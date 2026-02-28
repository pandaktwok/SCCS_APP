import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);

        // Prevent deleting 'T 0000' project which is critical for orphan invoices
        const project = await prisma.projects.findUnique({ where: { id } });
        if (project?.termo === 'T 0000') {
            return NextResponse.json({ error: "O projeto padrao 'T 0000' não pode ser deletado." }, { status: 403 });
        }

        await prisma.projects.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.code === 'P2003') {
            return NextResponse.json({ error: "Não é possível deletar este projeto pois existem notas vinculadas a ele." }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        const { termo, name, category_id } = await req.json();

        const project = await prisma.projects.findUnique({ where: { id } });
        if (project?.termo === 'T 0000') {
            return NextResponse.json({ error: "O projeto padrao 'T 0000' não pode ser editado." }, { status: 403 });
        }

        const updatedProject = await prisma.projects.update({
            where: { id },
            data: {
                termo: termo !== undefined ? termo : undefined,
                name: name !== undefined ? name : undefined,
                category_id: category_id !== undefined ? parseInt(category_id) : undefined
            }
        });

        return NextResponse.json(updatedProject);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
    }
}
