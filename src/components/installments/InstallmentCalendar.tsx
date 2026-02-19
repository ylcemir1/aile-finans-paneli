"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import { Modal } from "@/components/ui/Modal";

interface CalendarInstallment {
  id: string;
  due_date: string;
  amount: number;
  is_paid: boolean;
  installment_number: number;
  loan_id: string;
  loan?: {
    id: string;
    bank_name: string;
    loan_type: string;
  } | null;
}

interface InstallmentCalendarProps {
  installments: CalendarInstallment[];
}

const DAY_NAMES = ["Pzt", "Sal", "Car", "Per", "Cum", "Cmt", "Paz"];
const MONTH_NAMES = [
  "Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran",
  "Temmuz", "Agustos", "Eylul", "Ekim", "Kasim", "Aralik",
];

const LOAN_TYPE_LABELS: Record<string, string> = {
  konut: "Konut",
  tasit: "Tasit",
  ihtiyac: "Ihtiyac",
  kobi: "KOBi",
  esnaf: "Esnaf",
  tarim: "Tarim",
  egitim: "Egitim",
  diger: "Diger",
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function shortAmount(n: number): string {
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return String(Math.round(n));
}

export function InstallmentCalendar({ installments }: InstallmentCalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const installmentMap = new Map<string, CalendarInstallment[]>();
  for (const inst of installments) {
    if (!installmentMap.has(inst.due_date)) installmentMap.set(inst.due_date, []);
    installmentMap.get(inst.due_date)!.push(inst);
  }

  function goToPrevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  function goToToday() {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  }

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const monthInstallments = installments.filter((inst) => {
    const d = new Date(inst.due_date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const monthTotal = monthInstallments
    .filter((i) => !i.is_paid)
    .reduce((s, i) => s + Number(i.amount), 0);

  const monthPaidTotal = monthInstallments
    .filter((i) => i.is_paid)
    .reduce((s, i) => s + Number(i.amount), 0);

  const selectedInstallments = selectedDay
    ? installmentMap.get(selectedDay) ?? []
    : [];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-100 shadow-md shadow-black/[0.03] overflow-hidden max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
          <button
            onClick={goToPrevMonth}
            className="size-9 rounded-lg flex items-center justify-center hover:bg-slate-200 active:bg-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-600">chevron_left</span>
          </button>
          <button
            onClick={goToToday}
            className="text-sm font-bold text-slate-900 hover:text-primary transition-colors px-3 py-1 rounded-lg hover:bg-white"
          >
            {MONTH_NAMES[currentMonth]} {currentYear}
          </button>
          <button
            onClick={goToNextMonth}
            className="size-9 rounded-lg flex items-center justify-center hover:bg-slate-200 active:bg-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-600">chevron_right</span>
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7">
          {DAY_NAMES.map((name) => (
            <div key={name} className="py-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {name}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-slate-100">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="bg-white h-12 sm:h-14" />;
            }

            const dateStr = toDateStr(currentYear, currentMonth, day);
            const dayInsts = installmentMap.get(dateStr) ?? [];
            const isToday = dateStr === todayStr;
            const hasOverdue = dayInsts.some((i) => !i.is_paid && new Date(i.due_date) < today);
            const allPaid = dayInsts.length > 0 && dayInsts.every((i) => i.is_paid);
            const hasUnpaid = dayInsts.some((i) => !i.is_paid) && !hasOverdue;
            const hasInst = dayInsts.length > 0;
            const dayTotal = dayInsts.reduce((s, i) => s + Number(i.amount), 0);

            return (
              <button
                key={day}
                onClick={() => hasInst ? setSelectedDay(dateStr) : undefined}
                className={cn(
                  "bg-white h-12 sm:h-14 flex flex-col items-center justify-center relative transition-all",
                  hasInst && "cursor-pointer",
                  !hasInst && "cursor-default",
                  hasOverdue && "bg-red-50 hover:bg-red-100",
                  hasUnpaid && "bg-blue-50 hover:bg-blue-100",
                  allPaid && "bg-green-50 hover:bg-green-100",
                  !hasInst && !isToday && "hover:bg-slate-50"
                )}
              >
                <span
                  className={cn(
                    "text-[13px] font-semibold leading-none",
                    isToday && !hasInst && "text-primary font-extrabold",
                    hasOverdue && "text-red-700 font-bold",
                    hasUnpaid && "text-blue-700 font-bold",
                    allPaid && "text-green-700 font-bold",
                    !hasInst && !isToday && "text-slate-500"
                  )}
                >
                  {day}
                </span>
                {hasInst && (
                  <span
                    className={cn(
                      "text-[8px] sm:text-[9px] font-bold leading-none mt-0.5",
                      hasOverdue && "text-red-500",
                      hasUnpaid && "text-blue-500",
                      allPaid && "text-green-500"
                    )}
                  >
                    {shortAmount(dayTotal)}
                  </span>
                )}
                {isToday && (
                  <div className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Month summary */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded bg-blue-100 border border-blue-200" />
              <span className="text-slate-600">Bekleyen: <strong className="text-slate-900">{formatCurrency(monthTotal)}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded bg-green-100 border border-green-200" />
              <span className="text-slate-600">Odenen: <strong className="text-green-700">{formatCurrency(monthPaidTotal)}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded bg-red-100 border border-red-200" />
              <span className="text-slate-600">Geciken</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">
            Bu ay toplam {monthInstallments.length} taksit
          </p>
        </div>
      </div>

      {/* Day detail modal */}
      <Modal
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={
          selectedDay
            ? new Intl.DateTimeFormat("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(new Date(selectedDay))
            : ""
        }
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {selectedInstallments.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              Bu gun taksit yok
            </p>
          ) : (
            selectedInstallments.map((inst) => {
              const isPastDue =
                !inst.is_paid && new Date(inst.due_date) < today;
              return (
                <div
                  key={inst.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    inst.is_paid
                      ? "bg-green-50 border-green-100"
                      : isPastDue
                      ? "bg-red-50 border-red-100"
                      : "bg-blue-50 border-blue-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "size-9 rounded-lg flex items-center justify-center",
                        inst.is_paid
                          ? "bg-green-100"
                          : isPastDue
                          ? "bg-red-100"
                          : "bg-blue-100"
                      )}
                    >
                      <span
                        className={cn(
                          "material-symbols-outlined text-lg",
                          inst.is_paid
                            ? "text-green-600"
                            : isPastDue
                            ? "text-red-600"
                            : "text-blue-600"
                        )}
                      >
                        {inst.is_paid
                          ? "check_circle"
                          : isPastDue
                          ? "warning"
                          : "schedule"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {inst.loan?.bank_name ?? "Bilinmiyor"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {LOAN_TYPE_LABELS[inst.loan?.loan_type ?? ""] ??
                          inst.loan?.loan_type}{" "}
                        - Taksit #{inst.installment_number}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {formatCurrency(inst.amount)}
                    </p>
                    <p
                      className={cn(
                        "text-[10px] font-semibold uppercase",
                        inst.is_paid
                          ? "text-green-600"
                          : isPastDue
                          ? "text-red-600"
                          : "text-blue-600"
                      )}
                    >
                      {inst.is_paid
                        ? "Odendi"
                        : isPastDue
                        ? "Gecikti"
                        : "Bekliyor"}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          {selectedInstallments.length > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500">Toplam</span>
              <span className="text-sm font-bold text-slate-900">
                {formatCurrency(
                  selectedInstallments.reduce(
                    (s, i) => s + Number(i.amount),
                    0
                  )
                )}
              </span>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}