import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json({ error: 'Usuário e senha são obrigatórios.' }, { status: 400 });
        }

        const user = await prisma.users.findUnique({
            where: { username: username }
        });

        if (!user) {
            return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
        }

        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
            return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
        }

        const token = await signToken({ userId: user.id, username: user.username, role: user.role });

        // Configuração de cookie segura (Next.js 14 Response Cookies)
        const response = NextResponse.json({ success: true, message: 'Login realizado com sucesso', user: { username: user.username, role: user.role } });

        response.cookies.set({
            name: 'sccs_auth_token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 // 1 day
        });

        return response;
    } catch (error: any) {
        return NextResponse.json({ error: 'Erro interno ao processar login' }, { status: 500 });
    }
}
