"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { deleteBankAccount, updateBankAccount } from "@/actions/bank-accounts";
import { useTransition, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ACCOUNT_TYPES, CURRENCIES } from "@/types";

const accountTypeConfig: Record<string, { icon: string; bg: string; text: string; label: string }> = {
  vadesiz: { icon: "account_balance", bg: "bg-blue-50", text: "text-blue-600", label: "Vadesiz" },
  vadeli: { icon: "savings", bg: "bg-emerald-50", text: "text-emerald-600", label: "Vadeli" },
  doviz: { icon: "currency_exchange", bg: "bg-purple-50", text: "text-purple-600", label: "Doviz" },
  altin: { icon: "diamond", bg: "bg-amber-50", text: "text-amber-600", label: "Altin" },
  yatirim: { icon: "trending_up", bg: "bg-teal-50", text: "text-teal-600", label: "Yatirim" },
};

function maskIban(iban: string): string {
  const clean = iban.replace(/\s/g, "");
  if (clean.length <= 8) return clean;
  return `${clean.slice(0, 4)} **** **** ${clean.slice(-4)}`;
}

interface BankAccountCardProps {
  account: {
    id: string;
    bank_name: string;
    account_name: string;
    balance: number;
    owner: { full_name: string } | null;
    iban?: string;
    account_type?: string;
    currency?: string;
    account_number?: string;
  };
  isAdmin: boolean;
}

export function BankAccountCard({ account, isAdmin }: BankAccountCardProps) {
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState("");
  const [ibanCopied, setIbanCopied] = useState(false);

  const isNegative = account.balance < 0;
  const currency = account.currency ?? "TRY";
  const accountType = account.account_type ?? "vadesiz";
  const iconConfig = accountTypeConfig[accountType] ?? accountTypeConfig.vadesiz;

  function handleDelete() {
    if (!confirm("Bu hesabi silmek istediginize emin misiniz?")) return;
    startTransition(async () => {
      await deleteBankAccount(account.id);
    });
  }

  function handleEdit(formData: FormData) {
    setEditError("");
    startTransition(async () => {
      const result = await updateBankAccount(account.id, formData);
      if (result.success) {
        setEditOpen(false);
      } else {
        setEditError(result.error);
      }
    });
  }

  async function copyIban() {
    if (!account.iban) return;
    try {
      await navigator.clipboard.writeText(account.iban);
      setIbanCopied(true);
      setTimeout(() => setIbanCopied(false), 2000);
    } catch {
      /* clipboard API not available */
    }
  }

  return (
    <>
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-md shadow-black/[0.03] space-y-3">
        {/* Top row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`size-11 rounded-lg ${iconConfig.bg} flex items-center justify-center`}
            >
              <span className={`material-symbols-outlined ${iconConfig.text}`}>
                {iconConfig.icon}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900">
                  {account.bank_name}
                </p>
                <span
                  className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${iconConfig.bg} ${iconConfig.text}`}
                >
                  {iconConfig.label}
                </span>
                {currency !== "TRY" && (
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600">
                    {currency}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">{account.account_name}</p>
              {isAdmin && account.owner && (
                <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[12px]">
                    person
                  </span>
                  {account.owner.full_name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right mr-1">
              <p
                className={`text-base font-bold ${isNegative ? "text-red-500" : "text-slate-900"}`}
              >
                {formatCurrency(account.balance, currency)}
              </p>
            </div>
            <button
              onClick={() => setEditOpen(true)}
              className="size-8 rounded-full flex items-center justify-center hover:bg-blue-50 transition-colors text-slate-400 hover:text-primary"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="size-8 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors text-slate-400 hover:text-red-500"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
            </button>
          </div>
        </div>

        {/* IBAN row */}
        {account.iban && account.iban.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
            <span className="material-symbols-outlined text-slate-400 text-sm">
              badge
            </span>
            <span className="text-xs font-mono text-slate-600 flex-1">
              {maskIban(account.iban)}
            </span>
            <button
              onClick={copyIban}
              className="text-xs text-primary font-medium hover:text-primary/80 transition-colors flex items-center gap-0.5"
            >
              <span className="material-symbols-outlined text-sm">
                {ibanCopied ? "check" : "content_copy"}
              </span>
              {ibanCopied ? "Kopyalandi" : "Kopyala"}
            </button>
          </div>
        )}
      </div>

      {/* Edit modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Hesabi Duzenle"
      >
        <form action={handleEdit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {editError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {editError}
            </p>
          )}

          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Temel Bilgiler
            </p>
            <Input
              label="Banka Adi"
              name="bank_name"
              defaultValue={account.bank_name}
              required
            />
            <Input
              label="Hesap Adi"
              name="account_name"
              defaultValue={account.account_name}
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
                defaultValue={accountType}
              />
              <Select
                label="Para Birimi"
                name="currency"
                options={CURRENCIES.map((c) => ({
                  value: c.value,
                  label: `${c.symbol} ${c.label}`,
                }))}
                defaultValue={currency}
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Bakiye Bilgisi
            </p>
            <Input
              label="Bakiye"
              name="balance"
              type="number"
              step="0.01"
              defaultValue={account.balance}
              required
            />
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Hesap Detaylari
            </p>
            <Input
              label="IBAN"
              name="iban"
              defaultValue={account.iban ?? ""}
              placeholder="TR00 0000 0000 0000 0000 0000 00"
            />
            <Input
              label="Hesap Numarasi"
              name="account_number"
              defaultValue={account.account_number ?? ""}
              placeholder="1234567890"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Iptal
            </button>
            <Button type="submit" disabled={isPending} className="flex-1 py-2.5">
              {isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
