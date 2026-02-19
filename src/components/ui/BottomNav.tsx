"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/", label: "Ana Sayfa", icon: "house" },
  { href: "/loans", label: "Krediler", icon: "account_balance" },
  { href: "/installments", label: "Taksitler", icon: "payments" },
  { href: "/family", label: "Ailem", icon: "family_restroom" },
  { href: "/profile", label: "Profil", icon: "person" },
];

interface BottomNavProps {
  overdueCount?: number;
}

export function BottomNav({ overdueCount = 0 }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 sm:px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] md:hidden">
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
