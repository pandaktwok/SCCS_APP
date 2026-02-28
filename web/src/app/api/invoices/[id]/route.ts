import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);

        const invoice = await prisma.invoices.findUnique({
            where: { id }
        });

        if (invoice && invoice.file_path.startsWith('[NEXTCLOUD]')) {
            const nextcloudPath = invoice.file_path.replace('[NEXTCLOUD]', '');
            const { webdavClient } = require('@/lib/webdav');
            try {
                await webdavClient.deleteFile(nextcloudPath);
            } catch (err: any) {
                console.warn("Não foi possível apagar arquivo no nextcloud:", err.message);
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
