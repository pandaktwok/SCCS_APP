import { PrismaClient } from '@prisma/client';
import { webdavClient } from './src/lib/webdav';

const prisma = new PrismaClient();

async function cleanAll() {
    try {
        console.log("Deletando todos os registros do banco de dados...");
        const result = await prisma.invoices.deleteMany({});
        console.log(`Deletados ${result.count} registros do banco.`);

        console.log("Deletando pasta /Invoices do Nextcloud...");
        try {
            await webdavClient.deleteFile('/Invoices');
            console.log("Pasta /Invoices deletada com sucesso.");
        } catch (e: any) {
            console.log("Pasta /Invoices não encontrada ou já deletada.");
        }

        console.log("Limpeza completa!");
    } catch (e) {
        console.error("Erro na limpeza:", e);
    } finally {
        await prisma.$disconnect();
    }
}

cleanAll();
