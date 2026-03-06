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

        // Tenta encontrar o projeto classificado pelo Gemini de forma inteligente (para lidar com "T3171", "T-3171", "3171")
        let projectId = null;
        if (project_termo) {
            const exactMatch = await prisma.projects.findFirst({
                where: { termo: project_termo }
            });

            if (exactMatch) {
                projectId = exactMatch.id;
            } else {
                // Busca todos os projetos e faz match ignorando espaços e cases
                const cleanTermo = project_termo.replace(/\s+/g, '').toUpperCase();
                const justNumbers = project_termo.replace(/\D/g, '');

                const allProjects = await prisma.projects.findMany();

                const matchedProject = allProjects.find(p => p.termo.replace(/\s+/g, '').toUpperCase() === cleanTermo);

                if (matchedProject) {
                    projectId = matchedProject.id;
                } else if (justNumbers.length >= 3) {
                    // Tenta validar apenas os números se o AI só enviou "3104"
                    const matchByNumber = allProjects.find(p => p.termo.replace(/\D/g, '') === justNumbers);
                    if (matchByNumber) projectId = matchByNumber.id;
                }
            }

            if (!projectId) {
                // Se não achar o termo de forma alguma, ele vai para a lixeira virtual (Sem Termo) do Front.
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
