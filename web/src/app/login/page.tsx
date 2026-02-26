"use client";

export default function Login() {
    return (
        <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
            <div className="bg-white border border-sccs-border p-8 rounded shadow-lg w-full max-w-sm flex flex-col items-center">
                {/* Placeholder for Logo */}
                <div className="w-20 h-20 bg-sccs-gray rounded-full flex items-center justify-center mb-6 border border-sccs-border shadow-inner">
                    <span className="text-sccs-green font-bold text-xs text-center">SCCS<br />LOGO</span>
                </div>

                <h2 className="text-xl font-bold tracking-wide text-sccs-dark mb-6 text-center uppercase border-b border-sccs-gray pb-2 w-full">
                    Acesso ao Sistema
                </h2>

                <form className="w-full space-y-4" onSubmit={(e) => { e.preventDefault(); window.location.href = '/'; }}>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 tracking-wide">USUÁRIO</label>
                        <input
                            type="text"
                            className="w-full bg-sccs-gray border border-sccs-border rounded px-4 py-2.5 text-sccs-dark placeholder-gray-400 focus:outline-none focus:border-sccs-green focus:ring-1 focus:ring-sccs-green transition-all"
                            placeholder="Digite seu usuário"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 tracking-wide">SENHA</label>
                        <input
                            type="password"
                            className="w-full bg-sccs-gray border border-sccs-border rounded px-4 py-2.5 text-sccs-dark placeholder-gray-400 focus:outline-none focus:border-sccs-green focus:ring-1 focus:ring-sccs-green transition-all"
                            placeholder="Digite sua senha"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-sccs-green hover:bg-[#0e8a80] text-white font-bold py-2.5 rounded mt-6 tracking-wider transition-colors shadow-sm"
                    >
                        ENTRAR
                    </button>
                </form>
            </div>
        </div>
    );
}
