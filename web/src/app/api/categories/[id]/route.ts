import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);

        // Prevent deleting 'Sem Termo' category which is critical
        const category = await prisma.categories.findUnique({ where: { id } });
        if (category?.name === 'Sem Termo') {
            return NextResponse.json({ error: "A categoria 'Sem Termo' não pode ser deletada." }, { status: 403 });
        }

        await prisma.categories.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.code === 'P2003') {
            return NextResponse.json({ error: "Não é possível deletar esta categoria pois existem projetos vinculados a ela." }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        const { name } = await req.json();

        if (!name) {
            return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
        }

        const category = await prisma.categories.update({
            where: { id },
            data: { name }
        });

        return NextResponse.json(category);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
    }
}
