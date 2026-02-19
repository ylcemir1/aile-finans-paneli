"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/", label: "Ana Sayfa", icon: "house" },
  { href: "/bank-accounts", label: "Hesaplar", icon: "account_balance_wallet" },
  { href: "/loans", label: "Krediler", icon: "account_balance" },
  { href: "/installments", label: "Taksitler", icon: "payments" },
];

interface BottomNavProps {
  overdueCount?: number;
}

export function BottomNav({ overdueCount = 0 }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 px-6 py-3 pb-safe z-20 md:hidden">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        {navItems.map(({ href, label, icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const showBadge = href === "/installments" && overdueCount > 0;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 relative",
                isActive ? "text-primary active-nav" : "text-slate-400"
              )}
            >
              <span className="material-symbols-outlined text-2xl relative">
                {icon}
                {showBadge && (
                  <span className="absolute -top-1 -right-2 size-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {overdueCount > 9 ? "9+" : overdueCount}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-bold uppercase">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
