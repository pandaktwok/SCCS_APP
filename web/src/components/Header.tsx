import Link from "next/link";

export default function Header() {
    return (
        <header className="fixed top-0 w-full h-16 bg-white dark:bg-[#0c1322] shadow-sm z-50 flex items-center justify-between px-6 border-b border-sccs-border dark:border-slate-800 transition-colors duration-300">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-sccs-gray dark:bg-slate-800 rounded-full flex items-center justify-center p-1 overflow-hidden relative border border-sccs-border dark:border-slate-700">
                    <div className="text-sccs-green font-bold text-xs">LOGO</div>
                </div>
                <h1 className="text-sccs-dark dark:text-white font-medium tracking-wide text-lg sm:text-xl transition-colors">
                    SOCIEDADE CULTURAL CRUZEIRO DO SUL
                </h1>
            </div>

            <div className="flex items-center gap-8">
                <nav className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wider text-sccs-dark dark:text-slate-300">
                    <Link href="/" className="hover:text-sccs-green dark:hover:text-sccs-green transition-colors">
                        INÍCIO
                    </Link>
                    <Link href="/historico" className="hover:text-sccs-green transition-colors">
                        HISTÓRICO
                    </Link>
                    <Link href="/configuracao" className="hover:text-sccs-green transition-colors">
                        CONFIGURAÇÃO
                    </Link>
                </nav>
            </div>
        </header>
    );
}
