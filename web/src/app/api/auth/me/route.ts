import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('sccs_auth_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Nenhum token encontrado' }, { status: 401 });
        }

        const payload = await verifyToken(token);

        if (!payload || !payload.userId) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }

        return NextResponse.json({
            id: payload.userId,
            username: payload.username as string,
            role: payload.role as string
        });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao verificar sessão' }, { status: 500 });
    }
}
