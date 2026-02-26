import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get('projectId');

        const filter = projectId ? { project_id: parseInt(projectId) } : {};

        const invoices = await prisma.invoices.findMany({
            where: filter,
            include: { project: { include: { category: true } } },
            orderBy: { created_at: 'desc' }
        });
        return NextResponse.json(invoices);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { id, status, pix_receipt_path } = body;

        if (!id) {
            return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
        }

        const dataToUpdate: any = {};
        if (status) dataToUpdate.status = status;
        if (pix_receipt_path) dataToUpdate.pix_receipt_path = pix_receipt_path;
        if (status === 'PAGO') dataToUpdate.payment_date = new Date();

        const updatedInvoice = await prisma.invoices.update({
            where: { id },
            data: dataToUpdate
        });

        return NextResponse.json(updatedInvoice);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
    }
}
