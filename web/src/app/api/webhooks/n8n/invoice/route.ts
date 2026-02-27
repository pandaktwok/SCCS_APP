import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Estrutura que o n8n deve mandar no corpo da requisição (JSON)
        const { invoice_number, amount, file_path, project_termo } = body;

        if (!invoice_number || !amount || !file_path) {
            return NextResponse.json({
                error: 'Faltam dados obrigatórios para criar a fatura.',
                required: ['invoice_number', 'amount', 'file_path']
            }, { status: 400 });
        }

        // Tenta encontrar o projeto classificado pelo Gemini
        let projectId = null;
        if (project_termo) {
            const project = await prisma.projects.findFirst({
                where: { termo: project_termo }
            });
            if (project) {
                projectId = project.id;
            } else {
                // Se não achar o termo exato, ele vai para a lixeira virtual (Sem Termo) do Front.
                const fallback = await prisma.projects.findFirst({
                    where: { termo: 'T 0000' }
                });
                if (fallback) projectId = fallback.id;
            }
        }

        // Registra a nota na fila A PAGAR
        const newInvoice = await prisma.invoices.create({
            data: {
                invoice_number: invoice_number,
                amount: parseFloat(amount),
                file_path: file_path, // Ex: /invoices/nf-123.pdf ou [NEXTCLOUD]/historico/...
                project_id: projectId,
                status: 'A_PAGAR'
            },
            include: { project: true }
        });

        return NextResponse.json({
            success: true,
            message: 'Nota Fiscal classificada pelo n8n inserida na fila "A PAGAR".',
            invoice: newInvoice
        });

    } catch (error: any) {
        console.error("Erro no Webhook Webhook:", error);
        return NextResponse.json({
            error: 'Falha no processamento interno do webhook.',
            details: error.message
        }, { status: 500 });
    }
}
