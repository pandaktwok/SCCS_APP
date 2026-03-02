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

        const invoice = await prisma.invoices.update({
            where: { id },
            data: body
        });

        return NextResponse.json(invoice);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
    }
}
