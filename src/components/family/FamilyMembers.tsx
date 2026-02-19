"use client";

import { useTransition } from "react";
import { removeMember } from "@/actions/family";

interface Member {
  id: string;
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
  full_name: string;
}

interface FamilyMembersProps {
  members: Member[];
  myRole: "admin" | "member";
  currentUserId: string;
}

export function FamilyMembers({
  members,
  myRole,
  currentUserId,
}: FamilyMembersProps) {
  const [isPending, startTransition] = useTransition();

  function handleRemove(userId: string) {
    startTransition(async () => {
      await removeMember(userId);
    });
  }

  return (
    <div className="space-y-2">
      {members.map((m) => (
        <div
          key={m.id}
          className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100"
        >
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-base">
                {m.role === "admin" ? "admin_panel_settings" : "person"}
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                {m.full_name || "Isimsiz"}
                {m.user_id === currentUserId && (
                  <span className="text-xs text-slate-400 font-normal ml-1.5">
                    (Siz)
                  </span>
                )}
              </p>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  m.role === "admin" ? "text-primary" : "text-slate-400"
                }`}
              >
                {m.role === "admin" ? "Admin" : "Uye"}
              </span>
            </div>
          </div>
          {myRole === "admin" && m.user_id !== currentUserId && (
            <button
              onClick={() => handleRemove(m.user_id)}
              disabled={isPending}
              className="size-8 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors text-slate-400 hover:text-red-500 disabled:opacity-50"
              title="Uyeyi Cikar"
            >
              <span className="material-symbols-outlined text-lg">
                person_remove
              </span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
