import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const users = await prisma.users.findMany();
        return NextResponse.json({ users });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
