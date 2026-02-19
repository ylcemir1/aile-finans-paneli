"use client";

import { useState, useTransition } from "react";
import { createBankAccount } from "@/actions/bank-accounts";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

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
          <Input
            label="Banka Adı"
            name="bank_name"
            placeholder="Ziraat Bankası"
            required
          />
          <Input
            label="Hesap Adı"
            name="account_name"
            placeholder="Ana Hesap"
            required
          />
          <Input
            label="Bakiye"
            name="balance"
            type="number"
            step="0.01"
            placeholder="0.00"
            required
          />
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
