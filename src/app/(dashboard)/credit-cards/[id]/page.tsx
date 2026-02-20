import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/currency";
import { CreditCardForm } from "@/components/credit-cards/CreditCardForm";
import { CCInstallmentForm } from "@/components/credit-cards/CCInstallmentForm";
import { CCInstallmentItem } from "@/components/credit-cards/CCInstallmentItem";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CreditCardStatus } from "@/types";
import { CREDIT_CARD_STATUS_LABELS } from "@/types";

export default async function CreditCardDetailPage({
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

  const { data: card, error } = await supabase
    .from("credit_cards")
    .select("*, credit_card_installments(*), owner:profiles!owner_id(full_name)")
    .eq("id", id)
    .single();

  if (error || !card) notFound();
  const status = (card.status ?? "active") as CreditCardStatus;
  const statusLabel = CREDIT_CARD_STATUS_LABELS[status] ?? "Aktif";

  const statusColors: Record<string, { bg: string; text: string }> = {
    active: { bg: "bg-green-100", text: "text-green-700" },
    blocked: { bg: "bg-orange-100", text: "text-orange-700" },
    closed: { bg: "bg-slate-100", text: "text-slate-600" },
  };
  const statusColor = statusColors[status] ?? statusColors.active;

  const usagePercent =
    card.card_limit > 0
      ? Math.round((card.current_balance / card.card_limit) * 100)
      : 0;
  const availableLimit = card.card_limit - card.current_balance;

  const activeInstallments = (card.credit_card_installments ?? []).filter(
    (i) => !i.is_completed
  );
  const completedInstallments = (card.credit_card_installments ?? []).filter(
    (i) => i.is_completed
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/credit-cards"
          className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="text-xl font-bold text-slate-900 flex-1">
          Kart Detayi
        </h1>
        <CreditCardForm
          defaultScope={card.family_id ? "family" : "personal"}
          card={card}
          trigger={
            <button className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-xl">edit</span>
            </button>
          }
        />
      </div>

      {/* Card info */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-slate-900">{card.card_name}</p>
            <p className="text-sm text-slate-500">{card.bank_name}</p>
          </div>
          <span
            className={`${statusColor.bg} ${statusColor.text} text-[10px] font-bold px-2 py-0.5 rounded-full uppercase`}
          >
            {statusLabel}
          </span>
        </div>

        {/* Limit usage bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">Limit Kullanimi (%{usagePercent})</span>
            <span className="text-slate-900 font-medium">
              {formatCurrency(card.current_balance)} / {formatCurrency(card.card_limit)}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
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

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">
              Kart Limiti
            </p>
            <p className="font-bold text-slate-900">
              {formatCurrency(card.card_limit)}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">
              Guncel Borc
            </p>
            <p className="font-bold text-red-600">
              {formatCurrency(card.current_balance)}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">
              Kullanilabilir
            </p>
            <p className="font-bold text-green-600">
              {formatCurrency(availableLimit)}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">
              Asgari Odeme
            </p>
            <p className="font-bold text-slate-900">
              {formatCurrency(card.minimum_payment)}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">
              Ekstre Kesim
            </p>
            <p className="font-bold text-slate-900">
              Her ayin {card.statement_day}. gunu
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">
              Son Odeme
            </p>
            <p className="font-bold text-slate-900">
              Her ayin {card.due_day}. gunu
            </p>
          </div>
        </div>

        {card.notes && (
          <div className="flex items-start gap-2 text-sm bg-slate-50 p-3 rounded-lg">
            <span className="material-symbols-outlined text-slate-400 text-lg">
              sticky_note_2
            </span>
            <span className="text-slate-600">{card.notes}</span>
          </div>
        )}

        {card.owner && (
          <div className="flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-slate-400 text-lg">
              person
            </span>
            <span className="text-slate-500">Sahibi:</span>
            <span className="font-bold text-slate-700">
              {card.owner.full_name}
            </span>
          </div>
        )}
      </div>

      {/* Active installments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900">
            Taksitli Alisverisler
          </h2>
          <CCInstallmentForm cardId={card.id} />
        </div>

        {activeInstallments.length === 0 && completedInstallments.length === 0 ? (
          <EmptyState
            icon="shopping_cart"
            title="Taksitli alisveris yok"
            description="Taksitli alisverislerinizi ekleyerek takip edin."
            iconBg="bg-blue-50"
            iconColor="text-blue-500"
          />
        ) : (
          <div className="space-y-3">
            {activeInstallments.map((inst) => (
              <CCInstallmentItem
                key={inst.id}
                installment={inst}
                cardId={card.id}
              />
            ))}
            {completedInstallments.length > 0 && (
              <>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-2">
                  Tamamlanan
                </p>
                {completedInstallments.map((inst) => (
                  <CCInstallmentItem
                    key={inst.id}
                    installment={inst}
                    cardId={card.id}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
