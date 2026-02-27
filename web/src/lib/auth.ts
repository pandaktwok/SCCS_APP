import { SignJWT, jwtVerify } from 'jose';

// Chave secreta fixa para ambiente CasaOS local (ideal seria process.env.JWT_SECRET)
// Gerando dinamicamente na primeira vez, ou fixando.
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'sccs-super-secret-key-2026-casaos-only');

export async function signToken(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h') // 24 horas logado
        .sign(SECRET_KEY);
}

export async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        return payload;
    } catch (error) {
        return null;
    }
}
