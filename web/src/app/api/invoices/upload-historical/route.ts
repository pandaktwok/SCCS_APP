import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PDFDocument } from 'pdf-lib';
import path from 'path';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();

        const projectIdStr = formData.get('projectId') as string;
        const amountStr = formData.get('amount') as string;
        const paymentDateStr = formData.get('paymentDate') as string;
        const yearStr = formData.get('year') as string;
        const monthStr = formData.get('month') as string;

        const invoiceFile = formData.get('invoiceFile') as File;
        const receiptFile = formData.get('receiptFile') as File | null;

        if (!projectIdStr || !amountStr || !paymentDateStr || !invoiceFile || !yearStr || !monthStr) {
            return NextResponse.json({ error: 'Dados obrigatórios não fornecidos.' }, { status: 400 });
        }

        const projectId = parseInt(projectIdStr);
        const amount = parseFloat(amountStr);
        const paymentDate = new Date(`${paymentDateStr}T12:00:00Z`);

        const project = await prisma.projects.findUnique({
            where: { id: projectId }
        });

        if (!project) {
            return NextResponse.json({ error: 'Projeto não encontrado.' }, { status: 404 });
        }

        // 1. Processar PDFs
        const invoiceBytes = await invoiceFile.arrayBuffer();
        let invoiceBuffer = Buffer.from(invoiceBytes);
        let mergedPdfBytes: Uint8Array;

        // Se houver um arquivo de recibo separado (não combined)
        if (receiptFile) {
            const receiptBytes = await receiptFile.arrayBuffer();
            const receiptBuffer = Buffer.from(receiptBytes);

            const mergedPdf = await PDFDocument.create();

            // --- Anexar PDF Original (Nota) ---
            const originalDoc = await PDFDocument.load(invoiceBuffer);
            const copiedOriginalPages = await mergedPdf.copyPages(originalDoc, originalDoc.getPageIndices());
            copiedOriginalPages.forEach((page) => mergedPdf.addPage(page));

            // --- Anexar Comprovante PIX ---
            if (receiptFile.type === 'application/pdf') {
                const pixDoc = await PDFDocument.load(receiptBuffer);
                const copiedPixPages = await mergedPdf.copyPages(pixDoc, pixDoc.getPageIndices());
                copiedPixPages.forEach((page) => mergedPdf.addPage(page));
            } else if (receiptFile.type.startsWith('image/')) {
                let image;
                if (receiptFile.type === 'image/png') {
                    image = await mergedPdf.embedPng(receiptBuffer);
                } else {
                    image = await mergedPdf.embedJpg(receiptBuffer);
                }

                const page = mergedPdf.addPage();
                const width = page.getWidth();
                const height = page.getHeight();
                const dims = image.scale(1);
                const scale = Math.min(width / dims.width, height / dims.height) * 0.9;

                page.drawImage(image, {
                    x: width / 2 - (dims.width * scale) / 2,
                    y: height / 2 - (dims.height * scale) / 2,
                    width: dims.width * scale,
                    height: dims.height * scale,
                });
            }

            mergedPdfBytes = await mergedPdf.save();
        } else {
            // Se for arquivo único, o merged data é apenas o invoice original
            mergedPdfBytes = new Uint8Array(invoiceBuffer);
        }

        // 2. Salvar Árvore de Pastas Históricas NO NEXTCLOUD (WEBDAV)
        const { webdavClient, ensureWebdavDirectory } = require('@/lib/webdav');

        const projectTerm = project.termo.replace(/\s+/g, '') || 'SemTermo';

        // Cria as pastas remotas
        const remoteFolder = await ensureWebdavDirectory(['historico', yearStr, monthStr.padStart(2, '0'), projectTerm]);

        const originalFileName = path.parse(invoiceFile.name).name;
        // Se isCombinedUpload (sem receiptFile) vamos por _PIX porque pressupõe que já tem o PIX junto.
        const finalFileName = `${originalFileName}_PIX.pdf`;
        const remoteFilePath = `${remoteFolder}/${finalFileName}`;

        // Faz o upload real do Buffer final para o Nextcloud
        await webdavClient.putFileContents(remoteFilePath, Buffer.from(mergedPdfBytes));

        // 3. Atualizar o Banco de Dados
        const dbPath = `[NEXTCLOUD]${remoteFilePath}`;

        const invoice = await prisma.invoices.create({
            data: {
                project_id: projectId,
                invoice_number: `MANUAL-${Date.now()}`,
                amount: amount,
                file_path: dbPath,
                pix_receipt_path: receiptFile ? dbPath : null,
                status: 'PAGO',
                payment_date: paymentDate
            }
        });

        return NextResponse.json({ success: true, message: 'Fatura Histórica salva com sucesso!', invoice });

    } catch (error: any) {
        console.error("Erro no processamento histórico:", error);
        return NextResponse.json({ error: "Falha interna ao salvar o arquivo histórico.", details: error.message }, { status: 500 });
    }
}
