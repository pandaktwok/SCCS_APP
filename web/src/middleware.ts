import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('sccs_auth_token')?.value;
    const isLoginPage = request.nextUrl.pathname.startsWith('/login');
    const isApiRoute = request.nextUrl.pathname.startsWith('/api');

    // Deixar as APIs do n8n (/api/webhooks) abertas para não bloquear as automações de fora
    if (request.nextUrl.pathname.startsWith('/api/webhooks')) {
        return NextResponse.next();
    }

    if (!token) {
        if (!isLoginPage && !isApiRoute) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        if (isApiRoute && request.nextUrl.pathname !== '/api/auth/login' && request.nextUrl.pathname !== '/api/users/init' && request.nextUrl.pathname !== '/api/debug') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }
    } else {
        // Se tem token, verificar se é válido (Edge Compatible jose)
        const payload = await verifyToken(token);

        if (!payload) {
            // Token inválido/expirado
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('sccs_auth_token');
            return response;
        }

        if (isLoginPage) {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'], // Proteger todas as rotas (incluindo api), menos estáticos
};
