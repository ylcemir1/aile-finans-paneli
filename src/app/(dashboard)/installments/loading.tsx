import { Skeleton } from "@/components/ui/Skeleton";

export default function InstallmentsLoading() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-28" />
      </div>

      {/* Filter chips skeleton */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton
            key={i}
            className={`h-9 rounded-full ${
              i === 0 ? "w-16 bg-primary/20" : "w-24"
            }`}
          />
        ))}
      </div>

      {/* Installment list skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-xl border-l-4 border-slate-200 shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <Skeleton className="w-[50px] h-[46px] rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
