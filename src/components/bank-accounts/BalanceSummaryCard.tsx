import { formatCurrency } from "@/lib/utils/currency";

interface BalanceSummaryCardProps {
  totalBalance: number;
}

export function BalanceSummaryCard({ totalBalance }: BalanceSummaryCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-primary p-6 text-white shadow-xl shadow-primary/30">
      <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-3xl" />
      <div className="relative z-10">
        <p className="text-sm font-medium opacity-80 mb-1">
          Toplam Hane Bakiyesi
        </p>
        <h2 className="text-3xl font-extrabold tracking-tight mb-4">
          {formatCurrency(totalBalance)}
        </h2>
        <div className="flex items-center gap-2 text-xs bg-white/20 w-fit px-2 py-1 rounded-full">
          <span className="material-symbols-outlined text-sm">schedule</span>
          <span>Az önce güncellendi</span>
        </div>
      </div>
    </div>
  );
}
