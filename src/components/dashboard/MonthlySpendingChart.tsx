import { formatCurrency } from "@/lib/utils/currency";

interface MonthData {
  month: string;
  total: number;
}

interface MonthlySpendingChartProps {
  data: MonthData[];
}

const MONTH_NAMES: Record<string, string> = {
  "01": "Oca",
  "02": "Sub",
  "03": "Mar",
  "04": "Nis",
  "05": "May",
  "06": "Haz",
  "07": "Tem",
  "08": "Agu",
  "09": "Eyl",
  "10": "Eki",
  "11": "Kas",
  "12": "Ara",
};

export function MonthlySpendingChart({ data }: MonthlySpendingChartProps) {
  if (data.length === 0) {
    return null;
  }

  const maxValue = Math.max(...data.map((d) => d.total), 1);
  const barWidth = 32;
  const gap = 12;
  const chartHeight = 140;
  const chartWidth = data.length * (barWidth + gap) - gap;

  return (
    <section className="bg-white rounded-xl border border-slate-100 shadow-md shadow-black/[0.03] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Aylik Harcama
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Son {data.length} ay
          </p>
        </div>
        <div className="size-9 rounded-lg bg-indigo-50 flex items-center justify-center">
          <span className="material-symbols-outlined text-indigo-500 text-lg">
            bar_chart
          </span>
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <svg
          width={chartWidth + 16}
          height={chartHeight + 44}
          viewBox={`0 0 ${chartWidth + 16} ${chartHeight + 44}`}
          className="mx-auto"
        >
          {data.map((item, i) => {
            const barHeight = maxValue > 0 ? (item.total / maxValue) * chartHeight : 0;
            const x = i * (barWidth + gap) + 8;
            const y = chartHeight - barHeight;
            const monthKey = item.month.split("-")[1];
            const label = MONTH_NAMES[monthKey] ?? monthKey;
            const isLast = i === data.length - 1;

            return (
              <g key={item.month}>
                {/* Bar background */}
                <rect
                  x={x}
                  y={0}
                  width={barWidth}
                  height={chartHeight}
                  rx={6}
                  fill="#f1f5f9"
                />
                {/* Bar value */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={6}
                  fill={isLast ? "url(#barGradient)" : "#cbd5e1"}
                />
                {/* Amount label (only last bar) */}
                {isLast && barHeight > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    className="text-[9px] font-bold fill-primary"
                  >
                    {formatCurrency(item.total)}
                  </text>
                )}
                {/* Month label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 18}
                  textAnchor="middle"
                  className="text-[10px] font-semibold fill-slate-400"
                >
                  {label}
                </text>
              </g>
            );
          })}
          {/* Gradient definition */}
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1152d4" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </section>
  );
}
