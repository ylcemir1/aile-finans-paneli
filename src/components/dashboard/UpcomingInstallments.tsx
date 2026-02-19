import { formatCurrency } from "@/lib/utils/currency";
import { formatShortDate, daysUntil } from "@/lib/utils/date";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

interface InstallmentData {
  id: string;
  due_date: string;
  amount: number;
  is_paid: boolean;
  loan: { bank_name: string; loan_type: string } | null;
}

interface UpcomingInstallmentsProps {
  installments: InstallmentData[];
}

const loanIcons: Record<string, { icon: string; bgColor: string; textColor: string }> = {
  "Konut Kredisi": { icon: "home", bgColor: "bg-rose-50", textColor: "text-rose-600" },
  "Taşıt Kredisi": { icon: "directions_car", bgColor: "bg-blue-50", textColor: "text-blue-600" },
  "İhtiyaç Kredisi": { icon: "shopping_bag", bgColor: "bg-amber-50", textColor: "text-amber-600" },
};

function getIconConfig(loanType: string) {
  return loanIcons[loanType] ?? { icon: "payments", bgColor: "bg-slate-50", textColor: "text-slate-600" };
}

export function UpcomingInstallments({
  installments,
}: UpcomingInstallmentsProps) {
  if (installments.length === 0) {
    return (
      <EmptyState
        icon="event_available"
        title="Yaklaşan ödeme yok"
        description="Tebrikler! Yaklaşan taksit ödemeniz bulunmuyor."
        iconBg="bg-emerald-50"
        iconColor="text-emerald-500"
      />
    );
  }

  return (
    <div className="space-y-3">
      {installments.map((inst) => {
        const days = daysUntil(inst.due_date);
        const iconConfig = getIconConfig(inst.loan?.loan_type ?? "");

        return (
          <div
            key={inst.id}
            className={`flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-md shadow-black/[0.03] ${
              inst.is_paid ? "opacity-80" : ""
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`size-12 rounded-lg ${iconConfig.bgColor} flex items-center justify-center ${iconConfig.textColor}`}
              >
                <span className="material-symbols-outlined">
                  {iconConfig.icon}
                </span>
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900">
                  {inst.loan?.bank_name} — {inst.loan?.loan_type}
                </p>
                <p className="text-xs text-slate-500">
                  {inst.is_paid
                    ? `Ödendi`
                    : days < 0
                    ? `${Math.abs(days)} gün gecikti`
                    : days === 0
                    ? "Bugün"
                    : `${days} gün kaldı`}{" "}
                  • {formatCurrency(inst.amount)}
                </p>
              </div>
            </div>
            <Badge
              variant={inst.is_paid ? "paid" : days < 0 ? "overdue" : "unpaid"}
            />
          </div>
        );
      })}
    </div>
  );
}
