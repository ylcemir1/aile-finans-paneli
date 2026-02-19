import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoanCard } from "@/components/loans/LoanCard";
import { LoanFormModal } from "@/components/loans/LoanFormModal";
import { InstallmentItem } from "@/components/installments/InstallmentItem";
import { formatCurrency } from "@/lib/utils/currency";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function LoansPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    { data: loans },
    { data: profiles },
    { data: currentProfile },
    { data: unpaidInstallments },
    { data: allPaidInstallments },
  ] = await Promise.all([
    supabase
      .from("loans")
      .select(
        "*, payer:profiles!payer_id(full_name), installments(id, is_paid)"
      )
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name"),
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single(),
    supabase
      .from("installments")
      .select("*, loan:loans(id, bank_name, loan_type)")
      .eq("is_paid", false)
      .order("due_date", { ascending: true }),
    supabase
      .from("installments")
      .select("*, loan:loans(id, bank_name, loan_type)")
      .eq("is_paid", true)
      .order("due_date", { ascending: false }),
  ]);

  const isAdmin = currentProfile?.role === "admin";
  const activeLoans = (loans ?? []).filter((l) => l.status !== "closed");

  // Smart display: all unpaid + only the last paid per loan
  const allUnpaid = unpaidInstallments ?? [];
  const paidList = allPaidInstallments ?? [];
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
        <h1 className="text-xl font-bold text-slate-900">
          Krediler ve Taksitler
        </h1>
        <LoanFormModal
          profiles={profiles ?? []}
          currentUserId={user.id}
          isAdmin={isAdmin}
        />
      </div>

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
