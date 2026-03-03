import { NextResponse } from 'next/server';
import { webdavClient } from '@/lib/webdav';
import JSZip from 'jszip';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month'); // Expecting format like '03'
    const project = searchParams.get('project');

    if (!year || !month || !project) {
        return NextResponse.json({ error: 'Parâmetros (ano, mês, projeto) são obrigatórios.' }, { status: 400 });
    }

    try {
        // Constrói o caminho exatamente como nós salvamos no Histórico
        const formatProject = project === 'Sem Projeto' ? 'SemTermo' : project;
        const targetPath = `/sccs_api/historico/${year}/${month}/${formatProject}`;

        // Checa se o diretório existe e lista o conteúdo no NextCloud
        const exists = await webdavClient.exists(targetPath);
        if (!exists) {
            return NextResponse.json({ error: 'A pasta desde projeto ainda não existe no servidor (Nenhuma nota foi finalizada no mês/ano).' }, { status: 404 });
        }

        const dirContents = await webdavClient.getDirectoryContents(targetPath) as Array<{ filename: string, type: string, basename: string }>;

        // Filtra apenas arquivos válidos (ignora subpastas caso existissem por acaso)
        const files = dirContents.filter(item => item.type === 'file');

        if (files.length === 0) {
            return NextResponse.json({ error: 'A pasta está vazia.' }, { status: 404 });
        }

        // Instancia o Montador de ZIP
        const zip = new JSZip();

        // Faz o download binário de todos os arquivos do NextCloud paralalelamente
        await Promise.all(files.map(async (file) => {
            try {
                const buffer = await webdavClient.getFileContents(file.filename, { format: 'binary' }) as Buffer;
                zip.file(file.basename, buffer);
            } catch (e: any) {
                console.error(`Erro ao baixar arquivo específico da pasta: ${file.filename}`, e.message);
                // Continua com os outros arquivos se um der erro
            }
        }));

        // Verifica se há arquivos empacotados de sucesso
        if (Object.keys(zip.files).length === 0) {
            return NextResponse.json({ error: 'Falha ao baixar os documentos originais para a montagem do pacote.' }, { status: 500 });
        }

        // Gera o ZIP final
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

        // Cria nome sanitizado pro arquivo
        const zipFileName = `Projeto_${formatProject}_${month}-${year}.zip`;

        return new NextResponse(zipBuffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${zipFileName}"`,
            },
        });

    } catch (error: any) {
        console.error("Erro criando o ZIP da pasta:", error);
        return NextResponse.json({ error: 'Falha interna ao se comunicar com o Nextcloud para empacotar os arquivos.' }, { status: 500 });
    }
}
