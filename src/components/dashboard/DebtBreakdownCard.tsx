import { formatCurrency } from "@/lib/utils/currency";

interface DebtItem {
  label: string;
  amount: number;
  color: string;
  icon: string;
}

interface DebtBreakdownCardProps {
  loanDebt: number;
  creditCardDebt: number;
  loansByType: { type: string; label: string; amount: number }[];
}

const typeColors: Record<string, string> = {
  konut: "#f43f5e",
  tasit: "#3b82f6",
  ihtiyac: "#f59e0b",
  kobi: "#14b8a6",
  esnaf: "#f97316",
  tarim: "#22c55e",
  egitim: "#6366f1",
  diger: "#64748b",
};

const typeIcons: Record<string, string> = {
  konut: "home",
  tasit: "directions_car",
  ihtiyac: "shopping_bag",
  kobi: "business",
  esnaf: "storefront",
  tarim: "agriculture",
  egitim: "school",
  diger: "account_balance",
};

export function DebtBreakdownCard({
  loanDebt,
  creditCardDebt,
  loansByType,
}: DebtBreakdownCardProps) {
  const totalDebt = loanDebt + creditCardDebt;

  if (totalDebt === 0) {
    return (
      <section className="bg-white rounded-xl border border-slate-100 shadow-md shadow-black/[0.03] p-5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="size-9 rounded-lg bg-emerald-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-emerald-500 text-lg">
              celebration
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-900">Borc Dagilimi</h3>
        </div>
        <p className="text-sm text-slate-500">
          Tebrikler! Herhangi bir borcunuz bulunmuyor.
        </p>
      </section>
    );
  }

  // Build debt items
  const items: DebtItem[] = [];

  // Add loan types
  for (const lt of loansByType) {
    if (lt.amount > 0) {
      items.push({
        label: lt.label,
        amount: lt.amount,
        color: typeColors[lt.type] ?? "#64748b",
        icon: typeIcons[lt.type] ?? "account_balance",
      });
    }
  }

  // Add credit card debt
  if (creditCardDebt > 0) {
    items.push({
      label: "Kredi Kartlari",
      amount: creditCardDebt,
      color: "#a855f7",
      icon: "credit_card",
    });
  }

  // Sort by amount descending
  items.sort((a, b) => b.amount - a.amount);

  return (
    <section className="bg-white rounded-xl border border-slate-100 shadow-md shadow-black/[0.03] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-lg bg-rose-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-rose-500 text-lg">
              pie_chart
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Borc Dagilimi</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Toplam: {formatCurrency(totalDebt)}
            </p>
          </div>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="flex w-full h-3 rounded-full overflow-hidden mb-4">
        {items.map((item, i) => {
          const pct = (item.amount / totalDebt) * 100;
          return (
            <div
              key={i}
              className="h-full transition-all"
              style={{
                width: `${pct}%`,
                backgroundColor: item.color,
                minWidth: pct > 0 ? "4px" : "0",
              }}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="space-y-2.5">
        {items.map((item, i) => {
          const pct = ((item.amount / totalDebt) * 100).toFixed(1);
          return (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="size-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <span
                    className="material-symbols-outlined text-base"
                    style={{ color: item.color }}
                  >
                    {item.icon}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">
                    {item.label}
                  </p>
                  <p className="text-[10px] text-slate-400">{pct}%</p>
                </div>
              </div>
              <p className="text-sm font-bold text-slate-900">
                {formatCurrency(item.amount)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
