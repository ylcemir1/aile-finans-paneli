"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";

interface ViewScopeToggleProps {
  hasFamily: boolean;
}

export function ViewScopeToggle({ hasFamily }: ViewScopeToggleProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scope = searchParams.get("scope") ?? "personal";

  if (!hasFamily) return null;

  function buildHref(newScope: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("scope", newScope);
    return `${pathname}?${params.toString()}`;
  }

  return (
    <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5">
      <Link
        href={buildHref("personal")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
          scope === "personal"
            ? "bg-primary text-white shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        )}
      >
        <span className="material-symbols-outlined text-sm">person</span>
        Kisisel
      </Link>
      <Link
        href={buildHref("family")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
          scope === "family"
            ? "bg-primary text-white shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        )}
      >
        <span className="material-symbols-outlined text-sm">family_restroom</span>
        Aile
      </Link>
    </div>
  );
}
