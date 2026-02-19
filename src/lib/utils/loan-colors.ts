export const LOAN_COLORS = [
  { dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-400" },
  { dot: "bg-violet-500", bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-400" },
  { dot: "bg-orange-500", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-400" },
  { dot: "bg-teal-500", bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-400" },
  { dot: "bg-rose-500", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-400" },
  { dot: "bg-amber-600", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-400" },
  { dot: "bg-indigo-500", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-400" },
  { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-400" },
  { dot: "bg-cyan-500", bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-400" },
  { dot: "bg-pink-500", bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-400" },
] as const;

export type LoanColor = (typeof LOAN_COLORS)[number];

export function buildLoanColorMap(
  installments: { loan_id: string }[]
): Record<string, LoanColor> {
  const uniqueLoanIds = [...new Set(installments.map((i) => i.loan_id))];
  const map: Record<string, LoanColor> = {};
  uniqueLoanIds.forEach((id, idx) => {
    map[id] = LOAN_COLORS[idx % LOAN_COLORS.length];
  });
  return map;
}
