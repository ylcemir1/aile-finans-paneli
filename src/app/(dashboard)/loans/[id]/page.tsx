import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { InstallmentItem } from "@/components/installments/InstallmentItem";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: loan, error } = await supabase
    .from("loans")
    .select("*, payer:profiles!payer_id(full_name), installments(*)")
    .eq("id", id)
    .single();

  if (error || !loan) notFound();

  const sortedInstallments = loan.installments.sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );

  const paidCount = sortedInstallments.filter((i) => i.is_paid).length;
  const totalCount = sortedInstallments.length;
  const progress =
    totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

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
          Kredi Detayı
        </h1>
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
          <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            Aktif
          </span>
        </div>

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
              Aylık Ödeme
            </p>
            <p className="font-bold text-primary">
              {formatCurrency(loan.monthly_payment)}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">
              Başlangıç
            </p>
            <p className="font-bold text-slate-900">
              {formatDate(loan.start_date)}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">
              Bitiş
            </p>
            <p className="font-bold text-slate-900">
              {formatDate(loan.end_date)}
            </p>
          </div>
        </div>

        {loan.payer && (
          <div className="flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-slate-400 text-lg">
              person
            </span>
            <span className="text-slate-500">Ödeyen:</span>
            <span className="font-bold text-slate-700">
              {loan.payer.full_name}
            </span>
          </div>
        )}

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">
              İlerleme ({progress}%)
            </span>
            <span className="text-slate-700 font-bold">
              {paidCount}/{totalCount} taksit
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary to-indigo-400 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Installments */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-3">Taksitler</h2>
        <div className="space-y-3">
          {sortedInstallments.map((inst) => (
            <InstallmentItem
              key={inst.id}
              installment={{ ...inst, loan_id: id }}
              loanInfo={`${loan.bank_name} - ${loan.loan_type}`}
              paidCount={paidCount}
              totalCount={totalCount}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
