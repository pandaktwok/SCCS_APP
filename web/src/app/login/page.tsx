"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                router.push("/");
            } else {
                setError(data.error || "Falha na autenticação.");
            }
        } catch (err) {
            setError("Erro interno no servidor de autenticação.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
            <div className="bg-white border border-sccs-border p-8 rounded shadow-lg w-full max-w-sm flex flex-col items-center">
                <div className="w-20 h-20 bg-sccs-gray rounded-full flex items-center justify-center mb-6 border border-sccs-border shadow-inner">
                    <span className="text-sccs-green font-bold text-xs text-center">SCCS<br />LOGIN</span>
                </div>

                <h2 className="text-xl font-bold tracking-wide text-sccs-dark mb-6 text-center uppercase border-b border-sccs-gray pb-2 w-full">
                    Acesso ao Sistema
                </h2>

                {error && (
                    <div className="w-full bg-red-50 text-red-600 text-xs font-bold p-3 rounded border border-red-200 mb-4 text-center">
                        {error}
                    </div>
                )}

                <form className="w-full space-y-4" onSubmit={handleLogin}>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 tracking-wide">USUÁRIO</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-sccs-gray border border-sccs-border rounded px-4 py-2.5 text-sccs-dark placeholder-gray-400 focus:outline-none focus:border-sccs-green focus:ring-1 focus:ring-sccs-green transition-all"
                            placeholder="Digite seu usuário"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 tracking-wide">SENHA</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-sccs-gray border border-sccs-border rounded px-4 py-2.5 text-sccs-dark placeholder-gray-400 focus:outline-none focus:border-sccs-green focus:ring-1 focus:ring-sccs-green transition-all"
                            placeholder="Digite sua senha"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-sccs-green hover:bg-[#0e8a80] disabled:bg-gray-400 text-white font-bold py-2.5 rounded mt-6 tracking-wider transition-colors shadow-sm"
                    >
                        {loading ? "AUTENTICANDO..." : "ENTRAR"}
                    </button>
                </form>
            </div>
        </div>
    );
}
