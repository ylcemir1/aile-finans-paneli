import { createClient } from "@/lib/supabase/server";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { UpcomingInstallments } from "@/components/dashboard/UpcomingInstallments";
import { SavingsGoalCard } from "@/components/dashboard/SavingsGoalCard";
import { MonthlySpendingChart } from "@/components/dashboard/MonthlySpendingChart";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate, isThisMonth, isWithinDays, daysUntil } from "@/lib/utils/date";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: accounts }, { data: loans }, { data: installments }] =
    await Promise.all([
      supabase.from("bank_accounts").select("balance"),
      supabase.from("loans").select("monthly_payment"),
      supabase
        .from("installments")
        .select("*, loan:loans(bank_name, loan_type)")
        .eq("is_paid", false)
        .gte("due_date", new Date().toISOString().split("T")[0])
        .order("due_date", { ascending: true }),
    ]);

  // Also get recently paid installments for the list
  const { data: recentPaid } = await supabase
    .from("installments")
    .select("*, loan:loans(bank_name, loan_type)")
    .eq("is_paid", true)
    .order("paid_at", { ascending: false })
    .limit(3);

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

  const totalCash = (accounts ?? []).reduce(
    (sum, a) => sum + Number(a.balance),
    0
  );
  const totalMonthlyDebt = (loans ?? []).reduce(
    (sum, l) => sum + Number(l.monthly_payment),
    0
  );

  const thisMonthInstallments = (installments ?? []).filter((i) =>
    isThisMonth(i.due_date)
  );
  const thisMonthDue = thisMonthInstallments.reduce(
    (sum, i) => sum + Number(i.amount),
    0
  );

  const upcomingIn7Days = (installments ?? []).filter((i) =>
    isWithinDays(i.due_date, 7)
  );

  const nearestDueDate =
    installments && installments.length > 0 ? installments[0].due_date : null;

  const nearestDays = nearestDueDate ? daysUntil(nearestDueDate) : null;

  // Combine for display list
  const displayInstallments = [
    ...upcomingIn7Days,
    ...(recentPaid ?? []),
  ].slice(0, 6);

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
          title="Toplam Borç"
          value={formatCurrency(totalMonthlyDebt)}
          subtitle="Aylık ödeme"
          color="red"
          icon="credit_card"
        />
        <MetricCard
          title="Ödenecek"
          value={formatCurrency(thisMonthDue)}
          subtitle={`Bu ay ${thisMonthInstallments.length} taksit`}
          color="orange"
          icon="pending_actions"
        />
        <MetricCard
          title="Gelecek Ödeme"
          value={nearestDueDate ? formatDate(nearestDueDate) : "Yok"}
          subtitle={
            nearestDays !== null
              ? nearestDays === 0
                ? "Bugün"
                : `${nearestDays} gün içinde`
              : undefined
          }
          color="blue"
          icon="event"
        />
      </div>

      {/* Upcoming installments */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900">
            Acil Taksitler
          </h2>
        </div>
        <UpcomingInstallments installments={displayInstallments} />
      </section>

      {/* Monthly spending chart */}
      <MonthlySpendingChart data={monthlyData} />

      {/* Savings goal card */}
      <SavingsGoalCard totalCash={totalCash} totalDebt={totalMonthlyDebt} />
    </div>
  );
}
