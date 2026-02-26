"use client";

import { FileText, CheckCircle, Upload, Eye, Download, Printer, Trash2, LogOut, Settings } from "lucide-react";
import { useState, useEffect } from "react";

type Category = {
    id: number;
    name: string;
};

type Project = {
    id: number;
    category_id: number;
    termo: string;
    name?: string | null;
};

type Invoice = {
    id: number;
    project_id: number;
    invoice_number: string;
    amount: string;
    file_path: string;
    status: string;
    pix_receipt_path: string | null;
    payment_date?: string | null;
    created_at?: string;
    project: {
        termo: string;
    };
};

export default function DesignerPage() {
    const [categories, setCategories] = useState<Category[]>([
        { id: 1, name: "FIA" },
        { id: 2, name: "FMI" },
        { id: 3, name: "MUNICÍPIO" }
    ]);

    const [projects, setProjects] = useState<Project[]>([
        { id: 101, category_id: 1, termo: "FIA - 001/2026", name: "Projeto Semente" },
        { id: 102, category_id: 1, termo: "FIA - 002/2026", name: "Projeto Esperança" },
        { id: 103, category_id: 2, termo: "FMI - 010/2026", name: "Fundo de Manutenção" },
        { id: 104, category_id: 3, termo: "MUN - 055/2026", name: "Apoio Cidadão" }
    ]);

    const [invoices, setInvoices] = useState<Invoice[]>([
        { id: 1001, project_id: 101, invoice_number: "NF-1001", amount: "1500.50", file_path: "/dummy1.pdf", status: "A_PAGAR", pix_receipt_path: null, created_at: new Date().toISOString(), project: { termo: "FIA - 001/2026" } },
        { id: 1002, project_id: 102, invoice_number: "NF-1002", amount: "3200.00", file_path: "/dummy2.pdf", status: "A_PAGAR", pix_receipt_path: null, created_at: new Date().toISOString(), project: { termo: "FIA - 002/2026" } },
        { id: 1006, project_id: 103, invoice_number: "NF-2042", amount: "485.90", file_path: "/dummy6.pdf", status: "A_PAGAR", pix_receipt_path: null, created_at: new Date().toISOString(), project: { termo: "FMI - 010/2026" } },
        { id: 1007, project_id: 104, invoice_number: "NF-3088", amount: "12500.00", file_path: "/dummy7.pdf", status: "A_PAGAR", pix_receipt_path: null, created_at: new Date().toISOString(), project: { termo: "MUN - 055/2026" } },
        { id: 1003, project_id: 103, invoice_number: "NF-2003", amount: "450.75", file_path: "/dummy3.pdf", status: "AGUARDANDO_PIX", pix_receipt_path: null, created_at: new Date(Date.now() - 86400000).toISOString(), project: { termo: "FMI - 010/2026" } },
        { id: 1004, project_id: 101, invoice_number: "NF-1004", amount: "890.00", file_path: "/dummy4.pdf", status: "PAGO", pix_receipt_path: "/pix1.pdf", payment_date: new Date().toISOString(), created_at: new Date(Date.now() - 172800000).toISOString(), project: { termo: "FIA - 001/2026" } },
        { id: 1005, project_id: 104, invoice_number: "NF-3005", amount: "1230.20", file_path: "/dummy5.pdf", status: "PAGO", pix_receipt_path: "/pix2.pdf", payment_date: new Date(Date.now() - 86400000).toISOString(), created_at: new Date(Date.now() - 259200000).toISOString(), project: { termo: "MUN - 055/2026" } }
    ]);

    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [projectDisplayMode, setProjectDisplayMode] = useState<'termo' | 'nome' | 'tudo'>('tudo');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    const handleProjectSelect = (projectId: number) => {
        setSelectedProjectId(projectId === selectedProjectId ? null : projectId);
    };

    const updateInvoiceStatus = async (id: number, status: string) => {
        setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv));
    };

    const displayedInvoices = selectedProjectId && selectedProjectId !== -1
        ? invoices.filter(inv => inv.project_id === selectedProjectId)
        : invoices;

    const invoicesAPagar = displayedInvoices.filter(i => i.status === 'A_PAGAR');
    const invoicesAguardandoPix = displayedInvoices.filter(i => i.status === 'AGUARDANDO_PIX');
    const invoicesPagos = displayedInvoices.filter(i => i.status === 'PAGO');

    const groupInvoicesByDate = (invoicesList: Invoice[]) => {
        const groups: { [key: string]: Invoice[] } = {};
        invoicesList.forEach(inv => {
            const dateObj = inv.payment_date ? new Date(inv.payment_date) : new Date(inv.created_at || new Date());
            const dateString = dateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });

            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            let prefix = "";
            if (dateObj.toDateString() === today.toDateString()) prefix = "Hoje, ";
            else if (dateObj.toDateString() === yesterday.toDateString()) prefix = "Ontem, ";

            const key = prefix + dateString;
            if (!groups[key]) groups[key] = [];
            groups[key].push(inv);
        });

        return Object.keys(groups).map(date => ({
            date,
            invoices: groups[date]
        }));
    };

    const groupedPagos = groupInvoicesByDate(invoicesPagos);

    return (
        <div className="flex h-[calc(100vh-6rem)] gap-4 w-full">
            {/* Coluna 1: Projetos */}
            <aside className="w-64 flex-shrink-0 bg-sccs-dark rounded-lg p-4 flex flex-col gap-4 shadow-lg text-white overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center pb-2 border-b border-white/10 mb-2">
                    <h2 className="text-xl font-bold tracking-wider uppercase cursor-pointer hover:text-sccs-green transition-colors" onClick={() => handleProjectSelect(-1)}>
                        PROJETOS
                    </h2>

                    <div className="relative group p-1 z-30">
                        <button className="text-gray-400 hover:text-white transition-all duration-300 p-1 rounded-full hover:bg-white/10 group-hover:rotate-90" title="Opções de Exibição">
                            <Settings className="w-5 h-5" />
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-36 bg-[#1a222c] border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden z-40 
                            opacity-0 invisible translate-y-[-10px] translate-x-[10px] scale-95
                            group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:translate-x-0 group-hover:scale-100
                            transition-all duration-300 ease-out origin-top-right backdrop-blur-md">

                            <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5">
                                Exibir
                            </div>

                            <button
                                onClick={() => setProjectDisplayMode('termo')}
                                className={`text-xs text-left px-4 py-2.5 transition-all flex items-center gap-2 ${projectDisplayMode === 'termo' ? 'bg-sccs-green/10 text-sccs-green font-bold' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                            >
                                {projectDisplayMode === 'termo' && <div className="w-1.5 h-1.5 rounded-full bg-sccs-green"></div>}
                                <span className={projectDisplayMode === 'termo' ? '' : 'ml-[14px]'}>TERMO</span>
                            </button>

                            <button
                                onClick={() => setProjectDisplayMode('nome')}
                                className={`text-xs text-left px-4 py-2.5 transition-all flex items-center gap-2 ${projectDisplayMode === 'nome' ? 'bg-sccs-green/10 text-sccs-green font-bold' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                            >
                                {projectDisplayMode === 'nome' && <div className="w-1.5 h-1.5 rounded-full bg-sccs-green"></div>}
                                <span className={projectDisplayMode === 'nome' ? '' : 'ml-[14px]'}>NOME</span>
                            </button>

                            <button
                                onClick={() => setProjectDisplayMode('tudo')}
                                className={`text-xs text-left px-4 py-2.5 transition-all flex items-center gap-2 ${projectDisplayMode === 'tudo' ? 'bg-sccs-green/10 text-sccs-green font-bold' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                            >
                                {projectDisplayMode === 'tudo' && <div className="w-1.5 h-1.5 rounded-full bg-sccs-green"></div>}
                                <span className={projectDisplayMode === 'tudo' ? '' : 'ml-[14px]'}>TUDO</span>
                            </button>
                        </div>
                    </div>
                </div>

                {categories.map(cat => (
                    <div key={cat.id} className="flex flex-col gap-2">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mt-2 text-center">{cat.name}</h3>
                        {projects.filter(p => p.category_id === cat.id).map(p => {

                            let displayText = p.termo;
                            let tooltipText = p.name || '';

                            if (projectDisplayMode === 'nome') {
                                displayText = p.name || p.termo;
                                tooltipText = p.termo;
                            } else if (projectDisplayMode === 'tudo') {
                                displayText = `${p.termo} ${p.name || ''}`;
                                tooltipText = '';
                            }

                            return (
                                <button
                                    key={p.id}
                                    onClick={() => handleProjectSelect(p.id)}
                                    title={tooltipText}
                                    className={`text-center rounded-md py-2 px-4 shadow-sm transition-colors border text-sm truncate ${selectedProjectId === p.id ? 'bg-sccs-green text-white border-transparent' : 'bg-white/5 hover:bg-sccs-green text-white border-transparent'}`}
                                >
                                    {displayText}
                                </button>
                            );
                        })}
                    </div>
                ))}

                <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-sccs-green text-white flex items-center justify-center font-bold text-xs shadow-sm">
                            DS
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-sccs-green">Módulo Designer</span>
                            <span className="text-[10px] text-gray-400">Mock Data</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 grid grid-cols-3 gap-4 min-h-0">
                {/* Coluna 2: A Pagar */}
                <section className="bg-white rounded-lg p-4 border border-sccs-border shadow-sm flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center pb-2 border-b border-sccs-border mb-4">
                        <h2 className="text-lg font-bold text-sccs-dark">
                            A PAGAR (MOCK)
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {invoicesAPagar.map((inv) => (
                            <div key={inv.id} className="bg-sccs-gray p-3 rounded-lg border border-sccs-border flex flex-col gap-2 hover:shadow-md transition-shadow relative group">
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="bg-white border border-gray-200 hover:bg-gray-50 text-sccs-dark p-1.5 rounded-md flex items-center justify-center transition-colors shadow-sm" title="Visualizar Nota">
                                        <Eye className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="flex justify-between items-start mt-2">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-sccs-dark" />
                                            <span className="font-semibold text-sm text-sccs-dark">NF {inv.invoice_number}</span>
                                        </div>
                                        <span className="text-xs text-gray-500 font-medium">{inv.project?.termo}</span>
                                    </div>
                                    <span className="text-xs font-bold text-sccs-red">R$ {parseFloat(inv.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <button
                                    onClick={() => updateInvoiceStatus(inv.id, 'AGUARDANDO_PIX')}
                                    className="mt-2 w-full bg-sccs-green hover:bg-[#0e8a80] text-white py-1.5 rounded text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" /> SIMULAR PAGAMENTO
                                </button>
                            </div>
                        ))}
                        {invoicesAPagar.length === 0 && (
                            <div className="text-center text-sm text-gray-400 mt-10">Nenhuma fatura pendente.</div>
                        )}
                    </div>
                </section>

                {/* Coluna 3: Anexar PIX */}
                <section className="bg-white rounded-lg p-4 border border-sccs-border shadow-sm flex flex-col overflow-hidden">
                    <h2 className="text-lg font-bold text-sccs-dark pb-2 border-b border-sccs-border mb-4">
                        ANEXAR PIX (MOCK)
                    </h2>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {invoicesAguardandoPix.map((inv) => (
                            <div key={inv.id} className="bg-sccs-gray p-3 rounded-lg border border-sccs-border flex flex-col gap-3 hover:shadow-md transition-shadow relative group">
                                <div className="flex justify-between items-start mt-2">
                                    <div className="flex flex-col text-left">
                                        <span className="text-sm font-medium text-sccs-dark">Nota {inv.invoice_number}</span>
                                        <span className="text-xs text-sccs-green font-bold">{inv.project?.termo}</span>
                                    </div>
                                </div>

                                <label className="cursor-pointer border-2 border-dashed border-gray-300 hover:border-sccs-green rounded-lg p-4 flex flex-col items-center justify-center transition-colors bg-white">
                                    <Upload className="w-6 h-6 mb-2 text-gray-400" />
                                    <span className="text-xs text-gray-500 font-medium">Clique para enviar comprovante</span>
                                </label>
                                <button
                                    onClick={() => updateInvoiceStatus(inv.id, 'PAGO')}
                                    className="w-full border-2 border-sccs-green text-sccs-green bg-sccs-green/10 hover:bg-sccs-green hover:text-white py-1.5 rounded text-sm font-semibold transition-colors">
                                    CONFIRMAR ANEXO
                                </button>
                            </div>
                        ))}
                        {invoicesAguardandoPix.length === 0 && (
                            <div className="text-center text-sm text-gray-400 mt-10">Nenhuma nota aguardando PIX.</div>
                        )}
                    </div>
                </section>

                {/* Coluna 4: Download */}
                <section className="bg-white rounded-lg p-4 border border-sccs-border shadow-sm flex flex-col overflow-hidden">
                    <h2 className="text-lg font-bold text-sccs-dark pb-2 border-b border-sccs-border mb-4">
                        DOWNLOAD (MOCK)
                    </h2>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {groupedPagos.map((group, groupIdx) => (
                            <div key={groupIdx} className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 px-1">
                                    <div className="h-px bg-sccs-border flex-1"></div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{group.date}</span>
                                    <div className="h-px bg-sccs-border flex-1"></div>
                                </div>

                                {group.invoices.map((inv) => (
                                    <div key={inv.id} className="bg-sccs-gray p-3 rounded-lg border border-sccs-border flex flex-col gap-2 hover:shadow-md transition-shadow relative group">
                                        <div className="flex justify-between items-start mt-2">
                                            <div className="flex flex-col text-left">
                                                <span className="text-sm font-semibold text-sccs-dark">Nota Fiscal {inv.invoice_number} + PIX</span>
                                                <span className="text-[10px] text-gray-500 font-medium">{inv.project?.termo}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                        {groupedPagos.length === 0 && (
                            <div className="text-center text-sm text-gray-400 mt-10">Nenhum documento finalizado.</div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
