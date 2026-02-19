import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { InstallmentItem } from "@/components/installments/InstallmentItem";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import { LoanDetailActions } from "@/components/loans/LoanDetailActions";
import type { LoanStatus } from "@/types";
import { LOAN_STATUS_LABELS } from "@/types";

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: loan, error }, { data: profiles }, { data: currentProfile }] =
    await Promise.all([
      supabase
        .from("loans")
        .select("*, payer:profiles!payer_id(full_name), installments(*)")
        .eq("id", id)
        .single(),
      supabase.from("profiles").select("id, full_name"),
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single(),
    ]);

  if (error || !loan) notFound();

  const isAdmin = currentProfile?.role === "admin";

  const sortedInstallments = loan.installments.sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );

  const paidCount = sortedInstallments.filter((i) => i.is_paid).length;
  const totalCount = sortedInstallments.length;
  const paidAmount = loan.paid_amount ?? 0;
  const remainingBalance = loan.remaining_balance ?? loan.total_amount - paidAmount;
  const progress =
    loan.total_amount > 0
      ? Math.round((paidAmount / loan.total_amount) * 100)
      : 0;

  const status = (loan.status ?? "active") as LoanStatus;
  const statusLabel = LOAN_STATUS_LABELS[status] ?? "Aktif";

  const statusColors: Record<string, { bg: string; text: string }> = {
    active: { bg: "bg-green-100", text: "text-green-700" },
    closed: { bg: "bg-slate-100", text: "text-slate-600" },
    restructured: { bg: "bg-orange-100", text: "text-orange-700" },
  };
  const statusColor = statusColors[status] ?? statusColors.active;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/loans"
          className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="text-xl font-bold text-slate-900 flex-1">
          Kredi Detayi
        </h1>
        <LoanDetailActions
          loan={loan}
          profiles={profiles ?? []}
          currentUserId={user.id}
          isAdmin={isAdmin}
        />
      </div>

      {/* Loan info card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-slate-900">
              {loan.bank_name}
            </p>
            <p className="text-sm text-slate-500">{loan.loan_type}</p>
          </div>
          <span
            className={`${statusColor.bg} ${statusColor.text} text-[10px] font-bold px-2 py-0.5 rounded-full uppercase`}
          >
            {statusLabel}
          </span>
        </div>

        {/* 2x4 info grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">
              Toplam Tutar
            </p>
            <p className="font-bold text-slate-900">
              {formatCurrency(loan.total_amount)}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">
              Kalan Borc
            </p>
            <p className="font-bold text-red-600">
              {formatCurrency(remainingBalance)}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">
              Aylik Odeme
            </p>
            <p className="font-bold text-primary">
              {formatCurrency(loan.monthly_payment)}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">
              Odenen Tutar
            </p>
            <p className="font-bold text-green-600">
              {formatCurrency(paidAmount)}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">
              Faiz Orani
            </p>
            <p className="font-bold text-slate-900">
              %{loan.interest_rate ?? 0}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">
              Faiz Tipi
            </p>
            <p className="font-bold text-slate-900">
              {loan.interest_type === "variable" ? "Degisken" : "Sabit"}
            </p>
          </div>
          {loan.statement_day && (
            <div>
              <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">
                Kesim Gunu
              </p>
              <p className="font-bold text-slate-900">
                Her ayin {loan.statement_day}. gunu
              </p>
            </div>
          )}
          {loan.due_day && (
            <div>
              <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">
                Son Odeme Gunu
              </p>
              <p className="font-bold text-slate-900">
                Her ayin {loan.due_day}. gunu
              </p>
            </div>
          )}
          <div>
            <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">
              Baslangic
            </p>
            <p className="font-bold text-slate-900">
              {formatDate(loan.start_date)}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">
              Bitis
            </p>
            <p className="font-bold text-slate-900">
              {formatDate(loan.end_date)}
            </p>
          </div>
        </div>

        {loan.grace_period_months > 0 && (
          <div className="flex items-center gap-2 text-sm bg-amber-50 p-3 rounded-lg">
            <span className="material-symbols-outlined text-amber-600 text-lg">
              schedule
            </span>
            <span className="text-amber-700 font-medium">
              {loan.grace_period_months} ay odemesiz donem
            </span>
          </div>
        )}

        {loan.notes && (
          <div className="flex items-start gap-2 text-sm bg-slate-50 p-3 rounded-lg">
            <span className="material-symbols-outlined text-slate-400 text-lg">
              sticky_note_2
            </span>
            <span className="text-slate-600">{loan.notes}</span>
          </div>
        )}

        {loan.payer && (
          <div className="flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-slate-400 text-lg">
              person
            </span>
            <span className="text-slate-500">Odeyen:</span>
            <span className="font-bold text-slate-700">
              {loan.payer.full_name}
            </span>
          </div>
        )}

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">Odeme ({progress}%)</span>
            <span className="text-slate-700 font-bold">
              {paidCount}/{totalCount} taksit
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary to-indigo-400 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Installments */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-3">Taksitler</h2>
        <div className="space-y-3">
          {sortedInstallments.map((inst, index) => (
            <InstallmentItem
              key={inst.id}
              installment={{ ...inst, loan_id: id }}
              loanInfo={`${loan.bank_name} - ${loan.loan_type}`}
              paidCount={paidCount}
              totalCount={totalCount}
              installmentNumber={inst.installment_number || index + 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
