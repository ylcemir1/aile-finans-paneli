export default function CreditCardsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 bg-slate-200 rounded-lg" />
        <div className="h-5 w-24 bg-slate-200 rounded-lg" />
      </div>

      {/* Summary cards */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[150px] h-24 bg-slate-200 rounded-xl" />
        <div className="flex-1 min-w-[150px] h-24 bg-slate-200 rounded-xl" />
      </div>

      {/* Card skeletons */}
      <div className="space-y-4">
        <div className="h-6 w-32 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
