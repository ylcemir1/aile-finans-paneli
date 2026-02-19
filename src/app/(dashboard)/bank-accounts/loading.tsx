import { Skeleton } from "@/components/ui/Skeleton";

export default function BankAccountsLoading() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="size-10 rounded-full" />
      </div>

      {/* Balance summary card skeleton */}
      <div className="relative overflow-hidden rounded-xl bg-primary/10 p-6">
        <Skeleton className="h-3 w-40 mb-2 bg-primary/20" />
        <Skeleton className="h-9 w-48 mb-4 bg-primary/20" />
        <Skeleton className="h-5 w-44 rounded-full bg-primary/20" />
      </div>

      {/* Section title */}
      <div>
        <Skeleton className="h-3 w-32 mb-3" />

        {/* Account cards skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="size-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="size-8 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
