import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SCCS Financial Management",
  description: "Sistema de Gestão Financeira - Sociedade Cultural Cruzeiro do Sul",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} overflow-hidden`}>
        <Header />
        <main className="pt-20 px-6 max-w-7xl mx-auto p-4">
          {children}
        </main>
      </body>
    </html>
  );
}
