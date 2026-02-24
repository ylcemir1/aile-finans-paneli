"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils/cn";

interface ViewScopeToggleProps {
  hasFamily: boolean;
}

export function ViewScopeToggle({ hasFamily }: ViewScopeToggleProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const scope = searchParams.get("scope") ?? "personal";

  if (!hasFamily) return null;

  function handleSwitch(newScope: string) {
    if (newScope === scope) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("scope", newScope);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div className={cn("flex items-center bg-white rounded-lg border border-slate-200 p-0.5", isPending && "opacity-70")}>
      <button
        onClick={() => handleSwitch("personal")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
          scope === "personal"
            ? "bg-primary text-white shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        )}
      >
        <span className="material-symbols-outlined text-sm">person</span>
        Kisisel
      </button>
      <button
        onClick={() => handleSwitch("family")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
          scope === "family"
            ? "bg-primary text-white shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        )}
      >
        <span className="material-symbols-outlined text-sm">family_restroom</span>
        Aile
      </button>
    </div>
  );
}
