import { cn } from "@/lib/utils/cn";
import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
}

export function Select({
  label,
  options,
  className,
  ...props
}: SelectProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700 ml-1">
        {label}
      </label>
      <select
        className={cn(
          "block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-lg",
          "text-slate-900 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
          className
        )}
        {...props}
      >
        <option value="">Seçiniz</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
