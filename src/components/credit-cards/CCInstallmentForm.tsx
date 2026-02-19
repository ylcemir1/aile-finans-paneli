"use client";

import { useState, useTransition } from "react";
import { addCreditCardInstallment } from "@/actions/credit-cards";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils/currency";

interface CCInstallmentFormProps {
  cardId: string;
  trigger?: React.ReactNode; // Custom trigger element
  onSuccess?: () => void;
}

export function CCInstallmentForm({
  cardId,
  trigger,
  onSuccess,
}: CCInstallmentFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // For live calculation
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [installmentCount, setInstallmentCount] = useState<number>(2);

  const calculatedInstallment =
    installmentCount > 0 && totalAmount > 0
      ? Math.round((totalAmount / installmentCount) * 100) / 100
      : 0;

  function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      const result = await addCreditCardInstallment(cardId, formData);

      if (result.success) {
        setOpen(false);
        setTotalAmount(0);
        setInstallmentCount(2);
        onSuccess?.();
      } else {
        setError(result.error);
      }
    });
  }

  function handleOpen() {
    setOpen(true);
    setTotalAmount(0);
    setInstallmentCount(2);
    setError(null);
  }

  return (
    <>
      {trigger ? (
        <div onClick={handleOpen}>{trigger}</div>
      ) : (
        <button
          onClick={handleOpen}
          className="text-primary text-sm font-semibold"
        >
          + Taksit Ekle
        </button>
      )}

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setError(null);
        }}
        title="Taksitli Alisveris Ekle"
      >
        <form action={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Section: Alisveris Bilgileri */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Alisveris Bilgileri
            </p>
            <Input
              label="Magaza / Isyeri"
              name="merchant_name"
              placeholder="Teknosa, Trendyol, vb."
              required
            />
            <Input
              label="Aciklama"
              name="description"
              placeholder="Urun veya hizmet aciklamasi"
            />
          </div>

          {/* Section: Taksit Bilgileri */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Taksit Bilgileri
            </p>
            <Input
              label="Toplam Tutar"
              name="total_amount"
              type="number"
              step="0.01"
              min={0}
              placeholder="5000.00"
              required
              onChange={(e) =>
                setTotalAmount(parseFloat(e.target.value) || 0)
              }
            />
            <Input
              label="Taksit Sayisi"
              name="installment_count"
              type="number"
              min={2}
              max={48}
              placeholder="12"
              required
              onChange={(e) =>
                setInstallmentCount(parseInt(e.target.value) || 2)
              }
            />

            {/* Calculated installment preview */}
            {calculatedInstallment > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">
                      calculate
                    </span>
                    <span className="text-sm text-slate-600">Aylik Taksit:</span>
                  </div>
                  <span className="text-sm font-bold text-primary">
                    {formatCurrency(calculatedInstallment)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {installmentCount} taksit x {formatCurrency(calculatedInstallment)} = {formatCurrency(totalAmount)}
                </p>
              </div>
            )}

            <Input
              label="Baslangic Tarihi"
              name="start_date"
              type="date"
              required
            />
          </div>

          <Button type="submit" disabled={isPending} className="w-full py-3">
            {isPending ? "Ekleniyor..." : "Taksit Ekle"}
          </Button>
        </form>
      </Modal>
    </>
  );
}
