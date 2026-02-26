import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const projects = await prisma.projects.findMany({
            include: { category: true },
            orderBy: { termo: 'asc' }
        });
        return NextResponse.json(projects);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { category_id, termo } = body;

        if (!category_id || !termo) {
            return NextResponse.json({ error: "Category ID and Termo are required" }, { status: 400 });
        }

        const project = await prisma.projects.create({
            data: {
                category_id: parseInt(category_id),
                termo
            },
            include: { category: true }
        });

        return NextResponse.json(project, { status: 201 });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Project with this category and termo already exists" }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
    }
}
