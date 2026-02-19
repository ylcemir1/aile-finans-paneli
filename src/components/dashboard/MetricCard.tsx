const colorMap = {
  green: {
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-600",
    decorative: "bg-emerald-50",
  },
  red: {
    iconBg: "bg-rose-100",
    iconText: "text-rose-600",
    decorative: "bg-rose-50",
  },
  orange: {
    iconBg: "bg-amber-100",
    iconText: "text-amber-600",
    decorative: "bg-amber-50",
  },
  blue: {
    iconBg: "bg-primary/10",
    iconText: "text-primary",
    decorative: "bg-primary/5",
  },
};

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color: keyof typeof colorMap;
  icon: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  color,
  icon,
}: MetricCardProps) {
  const c = colorMap[color];
  return (
    <div className="relative overflow-hidden bg-white p-5 rounded-xl border border-slate-100 shadow-md shadow-black/[0.03]">
      {/* Decorative circle */}
      <div
        className={`absolute -right-4 -bottom-4 size-20 rounded-full ${c.decorative}`}
      />
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className={`size-9 rounded-lg ${c.iconBg} flex items-center justify-center`}
          >
            <span
              className={`material-symbols-outlined ${c.iconText} text-lg`}
            >
              {icon}
            </span>
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {title}
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-xl font-extrabold text-slate-900">{value}</p>
          {subtitle && (
            <p className="text-[10px] font-medium text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
