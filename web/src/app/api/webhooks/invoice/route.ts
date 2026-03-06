import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("==> Payload recebido do n8n:", body); // Adicionado para debugar

    const { invoice_number, amount, termo, project_term, file_path, file_url, supplier, date } = body;

    // Priorizar os campos que vêm do n8n, mas manter fallback para legibilidade/compatibilidade
    const finalTermo = project_term || termo;
    const finalFilePath = file_url || file_path;

    // 1. Validação básica
    if (!invoice_number || !amount || !finalTermo || !finalFilePath) {
      console.error("-> Erro de validação. Faltam parâmetros!", { invoice_number, amount, finalTermo, finalFilePath });
      return NextResponse.json(
        { error: 'Parâmetros ausentes na requisição do n8n.', received: body },
        { status: 400 }
      );
    }

    // 2. Procurar o Projeto (Termo)
    let project = await prisma.projects.findFirst({
      where: { termo: { equals: finalTermo, mode: "insensitive" } }
    });

    if (!project && finalTermo) {
      // Tenta encontrar o projeto de forma inteligente extraindo números
      const justNumbers = finalTermo.toString().replace(/\D/g, '');
      const allProjects = await prisma.projects.findMany();

      if (justNumbers.length >= 3) {
        const matchByNumber = allProjects.find(p => p.termo.replace(/\D/g, '') === justNumbers);
        if (matchByNumber) project = matchByNumber;
      }
    }
    // Se o termo não existir, fallback para "T 0000"
    if (!project) {
      project = await prisma.projects.findFirst({
        where: { termo: 'T 0000' }
      });

      // Se nem o T 0000 existir, criamos ele
      if (!project) {
        let fallbackCategory = await prisma.categories.findFirst({ where: { name: 'Sem Termo' } });
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
    let cleanAmountStr = amount.toString().replace(/[^\d.,-]/g, '');

    // Se possui vírgula, tratamos como formato brasileiro (1.500,00 -> 1500.00)
    if (cleanAmountStr.includes(',')) {
      cleanAmountStr = cleanAmountStr.replace(/\./g, ''); // Remove separador de milhar
      cleanAmountStr = cleanAmountStr.replace(',', '.');  // Troca vírgula decimal por ponto
    }
    const cleanAmount = cleanAmountStr;

    // 4. Criar a Inserção no Banco de Dados
    const newInvoice = await prisma.invoices.create({
      data: {
        invoice_number: invoice_number,
        supplier: supplier || "Fornecedor Não Identificado",
        amount: parseFloat(cleanAmount),
        file_path: finalFilePath,
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
