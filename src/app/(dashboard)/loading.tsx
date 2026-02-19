import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Metric cards skeleton */}
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="size-5 rounded" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-2.5 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming installments skeleton */}
      <section className="space-y-4">
        <Skeleton className="h-6 w-36" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="size-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-2.5 w-28" />
                </div>
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </section>

      {/* Savings goal card skeleton */}
      <div className="rounded-2xl p-6 bg-primary/10">
        <Skeleton className="h-3 w-32 mb-2 bg-primary/20" />
        <div className="flex items-end justify-between mb-4">
          <Skeleton className="h-7 w-36 bg-primary/20" />
          <Skeleton className="h-6 w-12 rounded-lg bg-primary/20" />
        </div>
        <Skeleton className="h-2 w-full rounded-full bg-primary/20" />
        <Skeleton className="h-2.5 w-48 mt-2 bg-primary/20" />
      </div>
    </div>
  );
}
