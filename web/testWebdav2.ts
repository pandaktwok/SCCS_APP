import { webdavClient } from './src/lib/webdav';

async function testWebdav() {
    try {
        const invoices = await webdavClient.getDirectoryContents('/Invoices');
        console.log("Invoices contents:", invoices.map((c: any) => c.filename));
    } catch (e) {
        console.log("FAIL", e);
    }
}

testWebdav().catch(console.error);
