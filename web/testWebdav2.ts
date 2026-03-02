import { webdavClient } from './src/lib/webdav';

async function testWebdav() {
    try {
        const contents = await webdavClient.getDirectoryContents('/');
        console.log("Root contents:", contents.map((c: any) => c.filename));

        const invoices = await webdavClient.getDirectoryContents('/Invoices');
        console.log("Invoices contents:", invoices.map((c: any) => c.filename));
    } catch (e) {
        console.log("FAIL", e);
    }
}

testWebdav().catch(console.error);
