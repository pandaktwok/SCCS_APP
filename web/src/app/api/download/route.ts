import { NextResponse } from 'next/server';
import { webdavClient } from '@/lib/webdav';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const pathQuery = searchParams.get('path');
    const action = searchParams.get('action') || 'download'; // Padrão antigo era download

    if (!pathQuery) {
        return NextResponse.json({ error: 'Caminho não fornecido' }, { status: 400 });
    }

    try {
        let nextcloudPath = "";

        if (pathQuery.startsWith('[NEXTCLOUD]')) {
            nextcloudPath = pathQuery.replace('[NEXTCLOUD]', '');
        } else if (pathQuery.startsWith('http://') || pathQuery.startsWith('https://')) {
            nextcloudPath = pathQuery;
            const webdavBaseUrl = 'remote.php/webdav/';
            const idx = pathQuery.indexOf(webdavBaseUrl);
            if (idx !== -1) {
                nextcloudPath = pathQuery.substring(idx + webdavBaseUrl.length);
            } else {
                try {
                    const url = new URL(pathQuery);
                    nextcloudPath = url.pathname;
                } catch (e) { }
            }
            nextcloudPath = decodeURI(nextcloudPath);
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
        return NextResponse.json({ error: 'Não foi possível encontrar este arquivo na nuvem da escola.' }, { status: 404 });
    }
}
