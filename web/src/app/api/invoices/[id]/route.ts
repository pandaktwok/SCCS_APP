import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);

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
