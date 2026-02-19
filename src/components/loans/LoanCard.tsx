import Link from "next/link";
import { formatCurrency } from "@/lib/utils/currency";
import type { Loan, Installment } from "@/types";

interface LoanCardProps {
  loan: Loan & {
    payer: { full_name: string } | null;
    installments: Pick<Installment, "id" | "is_paid">[];
  };
}

const loanTypeIcons: Record<string, { icon: string; bg: string; text: string }> = {
  "Konut Kredisi": { icon: "home", bg: "bg-blue-50", text: "text-primary" },
  "Taşıt Kredisi": { icon: "directions_car", bg: "bg-orange-50", text: "text-orange-600" },
  "İhtiyaç Kredisi": { icon: "shopping_bag", bg: "bg-purple-50", text: "text-purple-600" },
};

export function LoanCard({ loan }: LoanCardProps) {
  const iconConfig = loanTypeIcons[loan.loan_type] ?? {
    icon: "account_balance",
    bg: "bg-blue-50",
    text: "text-primary",
  };

  const totalInstallments = loan.installments.length;
  const paidInstallments = loan.installments.filter((i) => i.is_paid).length;
  const progress =
    totalInstallments > 0
      ? Math.round((paidInstallments / totalInstallments) * 100)
      : 0;

  return (
    <Link href={`/loans/${loan.id}`}>
      <div className="flex flex-col gap-4 rounded-xl min-w-[280px] p-4 bg-white border border-slate-100 shadow-md shadow-black/[0.03] hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`size-10 rounded-lg ${iconConfig.bg} flex items-center justify-center ${iconConfig.text}`}
            >
              <span className="material-symbols-outlined">{iconConfig.icon}</span>
            </div>
            <div>
              <p className="text-slate-900 font-bold text-sm">
                {loan.bank_name}
              </p>
              <p className="text-slate-500 text-xs">{loan.loan_type}</p>
            </div>
          </div>
          <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            Aktif
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">İlerleme ({progress}%)</span>
            <span className="text-slate-900 font-medium">
              {formatCurrency(loan.total_amount)}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-primary to-indigo-400 h-1.5 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between items-end pt-1">
          <div>
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              Aylık Ödeme
            </p>
            <p className="text-primary font-bold">
              {formatCurrency(loan.monthly_payment)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              Taksit
            </p>
            <p className="text-slate-700 font-bold text-sm">
              {paidInstallments}/{totalInstallments}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
