import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { WalletContextProvider } from "@/components/WalletProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NEXUM Protocol — Decentralized Micro-Task Marketplace",
  description: "Connecting Southeast Asian contributors with Web3 projects via trustless escrow on Solana",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </body>
    </html>
  );
}
