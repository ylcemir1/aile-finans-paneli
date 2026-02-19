import { cn } from "@/lib/utils/cn";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: string;
  error?: string;
}

export function Input({ label, icon, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700 ml-1">
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors text-xl">
              {icon}
            </span>
          </div>
        )}
        <input
          className={cn(
            "block w-full py-3.5 bg-slate-50 border border-slate-200 rounded-lg",
            "text-slate-900 placeholder:text-slate-400 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
            icon ? "pl-11 pr-4" : "px-4",
            error && "border-red-400 bg-red-50",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-600 ml-1">{error}</p>}
    </div>
  );
}
