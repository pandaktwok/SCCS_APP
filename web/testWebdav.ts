import { webdavClient } from './src/lib/webdav';

async function testWebdav() {
    const rawPath = 'Invoices/NF_63_RENAN%20SOMBRIO%20ZOCK%2008215526942.pdf';

    // Test 1: Without decode
    try {
        await webdavClient.getFileContents(rawPath, { format: 'binary' });
        console.log("SUCCESS: Raw path worked!");
    } catch (e) {
        console.log("FAIL raw path");
    }

    // Test 2: With decode
    try {
        const decoded = decodeURIComponent(rawPath);
        await webdavClient.getFileContents(decoded, { format: 'binary' });
        console.log("SUCCESS: Decoded path worked!");
    } catch (e) {
        console.log("FAIL decoded path", e.message);
    }
}

testWebdav().catch(console.error);
