import { formatCurrency } from "@/lib/utils/currency";

interface SavingsGoalCardProps {
  totalCash: number;
  totalDebt: number;
}

export function SavingsGoalCard({ totalCash, totalDebt }: SavingsGoalCardProps) {
  const netWorth = totalCash - totalDebt;
  const ratio = totalDebt > 0 ? Math.min(100, Math.round((totalCash / (totalCash + totalDebt)) * 100)) : 100;

  return (
    <section className="bg-primary rounded-2xl p-6 text-white overflow-hidden relative shadow-xl shadow-primary/30">
      <div className="relative z-10">
        <p className="text-sm font-medium opacity-80 mb-1">Net Varlık Durumu</p>
        <div className="flex items-end justify-between mb-4">
          <h3 className="text-2xl font-bold">
            {formatCurrency(netWorth)}
          </h3>
          <span className="text-sm font-bold bg-white/20 px-2 py-1 rounded-lg">
            {ratio}%
          </span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2 mb-2">
          <div
            className="bg-white h-full rounded-full transition-all"
            style={{ width: `${ratio}%` }}
          />
        </div>
        <p className="text-xs opacity-70">
          Toplam varlıklarınızın {ratio}% oranı borçsuz.
        </p>
      </div>
      {/* Decorative circle */}
      <div className="absolute -right-10 -bottom-10 size-40 bg-white/10 rounded-full" />
    </section>
  );
}
