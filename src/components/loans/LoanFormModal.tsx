"use client";

import { useState, useTransition } from "react";
import { createLoan, updateLoan } from "@/actions/loans";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { Loan } from "@/types";
import { LOAN_TYPES } from "@/types";

interface LoanFormModalProps {
  profiles: { id: string; full_name: string }[];
  currentUserId: string;
  isAdmin: boolean;
  loan?: Loan | null; // If provided, edit mode
  trigger?: React.ReactNode; // Custom trigger element
  onSuccess?: () => void;
}

export function LoanFormModal({
  profiles,
  currentUserId,
  isAdmin,
  loan,
  trigger,
  onSuccess,
}: LoanFormModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [regenerateInstallments, setRegenerateInstallments] = useState(false);

  const isEdit = !!loan;

  function handleSubmit(formData: FormData) {
    setError(null);

    if (isEdit && regenerateInstallments) {
      formData.set("regenerate_installments", "true");
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateLoan(loan.id, formData)
        : await createLoan(formData);

      if (result.success) {
        setOpen(false);
        setRegenerateInstallments(false);
        onSuccess?.();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Kredi Ekle
        </button>
      )}

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setError(null);
        }}
        title={isEdit ? "Krediyi Duzenle" : "Yeni Kredi"}
      >
        <form action={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Section: Temel Bilgiler */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Temel Bilgiler
            </p>
            <Input
              label="Banka Adi"
              name="bank_name"
              placeholder="Ziraat Bankasi"
              defaultValue={loan?.bank_name}
              required
            />
            <Select
              label="Kredi Turu"
              name="loan_type"
              options={LOAN_TYPES.map((t) => ({
                value: t.value,
                label: t.label,
              }))}
              defaultValue={loan?.loan_type}
              required
            />
          </div>

          {/* Section: Tutar Bilgileri */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tutar Bilgileri
            </p>
            <Input
              label="Toplam Tutar"
              name="total_amount"
              type="number"
              step="0.01"
              placeholder="100000.00"
              defaultValue={loan?.total_amount}
              required
            />
            <Input
              label="Aylik Odeme"
              name="monthly_payment"
              type="number"
              step="0.01"
              placeholder="2500.00"
              defaultValue={loan?.monthly_payment}
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Faiz Orani (%)"
                name="interest_rate"
                type="number"
                step="0.01"
                placeholder="1.89"
                defaultValue={loan?.interest_rate ?? 0}
              />
              <Select
                label="Faiz Tipi"
                name="interest_type"
                options={[
                  { value: "fixed", label: "Sabit" },
                  { value: "variable", label: "Degisken" },
                ]}
                defaultValue={loan?.interest_type ?? "fixed"}
              />
            </div>
          </div>

          {/* Section: Taksit Bilgileri */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Taksit Bilgileri
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Toplam Taksit Sayisi"
                name="installment_count"
                type="number"
                min={1}
                placeholder="12"
              />
              <Input
                label="Odenmis Taksit"
                name="paid_installment_count"
                type="number"
                min={0}
                placeholder="0"
                defaultValue={0}
              />
            </div>
            <p className="text-[10px] text-slate-400">
              Taksit sayisi girilirse sistem o kadar taksit olusturur. Bos birakilirsa tarih araligina gore hesaplanir.
            </p>
          </div>

          {/* Section: Tarih Bilgileri */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tarih Bilgileri
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Baslangic"
                name="start_date"
                type="date"
                defaultValue={loan?.start_date}
                required
              />
              <Input
                label="Bitis"
                name="end_date"
                type="date"
                defaultValue={loan?.end_date}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Kesim Gunu"
                name="statement_day"
                type="number"
                min={1}
                max={31}
                placeholder="15"
                defaultValue={loan?.statement_day ?? undefined}
              />
              <Input
                label="Son Odeme Gunu"
                name="due_day"
                type="number"
                min={1}
                max={31}
                placeholder="25"
                defaultValue={loan?.due_day ?? undefined}
              />
            </div>
          </div>

          {/* Section: Ek Bilgiler */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Ek Bilgiler
            </p>
            <Input
              label="Odemesiz Donem (Ay)"
              name="grace_period_months"
              type="number"
              min={0}
              placeholder="0"
              defaultValue={loan?.grace_period_months ?? 0}
            />
            {isEdit && (
              <Select
                label="Durum"
                name="status"
                options={[
                  { value: "active", label: "Aktif" },
                  { value: "closed", label: "Kapali" },
                  { value: "restructured", label: "Yeniden Yapilandirilmis" },
                ]}
                defaultValue={loan?.status ?? "active"}
              />
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notlar
              </label>
              <textarea
                name="notes"
                rows={2}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="Ek notlar..."
                defaultValue={loan?.notes ?? ""}
              />
            </div>
          </div>

          {isAdmin && !isEdit && (
            <Select
              label="Odeme Sorumlusu"
              name="payer_id"
              options={profiles.map((p) => ({
                value: p.id,
                label: p.full_name,
              }))}
            />
          )}
          {!isAdmin && !isEdit && (
            <input type="hidden" name="payer_id" value={currentUserId} />
          )}

          {/* Regenerate installments checkbox (edit mode only) */}
          {isEdit && (
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={regenerateInstallments}
                onChange={(e) => setRegenerateInstallments(e.target.checked)}
                className="rounded border-slate-300 text-primary focus:ring-primary"
              />
              Taksitleri yeniden olustur
            </label>
          )}

          <Button type="submit" disabled={isPending} className="w-full py-3">
            {isPending
              ? isEdit
                ? "Kaydediliyor..."
                : "Olusturuluyor..."
              : isEdit
              ? "Kaydet"
              : "Kredi Ekle"}
          </Button>
        </form>
      </Modal>
    </>
  );
}
