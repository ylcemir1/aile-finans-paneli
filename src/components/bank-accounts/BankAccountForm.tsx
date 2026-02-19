"use client";

import { useState, useTransition } from "react";
import { createBankAccount } from "@/actions/bank-accounts";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ACCOUNT_TYPES, CURRENCIES } from "@/types";

interface BankAccountFormProps {
  profiles: { id: string; full_name: string }[];
  currentUserId: string;
  isAdmin: boolean;
}

export function BankAccountForm({
  profiles,
  currentUserId,
  isAdmin,
}: BankAccountFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createBankAccount(formData);
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
        className="size-10 rounded-lg bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20"
      >
        <span className="material-symbols-outlined">add</span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Hesap Ekle">
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Temel Bilgiler */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Temel Bilgiler
            </p>
            <Input
              label="Banka Adi"
              name="bank_name"
              placeholder="Ziraat Bankasi"
              required
            />
            <Input
              label="Hesap Adi"
              name="account_name"
              placeholder="Ana Hesap"
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Hesap Turu"
                name="account_type"
                options={ACCOUNT_TYPES.map((t) => ({
                  value: t.value,
                  label: t.label,
                }))}
                defaultValue="vadesiz"
              />
              <Select
                label="Para Birimi"
                name="currency"
                options={CURRENCIES.map((c) => ({
                  value: c.value,
                  label: `${c.symbol} ${c.label}`,
                }))}
                defaultValue="TRY"
              />
            </div>
          </div>

          {/* Bakiye */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Bakiye Bilgisi
            </p>
            <Input
              label="Bakiye"
              name="balance"
              type="number"
              step="0.01"
              placeholder="0.00"
              required
            />
          </div>

          {/* Hesap Detaylari */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Hesap Detaylari
            </p>
            <Input
              label="IBAN"
              name="iban"
              placeholder="TR00 0000 0000 0000 0000 0000 00"
            />
            <Input
              label="Hesap Numarasi"
              name="account_number"
              placeholder="1234567890"
            />
          </div>

          {isAdmin && (
            <Select
              label="Hesap Sahibi"
              name="owner_id"
              options={profiles.map((p) => ({
                value: p.id,
                label: p.full_name,
              }))}
            />
          )}
          {!isAdmin && (
            <input type="hidden" name="owner_id" value={currentUserId} />
          )}
          <Button type="submit" disabled={isPending} className="w-full py-3">
            {isPending ? "Ekleniyor..." : "Hesap Ekle"}
          </Button>
        </form>
      </Modal>
    </>
  );
}
