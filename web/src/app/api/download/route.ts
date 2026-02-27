import { NextResponse } from 'next/server';
import { webdavClient } from '@/lib/webdav';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const pathQuery = searchParams.get('path');

    if (!pathQuery) {
        return NextResponse.json({ error: 'Caminho não fornecido' }, { status: 400 });
    }

    try {
        // Se for um link antigo do HD local (sem a flag NEXTCLOUD), avisamos.
        if (!pathQuery.startsWith('[NEXTCLOUD]')) {
            return NextResponse.json({
                error: 'Arquivo ainda está gravado localmente (Sistema Antigo).',
                local_path: pathQuery
            }, { status: 400 });
        }

        // Limpa a tag da frente e pega o caminho real do arquivo
        const nextcloudPath = pathQuery.replace('[NEXTCLOUD]', '');

        // Puxa os dados binários da nuvem através do nosso Proxy seguro
        const buffer = await webdavClient.getFileContents(nextcloudPath, { format: 'binary' }) as Buffer;

        // Extrai só o nome final do arquivo para o Download ("NF....pdf")
        const fileName = nextcloudPath.split('/').pop() || 'documento.pdf';

        // Anexa o header de PDF e força download com attachment
        return new NextResponse(buffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${fileName}"`,
            },
        });

    } catch (error: any) {
        console.error("Erro puxando arquivo do WebDAV:", error);
        return NextResponse.json({ error: 'Não foi possível encontrar este arquivo na nuvem da escola.' }, { status: 404 });
    }
}
