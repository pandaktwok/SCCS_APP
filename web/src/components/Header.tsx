import Link from "next/link";
import fs from "fs/promises";
import path from "path";

async function getSettings() {
    try {
        const filePath = path.join(process.cwd(), 'data', 'settings.json');
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        return { companyName: 'SOCIEDADE CULTURAL CRUZEIRO DO SUL', logoUrl: null };
    }
}

export default async function Header() {
    const settings = await getSettings();

    return (
        <header className="fixed top-0 w-full h-16 bg-white dark:bg-[#0c1322] shadow-sm z-50 flex items-center justify-between px-6 border-b border-sccs-border dark:border-slate-800 transition-colors duration-300">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-sccs-gray dark:bg-slate-800 rounded-full flex items-center justify-center p-1 overflow-hidden relative border border-sccs-border dark:border-slate-700">
                    {settings.logoUrl ? (
                        <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                        <div className="text-sccs-green font-bold text-xs">LOGO</div>
                    )}
                </div>
                <h1 className="text-sccs-dark dark:text-white font-medium tracking-wide text-lg sm:text-xl transition-colors uppercase">
                    {settings.companyName}
                </h1>
            </div>

            <div className="flex items-center gap-8">
                <nav className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wider text-sccs-dark dark:text-slate-300">
                    <a href="/" className="hover:text-sccs-green dark:hover:text-sccs-green transition-colors">
                        INÍCIO
                    </a>
                    <a href="/historico" className="hover:text-sccs-green transition-colors">
                        HISTÓRICO
                    </a>
                    <a href="/configuracao" className="hover:text-sccs-green transition-colors">
                        CONFIGURAÇÃO
                    </a>
                </nav>
            </div>
        </header>
    );
}
