"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { logout } from "@/actions/auth";

const navItems = [
  { href: "/", label: "Ana Sayfa", icon: "house" },
  { href: "/bank-accounts", label: "Hesaplar", icon: "account_balance_wallet" },
  { href: "/loans", label: "Krediler", icon: "account_balance" },
  { href: "/credit-cards", label: "Kartlar", icon: "credit_card" },
  { href: "/installments", label: "Taksitler", icon: "payments" },
  { href: "/profile", label: "Profil", icon: "person" },
];

interface SidebarProps {
  profile: {
    full_name: string;
    role: string;
  };
  overdueCount?: number;
}

export function Sidebar({ profile, overdueCount = 0 }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-100 flex-col z-30">
      {/* Logo area */}
      <div className="px-6 py-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-white text-xl">
              family_restroom
            </span>
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-900">
              Aile Finans
            </h1>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Paneli
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          const showBadge = href === "/installments" && overdueCount > 0;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                isActive
                  ? "bg-primary/10 text-primary active-nav"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              )}
            >
              <span className="material-symbols-outlined text-xl">
                {icon}
              </span>
              <span className="flex-1">{label}</span>
              {showBadge && (
                <span className="size-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {overdueCount > 9 ? "9+" : overdueCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-base">
              person
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">
              {profile.full_name}
            </p>
            <p className="text-[10px] font-medium text-slate-400 uppercase">
              {profile.role === "admin" ? "Admin" : "Uye"}
            </p>
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Cikis Yap
          </button>
        </form>
      </div>
    </aside>
  );
}
