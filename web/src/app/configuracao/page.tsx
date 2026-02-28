"use client";

import { useState, useEffect } from "react";
import { Save, Plus, Edit2, Trash2, LogOut, Upload, FileText, Loader2 } from "lucide-react";

type Tab = "projetos" | "usuarios" | "historico" | "avancadas";

type Category = { id: number; name: string };
type Project = { id: number; category_id: number; termo: string; name: string | null; category?: Category };
type User = { id: number; username: string; role: string };

export default function Configuracao() {
    const [activeTab, setActiveTab] = useState<Tab>("projetos");
    const [categories, setCategories] = useState<Category[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    const [newCategoryName, setNewCategoryName] = useState("");
    const [newProjectTermo, setNewProjectTermo] = useState("");
    const [newProjectName, setNewProjectName] = useState("");
    const [newCategoryIdStr, setNewCategoryIdStr] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");

    const [currentUser, setCurrentUser] = useState<{ username: string, role: string } | null>(null);

    const [newUsername, setNewUsername] = useState("");
    const [newPassword, setNewPassword] = useState("");

    // Arquivos Historico
    const [isCombinedUpload, setIsCombinedUpload] = useState(false);
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [processStatus, setProcessStatus] = useState<"IDLE" | "RENAMING" | "MERGING" | "DONE" | "ERROR">("IDLE");
    const [errorMessage, setErrorMessage] = useState("");
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear() < 2025 ? 2025 : new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<string>("JANEIRO");

    // Novos campos Obrigatorios
    const [selectedProjectForUpload, setSelectedProjectForUpload] = useState("");
    const [uploadAmount, setUploadAmount] = useState("");
    const [uploadDate, setUploadDate] = useState("");

    // Configurações Avançadas
    const [companyName, setCompanyName] = useState("SOCIEDADE CULTURAL CRUZEIRO DO SUL");
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [settingsLoading, setSettingsLoading] = useState(false);

    const months = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: Math.max(5, currentYear - 2025 + 5) }, (_, i) => 2025 + i);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [catRes, projRes, userRes, settingsRes] = await Promise.all([
                fetch('/api/categories'),
                fetch('/api/projects'),
                fetch('/api/users'),
                fetch('/api/settings')
            ]);
            const catData = await catRes.json();
            const projData = await projRes.json();
            const userData = await userRes.json();
            const settingsData = await settingsRes.json();

            setCategories(catData);
            setProjects(projData);
            setUsers(Array.isArray(userData) ? userData : []);
            if (settingsData && settingsData.companyName) {
                setCompanyName(settingsData.companyName);
            }

            if (catData.length > 0 && !selectedCategory) {
                setSelectedCategory(catData[0].id.toString());
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        }
    };

    const handleCreateUser = async () => {
        if (!newUsername || !newPassword) return;
        await fetch('/api/users', {
            method: 'POST',
            body: JSON.stringify({ username: newUsername, password: newPassword })
        });
        setNewUsername("");
        setNewPassword("");
        alert("Usuário Criado!");
        fetchData();
    };

    const handleDeleteUser = async (id: number) => {
        if (!window.confirm("Tem certeza que deseja deletar este usuário?")) return;
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.error) alert(data.error);
        fetchData();
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName) return;
        await fetch('/api/categories', {
            method: 'POST',
            body: JSON.stringify({ name: newCategoryName })
        });
        setNewCategoryName("");
        fetchData();
    };

    const handleCreateProject = async () => {
        if (!newProjectTermo || !selectedCategory) return;
        await fetch('/api/projects', {
            method: 'POST',
            body: JSON.stringify({ category_id: selectedCategory, termo: newProjectTermo, name: newProjectName })
        });
        setNewProjectTermo("");
        setNewProjectName("");
        alert("Projeto Salvo com sucesso!");
        fetchData();
    };

    const handleDeleteProject = async (id: number) => {
        if (!window.confirm('Tem certeza que deseja deletar este projeto?')) return;
        const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.error) alert(data.error);
        fetchData();
    };

    const handleEditProject = async (p: Project) => {
        const novoTermo = prompt("Novo Termo:", p.termo);
        if (novoTermo === null) return;
        const novoNome = prompt("Novo Nome:", p.name || "");
        if (novoNome === null) return;

        await fetch(`/api/projects/${p.id}`, {
            method: 'PUT',
            body: JSON.stringify({ termo: novoTermo, name: novoNome, category_id: p.category_id })
        });
        fetchData();
    };

    const handleDeleteCategory = async (id: number) => {
        const cat = categories.find(c => c.id === id);
        if (cat?.name === 'Sem Termo') {
            alert("A categoria 'Sem Termo' não pode ser deletada.");
            return;
        }

        if (!window.confirm('Tem certeza que deseja deletar esta categoria?')) return;
        const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.error) alert(data.error);
        fetchData();
    };

    const handleEditCategory = async (c: Category) => {
        if (c.name === 'Sem Termo') {
            alert("A categoria 'Sem Termo' não pode ser editada.");
            return;
        }
        const novoNome = prompt("Novo Nome da Categoria:", c.name);
        if (novoNome === null || !novoNome.trim()) return;

        await fetch(`/api/categories/${c.id}`, {
            method: 'PUT',
            body: JSON.stringify({ name: novoNome })
        });
        fetchData();
    };

    const handleProcessFiles = async () => {
        setErrorMessage("");

        if (!selectedProjectForUpload) {
            setErrorMessage("Erro: Você deve selecionar um Projeto/Termo.");
            return;
        }
        if (!uploadAmount || !uploadDate) {
            setErrorMessage("Erro: Você deve preencher o Valor e a Data de Pagamento.");
            return;
        }
        if (!invoiceFile) {
            setErrorMessage("Erro: Você deve anexar a Nota Fiscal.");
            return;
        }

        if (!isCombinedUpload && !receiptFile) {
            setErrorMessage("Erro: Você deve anexar o Comprovante PIX ou marcar a opção 'Comprovante está junto a nota'.");
            return;
        }

        setProcessStatus("MERGING");

        try {
            const formData = new FormData();
            formData.append("projectId", selectedProjectForUpload);
            formData.append("amount", uploadAmount);
            formData.append("paymentDate", uploadDate);
            formData.append("year", selectedYear.toString());
            formData.append("month", selectedMonth);
            formData.append("invoiceFile", invoiceFile);
            if (!isCombinedUpload && receiptFile) {
                formData.append("receiptFile", receiptFile);
            }

            const response = await fetch('/api/invoices/upload-historical', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Erro no processamento.");
            }

            setProcessStatus("DONE");
            fetchData();
        } catch (error: any) {
            setErrorMessage(error.message);
            setProcessStatus("ERROR");
        }
    };

    const resetProcessFlow = () => {
        setInvoiceFile(null);
        setReceiptFile(null);
        setIsCombinedUpload(false);
        setProcessStatus("IDLE");
        setErrorMessage("");
        setSelectedProjectForUpload("");
        setUploadAmount("");
        setUploadDate("");
    };


    const handleUpdateSettings = async () => {
        setSettingsLoading(true);
        try {
            const formData = new FormData();
            formData.append('companyName', companyName);
            if (logoFile) {
                formData.append('logo', logoFile);
            }

            const res = await fetch('/api/settings', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error("Erro ao salvar configurações globais");
            alert("Configurações atualizadas com sucesso! Atualize a página para ver as marcações surtirem efeito global.");
            setLogoFile(null); // limpa preview de input logo iterado
        } catch (error) {
            alert(error);
        } finally {
            setSettingsLoading(false);
        }
    };

    const handlePdfAction = (filePath: string, action: 'view' | 'download' | 'print') => {
        if (!filePath) {
            alert("Arquivo não encontrado!");
            return;
        }

        const proxyUrl = `/api/download?path=${encodeURIComponent(filePath)}`;

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
            {/* Sidebar de Configurações */}
            <aside className="w-64 flex-shrink-0 bg-sccs-dark rounded-lg p-4 flex flex-col gap-2 shadow-lg text-white">
                <h2 className="text-lg font-bold tracking-wider pb-2 border-b border-white/10 text-center uppercase mb-2">
                    OPÇÕES
                </h2>

                <button
                    onClick={() => setActiveTab("projetos")}
                    className={`py-3 px-4 rounded-md text-sm font-semibold tracking-wider transition-colors text-left ${activeTab === "projetos"
                        ? "bg-sccs-green text-white shadow"
                        : "bg-transparent text-gray-300 hover:bg-white/5"
                        }`}
                >
                    PROJETOS E CATEGORIA
                </button>

                <button
                    onClick={() => setActiveTab("usuarios")}
                    className={`py-3 px-4 rounded-md text-sm font-semibold tracking-wider transition-colors text-left ${activeTab === "usuarios"
                        ? "bg-sccs-green text-white shadow"
                        : "bg-transparent text-gray-300 hover:bg-white/5"
                        }`}
                >
                    USUÁRIOS
                </button>

                <button
                    onClick={() => {
                        setActiveTab("historico");
                        resetProcessFlow();
                    }}
                    className={`py-3 px-4 rounded-md text-sm font-semibold tracking-wider transition-colors text-left ${activeTab === "historico"
                        ? "bg-sccs-green text-white shadow"
                        : "bg-transparent text-gray-300 hover:bg-white/5"
                        }`}
                >
                    HISTÓRICO
                </button>

                <button
                    onClick={() => setActiveTab("avancadas")}
                    className={`py-3 px-4 rounded-md text-sm font-semibold tracking-wider transition-colors text-left ${activeTab === "avancadas"
                        ? "bg-sccs-green text-white shadow"
                        : "bg-transparent text-gray-300 hover:bg-white/5"
                        }`}
                >
                    AVANÇADAS
                </button>

                {/* User / Logout */}
                <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-sccs-green text-white flex items-center justify-center font-bold text-xs shadow-sm uppercase">
                            {currentUser?.username ? currentUser.username.substring(0, 2) : '??'}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold capitalize">{currentUser?.username || 'Carregando...'}</span>
                            <span className="text-[10px] text-gray-400 capitalize">{currentUser?.role === 'admin' ? 'Administrador' : 'Usuário'}</span>
                        </div>
                    </div>
                    <a href="/login" className="text-gray-400 hover:text-sccs-red transition-colors p-1 flex items-center justify-center" title="Sair do Sistema">
                        <LogOut className="w-4 h-4" />
                    </a>
                </div>
            </aside>

            {/* Main Content Area */}
            <section className="flex-1 bg-white rounded-lg p-6 border border-sccs-border shadow-sm flex flex-col relative overflow-hidden">

                {activeTab === "projetos" && (
                    <div className="flex flex-col gap-8 text-sccs-dark pr-2 h-full overflow-y-auto custom-scrollbar">

                        {/* SECTION: PROJETOS E CATEGORIAS (SIDE BY SIDE) */}
                        <div className="flex gap-6 w-full">

                            {/* COL 1: Cadastro de Projeto e Categorias */}
                            <div className="flex-1 flex flex-col gap-6">

                                <div className="bg-sccs-gray p-5 rounded-lg border border-sccs-border flex flex-col h-full flex-1">
                                    <h2 className="text-lg font-bold tracking-widest mb-4 uppercase border-b border-sccs-border pb-2 text-sccs-green">
                                        Novo Projeto
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="w-full">
                                            <label className="block text-xs font-bold text-sccs-dark mb-1">CATEGORIA</label>
                                            <select
                                                className="w-full bg-white border border-sccs-border rounded-md px-3 py-2 text-sm text-sccs-dark focus:outline-none focus:border-sccs-green focus:ring-1 focus:ring-sccs-green transition-all cursor-pointer"
                                                value={selectedCategory}
                                                onChange={e => setSelectedCategory(e.target.value)}
                                            >
                                                {categories.map(c => (
                                                    <option key={c.id} value={c.id.toString()}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex gap-4 w-full">
                                            <div className="flex-1">
                                                <label className="block text-xs font-bold text-sccs-dark mb-1">TERMO (EX: T 3104)</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-white border border-sccs-border rounded-md px-3 py-2 text-sm text-sccs-dark placeholder-gray-400 focus:outline-none focus:border-sccs-green focus:ring-1 focus:ring-sccs-green transition-all"
                                                    placeholder="Obrigatório"
                                                    value={newProjectTermo}
                                                    onChange={e => setNewProjectTermo(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-xs font-bold text-sccs-dark mb-1">NOME (EX: Música)</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-white border border-sccs-border rounded-md px-3 py-2 text-sm text-sccs-dark placeholder-gray-400 focus:outline-none focus:border-sccs-green focus:ring-1 focus:ring-sccs-green transition-all"
                                                    placeholder="Opcional"
                                                    value={newProjectName}
                                                    onChange={e => setNewProjectName(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <button onClick={handleCreateProject} className="w-full mt-2 bg-sccs-green hover:bg-[#0e8a80] text-white font-bold py-2 rounded-md shadow-sm transition-colors flex items-center justify-center gap-2 text-sm">
                                            <Save className="w-4 h-4" /> SALVAR PROJETO
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* COL 2: Lista de Projetos (NEW) */}
                            <div className="flex-1 bg-sccs-gray p-5 rounded-lg border border-sccs-border flex flex-col h-[350px]">
                                <h2 className="text-lg font-bold tracking-widest mb-4 uppercase border-b border-sccs-border pb-2 text-sccs-green">
                                    Projetos Cadastrados
                                </h2>
                                <div className="flex-1 overflow-y-auto border border-sccs-border rounded-md bg-white custom-scrollbar">
                                    <table className="w-full text-left text-sm text-sccs-dark">
                                        <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-sccs-border sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3">Termo</th>
                                                <th className="px-4 py-3">Nome / Categoria</th>
                                                <th className="px-4 py-3 text-center">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {projects.map((p) => {
                                                const isProtected = p.termo === 'T 0000';
                                                return (
                                                    <tr key={p.id} className="border-b border-sccs-border hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-3 font-semibold">{p.termo}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-col">
                                                                <span>{p.name || '-'}</span>
                                                                <span className="text-[10px] text-gray-500">{p.category?.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex justify-center gap-3">
                                                                {!isProtected ? (
                                                                    <>
                                                                        <button onClick={() => handleEditProject(p)} className="text-gray-400 hover:text-sccs-green transition-colors" title="Alterar">
                                                                            <Edit2 className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteProject(p.id)}
                                                                            className="text-gray-400 hover:text-sccs-red transition-colors"
                                                                            title="Deletar"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400 font-medium">Padrão</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                            {projects.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="text-center py-4 text-gray-400">Nenhum projeto cadastrado.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* ROW 2: CATEGORIAS */}
                        <div className="flex gap-6 w-full border-t border-sccs-border pt-8 flex-col-reverse md:flex-row">
                            <div className="flex-1 bg-sccs-gray p-5 rounded-lg border border-sccs-border h-fit">
                                <h2 className="text-lg font-bold tracking-widest mb-4 uppercase border-b border-sccs-border pb-2 text-sccs-green">
                                    Nova Categoria
                                </h2>
                                <div className="flex items-end gap-2 w-full flex-wrap">
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-xs font-bold text-sccs-dark mb-1">NOME DA CATEGORIA</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white border border-sccs-border rounded-md px-3 py-2 text-sm text-sccs-dark placeholder-gray-400 focus:outline-none focus:border-sccs-green focus:ring-1 focus:ring-sccs-green transition-all"
                                            placeholder="Ex: Financiamento Municipal"
                                            value={newCategoryName}
                                            onChange={e => setNewCategoryName(e.target.value)}
                                        />
                                    </div>
                                    <button onClick={handleCreateCategory} className="bg-sccs-green hover:bg-[#0e8a80] text-white font-bold py-2 px-4 rounded-md shadow-sm transition-colors flex items-center gap-2 text-sm">
                                        <Plus className="w-4 h-4" /> ADICIONAR
                                    </button>
                                </div>
                            </div>

                            {/* COL 2: Lista de Categorias */}
                            <div className="flex-1 bg-sccs-gray p-5 rounded-lg border border-sccs-border flex flex-col h-[300px]">
                                <h2 className="text-lg font-bold tracking-widest mb-4 uppercase border-b border-sccs-border pb-2 text-sccs-green">
                                    Categorias Cadastradas
                                </h2>
                                <div className="flex-1 overflow-y-auto border border-sccs-border rounded-md bg-white custom-scrollbar">
                                    <table className="w-full text-left text-sm text-sccs-dark">
                                        <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-sccs-border sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3">ID</th>
                                                <th className="px-4 py-3">Categoria</th>
                                                <th className="px-4 py-3 text-center">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categories.map((c) => {
                                                const isProtected = c.name === 'Sem Termo';
                                                return (
                                                    <tr key={c.id} className="border-b border-sccs-border hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-3 text-gray-500">#{c.id}</td>
                                                        <td className="px-4 py-3 font-semibold">{c.name}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex justify-center gap-3">
                                                                {!isProtected ? (
                                                                    <>
                                                                        <button onClick={() => handleEditCategory(c)} className="text-gray-400 hover:text-sccs-green transition-colors" title="Alterar">
                                                                            <Edit2 className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteCategory(c.id)}
                                                                            className="text-gray-400 hover:text-sccs-red transition-colors"
                                                                            title="Deletar"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400 font-medium">Padrão</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                            {categories.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="text-center py-4 text-gray-400">Nenhuma categoria cadastrada.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {activeTab === "usuarios" && (
                    <div className="flex flex-col gap-8 text-sccs-dark pr-2 h-full overflow-y-auto custom-scrollbar">
                        {/* SECTION: USUÁRIOS */}
                        <div className="flex gap-6 w-full flex-col md:flex-row">
                            <div className="flex-1 bg-sccs-gray p-5 rounded-lg border border-sccs-border h-fit">
                                <h2 className="text-lg font-bold tracking-widest mb-4 uppercase border-b border-sccs-border pb-2 text-sccs-dark">
                                    Novo Usuário
                                </h2>
                                <div className="space-y-4">
                                    <div className="w-full">
                                        <label className="block text-xs font-bold text-sccs-dark mb-1">USUÁRIO / LOGIN</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white border border-sccs-border rounded-md px-3 py-2 text-sm text-sccs-dark placeholder-gray-400 focus:outline-none focus:border-sccs-green focus:ring-1 focus:ring-sccs-green transition-all"
                                            placeholder="Nome de Usuário"
                                            value={newUsername}
                                            onChange={(e) => setNewUsername(e.target.value)}
                                        />
                                    </div>
                                    <div className="w-full">
                                        <label className="block text-xs font-bold text-sccs-dark mb-1">SENHA</label>
                                        <input
                                            type="password"
                                            className="w-full bg-white border border-sccs-border rounded-md px-3 py-2 text-sm text-sccs-dark placeholder-gray-400 focus:outline-none focus:border-sccs-green focus:ring-1 focus:ring-sccs-green transition-all"
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                    </div>
                                    <button onClick={handleCreateUser} className="w-full bg-sccs-green hover:bg-[#0e8a80] text-white font-bold py-2 rounded-md shadow-sm transition-colors flex items-center justify-center gap-2 text-sm mt-2">
                                        <Plus className="w-4 h-4" /> CADASTRAR USUÁRIO
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 bg-sccs-gray p-5 rounded-lg border border-sccs-border flex flex-col h-[500px]">
                                <h2 className="text-lg font-bold tracking-widest mb-4 uppercase border-b border-sccs-border pb-2 text-sccs-dark">
                                    Usuários Cadastrados
                                </h2>
                                <div className="flex-1 overflow-y-auto border border-sccs-border rounded-md bg-white custom-scrollbar">
                                    <table className="w-full text-left text-sm text-sccs-dark">
                                        <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-sccs-border sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3">Usuário</th>
                                                <th className="px-4 py-3 text-center">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((u) => {
                                                const isAdmin = u.username === 'admin';
                                                return (
                                                    <tr key={u.id} className="border-b border-sccs-border hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-3 font-semibold flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-sccs-green text-white flex items-center justify-center font-bold text-[10px]">
                                                                {u.username.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            {u.username}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex justify-center gap-3">
                                                                {!isAdmin ? (
                                                                    <button onClick={() => handleDeleteUser(u.id)} className="text-gray-400 hover:text-sccs-red transition-colors" title="Deletar"><Trash2 className="w-4 h-4" /></button>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400 font-medium">Protegido</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                            {users.length === 0 && (
                                                <tr>
                                                    <td colSpan={2} className="text-center py-4 text-gray-400">Nenhum usuário cadastrado.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "historico" && (
                    <div className="flex flex-col h-full text-sccs-dark pr-2 max-w-3xl mx-auto w-full overflow-y-auto custom-scrollbar">
                        <h2 className="text-2xl font-bold tracking-widest text-sccs-dark uppercase border-b border-sccs-border pb-4 mb-6 text-center">
                            PROCESSAR ARQUIVOS (HISTÓRICO)
                        </h2>

                        <div className="bg-sccs-gray p-6 rounded-lg border border-sccs-border flex flex-col gap-6">

                            {errorMessage && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200 font-medium text-sm">
                                    {errorMessage}
                                </div>
                            )}

                            {/* Data de Referência */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-sccs-dark mb-2 uppercase">MÊS DE REFERÊNCIA</h3>
                                    <select
                                        className="w-full bg-white border border-sccs-border rounded-lg px-4 py-3 text-sm text-sccs-dark focus:outline-none focus:border-sccs-green focus:ring-1 focus:ring-sccs-green transition-all shadow-sm cursor-pointer"
                                        value={selectedMonth}
                                        onChange={e => setSelectedMonth(e.target.value)}
                                    >
                                        {months.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-sccs-dark mb-2 uppercase">ANO DE REFERÊNCIA</h3>
                                    <select
                                        className="w-full bg-white border border-sccs-border rounded-lg px-4 py-3 text-sm text-sccs-dark focus:outline-none focus:border-sccs-green focus:ring-1 focus:ring-sccs-green transition-all shadow-sm cursor-pointer"
                                        value={selectedYear}
                                        onChange={e => setSelectedYear(parseInt(e.target.value))}
                                    >
                                        {years.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Project, Amount and Date */}
                            <div className="flex gap-4">
                                <div className="flex-[1.5]">
                                    <h3 className="text-sm font-bold text-sccs-dark mb-2 uppercase">PROJETO / TERMO</h3>
                                    <select
                                        className="w-full bg-white border border-sccs-border rounded-lg px-4 py-3 text-sm text-sccs-dark focus:outline-none focus:border-sccs-green focus:ring-1 focus:ring-sccs-green transition-all shadow-sm cursor-pointer"
                                        value={selectedProjectForUpload}
                                        onChange={e => setSelectedProjectForUpload(e.target.value)}
                                    >
                                        <option value="" disabled>Selecione um projeto...</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.termo} - {p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-sccs-dark mb-2 uppercase">VALOR (R$)</h3>
                                    <input
                                        type="number" step="0.01"
                                        className="w-full bg-white border border-sccs-border rounded-lg px-4 py-3 text-sm text-sccs-dark focus:outline-none focus:border-sccs-green focus:ring-1 focus:ring-sccs-green transition-all shadow-sm"
                                        value={uploadAmount}
                                        onChange={e => setUploadAmount(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-sccs-dark mb-2 uppercase">DATA PAGAMENTO</h3>
                                    <input
                                        type="date"
                                        className="w-full bg-white border border-sccs-border rounded-lg px-4 py-3 text-sm text-sccs-dark focus:outline-none focus:border-sccs-green focus:ring-1 focus:ring-sccs-green transition-all shadow-sm cursor-pointer"
                                        value={uploadDate}
                                        onChange={e => setUploadDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Upload Nota Fiscal */}
                            <div>
                                <h3 className="text-sm font-bold text-sccs-dark mb-2 uppercase">1. Selecionar Nota Fiscal</h3>
                                {!invoiceFile ? (
                                    <label className="cursor-pointer border-2 border-dashed border-gray-300 hover:border-sccs-green rounded-lg p-6 flex flex-col items-center justify-center transition-colors bg-white w-full">
                                        <Upload className="w-8 h-8 mb-2 text-gray-400" />
                                        <span className="text-sm text-gray-500 font-medium">Clique para selecionar a Nota Fiscal</span>
                                        <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => e.target.files && setInvoiceFile(e.target.files[0])} />
                                    </label>
                                ) : (
                                    <div className="bg-white border border-sccs-border rounded-lg p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-5 h-5 text-sccs-green" />
                                            <span className="font-semibold text-sm text-sccs-dark truncate">{invoiceFile.name}</span>
                                        </div>
                                        <button onClick={() => { if (window.confirm('Tem certeza que deseja remover esta nota da fila de envio?')) { setInvoiceFile(null); setProcessStatus("IDLE"); } }} className="text-gray-400 hover:text-sccs-red transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Checkbox Único Arquivo */}
                            <div className="flex items-center gap-3 bg-white p-4 border border-sccs-border rounded-md">
                                <input
                                    type="checkbox"
                                    id="combinedUploadConf"
                                    checked={isCombinedUpload}
                                    onChange={(e) => setIsCombinedUpload(e.target.checked)}
                                    className="w-5 h-5 text-sccs-green rounded border-gray-300 focus:ring-sccs-green cursor-pointer"
                                />
                                <label htmlFor="combinedUploadConf" className="text-sm font-bold text-sccs-dark cursor-pointer select-none">
                                    O comprovante PIX já está anexado junto a esta Nota Fiscal (Arquivo Único)
                                </label>
                            </div>

                            {/* Upload Comprovante (Condicional) */}
                            {!isCombinedUpload && (
                                <div className="pt-2 border-t border-sccs-border/50">
                                    <h3 className="text-sm font-bold text-sccs-dark mb-2 uppercase">2. Selecionar Comprovante PIX</h3>
                                    {!receiptFile ? (
                                        <label className="cursor-pointer border-2 border-dashed border-gray-300 hover:border-sccs-green rounded-lg p-6 flex flex-col items-center justify-center transition-colors bg-white w-full">
                                            <Upload className="w-8 h-8 mb-2 text-gray-400" />
                                            <span className="text-sm text-gray-500 font-medium">Clique para selecionar o Comprovante</span>
                                            <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => e.target.files && setReceiptFile(e.target.files[0])} />
                                        </label>
                                    ) : (
                                        <div className="bg-white border border-sccs-border rounded-lg p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-5 h-5 text-sccs-green" />
                                                <span className="font-semibold text-sm text-sccs-dark truncate">{receiptFile.name}</span>
                                            </div>
                                            <button onClick={() => { if (window.confirm('Tem certeza que deseja remover este comprovante da fila de envio?')) { setReceiptFile(null); setProcessStatus("IDLE"); } }} className="text-gray-400 hover:text-sccs-red transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Botão de Envio / Status */}
                            <div className="mt-4 pt-6 border-t border-sccs-border">
                                {processStatus === "IDLE" || processStatus === "ERROR" ? (
                                    <button
                                        onClick={handleProcessFiles}
                                        className="w-full bg-sccs-green hover:bg-[#0e8a80] text-white font-bold py-3.5 rounded-md shadow-md transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-5 h-5" />
                                        ENVIAR PARA PROCESSAMENTO
                                    </button>
                                ) : (
                                    <div className="bg-white border-2 border-sccs-green rounded-lg p-5 flex flex-col items-center justify-center gap-3">
                                        {processStatus === "RENAMING" && (
                                            <>
                                                <Loader2 className="w-8 h-8 text-sccs-green animate-spin" />
                                                <span className="font-bold text-sccs-dark">Renomeando Nota Fiscal para os padrões do sistema...</span>
                                            </>
                                        )}
                                        {processStatus === "MERGING" && (
                                            <>
                                                <Loader2 className="w-8 h-8 text-sccs-green animate-spin" />
                                                <span className="font-bold text-sccs-dark">Agrupando Nota Fiscal com Comprovante (Mesclando PDF)...</span>
                                            </>
                                        )}
                                        {processStatus === "DONE" && (
                                            <>
                                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                                                    <Save className="w-6 h-6" />
                                                </div>
                                                <span className="font-black text-lg text-sccs-green uppercase">Processamento Concluído!</span>
                                                <span className="text-sm text-gray-500 font-medium">Os arquivos foram armazenados com sucesso no banco de dados.</span>
                                                <button onClick={resetProcessFlow} className="mt-4 text-sm font-bold text-sccs-dark border border-gray-300 hover:bg-gray-100 px-4 py-2 rounded transition-colors">
                                                    PROCESSAR NOVO ARQUIVO
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                )}

                {activeTab === "avancadas" && (
                    <div className="flex flex-col h-full text-sccs-dark pr-2 overflow-y-auto custom-scrollbar">
                        {/* EMPRESA SECTION */}
                        <div className="border-b border-sccs-border pb-6 mb-6">
                            <h2 className="text-lg font-bold text-sccs-green mb-4 uppercase">
                                Empresa
                            </h2>
                            <div className="w-full flex items-end gap-4 bg-sccs-gray p-4 rounded-lg border border-sccs-border flex-wrap">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-sm font-bold text-sccs-dark mb-2">NOME DA EMPRESA</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white border border-sccs-border rounded px-4 py-2.5 text-sccs-dark placeholder-gray-400 focus:outline-none focus:border-sccs-green focus:ring-1 focus:ring-sccs-green transition-all shadow-sm"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        placeholder="Digite o nome da empresa"
                                    />
                                </div>
                                <div className="flex-[0.5] min-w-[200px]">
                                    <label className="block text-sm font-bold text-sccs-dark mb-2">LOGOMARCA</label>
                                    <label className="flex w-full cursor-pointer items-center justify-center gap-2 bg-white border border-dashed border-gray-400 hover:border-sccs-green rounded px-4 py-2.5 text-gray-500 hover:text-sccs-green transition-colors shadow-sm overflow-hidden whitespace-nowrap">
                                        <Upload className="w-4 h-4 flex-shrink-0" />
                                        <span className="text-sm font-medium truncate">{logoFile ? logoFile.name : "Alterar Imagem"}</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && setLogoFile(e.target.files[0])} />
                                    </label>
                                </div>
                                <button
                                    onClick={handleUpdateSettings}
                                    disabled={settingsLoading}
                                    className="bg-sccs-green hover:bg-[#0e8a80] disabled:bg-gray-400 text-white font-bold py-2.5 px-6 rounded shadow-sm transition-colors whitespace-nowrap flex items-center gap-2"
                                >
                                    {settingsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {settingsLoading ? "SALVANDO..." : "ATUALIZAR"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </section>
        </div>
    );
}
