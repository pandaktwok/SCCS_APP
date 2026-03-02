import { webdavClient } from './src/lib/webdav';
import fs from 'fs';

async function testDownload() {
    try {
        const filePath = '/Invoices/NF_6_RESTAURANTE_SABOR_DCASA_LTDA_ME.pdf';
        const buffer = await webdavClient.getFileContents(filePath, { format: 'binary' });
        fs.writeFileSync('test.pdf', buffer as Buffer);
        console.log("SUCCESS downloaded!");
    } catch (e: any) {
        console.log("FAIL", e.message);
        console.log(e.response?.status, e.response?.statusText);
    }
}

testDownload().catch(console.error);
