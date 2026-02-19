import { formatCurrency } from "@/lib/utils/currency";

interface CurrencyBalance {
  currency: string;
  total: number;
  count: number;
}

interface BalanceSummaryCardProps {
  totalBalance: number;
  currencyBreakdown?: CurrencyBalance[];
}

export function BalanceSummaryCard({
  totalBalance,
  currencyBreakdown,
}: BalanceSummaryCardProps) {
  // Filter non-TRY currencies that have accounts
  const otherCurrencies = currencyBreakdown?.filter(
    (c) => c.currency !== "TRY" && c.count > 0
  );

  return (
    <div className="relative overflow-hidden rounded-xl bg-primary p-6 text-white shadow-xl shadow-primary/30">
      <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-3xl" />
      <div className="relative z-10">
        <p className="text-sm font-medium opacity-80 mb-1">
          Toplam Hane Bakiyesi (TL)
        </p>
        <h2 className="text-3xl font-extrabold tracking-tight mb-4">
          {formatCurrency(totalBalance)}
        </h2>

        {/* Currency breakdown */}
        {otherCurrencies && otherCurrencies.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {otherCurrencies.map((c) => (
              <div
                key={c.currency}
                className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-lg"
              >
                <span className="text-xs font-bold opacity-80">
                  {c.currency}
                </span>
                <span className="text-sm font-bold">
                  {formatCurrency(c.total, c.currency)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs bg-white/20 w-fit px-2 py-1 rounded-full">
          <span className="material-symbols-outlined text-sm">schedule</span>
          <span>Az once guncellendi</span>
        </div>
      </div>
    </div>
  );
}
