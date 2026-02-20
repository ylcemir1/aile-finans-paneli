import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoanCard } from "@/components/loans/LoanCard";
import { LoanFormModal } from "@/components/loans/LoanFormModal";
import { InstallmentItem } from "@/components/installments/InstallmentItem";
import { formatCurrency } from "@/lib/utils/currency";
import { EmptyState } from "@/components/ui/EmptyState";
import { ViewScopeToggle } from "@/components/ui/ViewScopeToggle";
import { getUserFamilyId } from "@/lib/utils/family-scope";

export default async function LoansPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const familyId = await getUserFamilyId(supabase, user.id);
  const scope = params.scope ?? "personal";
  const isFamily = scope === "family" && !!familyId;

  let loansQuery = supabase
    .from("loans")
    .select(
      "*, payer:profiles!payer_id(full_name), installments(id, is_paid)"
    )
    .order("created_at", { ascending: false });

  const unpaidInstallmentsQuery = supabase
    .from("installments")
    .select("*, loan:loans(id, bank_name, loan_type, payer_id, family_id)")
    .eq("is_paid", false)
    .order("due_date", { ascending: true });

  const paidInstallmentsQuery = supabase
    .from("installments")
    .select("*, loan:loans(id, bank_name, loan_type, payer_id, family_id)")
    .eq("is_paid", true)
    .order("due_date", { ascending: false });

  if (isFamily) {
    loansQuery = loansQuery.eq("family_id", familyId);
  } else {
    loansQuery = loansQuery.eq("payer_id", user.id);
  }

  const [
    { data: loans },
    { data: profiles },
    { data: currentProfile },
    { data: unpaidInstallments },
    { data: allPaidInstallments },
  ] = await Promise.all([
    loansQuery,
    supabase.from("profiles").select("id, full_name"),
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single(),
    unpaidInstallmentsQuery,
    paidInstallmentsQuery,
  ]);

  const isAdmin = currentProfile?.role === "admin";
  const activeLoans = (loans ?? []).filter((l) => l.status !== "closed");

  const scopedUnpaidInstallments = (unpaidInstallments ?? []).filter((inst) => {
    if (!inst.loan) return false;
    if (isFamily) return inst.loan.family_id === familyId;
    return !inst.loan.family_id && inst.loan.payer_id === user.id;
  });

  const scopedPaidInstallments = (allPaidInstallments ?? []).filter((inst) => {
    if (!inst.loan) return false;
    if (isFamily) return inst.loan.family_id === familyId;
    return !inst.loan.family_id && inst.loan.payer_id === user.id;
  });

  // Smart display: all unpaid + only the last paid per loan
  const allUnpaid = scopedUnpaidInstallments;
  const paidList = scopedPaidInstallments;
  const lastPaidPerLoan = new Map<string, (typeof paidList)[number]>();
  for (const inst of paidList) {
    if (!lastPaidPerLoan.has(inst.loan_id)) {
      lastPaidPerLoan.set(inst.loan_id, inst);
    }
  }
  const displayInstallments = [
    ...Array.from(lastPaidPerLoan.values()),
    ...allUnpaid,
  ].sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );

  const totalDebt = activeLoans.reduce(
    (sum, l) => sum + Number(l.remaining_balance ?? l.total_amount),
    0
  );
  const monthlyPayment = activeLoans.reduce(
    (sum, l) => sum + Number(l.monthly_payment),
    0
  );
  const totalPaid = (loans ?? []).reduce(
    (sum, l) => sum + Number(l.paid_amount ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Krediler ve Taksitler
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isFamily ? "Aile gorunumu" : "Kisisel gorunum"}
          </p>
        </div>
        <LoanFormModal
          profiles={profiles ?? []}
          currentUserId={user.id}
          isAdmin={isAdmin}
        />
      </div>
      <ViewScopeToggle hasFamily={!!familyId} />

      {/* Summary stats */}
      <div className="flex flex-wrap gap-4">
        <div className="flex min-w-[150px] flex-1 flex-col gap-2 rounded-xl p-5 bg-primary text-white shadow-lg shadow-primary/20">
          <div className="flex items-center gap-2 opacity-90">
            <span className="material-symbols-outlined text-sm">
              account_balance_wallet
            </span>
            <p className="text-sm font-medium">Kalan Borc</p>
          </div>
          <p className="tracking-tight text-2xl font-extrabold">
            {formatCurrency(totalDebt)}
          </p>
        </div>
        <div className="flex min-w-[150px] flex-1 flex-col gap-2 rounded-xl p-5 bg-white border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="material-symbols-outlined text-sm">payments</span>
            <p className="text-sm font-medium">Aylik Cikis</p>
          </div>
          <p className="text-slate-900 tracking-tight text-2xl font-extrabold">
            {formatCurrency(monthlyPayment)}
          </p>
        </div>
        <div className="flex min-w-[150px] flex-1 flex-col gap-2 rounded-xl p-5 bg-white border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-green-600">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <p className="text-sm font-medium">Toplam Odenen</p>
          </div>
          <p className="text-green-700 tracking-tight text-2xl font-extrabold">
            {formatCurrency(totalPaid)}
          </p>
        </div>
      </div>

      {/* Active loans carousel */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-3">
          Aktif Krediler
        </h2>
        {(loans ?? []).length === 0 ? (
          <EmptyState
            icon="credit_card"
            title="Henuz kredi eklenmedi"
            description="Kredilerinizi ekleyerek taksit takibini baslatin."
            actionLabel="+ Kredi Ekle"
            iconBg="bg-purple-50"
            iconColor="text-purple-500"
          />
        ) : (
          <div className="flex overflow-x-auto gap-4 py-2 no-scrollbar">
            {(loans ?? []).map((loan) => (
              <LoanCard
                key={loan.id}
                loan={loan}
                profiles={profiles ?? []}
                currentUserId={user.id}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </div>

      {/* Installment schedule */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-3">
          Taksit Takvimi
        </h2>
        <div className="space-y-3">
          {displayInstallments.length === 0 ? (
            <EmptyState
              icon="event_available"
              title="Taksit bulunamadi"
              description="Kredi ekledikten sonra taksitler otomatik olusturulacak."
              iconBg="bg-emerald-50"
              iconColor="text-emerald-500"
            />
          ) : (
            displayInstallments.map((inst) => (
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
    </div>
  );
}
