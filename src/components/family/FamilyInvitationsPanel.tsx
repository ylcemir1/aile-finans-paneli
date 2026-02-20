"use client";

import { useTransition } from "react";
import { cancelInvitation } from "@/actions/family";
import { InviteMemberForm } from "./InviteMemberForm";

interface FamilyInvitationsPanelProps {
  invitations: {
    id: string;
    invited_email: string;
    status: "pending" | "accepted" | "rejected" | "canceled" | "expired";
    created_at: string;
    expires_at: string | null;
  }[];
  canManageInvitations: boolean;
}

export function FamilyInvitationsPanel({
  invitations,
  canManageInvitations,
}: FamilyInvitationsPanelProps) {
  const [isPending, startTransition] = useTransition();

  const pending = invitations.filter((i) => i.status === "pending");
  const history = invitations
    .filter((i) => i.status !== "pending")
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 10);

  function handleCancel(invitationId: string) {
    startTransition(async () => {
      await cancelInvitation(invitationId);
    });
  }

  return (
    <div className="space-y-4">
      {canManageInvitations && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Yeni Davet
          </h3>
          <InviteMemberForm />
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Bekleyen Davetler
        </h3>
        {pending.length === 0 ? (
          <p className="text-sm text-slate-500">Bekleyen davet bulunmuyor.</p>
        ) : (
          pending.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 p-2.5"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">{inv.invited_email}</p>
                <p className="text-xs text-slate-500">
                  Son tarih:{" "}
                  {inv.expires_at
                    ? new Date(inv.expires_at).toLocaleDateString("tr-TR")
                    : "-"}
                </p>
              </div>
              {canManageInvitations && (
                <button
                  disabled={isPending}
                  onClick={() => handleCancel(inv.id)}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Iptal Et
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Davet Gecmisi
        </h3>
        {history.length === 0 ? (
          <p className="text-sm text-slate-500">Davet gecmisi bulunmuyor.</p>
        ) : (
          history.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5"
            >
              <span className="text-sm text-slate-700">{inv.invited_email}</span>
              <span className="text-xs uppercase font-semibold text-slate-500">
                {inv.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
