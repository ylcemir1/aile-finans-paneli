"use client";

import { useState, useTransition } from "react";
import { formatCurrency } from "@/lib/utils/currency";
import { formatMonthDay, daysUntil } from "@/lib/utils/date";
import { MarkPaidButton } from "./MarkPaidButton";
import { updateInstallment } from "@/actions/installments";
import { Modal } from "@/components/ui/Modal";
import type { LoanColor } from "@/lib/utils/loan-colors";

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
  loanColor?: LoanColor;
  showMarkPaid?: boolean;
  paidCount?: number;
  totalCount?: number;
  installmentNumber?: number;
}

export function InstallmentItem({
  installment,
  loanInfo,
  loanColor,
  showMarkPaid = true,
  paidCount,
  totalCount,
}: InstallmentItemProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState("");
  const [isPending, startTransition] = useTransition();

  const { month, day } = formatMonthDay(installment.due_date);
  const days = daysUntil(installment.due_date);
  const isOverdue = !installment.is_paid && days < 0;
  const isPendingPayment = !installment.is_paid && days >= 0;

  const borderColor = loanColor?.border ?? (isOverdue ? "border-red-500" : isPendingPayment ? "border-primary" : "border-slate-300");

  let dateBg = "bg-slate-200";
  let dateText = "text-slate-500";
  let statusText = "";

  if (isOverdue) {
    dateBg = "bg-red-50";
    dateText = "text-red-600";
    statusText = `${Math.abs(days)} gün gecikti`;
  } else if (isPendingPayment) {
    dateBg = loanColor ? `${loanColor.bg}` : "bg-primary/10";
    dateText = loanColor ? `${loanColor.text}` : "text-primary";
    statusText = days === 0 ? "Bugün" : `${days} gün sonra`;
  } else {
    statusText = "Ödendi";
  }

  function handleEdit(formData: FormData) {
    setEditError("");
    const dueDate = formData.get("due_date") as string;
    const amount = parseFloat(formData.get("amount") as string);

    startTransition(async () => {
      const result = await updateInstallment(
        installment.id,
        installment.loan_id,
        { due_date: dueDate || undefined, amount: isNaN(amount) ? undefined : amount }
      );
      if (result.success) {
        setEditOpen(false);
      } else {
        setEditError(result.error);
      }
    });
  }

  return (
    <>
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
              {loanInfo && loanColor ? (
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold ${
                    installment.is_paid
                      ? "bg-slate-100 text-slate-400 line-through"
                      : `${loanColor.bg} ${loanColor.text}`
                  }`}
                >
                  <span
                    className={`size-2 rounded-full shrink-0 ${
                      installment.is_paid ? "bg-slate-300" : loanColor.dot
                    }`}
                  />
                  {loanInfo}
                </span>
              ) : (
                <p
                  className={`text-sm font-bold leading-tight ${
                    installment.is_paid
                      ? "text-slate-400 line-through"
                      : "text-slate-900"
                  }`}
                >
                  {loanInfo ?? "Taksit Ödemesi"}
                </p>
              )}
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
          <div className="flex items-center gap-2">
            <p
              className={`font-extrabold ${
                installment.is_paid ? "text-slate-400" : "text-slate-900"
              }`}
            >
              {formatCurrency(installment.amount)}
            </p>
            <button
              onClick={() => setEditOpen(true)}
              className="size-7 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400 hover:text-primary"
              title="Taksiti Duzenle"
            >
              <span className="material-symbols-outlined text-base">edit</span>
            </button>
          </div>
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

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Taksiti Duzenle"
      >
        <form action={handleEdit} className="space-y-4">
          {editError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {editError}
            </p>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Odeme Tarihi
            </label>
            <input
              type="date"
              name="due_date"
              defaultValue={installment.due_date}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Tutar
            </label>
            <input
              type="number"
              name="amount"
              step="0.01"
              defaultValue={installment.amount}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Iptal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isPending ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
