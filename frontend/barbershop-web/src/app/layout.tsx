import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BarberShop",
  description: "Aplicativo mobile para barbearia com agenda, loja e painel admin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full bg-stone-50 text-zinc-950">{children}</body>
    </html>
  );
}
