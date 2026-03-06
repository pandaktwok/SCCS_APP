import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const categories = await prisma.categories.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(categories);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const category = await prisma.categories.create({
            data: { name }
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Category already exists" }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
}
