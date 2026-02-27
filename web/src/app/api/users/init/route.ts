import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
    try {
        const userCount = await prisma.users.count();
        if (userCount === 0) {
            const hashedPassword = await bcrypt.hash('admin', 10);
            await prisma.users.create({
                data: {
                    username: 'admin',
                    password_hash: hashedPassword,
                    role: 'admin'
                }
            });
        }

        // Criar Categoria "Sem Termo" e Projeto "T 0000" se não existirem
        let catSemTermo = await prisma.categories.findFirst({ where: { name: 'Sem Termo' } });
        if (!catSemTermo) {
            catSemTermo = await prisma.categories.create({ data: { name: 'Sem Termo' } });
        }

        const projSemTermo = await prisma.projects.findFirst({ where: { termo: 'T 0000' } });
        if (!projSemTermo) {
            await prisma.projects.create({
                data: {
                    termo: 'T 0000',
                    name: 'Aguardando Termo',
                    category_id: catSemTermo.id
                }
            });
        }

        return NextResponse.json({ success: true, message: 'Banco de dados inicializado com Admin e T 0000.' });
    } catch (error: any) {
        return NextResponse.json({ error: 'Erro ao criar usuário inicial.' }, { status: 500 });
    }
}
