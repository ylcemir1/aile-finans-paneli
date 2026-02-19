interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  actionLabel?: string;
  iconBg?: string;
  iconColor?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  iconBg = "bg-slate-100",
  iconColor = "text-slate-400",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white/50 py-10 px-6 text-center">
      <div
        className={`size-14 rounded-xl ${iconBg} flex items-center justify-center mb-4`}
      >
        <span className={`material-symbols-outlined text-2xl ${iconColor}`}>
          {icon}
        </span>
      </div>
      <p className="text-sm font-bold text-slate-700 mb-1">{title}</p>
      {description && (
        <p className="text-xs text-slate-400 max-w-[240px]">{description}</p>
      )}
      {actionLabel && (
        <p className="text-xs text-primary font-semibold mt-3">
          {actionLabel}
        </p>
      )}
    </div>
  );
}
