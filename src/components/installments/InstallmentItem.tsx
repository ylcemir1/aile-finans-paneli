import { formatCurrency } from "@/lib/utils/currency";
import { formatMonthDay, daysUntil } from "@/lib/utils/date";
import { MarkPaidButton } from "./MarkPaidButton";

interface InstallmentItemProps {
  installment: {
    id: string;
    loan_id: string;
    due_date: string;
    amount: number;
    is_paid: boolean;
    paid_at: string | null;
  };
  loanInfo?: string;
  showMarkPaid?: boolean;
  paidCount?: number;
  totalCount?: number;
}

export function InstallmentItem({
  installment,
  loanInfo,
  showMarkPaid = true,
  paidCount,
  totalCount,
}: InstallmentItemProps) {
  const { month, day } = formatMonthDay(installment.due_date);
  const days = daysUntil(installment.due_date);
  const isOverdue = !installment.is_paid && days < 0;
  const isPending = !installment.is_paid && days >= 0;

  let borderColor = "border-slate-300";
  let dateBg = "bg-slate-200";
  let dateText = "text-slate-500";
  let statusText = "";

  if (isOverdue) {
    borderColor = "border-red-500";
    dateBg = "bg-red-50";
    dateText = "text-red-600";
    statusText = `${Math.abs(days)} gün gecikti`;
  } else if (isPending) {
    borderColor = "border-primary";
    dateBg = "bg-primary/10";
    dateText = "text-primary";
    statusText = days === 0 ? "Bugün" : `${days} gün sonra`;
  } else {
    statusText = "Ödendi";
  }

  return (
    <div
      className={`bg-white p-4 rounded-xl border-l-4 ${borderColor} shadow-md shadow-black/[0.03] flex flex-col gap-3 ${
        installment.is_paid ? "opacity-80" : ""
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex gap-3">
          <div
            className={`flex flex-col items-center justify-center ${dateBg} ${dateText} rounded-lg px-2 py-1 min-w-[50px]`}
          >
            <span className="text-[10px] font-bold uppercase">{month}</span>
            <span className="text-lg font-extrabold leading-none">{day}</span>
          </div>
          <div>
            <p
              className={`text-sm font-bold leading-tight ${
                installment.is_paid
                  ? "text-slate-400 line-through"
                  : "text-slate-900"
              }`}
            >
              {loanInfo ?? "Taksit Ödemesi"}
            </p>
            <p
              className={`text-xs font-medium ${
                isOverdue
                  ? "text-red-500"
                  : installment.is_paid
                  ? "text-green-500 flex items-center gap-1"
                  : "text-slate-500"
              }`}
            >
              {installment.is_paid && (
                <span className="material-symbols-outlined text-[14px]">
                  check
                </span>
              )}
              {statusText}
            </p>
          </div>
        </div>
        <p
          className={`font-extrabold ${
            installment.is_paid ? "text-slate-400" : "text-slate-900"
          }`}
        >
          {formatCurrency(installment.amount)}
        </p>
      </div>

      {!installment.is_paid && showMarkPaid && (
        <div className="flex items-center justify-between gap-4">
          {paidCount !== undefined && totalCount !== undefined && (
            <div className="text-xs text-slate-500">
              Tks.{" "}
              <span className="text-slate-700 font-bold">
                {paidCount}/{totalCount}
              </span>
            </div>
          )}
          <MarkPaidButton
            id={installment.id}
            loanId={installment.loan_id}
            isPaid={installment.is_paid}
          />
        </div>
      )}
    </div>
  );
}
