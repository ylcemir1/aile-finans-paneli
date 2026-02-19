import { createClient } from "@/lib/supabase/server";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { UpcomingInstallments } from "@/components/dashboard/UpcomingInstallments";
import { SavingsGoalCard } from "@/components/dashboard/SavingsGoalCard";
import { MonthlySpendingChart } from "@/components/dashboard/MonthlySpendingChart";
import { DebtBreakdownCard } from "@/components/dashboard/DebtBreakdownCard";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate, isWithinDays, daysUntil } from "@/lib/utils/date";
import { LOAN_TYPES } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { data: accounts },
    { data: loans },
    { data: installments },
    { data: creditCards },
  ] = await Promise.all([
    supabase.from("bank_accounts").select("balance, currency"),
    supabase
      .from("loans")
      .select("monthly_payment, remaining_balance, loan_type, status")
      .eq("status", "active"),
    supabase
      .from("installments")
      .select("*, loan:loans(bank_name, loan_type)")
      .eq("is_paid", false)
      .gte("due_date", new Date().toISOString().split("T")[0])
      .order("due_date", { ascending: true }),
    supabase.from("credit_cards").select("current_balance").eq("status", "active"),
  ]);

  // Also get recently paid installments for the list
  const { data: recentPaid } = await supabase
    .from("installments")
    .select("*, loan:loans(bank_name, loan_type)")
    .eq("is_paid", true)
    .order("paid_at", { ascending: false })
    .limit(3);

  // Also get overdue installments (past due date, not paid)
  const { data: overdueInstallments } = await supabase
    .from("installments")
    .select("*, loan:loans(bank_name, loan_type)")
    .eq("is_paid", false)
    .lt("due_date", new Date().toISOString().split("T")[0])
    .order("due_date", { ascending: true });

  // Monthly spending data (last 6 months of paid installments)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  const sixMonthsAgoStr = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, "0")}-01`;

  const { data: paidInstallments } = await supabase
    .from("installments")
    .select("due_date, amount")
    .eq("is_paid", true)
    .gte("due_date", sixMonthsAgoStr)
    .order("due_date", { ascending: true });

  // Group by month
  const monthlyMap = new Map<string, number>();
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, 0);
  }
  (paidInstallments ?? []).forEach((inst) => {
    const key = inst.due_date.slice(0, 7);
    if (monthlyMap.has(key)) {
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + Number(inst.amount));
    }
  });
  const monthlyData = Array.from(monthlyMap, ([month, total]) => ({
    month,
    total,
  }));

  // Calculations
  const totalCash = (accounts ?? [])
    .filter((a) => (a.currency ?? "TRY") === "TRY")
    .reduce((sum, a) => sum + Number(a.balance), 0);

  const loanDebt = (loans ?? []).reduce(
    (sum, l) => sum + Number(l.remaining_balance ?? 0),
    0
  );

  const creditCardDebt = (creditCards ?? []).reduce(
    (sum, c) => sum + Number(c.current_balance ?? 0),
    0
  );

  const totalDebt = loanDebt + creditCardDebt;
  const netWorth = totalCash - totalDebt;

  // Loan debt by type
  const loanTypeMap = new Map<string, number>();
  for (const l of loans ?? []) {
    const type = l.loan_type ?? "diger";
    loanTypeMap.set(type, (loanTypeMap.get(type) ?? 0) + Number(l.remaining_balance ?? 0));
  }
  const loansByType = Array.from(loanTypeMap.entries()).map(([type, amount]) => ({
    type,
    label: LOAN_TYPES.find((lt) => lt.value === type)?.label ?? type,
    amount,
  }));

  const upcomingIn7Days = (installments ?? []).filter((i) =>
    isWithinDays(i.due_date, 7)
  );

  const nearestDueDate =
    installments && installments.length > 0 ? installments[0].due_date : null;

  const nearestDays = nearestDueDate ? daysUntil(nearestDueDate) : null;

  // Combine for display list: overdue first, then upcoming, then recent paid
  const displayInstallments = [
    ...(overdueInstallments ?? []),
    ...upcomingIn7Days,
    ...(recentPaid ?? []),
  ].slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          title="Toplam Nakit"
          value={formatCurrency(totalCash)}
          color="green"
          icon="account_balance_wallet"
        />
        <MetricCard
          title="Toplam Borc"
          value={formatCurrency(totalDebt)}
          subtitle={`Kredi: ${formatCurrency(loanDebt)} + Kart: ${formatCurrency(creditCardDebt)}`}
          color="red"
          icon="credit_card"
        />
        <MetricCard
          title="Net Varlik"
          value={formatCurrency(netWorth)}
          subtitle={netWorth >= 0 ? "Pozitif" : "Negatif"}
          color="blue"
          icon="trending_up"
        />
        <MetricCard
          title="Gelecek Odeme"
          value={nearestDueDate ? formatDate(nearestDueDate) : "Yok"}
          subtitle={
            nearestDays !== null
              ? nearestDays === 0
                ? "Bugun"
                : `${nearestDays} gun icinde`
              : undefined
          }
          color="orange"
          icon="event"
        />
      </div>

      {/* Upcoming installments */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900">
            Acil Taksitler
          </h2>
          {(overdueInstallments ?? []).length > 0 && (
            <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg">
              {(overdueInstallments ?? []).length} gecikti
            </span>
          )}
        </div>
        <UpcomingInstallments installments={displayInstallments} />
      </section>

      {/* Debt breakdown */}
      <DebtBreakdownCard
        loanDebt={loanDebt}
        creditCardDebt={creditCardDebt}
        loansByType={loansByType}
      />

      {/* Monthly spending chart */}
      <MonthlySpendingChart data={monthlyData} />

      {/* Net worth card */}
      <SavingsGoalCard totalCash={totalCash} totalDebt={totalDebt} />
    </div>
  );
}
