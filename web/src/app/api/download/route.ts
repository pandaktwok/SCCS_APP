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

        // Puxa os dados binários da nuvem através do nosso Proxy seguro
        const buffer = await webdavClient.getFileContents(nextcloudPath, { format: 'binary' }) as Buffer;

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
