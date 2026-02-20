import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { InstallmentItem } from "@/components/installments/InstallmentItem";
import { InstallmentCalendar } from "@/components/installments/InstallmentCalendar";
import { cn } from "@/lib/utils/cn";
import { EmptyState } from "@/components/ui/EmptyState";
import { buildLoanColorMap } from "@/lib/utils/loan-colors";
import { ViewScopeToggle } from "@/components/ui/ViewScopeToggle";
import { getUserFamilyId } from "@/lib/utils/family-scope";

const filters = [
  { label: "Tumu", value: "" },
  { label: "Odenmemis", value: "unpaid" },
  { label: "Odenmis", value: "paid" },
  { label: "7 Gun", value: "upcoming" },
] as const;

export default async function InstallmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; view?: string; scope?: string }>;
}) {
  const params = await searchParams;
  const filter = params.filter ?? "";
  const view = params.view ?? "list";
  const scope = params.scope ?? "personal";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const familyId = user ? await getUserFamilyId(supabase, user.id) : null;
  const isFamily = scope === "family" && !!familyId;

  const { data: allInstallments } = await supabase
    .from("installments")
    .select("*, loan:loans(id, bank_name, loan_type, payer_id, created_by, family_id)")
    .order("due_date", { ascending: true });

  const scopedInstallments = (allInstallments ?? []).filter((inst) => {
    if (!inst.loan) return false;
    if (isFamily) return inst.loan.family_id === familyId;
    if (!user) return true;
    return !inst.loan.family_id && inst.loan.payer_id === user.id;
  });

  const loanColorMap = buildLoanColorMap(scopedInstallments);

  let filteredInstallments = scopedInstallments;

  if (view === "list") {
    if (filter === "unpaid") {
      filteredInstallments = filteredInstallments.filter((i) => !i.is_paid);
    } else if (filter === "paid") {
      filteredInstallments = filteredInstallments.filter((i) => i.is_paid);
    } else if (filter === "upcoming") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const in7 = new Date(today.getTime() + 7 * 86400000);
      filteredInstallments = filteredInstallments.filter((i) => {
        if (i.is_paid) return false;
        const d = new Date(i.due_date);
        return d >= today && d <= in7;
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Taksitler</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isFamily ? "Aile gorunumu" : "Kisisel gorunum"}
          </p>
        </div>
        <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5">
          <Link
            href={`/installments?view=list&scope=${scope}${filter ? `&filter=${filter}` : ""}`}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
              view === "list"
                ? "bg-primary text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <span className="material-symbols-outlined text-sm">view_list</span>
            Liste
          </Link>
          <Link
            href={`/installments?view=calendar&scope=${scope}`}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
              view === "calendar"
                ? "bg-primary text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <span className="material-symbols-outlined text-sm">calendar_month</span>
            Takvim
          </Link>
        </div>
      </div>
      <ViewScopeToggle hasFamily={!!familyId} />

      {view === "calendar" ? (
        <InstallmentCalendar installments={scopedInstallments} loanColorMap={loanColorMap} />
      ) : (
        <>
          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {filters.map(({ label, value }) => (
              <Link
                key={value}
                href={
                  value
                    ? `/installments?view=list&scope=${scope}&filter=${value}`
                    : `/installments?view=list&scope=${scope}`
                }
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
            {filteredInstallments.length === 0 ? (
              <EmptyState
                icon="filter_list"
                title="Taksit bulunamadi"
                description="Bu filtreye uygun taksit bulunmuyor. Filtreyi degistirmeyi deneyin."
                iconBg="bg-amber-50"
                iconColor="text-amber-500"
              />
            ) : (
              filteredInstallments.map((inst) => (
                <InstallmentItem
                  key={inst.id}
                  installment={inst}
                  loanInfo={
                    inst.loan
                      ? `${inst.loan.bank_name} - ${inst.loan.loan_type}`
                      : undefined
                  }
                  loanColor={loanColorMap[inst.loan_id]}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
