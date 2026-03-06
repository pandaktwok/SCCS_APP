import { NextResponse } from 'next/server';
import { webdavClient } from '@/lib/webdav';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const pathQuery = searchParams.get('path');
    const action = searchParams.get('action') || 'download'; // Padrão antigo era download

    if (!pathQuery) {
        return NextResponse.json({ error: 'Caminho não fornecido' }, { status: 400 });
    }

    let nextcloudPath = "";

    try {

        if (pathQuery.startsWith('[NEXTCLOUD]')) {
            nextcloudPath = pathQuery.replace('[NEXTCLOUD]', '');
        } else if (pathQuery.startsWith('http://') || pathQuery.startsWith('https://')) {
            nextcloudPath = pathQuery;
            const match = nextcloudPath.match(/remote\.php\/(?:webdav|dav\/files\/[^/]+)\/(.*)/);
            if (match && match[1]) {
                nextcloudPath = '/' + match[1];
            } else {
                try {
                    const url = new URL(pathQuery);
                    nextcloudPath = url.pathname;
                } catch (e) { }
            }
            nextcloudPath = decodeURIComponent(nextcloudPath);
        } else {
            return NextResponse.json({
                error: 'Arquivo ainda está gravado localmente (Sistema Antigo).',
                local_path: pathQuery
            }, { status: 400 });
        }

        // Puxa os dados binários da nuvem através de HTTP direto para contornar bugs de proxy do pacote 'webdav'
        const authHeader = 'Basic ' + Buffer.from(`${process.env.NEXTCLOUD_USERNAME || 'casaos'}:${process.env.NEXTCLOUD_PASSWORD || 'casaos'}`).toString('base64');
        const fetchUrl = `http://192.168.15.4:7580/remote.php/webdav${encodeURI(nextcloudPath)}`;

        const response = await fetch(fetchUrl, {
            method: 'GET',
            headers: { 'Authorization': authHeader }
        });

        if (!response.ok) {
            throw new Error(`Nextcloud retornou status ${response.status} ao baixar buffer.`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.length === 0) {
            throw new Error(`Nextcloud devolveu um arquivo vazio (0 bytes). O arquivo original pode estar corrompido.`);
        }

        // Extrai só o nome final do arquivo para o Download ("NF....pdf")
        const fileName = nextcloudPath.split('/').pop() || 'documento.pdf';

        const disposition = action === 'download'
            ? `attachment; filename="${fileName}"`
            : `inline; filename="${fileName}"`;

        // Anexa o header de PDF e força a exibição ou download
        return new NextResponse(buffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': disposition,
            },
        });

    } catch (error: any) {
        console.error("Erro puxando arquivo do WebDAV:", error);
        return NextResponse.json({
            error: 'Não foi possível encontrar este arquivo na nuvem da escola.',
            details: error.message || String(error),
            tried_path: nextcloudPath
        }, { status: 404 });
    }
}
