"use client";

import { useState, useTransition } from "react";
import { leaveFamily } from "@/actions/family";

interface FamilyLeaveButtonProps {
  myRole: "admin" | "member";
}

export function FamilyLeaveButton({ myRole }: FamilyLeaveButtonProps) {
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleLeave() {
    setError("");
    startTransition(async () => {
      const res = await leaveFamily();
      if (!res.success) {
        setError(res.error);
        setConfirm(false);
      }
    });
  }

  if (!confirm) {
    return (
      <div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-2">
            {error}
          </p>
        )}
        <button
          onClick={() => setConfirm(true)}
          className="text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
        >
          {myRole === "admin" ? "Aileyi Sil" : "Aileden Ayril"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <p className="text-xs text-red-600 font-medium">
        {myRole === "admin"
          ? "Aile silinecek ve tum uyeler cikarilacak. Emin misiniz?"
          : "Aileden ayrilacaksiniz. Emin misiniz?"}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => setConfirm(false)}
          className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Vazgec
        </button>
        <button
          onClick={handleLeave}
          disabled={isPending}
          className="px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {isPending
            ? "Isleniyor..."
            : myRole === "admin"
            ? "Evet, Sil"
            : "Evet, Ayril"}
        </button>
      </div>
    </div>
  );
}
