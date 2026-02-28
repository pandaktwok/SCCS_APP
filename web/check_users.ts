import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const users = await prisma.users.findMany();
    console.log(users);
}

check().finally(() => prisma.$disconnect());
