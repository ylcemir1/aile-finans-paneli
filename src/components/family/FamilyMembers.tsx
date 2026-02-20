"use client";

import { useState, useTransition } from "react";
import {
  removeMember,
  updateFamilyMemberPermissions,
  updateFamilyMemberRole,
} from "@/actions/family";

interface Member {
  id: string;
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
  full_name: string;
  can_view_finance: boolean;
  can_create_finance: boolean;
  can_edit_finance: boolean;
  can_delete_finance: boolean;
  can_manage_members: boolean;
  can_manage_invitations: boolean;
  can_assign_permissions: boolean;
}

interface FamilyMembersProps {
  members: Member[];
  myPermissions: {
    can_manage_members: boolean;
    can_assign_permissions: boolean;
  };
  currentUserId: string;
}

export function FamilyMembers({
  members,
  myPermissions,
  currentUserId,
}: FamilyMembersProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>("");

  function handleRemove(userId: string) {
    startTransition(async () => {
      const res = await removeMember(userId);
      if (!res.success) setMessage(res.error);
    });
  }

  function handleRoleChange(userId: string, role: "admin" | "member") {
    startTransition(async () => {
      const res = await updateFamilyMemberRole(userId, role);
      setMessage(res.success ? "Uye rolu guncellendi" : res.error);
    });
  }

  function handlePermissionChange(
    userId: string,
    key:
      | "can_view_finance"
      | "can_create_finance"
      | "can_edit_finance"
      | "can_delete_finance"
      | "can_manage_members"
      | "can_manage_invitations"
      | "can_assign_permissions",
    value: boolean,
    member: Member
  ) {
    startTransition(async () => {
      const res = await updateFamilyMemberPermissions(userId, {
        can_view_finance: key === "can_view_finance" ? value : member.can_view_finance,
        can_create_finance:
          key === "can_create_finance" ? value : member.can_create_finance,
        can_edit_finance: key === "can_edit_finance" ? value : member.can_edit_finance,
        can_delete_finance:
          key === "can_delete_finance" ? value : member.can_delete_finance,
        can_manage_members:
          key === "can_manage_members" ? value : member.can_manage_members,
        can_manage_invitations:
          key === "can_manage_invitations" ? value : member.can_manage_invitations,
        can_assign_permissions:
          key === "can_assign_permissions" ? value : member.can_assign_permissions,
      });
      setMessage(res.success ? "Izinler guncellendi" : res.error);
    });
  }

  return (
    <div className="space-y-2">
      {message && (
        <p className="text-xs text-slate-600 bg-slate-100 rounded-lg px-2.5 py-1.5">
          {message}
        </p>
      )}
      {members.map((m) => (
        <div
          key={m.id}
          className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-2"
        >
          <div className="flex items-center justify-between">
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
            {myPermissions.can_manage_members && m.user_id !== currentUserId && (
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

          {myPermissions.can_manage_members && m.user_id !== currentUserId && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">Rol:</label>
              <select
                defaultValue={m.role}
                onChange={(e) =>
                  handleRoleChange(m.user_id, e.target.value as "admin" | "member")
                }
                className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white"
              >
                <option value="member">Uye</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          {myPermissions.can_assign_permissions && m.user_id !== currentUserId && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(
                [
                  ["can_view_finance", "Finans goruntule"],
                  ["can_create_finance", "Finans olustur"],
                  ["can_edit_finance", "Finans duzenle"],
                  ["can_delete_finance", "Finans sil"],
                  ["can_manage_members", "Uye yonetimi"],
                  ["can_manage_invitations", "Davet yonetimi"],
                  ["can_assign_permissions", "Izin atama"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="inline-flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={m[key]}
                    onChange={(e) =>
                      handlePermissionChange(m.user_id, key, e.target.checked, m)
                    }
                  />
                  <span className="text-slate-600">{label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
