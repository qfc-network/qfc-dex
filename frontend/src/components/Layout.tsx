import Link from "next/link";
import { useRouter } from "next/router";
import WalletConnect from "./WalletConnect";
import { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Swap" },
  { href: "/liquidity", label: "Liquidity" },
  { href: "/pools", label: "Pools" },
  { href: "/positions", label: "My Positions" },
];

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-qfc-dark">
      <nav className="border-b border-qfc-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold text-white">
              QFC <span className="text-qfc-primary">DEX</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    router.pathname === item.href
                      ? "bg-qfc-primary/20 text-qfc-accent"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <WalletConnect />
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
