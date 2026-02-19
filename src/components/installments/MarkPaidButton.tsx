"use client";

import { useTransition } from "react";
import {
  markInstallmentPaid,
  markInstallmentUnpaid,
} from "@/actions/installments";

interface MarkPaidButtonProps {
  id: string;
  loanId: string;
  isPaid: boolean;
}

export function MarkPaidButton({ id, loanId, isPaid }: MarkPaidButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      if (isPaid) {
        await markInstallmentUnpaid(id, loanId);
      } else {
        await markInstallmentPaid(id, loanId);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 ${
        isPaid
          ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
          : "bg-primary text-white hover:bg-primary/90"
      }`}
    >
      <span className="material-symbols-outlined text-sm">check_circle</span>
      {isPending
        ? "İşleniyor..."
        : isPaid
        ? "Ödenmedi Yap"
        : "Ödendi İşaretle"}
    </button>
  );
}
