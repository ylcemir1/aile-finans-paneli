import type { InsertInstallment } from "@/types";

/**
 * Correctly calculate installment dates handling month overflow.
 * e.g., Jan 31 -> Feb 28 -> Mar 31 -> Apr 30
 * If dueDay is specified, it will use that day of the month.
 */
function getInstallmentDate(
  startDate: Date,
  monthOffset: number,
  dueDay?: number | null
): Date {
  const targetDay = dueDay ?? startDate.getDate();
  const result = new Date(
    startDate.getFullYear(),
    startDate.getMonth() + monthOffset,
    1
  );
  const lastDayOfMonth = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0
  ).getDate();
  result.setDate(Math.min(targetDay, lastDayOfMonth));
  return result;
}

function parseDateLocal(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toMonthIndex(date: Date): number {
  return date.getFullYear() * 12 + date.getMonth();
}

interface GenerateInstallmentScheduleParams {
  loanId: string;
  startDate: string;
  endDate: string;
  monthlyPayment: number;
  dueDay?: number | null;
  gracePeriodMonths?: number;
  paidAmount?: number;
}

/**
 * Generate installment schedule for a loan.
 * Supports grace period (odemesiz donem) and due_day.
 * If paidAmount is specified, installments up to that amount are marked as paid.
 */
export function generateInstallmentSchedule(
  params: GenerateInstallmentScheduleParams
): InsertInstallment[] {
  const {
    loanId,
    startDate,
    endDate,
    monthlyPayment,
    dueDay,
    gracePeriodMonths = 0,
    paidAmount = 0,
  } = params;

  const installments: InsertInstallment[] = [];
  const start = parseDateLocal(startDate);
  const end = parseDateLocal(endDate);
  const startMonthIndex = toMonthIndex(start);
  const endMonthIndex = toMonthIndex(end);
  const safeGracePeriod = Math.max(0, gracePeriodMonths);
  let installmentNumber = 1;
  let cumulativePaid = 0;

  // Generate installments month-by-month (inclusive by month)
  // so due_day day-of-month does not drop the last month.
  for (let monthOffset = safeGracePeriod; monthOffset <= 600; monthOffset++) {
    const currentMonthIndex = startMonthIndex + monthOffset;
    if (currentMonthIndex > endMonthIndex) break;

    const dueDateObj = getInstallmentDate(start, monthOffset, dueDay);

    // Determine if this installment should be marked as paid (for partial loans)
    const isPaid = cumulativePaid + monthlyPayment <= paidAmount;
    if (isPaid) {
      cumulativePaid += monthlyPayment;
    }

    installments.push({
      loan_id: loanId,
      due_date: formatDateLocal(dueDateObj),
      amount: monthlyPayment,
      is_paid: isPaid,
      paid_at: isPaid ? new Date().toISOString() : null,
      installment_number: installmentNumber,
    });

    installmentNumber++;
  }

  return installments;
}

interface LoanSummary {
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  paidPercentage: number;
  totalInstallments: number;
  paidInstallments: number;
  remainingInstallments: number;
  nextPaymentDate: string | null;
  nextPaymentAmount: number | null;
}

/**
 * Calculate loan summary from installments data.
 */
export function calculateLoanSummary(
  totalAmount: number,
  installments: Array<{
    amount: number;
    is_paid: boolean;
    due_date: string;
  }>
): LoanSummary {
  const paidInstallments = installments.filter((i) => i.is_paid);
  const unpaidInstallments = installments
    .filter((i) => !i.is_paid)
    .sort(
      (a, b) =>
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    );

  const paidAmount = paidInstallments.reduce((sum, i) => sum + i.amount, 0);
  const remainingBalance = totalAmount - paidAmount;
  const paidPercentage =
    totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  return {
    totalAmount,
    paidAmount,
    remainingBalance: Math.max(0, remainingBalance),
    paidPercentage: Math.min(100, paidPercentage),
    totalInstallments: installments.length,
    paidInstallments: paidInstallments.length,
    remainingInstallments: unpaidInstallments.length,
    nextPaymentDate: unpaidInstallments[0]?.due_date ?? null,
    nextPaymentAmount: unpaidInstallments[0]?.amount ?? null,
  };
}
