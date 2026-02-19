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

export function InstallmentCalendar({ installments }: InstallmentCalendarProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const installmentMap = new Map<string, CalendarInstallment[]>();
  for (const inst of installments) {
    const dateKey = inst.due_date;
    if (!installmentMap.has(dateKey)) installmentMap.set(dateKey, []);
    installmentMap.get(dateKey)!.push(inst);
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
      <div className="bg-white rounded-xl border border-slate-100 shadow-md shadow-black/[0.03] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
          <button
            onClick={goToPrevMonth}
            className="size-8 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-600 text-lg">chevron_left</span>
          </button>
          <div className="text-center">
            <button
              onClick={goToToday}
              className="text-sm font-bold text-slate-900 hover:text-primary transition-colors"
            >
              {MONTH_NAMES[currentMonth]} {currentYear}
            </button>
          </div>
          <button
            onClick={goToNextMonth}
            className="size-8 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-600 text-lg">chevron_right</span>
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAY_NAMES.map((name) => (
            <div key={name} className="py-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {name}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="aspect-square border-b border-r border-slate-50" />;
            }

            const dateStr = toDateStr(currentYear, currentMonth, day);
            const dayInstallments = installmentMap.get(dateStr) ?? [];
            const isToday = dateStr === todayStr;
            const hasUnpaid = dayInstallments.some((i) => !i.is_paid);
            const hasOverdue = dayInstallments.some(
              (i) => !i.is_paid && new Date(i.due_date) < today
            );
            const allPaid = dayInstallments.length > 0 && dayInstallments.every((i) => i.is_paid);
            const hasInstallments = dayInstallments.length > 0;

            return (
              <button
                key={day}
                onClick={() => hasInstallments ? setSelectedDay(dateStr) : undefined}
                className={cn(
                  "aspect-square border-b border-r border-slate-50 flex flex-col items-center justify-center gap-0.5 relative transition-colors",
                  hasInstallments && "cursor-pointer hover:bg-slate-50",
                  !hasInstallments && "cursor-default",
                  isToday && "bg-primary/5"
                )}
              >
                <span
                  className={cn(
                    "text-xs font-semibold leading-none",
                    isToday && "text-primary font-bold",
                    !isToday && hasInstallments ? "text-slate-900" : "text-slate-400"
                  )}
                >
                  {day}
                </span>
                {hasInstallments && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayInstallments.slice(0, 3).map((inst, i) => (
                      <div
                        key={i}
                        className={cn(
                          "size-1.5 rounded-full",
                          inst.is_paid
                            ? "bg-green-400"
                            : hasOverdue
                            ? "bg-red-400"
                            : "bg-blue-400"
                        )}
                      />
                    ))}
                    {dayInstallments.length > 3 && (
                      <span className="text-[8px] text-slate-400 leading-none">+{dayInstallments.length - 3}</span>
                    )}
                  </div>
                )}
                {isToday && (
                  <div className="absolute bottom-0.5 w-4 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Month summary */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-blue-400" />
            <span className="text-slate-600 font-medium">Odenmemis: <strong className="text-slate-900">{formatCurrency(monthTotal)}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-green-400" />
            <span className="text-slate-600 font-medium">Odenmis: <strong className="text-green-700">{formatCurrency(monthPaidTotal)}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-red-400" />
            <span className="text-slate-600 font-medium">Geciken</span>
          </div>
          <span className="ml-auto text-slate-400">
            {monthInstallments.length} taksit
          </span>
        </div>
      </div>

      {/* Day detail modal */}
      <Modal
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(selectedDay)) : ""}
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {selectedInstallments.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Bu gun taksit yok</p>
          ) : (
            selectedInstallments.map((inst) => {
              const isPastDue = !inst.is_paid && new Date(inst.due_date) < today;
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
                        inst.is_paid ? "bg-green-100" : isPastDue ? "bg-red-100" : "bg-blue-100"
                      )}
                    >
                      <span
                        className={cn(
                          "material-symbols-outlined text-lg",
                          inst.is_paid ? "text-green-600" : isPastDue ? "text-red-600" : "text-blue-600"
                        )}
                      >
                        {inst.is_paid ? "check_circle" : isPastDue ? "warning" : "schedule"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {inst.loan?.bank_name ?? "Bilinmiyor"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {LOAN_TYPE_LABELS[inst.loan?.loan_type ?? ""] ?? inst.loan?.loan_type} - Taksit #{inst.installment_number}
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
                        inst.is_paid ? "text-green-600" : isPastDue ? "text-red-600" : "text-blue-600"
                      )}
                    >
                      {inst.is_paid ? "Odendi" : isPastDue ? "Gecikti" : "Bekliyor"}
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
                {formatCurrency(selectedInstallments.reduce((s, i) => s + Number(i.amount), 0))}
              </span>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}