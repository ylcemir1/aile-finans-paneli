"use client";

import { useState, useTransition } from "react";
import { createLoan } from "@/actions/loans";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface LoanFormProps {
  profiles: { id: string; full_name: string }[];
  currentUserId: string;
  isAdmin: boolean;
}

export function LoanForm({ profiles, currentUserId, isAdmin }: LoanFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createLoan(formData);
      if (result.success) {
        setOpen(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-primary text-sm font-semibold"
      >
        + Kredi Ekle
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Yeni Kredi">
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          <Input
            label="Banka Adı"
            name="bank_name"
            placeholder="Ziraat Bankası"
            required
          />
          <Select
            label="Kredi Türü"
            name="loan_type"
            options={[
              { value: "Konut Kredisi", label: "Konut Kredisi" },
              { value: "Taşıt Kredisi", label: "Taşıt Kredisi" },
              { value: "İhtiyaç Kredisi", label: "İhtiyaç Kredisi" },
            ]}
            required
          />
          <Input
            label="Toplam Tutar"
            name="total_amount"
            type="number"
            step="0.01"
            placeholder="100000.00"
            required
          />
          <Input
            label="Aylık Ödeme"
            name="monthly_payment"
            type="number"
            step="0.01"
            placeholder="2500.00"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Başlangıç"
              name="start_date"
              type="date"
              required
            />
            <Input label="Bitiş" name="end_date" type="date" required />
          </div>
          {isAdmin && (
            <Select
              label="Ödeme Sorumlusu"
              name="payer_id"
              options={profiles.map((p) => ({
                value: p.id,
                label: p.full_name,
              }))}
            />
          )}
          {!isAdmin && (
            <input type="hidden" name="payer_id" value={currentUserId} />
          )}
          <Button type="submit" disabled={isPending} className="w-full py-3">
            {isPending ? "Oluşturuluyor..." : "Kredi Ekle"}
          </Button>
        </form>
      </Modal>
    </>
  );
}
