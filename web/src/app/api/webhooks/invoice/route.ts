import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { invoice_number, amount, termo, file_path } = body;

    // 1. Validação básica
    if (!invoice_number || !amount || !termo || !file_path) {
      return NextResponse.json(
        { error: 'Parâmetros ausentes na requisição do n8n.' },
        { status: 400 }
      );
    }

    // 2. Procurar o Projeto (Termo)
    let project = await prisma.projects.findFirst({
      where: { termo: { equals: termo, mode: "insensitive" } }
    });

    // Se o termo não existir, fallback para "T 0000"
    if (!project) {
        project = await prisma.projects.findFirst({
            where: { termo: 'T 0000' }
        });
        
        // Se nem o T 0000 existir, criamos ele
        if (!project) {
            let fallbackCategory = await prisma.categories.findFirst({ where: { name: 'Sem Termo' }});
            if (!fallbackCategory) {
               fallbackCategory = await prisma.categories.create({ data: { name: 'Sem Termo' } });
            }
            project = await prisma.projects.create({
                data: {
                    termo: 'T 0000',
                    name: 'Aguardando Termo',
                    category_id: fallbackCategory.id
                }
            });
        }
    }

    // 3. Converter valor (garantir que seja decimal do n8n ou texto limpo)
    const cleanAmount = amount.toString()
        .replace(/[^\d.,-]/g, '')
        .replace(',', '.');

    // 4. Criar a Inserção no Banco de Dados
    const newInvoice = await prisma.invoices.create({
      data: {
        invoice_number: invoice_number,
        amount: parseFloat(cleanAmount),
        file_path: file_path,
        project_id: project.id,
        status: 'A_PAGAR'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Nota Fiscal arquivada com sucesso.',
      data: newInvoice
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro no Webhook n8n:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor SCCS.', details: error.message },
      { status: 500 }
    );
  }
}
