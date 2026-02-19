"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { deleteBankAccount, updateBankAccount } from "@/actions/bank-accounts";
import { useTransition, useState } from "react";
import { Modal } from "@/components/ui/Modal";

const bankIcons: Record<string, { icon: string; bg: string; text: string }> = {
  default: { icon: "account_balance", bg: "bg-blue-50", text: "text-blue-600" },
};

interface BankAccountCardProps {
  account: {
    id: string;
    bank_name: string;
    account_name: string;
    balance: number;
    owner: { full_name: string } | null;
  };
  isAdmin: boolean;
}

export function BankAccountCard({ account, isAdmin }: BankAccountCardProps) {
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState("");
  const isNegative = account.balance < 0;
  const iconConfig = bankIcons.default;

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

  return (
    <>
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-md shadow-black/[0.03] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`size-12 rounded-lg ${iconConfig.bg} flex items-center justify-center`}
          >
            <span
              className={`material-symbols-outlined ${iconConfig.text}`}
            >
              {iconConfig.icon}
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">
              {account.bank_name}
            </p>
            <p className="text-xs text-slate-500">{account.account_name}</p>
            {isAdmin && account.owner && (
              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[12px]">person</span>
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
              {formatCurrency(account.balance)}
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

      {/* Edit modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Hesabi Duzenle"
      >
        <form action={handleEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Banka Adi
            </label>
            <input
              type="text"
              name="bank_name"
              defaultValue={account.bank_name}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Hesap Adi
            </label>
            <input
              type="text"
              name="account_name"
              defaultValue={account.account_name}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Bakiye
            </label>
            <input
              type="number"
              name="balance"
              step="0.01"
              defaultValue={account.balance}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {editError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {editError}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Iptal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isPending ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
