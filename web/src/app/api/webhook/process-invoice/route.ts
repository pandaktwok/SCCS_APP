import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { text_content, pdf_path } = body;

        if (!text_content) {
            return NextResponse.json({ error: "No text content provided" }, { status: 400 });
        }

        // 1. Write text content to a temporary file
        const tempFilePath = path.join(process.cwd(), '..', 'execution', 'temp_invoice.txt');
        await fs.writeFile(tempFilePath, text_content, 'utf8');

        // 2. Run Gemini Python Script
        const scriptPath = path.join(process.cwd(), '..', 'execution', 'gemini_classifier.py');
        const command = `python "${scriptPath}" "${tempFilePath}"`;

        const { stdout, stderr } = await execAsync(command);

        // Clean up temp file
        await fs.unlink(tempFilePath).catch(() => { });

        if (stderr) {
            console.error("Gemini Script Error:", stderr);
        }

        // 3. Parse result
        const result = JSON.parse(stdout.trim());

        if (!result.category || !result.termo || !result.invoice_number) {
            return NextResponse.json({ error: "Classification failed or incomplete", result }, { status: 422 });
        }

        // 4. Find matching project and category in DB
        const categoryRecord = await prisma.categories.findFirst({
            where: { name: { contains: result.category, mode: 'insensitive' } }
        });

        if (!categoryRecord) {
            return NextResponse.json({ error: `Category '${result.category}' not found in DB` }, { status: 404 });
        }

        const projectRecord = await prisma.projects.findFirst({
            where: {
                category_id: categoryRecord.id,
                termo: { contains: result.termo, mode: 'insensitive' }
            }
        });

        if (!projectRecord) {
            return NextResponse.json({ error: `Project '${result.termo}' not found in DB` }, { status: 404 });
        }

        // 5. Insert invoice into DB
        const invoice = await prisma.invoices.create({
            data: {
                project_id: projectRecord.id,
                invoice_number: result.invoice_number.toString(),
                amount: 0.00, // Should ideally be extracted by Gemini as well, defaulting to 0 for now
                file_path: pdf_path || "/uploads/unknown.pdf",
                status: "A_PAGAR"
            }
        });

        return NextResponse.json({ success: true, invoice }, { status: 201 });

    } catch (error: any) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: "Failed to process webhook", details: error.message }, { status: 500 });
    }
}
