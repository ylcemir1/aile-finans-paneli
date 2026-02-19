import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreditCardCard } from "@/components/credit-cards/CreditCardCard";
import { CreditCardForm } from "@/components/credit-cards/CreditCardForm";
import { formatCurrency } from "@/lib/utils/currency";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function CreditCardsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: cards } = await supabase
    .from("credit_cards")
    .select("*, credit_card_installments(*)")
    .order("created_at", { ascending: false });
  const activeCards = (cards ?? []).filter((c) => c.status !== "closed");

  const totalDebt = activeCards.reduce(
    (sum, c) => sum + Number(c.current_balance),
    0
  );
  const totalLimit = activeCards.reduce(
    (sum, c) => sum + Number(c.card_limit),
    0
  );
  const availableLimit = totalLimit - totalDebt;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Kredi Kartlari</h1>
        <CreditCardForm />
      </div>

      {/* Summary stats */}
      <div className="flex flex-wrap gap-4">
        <div className="flex min-w-[150px] flex-1 flex-col gap-2 rounded-xl p-5 bg-primary text-white shadow-lg shadow-primary/20">
          <div className="flex items-center gap-2 opacity-90">
            <span className="material-symbols-outlined text-sm">
              credit_card
            </span>
            <p className="text-sm font-medium">Toplam Borc</p>
          </div>
          <p className="tracking-tight text-2xl font-extrabold">
            {formatCurrency(totalDebt)}
          </p>
        </div>
        <div className="flex min-w-[150px] flex-1 flex-col gap-2 rounded-xl p-5 bg-white border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-green-600">
            <span className="material-symbols-outlined text-sm">
              account_balance_wallet
            </span>
            <p className="text-sm font-medium">Kullanilabilir Limit</p>
          </div>
          <p className="text-green-700 tracking-tight text-2xl font-extrabold">
            {formatCurrency(availableLimit)}
          </p>
        </div>
      </div>

      {/* Cards list */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-3">
          Kartlarim
        </h2>
        {(cards ?? []).length === 0 ? (
          <EmptyState
            icon="credit_card"
            title="Henuz kredi karti eklenmedi"
            description="Kredi kartlarinizi ekleyerek borc takibini baslatin."
            actionLabel="+ Kart Ekle"
            iconBg="bg-purple-50"
            iconColor="text-purple-500"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(cards ?? []).map((card) => (
              <CreditCardCard
                key={card.id}
                card={card}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
