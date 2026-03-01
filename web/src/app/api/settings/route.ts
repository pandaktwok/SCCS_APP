import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

export async function GET() {
    try {
        await fs.mkdir(path.dirname(SETTINGS_FILE), { recursive: true });

        let settings = {
            companyName: 'SOCIEDADE CULTURAL CRUZEIRO DO SUL',
            logoUrl: null
        };

        try {
            const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
            settings = JSON.parse(data);
        } catch (e) {
            // Se o arquivo não existir, usaremos os defaults  
            await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings));
        }

        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: 'Falha ao ler configurações' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const companyName = formData.get('companyName') as string;
        const logoFile = formData.get('logo') as File | null;

        await fs.mkdir(path.dirname(SETTINGS_FILE), { recursive: true });

        let currentSettings: any = { companyName: 'SOCIEDADE CULTURAL CRUZEIRO DO SUL', logoUrl: null };
        try {
            const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
            currentSettings = JSON.parse(data);
        } catch (e) { }

        if (companyName) {
            currentSettings.companyName = companyName;
        }

        if (logoFile && logoFile.size > 0) {
            const publicDir = path.join(process.cwd(), 'public', 'uploads');
            await fs.mkdir(publicDir, { recursive: true });

            const ext = path.extname(logoFile.name);
            const fileName = `custom-logo-${Date.now()}${ext}`;
            const filePath = path.join(publicDir, fileName);

            const bytes = await logoFile.arrayBuffer();
            await fs.writeFile(filePath, Buffer.from(bytes));

            // Set public URL
            currentSettings.logoUrl = `/uploads/${fileName}`;
        } else if (formData.has('removeLogo') && formData.get('removeLogo') === 'true') {
            currentSettings.logoUrl = null;
        }

        await fs.writeFile(SETTINGS_FILE, JSON.stringify(currentSettings, null, 2));

        // Revalida o cache do Next.js para forçar o recarregamento do layout e mostrar a nova logo na hora
        const { revalidatePath } = require('next/cache');
        revalidatePath('/', 'layout');

        return NextResponse.json({ success: true, settings: currentSettings });
    } catch (error: any) {
        console.error('Erro ao salvar settings:', error);
        return NextResponse.json({ error: 'Falha ao salvar configurações', details: error.message }, { status: 500 });
    }
}
