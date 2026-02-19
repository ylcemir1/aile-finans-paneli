import { cn } from "@/lib/utils/cn";

type BadgeVariant = "paid" | "unpaid" | "overdue";

const variantStyles: Record<BadgeVariant, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  unpaid: "bg-rose-100 text-rose-700",
  overdue: "bg-red-100 text-red-700",
};

const variantLabels: Record<BadgeVariant, string> = {
  paid: "ÖDENDİ",
  unpaid: "ÖDENMEDİ",
  overdue: "GECİKMİŞ",
};

interface BadgeProps {
  variant: BadgeVariant;
  className?: string;
}

export function Badge({ variant, className }: BadgeProps) {
  return (
    <div
      className={cn(
        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
        variantStyles[variant],
        className
      )}
    >
      {variantLabels[variant]}
    </div>
  );
}
