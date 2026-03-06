import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("process-invoice-parsed webhook payload recebido:", body);

        const category_name = body.category_name || body.categoria || body.category;
        const termo = body.termo || body.project_termo || body.projeto || body.project;
        const invoice_number = body.invoice_number || body.numero_nota || body.numero;
        const pdf_path = body.pdf_path || body.file_path || body.file;
        const amount = body.amount || body.valor || body.total;
        const supplier = body.supplier || body.fornecedor || body.prestador || body.nome_prestador;

        // If data is pre-parsed by n8n regex/deterministic extraction
        if (!category_name || !termo || !invoice_number) {
            return NextResponse.json({ error: "Missing required deterministic fields", received: body }, { status: 400 });
        }

        const categoryRecord = await prisma.categories.findFirst({
            where: { name: { contains: category_name, mode: 'insensitive' } }
        });

        if (!categoryRecord) {
            return NextResponse.json({ error: `Category '${category_name}' not found locally` }, { status: 404 });
        }

        let projectRecord = await prisma.projects.findFirst({
            where: {
                category_id: categoryRecord.id,
                termo: { contains: termo, mode: 'insensitive' }
            }
        });

        // 4b. Robust Fallback: Strip spaces and ignore case, or match digits only
        if (!projectRecord && termo) {
            const cleanTermo = termo.replace(/\s+/g, '').toUpperCase();
            const justNumbers = termo.replace(/\D/g, '');

            const allProjects = await prisma.projects.findMany({ where: { category_id: categoryRecord.id } });
            projectRecord = allProjects.find(p => p.termo.replace(/\s+/g, '').toUpperCase() === cleanTermo) || null;

            if (!projectRecord && justNumbers.length >= 3) {
                projectRecord = allProjects.find(p => p.termo.replace(/\D/g, '') === justNumbers) || null;
            }
        }

        if (!projectRecord) {
            // Find universal fallback
            projectRecord = await prisma.projects.findFirst({ where: { termo: 'T 0000' } }) || null;
            if (!projectRecord) {
                return NextResponse.json({ error: `Project '${termo}' not found in DB and fallback missing` }, { status: 404 });
            }
        }

        let parsedAmount = 0;
        if (amount) {
            if (typeof amount === 'string') {
                if (amount.includes(',')) {
                    // Se vier formato "2.500,00" ou "2500,00", transformamos em 2500.00
                    const formatStr = amount.replace(/\./g, '').replace(',', '.');
                    parsedAmount = parseFloat(formatStr);
                } else {
                    // Formato padrão "2500.00"
                    parsedAmount = parseFloat(amount);
                }
            } else {
                parsedAmount = parseFloat(amount);
            }
        }

        // 5. Insert invoice
        const invoice = await prisma.invoices.create({
            data: {
                project_id: projectRecord.id,
                invoice_number: invoice_number.toString(),
                amount: parsedAmount,
                file_path: pdf_path || "/uploads/unknown.pdf",
                supplier: supplier ? supplier.toString() : null,
                status: "A_PAGAR"
            }
        });

        return NextResponse.json({ success: true, is_parsed: true, invoice }, { status: 201 });

    } catch (error: any) {
        console.error("Webhook Parsed Error:", error);
        return NextResponse.json({ error: "Failed to process parsed webhook", details: error.message }, { status: 500 });
    }
}
