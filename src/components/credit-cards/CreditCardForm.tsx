"use client";

import { useState, useTransition } from "react";
import { createCreditCard, updateCreditCard } from "@/actions/credit-cards";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { CreditCard } from "@/types";

interface CreditCardFormProps {
  card?: CreditCard | null; // If provided, edit mode
  trigger?: React.ReactNode; // Custom trigger element
  onSuccess?: () => void;
}

export function CreditCardForm({
  card,
  trigger,
  onSuccess,
}: CreditCardFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!card;

  function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      const result = isEdit
        ? await updateCreditCard(card.id, formData)
        : await createCreditCard(formData);

      if (result.success) {
        setOpen(false);
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
          className="text-primary text-sm font-semibold"
        >
          + Kart Ekle
        </button>
      )}

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setError(null);
        }}
        title={isEdit ? "Karti Duzenle" : "Yeni Kredi Karti"}
      >
        <form action={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Section: Kart Bilgileri */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Kart Bilgileri
            </p>
            <Input
              label="Kart Adi"
              name="card_name"
              placeholder="Bonus, Maximum, vb."
              defaultValue={card?.card_name}
              required
            />
            <Input
              label="Banka Adi"
              name="bank_name"
              placeholder="Garanti Bankasi"
              defaultValue={card?.bank_name}
              required
            />
          </div>

          {/* Section: Tutar Bilgileri */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tutar Bilgileri
            </p>
            <Input
              label="Kart Limiti"
              name="card_limit"
              type="number"
              step="0.01"
              placeholder="50000.00"
              defaultValue={card?.card_limit}
              required
            />
            <Input
              label="Guncel Borc"
              name="current_balance"
              type="number"
              step="0.01"
              placeholder="0.00"
              defaultValue={card?.current_balance ?? 0}
            />
            <Input
              label="Asgari Odeme"
              name="minimum_payment"
              type="number"
              step="0.01"
              placeholder="0.00"
              defaultValue={card?.minimum_payment ?? 0}
            />
          </div>

          {/* Section: Tarih Bilgileri */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tarih Bilgileri
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Hesap Kesim Gunu"
                name="statement_day"
                type="number"
                min={1}
                max={31}
                placeholder="15"
                defaultValue={card?.statement_day}
                required
              />
              <Input
                label="Son Odeme Gunu"
                name="due_day"
                type="number"
                min={1}
                max={31}
                placeholder="25"
                defaultValue={card?.due_day}
                required
              />
            </div>
          </div>

          {/* Section: Ek Bilgiler */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Ek Bilgiler
            </p>
            {isEdit && (
              <Select
                label="Durum"
                name="status"
                options={[
                  { value: "active", label: "Aktif" },
                  { value: "blocked", label: "Blokeli" },
                  { value: "closed", label: "Kapali" },
                ]}
                defaultValue={card?.status ?? "active"}
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
                defaultValue={card?.notes ?? ""}
              />
            </div>
          </div>

          <Button type="submit" disabled={isPending} className="w-full py-3">
            {isPending
              ? isEdit
                ? "Kaydediliyor..."
                : "Olusturuluyor..."
              : isEdit
              ? "Kaydet"
              : "Kart Ekle"}
          </Button>
        </form>
      </Modal>
    </>
  );
}
