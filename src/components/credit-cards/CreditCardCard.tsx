"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils/currency";
import { deleteCreditCard } from "@/actions/credit-cards";
import { CreditCardForm } from "./CreditCardForm";
import type { CreditCard, CreditCardStatus } from "@/types";
import { CREDIT_CARD_STATUS_LABELS } from "@/types";

interface CreditCardCardProps {
  card: CreditCard;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  active: { bg: "bg-green-100", text: "text-green-700" },
  blocked: { bg: "bg-orange-100", text: "text-orange-700" },
  closed: { bg: "bg-slate-100", text: "text-slate-600" },
};

export function CreditCardCard({ card }: CreditCardCardProps) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  const status = (card.status ?? "active") as CreditCardStatus;
  const statusColor = statusColors[status] ?? statusColors.active;
  const statusLabel = CREDIT_CARD_STATUS_LABELS[status] ?? "Aktif";

  const usagePercent =
    card.card_limit > 0
      ? Math.round((card.current_balance / card.card_limit) * 100)
      : 0;

  const availableLimit = card.card_limit - card.current_balance;

  function handleDelete() {
    startDeleteTransition(async () => {
      const result = await deleteCreditCard(card.id);
      if (result.success) {
        setShowDeleteConfirm(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl min-w-[280px] p-4 bg-white border border-slate-100 shadow-md shadow-black/[0.03] hover:shadow-lg transition-shadow relative">
      {/* Top row: info + status badge */}
      <div className="flex items-start justify-between">
        <Link href={`/credit-cards/${card.id}`} className="flex items-center gap-3 flex-1">
          <div className="size-10 rounded-lg bg-blue-50 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">credit_card</span>
          </div>
          <div>
            <p className="text-slate-900 font-bold text-sm">{card.card_name}</p>
            <p className="text-slate-500 text-xs">{card.bank_name}</p>
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

      {/* Limit usage progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500">Limit Kullanimi ({usagePercent}%)</span>
          <span className="text-slate-900 font-medium">
            Kullanilabilir: {formatCurrency(availableLimit)}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${
              usagePercent >= 90
                ? "bg-gradient-to-r from-red-500 to-red-400"
                : usagePercent >= 70
                ? "bg-gradient-to-r from-orange-500 to-orange-400"
                : "bg-gradient-to-r from-primary to-indigo-400"
            }`}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Bottom row: statement day + due day */}
      <div className="flex justify-between items-end pt-1">
        <div>
          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
            Hesap Kesim
          </p>
          <p className="text-slate-700 font-bold text-sm">
            Her ay {card.statement_day}.
          </p>
        </div>
        <div className="text-right">
          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
            Son Odeme
          </p>
          <p className="text-primary font-bold text-sm">
            Her ay {card.due_day}.
          </p>
        </div>
      </div>

      {/* Current balance */}
      <div className="flex items-center gap-1 text-xs text-slate-500">
        <span className="material-symbols-outlined text-xs">payments</span>
        <span>
          Guncel Borc: {formatCurrency(card.current_balance)}
        </span>
        {card.minimum_payment > 0 && (
          <span className="ml-auto text-slate-400">
            Asgari: {formatCurrency(card.minimum_payment)}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-1 border-t border-slate-50">
        <CreditCardForm
          card={card}
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
