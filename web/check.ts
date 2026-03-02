import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const invoices = await prisma.invoices.findMany({
    select: {
      id: true,
      invoice_number: true,
      supplier: true,
      file_path: true,
    },
    orderBy: { id: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(invoices, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
