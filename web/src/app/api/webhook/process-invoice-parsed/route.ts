import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { category_name, termo, invoice_number, pdf_path, amount } = body;

        // If data is pre-parsed by n8n regex/deterministic extraction
        if (!category_name || !termo || !invoice_number) {
            return NextResponse.json({ error: "Missing required deterministic fields" }, { status: 400 });
        }

        const categoryRecord = await prisma.categories.findFirst({
            where: { name: { contains: category_name, mode: 'insensitive' } }
        });

        if (!categoryRecord) {
            return NextResponse.json({ error: `Category '${category_name}' not found locally` }, { status: 404 });
        }

        const projectRecord = await prisma.projects.findFirst({
            where: {
                category_id: categoryRecord.id,
                termo: { contains: termo, mode: 'insensitive' }
            }
        });

        if (!projectRecord) {
            return NextResponse.json({ error: `Project '${termo}' not found in DB` }, { status: 404 });
        }

        // 5. Insert invoice
        const invoice = await prisma.invoices.create({
            data: {
                project_id: projectRecord.id,
                invoice_number: invoice_number.toString(),
                amount: amount ? parseFloat(amount) : 0.00,
                file_path: pdf_path || "/uploads/unknown.pdf",
                status: "A_PAGAR"
            }
        });

        return NextResponse.json({ success: true, is_parsed: true, invoice }, { status: 201 });

    } catch (error: any) {
        console.error("Webhook Parsed Error:", error);
        return NextResponse.json({ error: "Failed to process parsed webhook", details: error.message }, { status: 500 });
    }
}
