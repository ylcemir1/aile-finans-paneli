"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils/currency";
import { deleteLoan } from "@/actions/loans";
import { LoanFormModal } from "./LoanFormModal";
import type { Loan, Installment, LoanStatus } from "@/types";
import { LOAN_STATUS_LABELS } from "@/types";

interface LoanCardProps {
  loan: Loan & {
    payer: { full_name: string } | null;
    installments: Pick<Installment, "id" | "is_paid">[];
  };
  profiles: { id: string; full_name: string }[];
  currentUserId: string;
  isAdmin: boolean;
}

const loanTypeIcons: Record<string, { icon: string; bg: string; text: string }> = {
  konut: { icon: "home", bg: "bg-blue-50", text: "text-primary" },
  tasit: { icon: "directions_car", bg: "bg-orange-50", text: "text-orange-600" },
  ihtiyac: { icon: "shopping_bag", bg: "bg-purple-50", text: "text-purple-600" },
  kobi: { icon: "business", bg: "bg-teal-50", text: "text-teal-600" },
  esnaf: { icon: "storefront", bg: "bg-amber-50", text: "text-amber-600" },
  tarim: { icon: "agriculture", bg: "bg-green-50", text: "text-green-600" },
  egitim: { icon: "school", bg: "bg-indigo-50", text: "text-indigo-600" },
  diger: { icon: "account_balance", bg: "bg-slate-50", text: "text-slate-600" },
  // Legacy support for old loan types
  "Konut Kredisi": { icon: "home", bg: "bg-blue-50", text: "text-primary" },
  "Tasit Kredisi": { icon: "directions_car", bg: "bg-orange-50", text: "text-orange-600" },
  "Ihtiyac Kredisi": { icon: "shopping_bag", bg: "bg-purple-50", text: "text-purple-600" },
};

const statusColors: Record<string, { bg: string; text: string }> = {
  active: { bg: "bg-green-100", text: "text-green-700" },
  closed: { bg: "bg-slate-100", text: "text-slate-600" },
  restructured: { bg: "bg-orange-100", text: "text-orange-700" },
};

export function LoanCard({ loan, profiles, currentUserId, isAdmin }: LoanCardProps) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  const iconConfig = loanTypeIcons[loan.loan_type] ?? {
    icon: "account_balance",
    bg: "bg-blue-50",
    text: "text-primary",
  };

  const status = (loan.status ?? "active") as LoanStatus;
  const statusColor = statusColors[status] ?? statusColors.active;
  const statusLabel = LOAN_STATUS_LABELS[status] ?? "Aktif";

  // Use paid_amount based progress (money-based)
  const paidAmount = loan.paid_amount ?? 0;
  const totalAmount = loan.total_amount ?? 0;
  const progress = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;
  const remainingBalance = loan.remaining_balance ?? totalAmount - paidAmount;

  const totalInstallments = loan.installments.length;
  const paidInstallments = loan.installments.filter((i) => i.is_paid).length;

  function handleDelete() {
    startDeleteTransition(async () => {
      const result = await deleteLoan(loan.id);
      if (result.success) {
        setShowDeleteConfirm(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl min-w-[280px] p-4 bg-white border border-slate-100 shadow-md shadow-black/[0.03] hover:shadow-lg transition-shadow relative">
      {/* Top row: info + status badge + actions */}
      <div className="flex items-start justify-between">
        <Link href={`/loans/${loan.id}`} className="flex items-center gap-3 flex-1">
          <div
            className={`size-10 rounded-lg ${iconConfig.bg} flex items-center justify-center ${iconConfig.text}`}
          >
            <span className="material-symbols-outlined">{iconConfig.icon}</span>
          </div>
          <div>
            <p className="text-slate-900 font-bold text-sm">{loan.bank_name}</p>
            <p className="text-slate-500 text-xs">{loan.loan_type}</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <span
            className={`${statusColor.bg} ${statusColor.text} text-[10px] font-bold px-2 py-0.5 rounded-full uppercase`}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Money-based progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500">Odeme ({progress}%)</span>
          <span className="text-slate-900 font-medium">
            Kalan: {formatCurrency(remainingBalance)}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5">
          <div
            className="bg-gradient-to-r from-primary to-indigo-400 h-1.5 rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Bottom row: monthly payment + installment count */}
      <div className="flex justify-between items-end pt-1">
        <div>
          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
            Aylik Odeme
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

      {/* Interest rate badge */}
      {loan.interest_rate > 0 && (
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <span className="material-symbols-outlined text-xs">percent</span>
          <span>
            {loan.interest_rate}% {loan.interest_type === "variable" ? "(Degisken)" : "(Sabit)"}
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-1 border-t border-slate-50">
        <LoanFormModal
          profiles={profiles}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          loan={loan}
          trigger={
            <button className="flex-1 flex items-center justify-center gap-1 text-xs text-primary font-medium py-1.5 rounded-lg hover:bg-primary/5 transition-colors">
              <span className="material-symbols-outlined text-sm">edit</span>
              Duzenle
            </button>
          }
        />
        {showDeleteConfirm ? (
          <div className="flex-1 flex items-center gap-1">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 text-xs text-red-600 font-medium py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              {isDeleting ? "..." : "Evet"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 text-xs text-slate-500 font-medium py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Hayir
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-1 flex items-center justify-center gap-1 text-xs text-red-500 font-medium py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            Sil
          </button>
        )}
      </div>
    </div>
  );
}
