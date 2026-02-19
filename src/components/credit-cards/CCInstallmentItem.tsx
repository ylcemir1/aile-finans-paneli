"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils/currency";
import { markCCInstallmentPaid } from "@/actions/credit-cards";
import type { CreditCardInstallment } from "@/types";

interface CCInstallmentItemProps {
  installment: CreditCardInstallment;
  cardId: string;
}

export function CCInstallmentItem({ installment, cardId }: CCInstallmentItemProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const progress =
    installment.installment_count > 0
      ? Math.round(
          (installment.paid_installments / installment.installment_count) * 100
        )
      : 0;

  function handleMarkPaid() {
    startTransition(async () => {
      await markCCInstallmentPaid(installment.id, cardId);
      router.refresh();
    });
  }

  return (
    <div
      className={`bg-white p-4 rounded-xl border border-slate-100 shadow-md shadow-black/[0.03] space-y-3 ${
        installment.is_completed ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <span className="material-symbols-outlined">shopping_bag</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">
              {installment.merchant_name}
            </p>
            {installment.description && (
              <p className="text-xs text-slate-500">{installment.description}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-slate-900">
            {formatCurrency(installment.total_amount)}
          </p>
          <p className="text-xs text-slate-500">
            {formatCurrency(installment.installment_amount)}/ay
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">
            {installment.paid_installments}/{installment.installment_count} taksit
          </span>
          <span className="text-slate-700 font-medium">{progress}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${
              installment.is_completed
                ? "bg-green-500"
                : "bg-gradient-to-r from-primary to-indigo-400"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Mark paid button */}
      {!installment.is_completed && (
        <button
          onClick={handleMarkPaid}
          disabled={isPending}
          className="w-full text-center text-xs font-medium text-primary py-2 rounded-lg hover:bg-primary/5 transition-colors border border-primary/20"
        >
          {isPending ? "Isleniyor..." : "Taksit Odendi Isaretle"}
        </button>
      )}

      {installment.is_completed && (
        <div className="flex items-center justify-center gap-1 text-xs text-green-600 font-medium">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          Tamamlandi
        </div>
      )}
    </div>
  );
}
