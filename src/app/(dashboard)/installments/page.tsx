import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { InstallmentItem } from "@/components/installments/InstallmentItem";
import { cn } from "@/lib/utils/cn";
import { EmptyState } from "@/components/ui/EmptyState";

const filters = [
  { label: "Tümü", value: "" },
  { label: "Ödenmemiş", value: "unpaid" },
  { label: "Ödenmiş", value: "paid" },
  { label: "7 Gün", value: "upcoming" },
] as const;

export default async function InstallmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const filter = params.filter ?? "";
  const supabase = await createClient();

  let query = supabase
    .from("installments")
    .select("*, loan:loans(id, bank_name, loan_type)")
    .order("due_date", { ascending: true });

  if (filter === "unpaid") {
    query = query.eq("is_paid", false);
  } else if (filter === "paid") {
    query = query.eq("is_paid", true);
  } else if (filter === "upcoming") {
    const today = new Date().toISOString().split("T")[0];
    const in7 = new Date(Date.now() + 7 * 86400000)
      .toISOString()
      .split("T")[0];
    query = query.eq("is_paid", false).gte("due_date", today).lte("due_date", in7);
  }

  const { data: installments } = await query;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Taksitler</h1>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {filters.map(({ label, value }) => (
          <Link
            key={value}
            href={value ? `/installments?filter=${value}` : "/installments"}
            className={cn(
              "flex items-center px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors",
              filter === value
                ? "bg-primary text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Installment list */}
      <div className="space-y-3">
        {(installments ?? []).length === 0 ? (
          <EmptyState
            icon="filter_list"
            title="Taksit bulunamadı"
            description="Bu filtreye uygun taksit bulunmuyor. Filtreyi değiştirmeyi deneyin."
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
          />
        ) : (
          (installments ?? []).map((inst) => (
            <InstallmentItem
              key={inst.id}
              installment={inst}
              loanInfo={
                inst.loan
                  ? `${inst.loan.bank_name} - ${inst.loan.loan_type}`
                  : undefined
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
