import { Skeleton } from "@/components/ui/Skeleton";

export default function ProfileLoading() {
  return (
    <div className="space-y-6 max-w-lg animate-fade-in-up">
      <div>
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-64 mt-1" />
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-md shadow-black/[0.03] p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <Skeleton className="size-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-44" />
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <Skeleton className="h-3 w-20 mb-1.5" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
          <div>
            <Skeleton className="h-3 w-16 mb-1.5" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
          <div>
            <Skeleton className="h-3 w-8 mb-1.5" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
