import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const invoiceIdStr = formData.get('invoiceId') as string;
        const file = formData.get('file') as File;

        if (!invoiceIdStr || !file) {
            return NextResponse.json({ error: 'Fatura ou arquivo não fornecido.' }, { status: 400 });
        }

        const invoiceId = parseInt(invoiceIdStr);
        const invoice = await prisma.invoices.findUnique({
            where: { id: invoiceId },
            include: { project: true }
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Nota fiscal não encontrada no banco de dados.' }, { status: 404 });
        }

        // 1. Ler o Comprovante que acabou de subir (Buffer)
        const bytes = await file.arrayBuffer();
        const pixBuffer = Buffer.from(bytes);

        // 2. Caminhos dos arquivos (CasaOS/Docker environment)
        // O n8n salva na raız do public (ex: /invoices/NF_100.pdf)
        const publicDir = path.join(process.cwd(), 'public');
        const originalPdfPath = path.join(publicDir, invoice.file_path.replace(/^\//, ''));

        let originalPdfBuffer: Buffer;
        try {
            originalPdfBuffer = await fs.readFile(originalPdfPath);
        } catch (e) {
            return NextResponse.json({ error: 'O PDF original da Nota Fiscal não foi encontrado fisicamente no servidor.' }, { status: 404 });
        }

        // 3. Mesclar PDFs usando pdf-lib
        const mergedPdf = await PDFDocument.create();

        // --- Anexar PDF Original (Nota) ---
        // Checagem pesada: o arquivo original gerado pela pref/governo pode estar encriptado ou quebrado.
        const originalDoc = await PDFDocument.load(originalPdfBuffer);
        const copiedOriginalPages = await mergedPdf.copyPages(originalDoc, originalDoc.getPageIndices());
        copiedOriginalPages.forEach((page) => mergedPdf.addPage(page));

        // --- Anexar Comprovante PIX ---
        // Se o banco soltar uma imagem (JPEG/PNG) ao invés de PDF, cobrimos depois. Assumindo PDF por enquanto.
        if (file.type === 'application/pdf') {
            const pixDoc = await PDFDocument.load(pixBuffer);
            const copiedPixPages = await mergedPdf.copyPages(pixDoc, pixDoc.getPageIndices());
            copiedPixPages.forEach((page) => mergedPdf.addPage(page));
        } else if (file.type.startsWith('image/')) {
            // Caso a pessoa suba um Print do celular
            let image;
            if (file.type === 'image/png') {
                image = await mergedPdf.embedPng(pixBuffer);
            } else {
                image = await mergedPdf.embedJpg(pixBuffer);
            }

            const page = mergedPdf.addPage();
            const width = page.getWidth();
            const height = page.getHeight();
            // Centraliza a imagem mantendo a proporção (Matemática básica de redimensionamento)
            const dims = image.scale(1);
            const scale = Math.min(width / dims.width, height / dims.height) * 0.9; // 90% do tamanho para ter margem

            page.drawImage(image, {
                x: width / 2 - (dims.width * scale) / 2,
                y: height / 2 - (dims.height * scale) / 2,
                width: dims.width * scale,
                height: dims.height * scale,
            });
        }

        const mergedPdfBytes = await mergedPdf.save();

        // 4. Criar Árvore de Pastas Históricas
        const currentYear = new Date().getFullYear().toString();
        const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
        const projectTerm = invoice.project?.termo.replace(/\s+/g, '') || 'SemTermo';

        // Caminho final absoluto: /public/historico/2026/02/T3200/
        const historicoDir = path.join(publicDir, 'historico', currentYear, currentMonth, projectTerm);
        await fs.mkdir(historicoDir, { recursive: true });

        const finalFileName = `NF_${invoice.invoice_number}_FINAL_${Date.now()}.pdf`;
        const finalFilePath = path.join(historicoDir, finalFileName);

        await fs.writeFile(finalFilePath, mergedPdfBytes);

        // Caminho relativo para o navegador ler (começa a partir da public)
        const browserDbPath = `/historico/${currentYear}/${currentMonth}/${projectTerm}/${finalFileName}`;

        // 5. Atualizar o Banco de Dados
        await prisma.invoices.update({
            where: { id: invoiceId },
            data: {
                status: 'PAGO',
                payment_date: new Date(),
                pix_receipt_path: browserDbPath, // Salvamos o link do comprovante
                file_path: browserDbPath // Otimização: O link da nota oficial agora vira o Mesclado Final para ele baixar tudo de uma vez.
            }
        });

        return NextResponse.json({ success: true, message: 'Comprovante anexado e arquivos grampeados com sucesso!', filePath: browserDbPath });

    } catch (error: any) {
        console.error("Erro na mesclagem de PDF:", error);
        return NextResponse.json({ error: "Falha interna ao grampear os arquivos.", details: error.message }, { status: 500 });
    }
}
