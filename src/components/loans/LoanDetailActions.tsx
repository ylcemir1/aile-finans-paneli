"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { closeLoan, deleteLoan } from "@/actions/loans";
import { LoanFormModal } from "./LoanFormModal";
import type { Loan } from "@/types";

interface LoanDetailActionsProps {
  loan: Loan;
  profiles: { id: string; full_name: string }[];
  currentUserId: string;
  isAdmin: boolean;
}

export function LoanDetailActions({
  loan,
  profiles,
  currentUserId,
  isAdmin,
}: LoanDetailActionsProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState<"close" | "delete" | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClose() {
    startTransition(async () => {
      const result = await closeLoan(loan.id);
      if (result.success) {
        setShowConfirm(null);
        router.refresh();
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteLoan(loan.id);
      if (result.success) {
        router.push("/loans");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <LoanFormModal
        profiles={profiles}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        defaultScope={loan.family_id ? "family" : "personal"}
        loan={loan}
        trigger={
          <button className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors">
            <span className="material-symbols-outlined text-xl">edit</span>
          </button>
        }
      />

      {loan.status !== "closed" && (
        <>
          {showConfirm === "close" ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleClose}
                disabled={isPending}
                className="text-xs px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {isPending ? "..." : "Evet, Kapat"}
              </button>
              <button
                onClick={() => setShowConfirm(null)}
                className="text-xs px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Iptal
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm("close")}
              className="size-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 hover:bg-green-100 transition-colors"
              title="Krediyi Kapat"
            >
              <span className="material-symbols-outlined text-xl">
                check_circle
              </span>
            </button>
          )}
        </>
      )}

      {showConfirm === "delete" ? (
        <div className="flex items-center gap-1">
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-xs px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {isPending ? "..." : "Evet, Sil"}
          </button>
          <button
            onClick={() => setShowConfirm(null)}
            className="text-xs px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Iptal
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowConfirm("delete")}
          className="size-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
          title="Krediyi Sil"
        >
          <span className="material-symbols-outlined text-xl">delete</span>
        </button>
      )}
    </div>
  );
}
