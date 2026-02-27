import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const userId = parseInt(params.id);

        // Impede de deletar o último usuário (Ou um hardcoded para evitar auto-ban)
        const totalUsers = await prisma.users.count();
        if (totalUsers <= 1) {
            return NextResponse.json({ error: 'Não é possível deletar o único usuário restante do sistema.' }, { status: 400 });
        }

        await prisma.users.delete({
            where: { id: userId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Falha ao deletar usuário.' }, { status: 500 });
    }
}
