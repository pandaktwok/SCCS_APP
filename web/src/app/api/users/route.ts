import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Lista Usuários
export async function GET() {
    try {
        const users = await prisma.users.findMany({
            select: {
                id: true,
                username: true,
                role: true,
                created_at: true,
            },
            orderBy: { created_at: 'asc' }
        });
        return NextResponse.json(users);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

// Cria Novo Usuário
export async function POST(request: Request) {
    try {
        const { username, password, role } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Usuário e senha são obrigatórios.' }, { status: 400 });
        }

        const existingUser = await prisma.users.findUnique({ where: { username } });
        if (existingUser) {
            return NextResponse.json({ error: 'Usuário já existe.' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.users.create({
            data: {
                username,
                password_hash: hashedPassword,
                role: role || 'user',
            }
        });

        return NextResponse.json({ success: true, user: { id: newUser.id, username: newUser.username } });
    } catch (error: any) {
        return NextResponse.json({ error: 'Falha ao criar usuário.' }, { status: 500 });
    }
}
