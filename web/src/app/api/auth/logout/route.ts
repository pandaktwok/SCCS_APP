import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const response = NextResponse.json({ success: true, message: 'Logout realizado com sucesso' });

    // Limpar o cookie definindo uma data expirada
    response.cookies.set({
        name: 'sccs_auth_token',
        value: '',
        httpOnly: true,
        expires: new Date(0),
        path: '/',
    });

    return response;
}
