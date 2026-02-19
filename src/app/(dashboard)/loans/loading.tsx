import { Skeleton } from "@/components/ui/Skeleton";

export default function LoansLoading() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="size-10 rounded-full" />
      </div>

      {/* Summary stats skeleton */}
      <div className="flex flex-wrap gap-4">
        <div className="flex min-w-[150px] flex-1 flex-col gap-2 rounded-xl p-5 bg-primary/10">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 bg-primary/20" />
            <Skeleton className="h-3 w-20 bg-primary/20" />
          </div>
          <Skeleton className="h-7 w-32 bg-primary/20" />
        </div>
        <div className="flex min-w-[150px] flex-1 flex-col gap-2 rounded-xl p-5 bg-white border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-7 w-32" />
        </div>
      </div>

      {/* Active loans carousel skeleton */}
      <div>
        <Skeleton className="h-7 w-32 mb-3" />
        <div className="flex overflow-x-auto gap-4 py-2 no-scrollbar">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-4 rounded-xl min-w-[280px] p-4 bg-white border border-slate-100 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                </div>
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-2.5 w-20" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
              <div className="flex justify-between pt-1">
                <div className="space-y-1">
                  <Skeleton className="h-2 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-2 w-10" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Installment schedule skeleton */}
      <div>
        <Skeleton className="h-7 w-32 mb-3" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white p-4 rounded-xl border-l-4 border-slate-200 shadow-sm flex items-center justify-between"
            >
              <div className="flex gap-3">
                <Skeleton className="w-[50px] h-[46px] rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
