"use client";

import { useState, useEffect } from "react";
import { FileText, Eye, Download, Printer, Trash2, LogOut, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";

type Invoice = {
    id: number;
    project_id: number;
    invoice_number: string;
    amount: string;
    file_path: string;
    status: string;
    pix_receipt_path: string | null;
    payment_date: string | null;
    supplier?: string | null;
    project: { termo: string };
};

const monthNames = [
    "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
    "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
];

export default function Historico() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<string>(monthNames[new Date().getMonth()]);
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [isProjectMenuExpanded, setIsProjectMenuExpanded] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [currentUser, setCurrentUser] = useState<{ username: string, role: string } | null>(null);

    useEffect(() => {
        setIsMounted(true);
        fetch('/api/invoices')
            .then(res => res.json())
            .then(data => {
                setInvoices(data.filter((i: Invoice) => i.status === 'PAGO' && i.payment_date));
            });

        fetch('/api/auth/me')
            .then(res => res.ok ? res.json() : null)
            .then(user => setCurrentUser(user));
    }, []);

    if (!isMounted) return null;

    const availableYears = Array.from(new Set(invoices.map(i => new Date(i.payment_date!).getFullYear()))).sort((a, b) => b - a);
    const yearsToDisplay = availableYears.length > 0 ? availableYears : [selectedYear];

    const monthsData = monthNames.map((name, index) => {
        const hasData = invoices.some(i => {
            const d = new Date(i.payment_date!);
            return d.getFullYear() === selectedYear && d.getMonth() === index;
        });
        return { name, hasData };
    });

    const filteredInvoices = invoices.filter(i => {
        const d = new Date(i.payment_date!);
        const isMatch = d.getFullYear() === selectedYear && monthNames[d.getMonth()] === selectedMonth;
        if (!isMatch) return false;

        if (selectedProject) {
            return (i.project?.termo || 'Sem Projeto') === selectedProject;
        }
        return true;
    });

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    };

    const handlePdfAction = (filePath: string, action: 'view' | 'download' | 'print') => {
        if (!filePath) {
            alert("Arquivo não encontrado!");
            return;
        }

        const proxyUrl = `/api/download?path=${encodeURIComponent(filePath)}&action=${action}`;

        if (action === 'download') {
            const a = document.createElement('a');
            a.href = proxyUrl;
            a.setAttribute('download', '');
            document.body.appendChild(a);
            a.click();
            a.remove();
        } else if (action === 'view') {
            window.open(proxyUrl, '_blank');
        } else if (action === 'print') {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = proxyUrl;
            document.body.appendChild(iframe);
            iframe.onload = () => {
                iframe.contentWindow?.print();
                setTimeout(() => iframe.remove(), 5000);
            };
        }
    };

    return (
        <div className="flex h-[calc(100vh-6rem)] gap-4 w-full">
            {/* Sidebar: Filtros de Data */}
            <aside className="w-64 flex-shrink-0 bg-sccs-dark rounded-lg p-4 flex flex-col gap-4 shadow-lg text-white">
                <h2 className="text-lg font-bold tracking-wider pb-2 border-b border-white/10 text-center">
                    FILTROS
                </h2>

                {/* Years */}
                <div className="flex flex-wrap gap-2 mt-2 bg-black/20 p-1 rounded-md">
                    {yearsToDisplay.map((y) => (
                        <button
                            key={y}
                            onClick={() => setSelectedYear(y)}
                            className={`flex-1 py-1 px-2 rounded text-xs font-semibold transition-colors ${selectedYear === y
                                ? "bg-sccs-green text-white shadow"
                                : "text-gray-300 hover:bg-white/10"
                                }`}
                        >
                            {y}
                        </button>
                    ))}
                </div>

                {/* Months */}
                <div className="flex flex-col gap-1 mt-2 overflow-y-auto pr-2 custom-scrollbar">
                    {monthsData.map((m) => {
                        const monthIndex = monthNames.indexOf(m.name);
                        const monthProjects = Array.from(new Set(
                            invoices
                                .filter(i => {
                                    const d = new Date(i.payment_date!);
                                    return d.getFullYear() === selectedYear && d.getMonth() === monthIndex;
                                })
                                .map(i => i.project?.termo || 'Sem Projeto')
                        )).sort();

                        return (
                            <div key={m.name} className="flex flex-col gap-1">
                                <button
                                    disabled={!m.hasData}
                                    onClick={() => {
                                        if (selectedMonth === m.name) {
                                            setIsProjectMenuExpanded(!isProjectMenuExpanded);
                                        } else {
                                            setSelectedMonth(m.name);
                                            setSelectedProject(null);
                                            setIsProjectMenuExpanded(true);
                                        }
                                    }}
                                    className={`py-2 px-3 flex items-center justify-between text-left rounded text-sm font-medium transition-colors ${!m.hasData
                                        ? "opacity-40 cursor-not-allowed text-gray-400"
                                        : selectedMonth === m.name
                                            ? "bg-sccs-green text-white shadow border-l-4 border-white"
                                            : "text-gray-300 hover:bg-white/10 border-l-4 border-transparent"
                                        }`}
                                >
                                    <span>{m.name}</span>
                                    {selectedMonth === m.name && m.hasData && monthProjects.length > 0 && (
                                        isProjectMenuExpanded ? <ChevronUp className="w-4 h-4 ml-2 opacity-70" /> : <ChevronDown className="w-4 h-4 ml-2 opacity-70" />
                                    )}
                                </button>

                                {/* Sub-menu for projects */}
                                {selectedMonth === m.name && isProjectMenuExpanded && m.hasData && monthProjects.length > 0 && (
                                    <div className="pl-4 flex flex-col gap-1 mt-1 mb-2">
                                        <button
                                            onClick={() => setSelectedProject(null)}
                                            className={`text-xs text-left py-1.5 px-3 rounded font-medium transition-colors whitespace-nowrap truncate ${selectedProject === null
                                                ? 'bg-white/20 text-white'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                        >
                                            TODOS OS PROJETOS
                                        </button>
                                        {monthProjects.map(proj => (
                                            <div
                                                key={proj}
                                                className={`flex items-center justify-between rounded pr-1 group transition-colors ${selectedProject === proj
                                                    ? 'bg-white/20 text-white'
                                                    : 'text-gray-400 hover:bg-white/5'}`}
                                            >
                                                <button
                                                    onClick={() => setSelectedProject(proj)}
                                                    className="flex-1 text-xs text-left py-1.5 px-3 font-medium whitespace-nowrap truncate hover:text-white"
                                                >
                                                    {proj}
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();

                                                        // Filta as notas do ano, mês e projeto clicado
                                                        const targetInvoices = invoices.filter(i => {
                                                            const d = new Date(i.payment_date!);
                                                            return d.getFullYear() === selectedYear &&
                                                                d.getMonth() === monthIndex &&
                                                                (i.project?.termo || 'Sem Projeto') === proj &&
                                                                i.file_path;
                                                        });

                                                        if (targetInvoices.length === 0) {
                                                            alert("Nenhum arquivo para baixar neste projeto.");
                                                            return;
                                                        }

                                                        const monthString = (monthIndex + 1).toString().padStart(2, '0');
                                                        const downloadZipUrl = `/api/download-folder?year=${selectedYear}&month=${monthString}&project=${encodeURIComponent(proj)}`;

                                                        // Aciona o download do ZIP pelo navegador
                                                        const a = document.createElement('a');
                                                        a.href = downloadZipUrl;
                                                        a.setAttribute('download', '');
                                                        document.body.appendChild(a);
                                                        a.click();
                                                        a.remove();
                                                    }}
                                                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/20 hover:text-white transition-all text-gray-400"
                                                    title="Baixar notas deste projeto"
                                                >
                                                    <Download className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

            </aside>

            {/* Main Content Area */}
            <section className="flex-1 bg-white rounded-lg p-6 border border-sccs-border shadow-sm flex flex-col relative overflow-hidden">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-sccs-border">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold tracking-widest text-sccs-dark uppercase">
                            DOCUMENTOS DE {selectedMonth} / {selectedYear}
                        </h2>
                        <span className="bg-sccs-gray text-sccs-dark px-4 py-1.5 rounded-full text-sm font-semibold border border-sccs-border">
                            {filteredInvoices.length} Documentos
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-4">
                    {filteredInvoices.map((inv) => (
                        <div key={inv.id} className="bg-sccs-gray p-4 rounded-lg border border-sccs-border flex items-center justify-between hover:shadow-md transition-shadow group">

                            <div className="flex items-center gap-4">
                                <div className="bg-white p-3 rounded-full border border-gray-200 text-sccs-green group-hover:scale-110 transition-transform">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-sccs-dark text-lg">
                                        {inv.supplier ? `${inv.supplier} + PIX` : `Nota Fiscal ${inv.invoice_number} + Comprovante PIX`}
                                    </span>
                                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">PAGO</span>
                                        <span>•</span>
                                        <span className="font-medium text-sccs-dark">{inv.project?.termo}</span>
                                        <span>•</span>
                                        <span className="font-bold text-sccs-red">R$ {parseFloat(inv.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button onClick={() => handlePdfAction(inv.file_path, 'view')} className="bg-white border border-gray-200 hover:bg-gray-50 text-sccs-dark p-2.5 rounded-md flex items-center justify-center transition-colors shadow-sm" title="Visualizar Documento">
                                    <Eye className="w-5 h-5" />
                                </button>
                                <button onClick={() => handlePdfAction(inv.file_path, 'download')} className="bg-white border border-gray-200 hover:bg-gray-50 text-sccs-dark p-2.5 rounded-md flex items-center justify-center transition-colors shadow-sm" title="Baixar Arquivo via NextCloud">
                                    <Download className="w-5 h-5" />
                                </button>
                                <button onClick={() => handlePdfAction(inv.file_path, 'print')} className="bg-white border border-gray-200 hover:bg-gray-50 text-sccs-dark p-2.5 rounded-md flex items-center justify-center transition-colors shadow-sm" title="Imprimir">
                                    <Printer className="w-5 h-5" />
                                </button>
                                <button onClick={async () => {
                                    if (window.confirm('Tem certeza que deseja deletar este registro de histórico?')) {
                                        await fetch(`/api/invoices/${inv.id}`, { method: 'DELETE' });
                                        setInvoices(prev => prev.filter(i => i.id !== inv.id));
                                    }
                                }} className="bg-white border border-gray-200 hover:bg-red-50 text-sccs-red p-2.5 rounded-md flex items-center justify-center transition-colors shadow-sm ml-2" title="Deletar Registro">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {filteredInvoices.length === 0 && (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium text-lg">
                            Nenhum documento encontrado neste período.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

