"use client";

import { useTransition } from "react";
import { acceptInvitation, rejectInvitation } from "@/actions/family";

interface Invitation {
  id: string;
  family_id: string;
  family_name: string;
  invited_by_name: string;
  created_at: string;
  expires_at: string | null;
}

interface PendingInvitationsProps {
  invitations: Invitation[];
}

export function PendingInvitations({ invitations }: PendingInvitationsProps) {
  const [isPending, startTransition] = useTransition();

  if (invitations.length === 0) return null;

  function handleAccept(id: string) {
    startTransition(async () => {
      await acceptInvitation(id);
    });
  }

  function handleReject(id: string) {
    startTransition(async () => {
      await rejectInvitation(id);
    });
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-amber-600 text-lg">
          mail
        </span>
        <h3 className="text-sm font-bold text-amber-800">
          Bekleyen Davetler ({invitations.length})
        </h3>
      </div>
      {invitations.map((inv) => (
        <div
          key={inv.id}
          className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-100"
        >
          <div>
            <p className="text-sm font-bold text-slate-900">
              {inv.family_name}
            </p>
            <p className="text-xs text-slate-500">
              {inv.invited_by_name} tarafindan davet edildiniz
            </p>
            <p className="text-[11px] text-amber-700">
              Son tarih:{" "}
              {inv.expires_at
                ? new Date(inv.expires_at).toLocaleDateString("tr-TR")
                : "-"}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => handleReject(inv.id)}
              disabled={isPending}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Reddet
            </button>
            <button
              onClick={() => handleAccept(inv.id)}
              disabled={isPending}
              className="px-3 py-1.5 text-xs font-bold text-white bg-primary rounded-lg shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Kabul Et
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
