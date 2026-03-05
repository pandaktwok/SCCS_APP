import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);

        const invoice = await prisma.invoices.findUnique({
            where: { id }
        });

        if (invoice && invoice.file_path) {
            let nextcloudPath = "";
            let shouldDelete = false;

            if (invoice.file_path.startsWith('[NEXTCLOUD]')) {
                nextcloudPath = invoice.file_path.replace('[NEXTCLOUD]', '');
                shouldDelete = true;
            } else if (invoice.file_path.startsWith('http://') || invoice.file_path.startsWith('https://')) {
                nextcloudPath = invoice.file_path;
                const match = nextcloudPath.match(/remote\.php\/(?:webdav|dav\/files\/[^/]+)\/(.*)/);
                if (match && match[1]) {
                    nextcloudPath = '/' + match[1];
                } else {
                    try {
                        const url = new URL(invoice.file_path);
                        nextcloudPath = url.pathname;
                    } catch (e) { }
                }
                nextcloudPath = decodeURIComponent(nextcloudPath);
                shouldDelete = true;
            }

            if (shouldDelete) {
                const { webdavClient } = require('@/lib/webdav');
                try {
                    await webdavClient.deleteFile(nextcloudPath);
                } catch (err: any) {
                    console.warn("Não foi possível apagar arquivo no nextcloud:", err.message);
                }
            }
        }

        await prisma.invoices.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: "Nota fiscal deletada com sucesso." });
    } catch (error: any) {
        return NextResponse.json({ error: "Falha ao deletar a nota fiscal." }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        const body = await req.json();

        // Se o status mudar para ARQUIVADO, nós movemos fisicamente o arquivo do Nextcloud
        if (body.status === 'ARQUIVADO') {
            const invoice = await prisma.invoices.findUnique({
                where: { id },
                include: { project: true }
            });

            if (invoice && invoice.file_path) {
                let nextcloudPath = "";

                if (invoice.file_path.startsWith('[NEXTCLOUD]')) {
                    nextcloudPath = invoice.file_path.replace('[NEXTCLOUD]', '');
                } else if (invoice.file_path.startsWith('http://') || invoice.file_path.startsWith('https://')) {
                    nextcloudPath = invoice.file_path;
                    const match = nextcloudPath.match(/remote\.php\/(?:webdav|dav\/files\/[^/]+)\/(.*)/);
                    if (match && match[1]) {
                        nextcloudPath = '/' + match[1];
                    } else {
                        try {
                            const url = new URL(invoice.file_path);
                            nextcloudPath = url.pathname;
                        } catch (e) { }
                    }
                    nextcloudPath = decodeURIComponent(nextcloudPath);
                }

                if (nextcloudPath) {
                    const { webdavClient, ensureWebdavDirectory } = require('@/lib/webdav');
                    const path = require('path');
                    const currentYear = new Date().getFullYear().toString();
                    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
                    const projectTerm = invoice.project?.termo.replace(/\s+/g, '') || 'SemTermo';

                    try {
                        const remoteFolder = await ensureWebdavDirectory(['historico', currentYear, currentMonth, projectTerm]);
                        const originalFileName = path.basename(nextcloudPath);
                        const remoteFilePath = `${remoteFolder}/${originalFileName}`;

                        await webdavClient.moveFile(nextcloudPath, remoteFilePath);

                        // Garante que o banco de dados seja atualizado com o URL contendo o novo caminho /historico/
                        const fullHost = invoice.file_path.split('/remote.php')[0] || "http://192.168.15.4:3002";
                        body.file_path = `${fullHost}/remote.php/dav/files/casaos${remoteFilePath}`;
                        body.pix_receipt_path = body.file_path;

                    } catch (e: any) {
                        console.error("Erro ao mover a file para o historico no Nextcloud:", e.message);
                    }
                }
            }
        }

        const updatedInvoice = await prisma.invoices.update({
            where: { id },
            data: body
        });

        return NextResponse.json(updatedInvoice);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
    }
}
