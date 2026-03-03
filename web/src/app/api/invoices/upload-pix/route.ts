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

        let originalPdfBuffer: Buffer;
        let isLocalOriginal = false;
        let originalPdfPath = "";
        let nextcloudPath = "";

        if (invoice.file_path.startsWith('[NEXTCLOUD]')) {
            const nextcloudPath = invoice.file_path.replace('[NEXTCLOUD]', '');
            const { webdavClient } = require('@/lib/webdav');
            try {
                originalPdfBuffer = await webdavClient.getFileContents(nextcloudPath, { format: 'binary' }) as Buffer;
            } catch (e) {
                return NextResponse.json({ error: 'O PDF original da Nota Fiscal não foi encontrado na nuvem Nextcloud.' }, { status: 404 });
            }
        } else if (invoice.file_path.startsWith('http://') || invoice.file_path.startsWith('https://')) {
            nextcloudPath = invoice.file_path;

            // Suporta tanto o padrão antigo "remote.php/webdav/" quanto o novo "remote.php/dav/files/usuario/"
            const match = nextcloudPath.match(/remote\.php\/(?:webdav|dav\/files\/[^/]+)\/(.*)/);
            if (match && match[1]) {
                nextcloudPath = '/' + match[1];
            } else {
                try {
                    const url = new URL(invoice.file_path);
                    nextcloudPath = url.pathname;
                } catch (e) { }
            }

            // Decodificar URI para caso o n8n tenha salvo com %20 ou outros caracteres
            nextcloudPath = decodeURIComponent(nextcloudPath);

            const { webdavClient } = require('@/lib/webdav');
            try {
                originalPdfBuffer = await webdavClient.getFileContents(nextcloudPath, { format: 'binary' }) as Buffer;
            } catch (e) {
                return NextResponse.json({ error: 'O PDF original da Nota Fiscal não foi encontrado na nuvem Nextcloud (via URL).' }, { status: 404 });
            }
        } else {
            isLocalOriginal = true;
            const publicDir = path.join(process.cwd(), 'public');
            originalPdfPath = path.join(publicDir, invoice.file_path.replace(/^\//, ''));
            try {
                originalPdfBuffer = await fs.readFile(originalPdfPath);
            } catch (e) {
                return NextResponse.json({ error: 'O PDF original da Nota Fiscal não foi encontrado fisicamente no servidor local.' }, { status: 404 });
            }
        }

        // 3. Mesclar PDFs usando pdf-lib
        const mergedPdf = await PDFDocument.create();

        // --- Anexar PDF Original (Nota) ---
        const originalDoc = await PDFDocument.load(originalPdfBuffer, { ignoreEncryption: true });
        const copiedOriginalPages = await mergedPdf.copyPages(originalDoc, originalDoc.getPageIndices());
        copiedOriginalPages.forEach((page) => mergedPdf.addPage(page));

        // --- Anexar Comprovante PIX ---
        if (file.type === 'application/pdf') {
            const pixDoc = await PDFDocument.load(pixBuffer, { ignoreEncryption: true });
            const copiedPixPages = await mergedPdf.copyPages(pixDoc, pixDoc.getPageIndices());
            copiedPixPages.forEach((page) => mergedPdf.addPage(page));
        } else if (file.type.startsWith('image/')) {
            let image;
            if (file.type === 'image/png') {
                image = await mergedPdf.embedPng(pixBuffer);
            } else {
                image = await mergedPdf.embedJpg(pixBuffer);
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

        const mergedPdfBytes = await mergedPdf.save();

        // 4. Salvar PDF Mesclado de Volta no Mesmo Caminho Original (Substituição)
        const { webdavClient } = require('@/lib/webdav');

        // Faz o upload real do Buffer final para o Nextcloud, sobrescrevendo a NF original
        await webdavClient.putFileContents(nextcloudPath, Buffer.from(mergedPdfBytes), { overwrite: true });

        // Limpeza opcional: Apagar o arquivo original do `/public` local para economizar espaço
        if (isLocalOriginal) {
            try {
                await fs.unlink(originalPdfPath);
            } catch (e) {
                console.warn("Não foi possível excluir o arquivo original temporário.", e);
            }
        }

        // 5. Atualizar o Banco de Dados
        await prisma.invoices.update({
            where: { id: invoiceId },
            data: {
                status: 'PAGO',
                payment_date: new Date(),
                // file_path já contém o caminho (URL) e permanece idêntico apontando pra nf_sem_comprovante
            }
        });

        return NextResponse.json({ success: true, message: 'Comprovante anexado! A Nota foi grampeada na pasta temporária.', filePath: invoice.file_path });


    } catch (error: any) {
        console.error("Erro na mesclagem de PDF:", error.stack || error);

        // Logar o erro também num arquivo temporário caso não vejamos o console docker
        try {
            await fs.appendFile(path.join(process.cwd(), 'debug_error.log'), new Date().toISOString() + '\\n' + (error.stack || error) + '\\n\\n');
        } catch (e) { }

        return NextResponse.json({ error: "Falha interna ao grampear os arquivos.", details: error.message, stack: error.stack }, { status: 500 });
    }
}
