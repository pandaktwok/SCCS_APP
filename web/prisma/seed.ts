import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('Clearing old data...');
    await prisma.invoices.deleteMany({});
    await prisma.projects.deleteMany({});
    await prisma.categories.deleteMany({});

    console.log('Seeding fake data...');

    // Create Categories
    const fia = await prisma.categories.create({ data: { name: 'FIA' } })
    const fmi = await prisma.categories.create({ data: { name: 'FMI' } })
    const muni = await prisma.categories.create({ data: { name: 'Município' } })

    // Create Projects
    const proj1 = await prisma.projects.create({ data: { category_id: fia.id, termo: 'T 3104', name: 'Música nas Escolas' } })
    const proj2 = await prisma.projects.create({ data: { category_id: fia.id, termo: 'T 3202', name: 'Esporte Cidadão' } })
    const proj3 = await prisma.projects.create({ data: { category_id: fmi.id, termo: 'T 3200', name: 'Apoio ao Idoso' } })
    const proj4 = await prisma.projects.create({ data: { category_id: muni.id, termo: 'T 3171', name: 'Manutenção da Sede' } })

    // Create Invoices - A PAGAR
    await prisma.invoices.create({
        data: { project_id: proj1.id, invoice_number: '1001', amount: 1500.00, file_path: '/fake/path.pdf', status: 'A_PAGAR' }
    })
    await prisma.invoices.create({
        data: { project_id: proj3.id, invoice_number: '2050', amount: 3450.50, file_path: '/fake/path.pdf', status: 'A_PAGAR' }
    })
    await prisma.invoices.create({
        data: { project_id: proj4.id, invoice_number: '988', amount: 750.00, file_path: '/fake/path.pdf', status: 'A_PAGAR' }
    })

    // Create Invoices - AGUARDANDO_PIX
    await prisma.invoices.create({
        data: { project_id: proj2.id, invoice_number: '1002', amount: 2000.00, file_path: '/fake/path.pdf', status: 'AGUARDANDO_PIX' }
    })
    await prisma.invoices.create({
        data: { project_id: proj1.id, invoice_number: '1005', amount: 500.00, file_path: '/fake/path.pdf', status: 'AGUARDANDO_PIX' }
    })

    // Create Invoices - PAGO
    await prisma.invoices.create({
        data: { project_id: proj1.id, invoice_number: '998', amount: 1500.00, file_path: '/fake/path.pdf', status: 'PAGO', payment_date: new Date() }
    })
    await prisma.invoices.create({
        data: { project_id: proj3.id, invoice_number: '105', amount: 5000.00, file_path: '/fake/path.pdf', status: 'PAGO', payment_date: new Date() }
    })

    // Create old paid invoices for Historico filters
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    await prisma.invoices.create({
        data: { project_id: proj4.id, invoice_number: '77', amount: 12000.00, file_path: '/fake/path.pdf', status: 'PAGO', payment_date: lastMonth }
    })

    console.log('Seed completed successfully!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
