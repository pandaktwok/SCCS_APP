import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const users = await prisma.users.findMany({
            select: { id: true, username: true, role: true, created_at: true },
            orderBy: { username: 'asc' }
        });
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json({ error: "Username and Password are required" }, { status: 400 });
        }

        // Note: In a real app, hash the password using bcrypt here.
        // For this local MVP scope, storing as-is or simple hash placeholder based on schema definition.
        const user = await prisma.users.create({
            data: {
                username,
                password_hash: password
            },
            select: { id: true, username: true, role: true } // Don't return password hash
        });

        return NextResponse.json(user, { status: 201 });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "User already exists" }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
}
