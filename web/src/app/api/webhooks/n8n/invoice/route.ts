import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        console.log("n8n invoice webhook payload recebido:", body);

        // Fallbacks para possíveis variações de nomes de chaves vindo da IA no n8n
        const invoice_number = body.invoice_number || body.numero_nota || body.numero;
        const amount = body.amount || body.valor || body.total;
        const file_path = body.file_path || body.pdf_path || body.file;
        const project_termo = body.project_termo || body.termo || body.projeto || body.project;
        const supplier = body.supplier || body.fornecedor || body.prestador || body.nome_prestador;

        if (!invoice_number || !amount || !file_path) {
            return NextResponse.json({
                error: 'Faltam dados obrigatórios para criar a fatura.',
                required: ['invoice_number (ou numero_nota)', 'amount (ou valor)', 'file_path'],
                received: body
            }, { status: 400 });
        }

        // Tenta encontrar o projeto classificado pelo Gemini de forma inteligente (para lidar com "T3171", "T-3171", "3171")
        let projectId = null;
        if (project_termo) {
            const project_termo_str = project_termo.toString();
            const exactMatch = await prisma.projects.findFirst({
                where: { termo: project_termo_str }
            });

            if (exactMatch) {
                projectId = exactMatch.id;
            } else {
                // Busca todos os projetos e faz match ignorando espaços e cases
                const cleanTermo = project_termo_str.replace(/\s+/g, '').toUpperCase();
                const justNumbers = project_termo_str.replace(/\D/g, '');

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

        let parsedAmount = 0;
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

        // Registra a nota na fila A PAGAR
        const newInvoice = await prisma.invoices.create({
            data: {
                invoice_number: invoice_number.toString(),
                amount: parsedAmount,
                file_path: file_path, // Ex: /invoices/nf-123.pdf ou [NEXTCLOUD]/historico/...
                project_id: projectId,
                supplier: supplier ? supplier.toString() : null,
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
