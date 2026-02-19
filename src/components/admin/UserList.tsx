"use client";

import { useState } from "react";
import { UserEditModal } from "./UserEditModal";
import { AddUserModal } from "./AddUserModal";

interface UserData {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "member";
  created_at: string;
}

interface UserListProps {
  users: UserData[];
}

export function UserList({ users }: UserListProps) {
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Kullanici Yonetimi</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Toplam {users.length} kullanici
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          Kullanici Ekle
        </button>
      </div>

      {/* User cards */}
      <div className="space-y-3">
        {users.map((u) => (
          <div
            key={u.id}
            className="bg-white rounded-xl border border-slate-100 shadow-md shadow-black/[0.03] p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-lg">
                  {u.role === "admin" ? "admin_panel_settings" : "person"}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {u.full_name || "Isimsiz"}
                </p>
                <p className="text-xs text-slate-500 truncate">{u.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  u.role === "admin"
                    ? "bg-primary/10 text-primary"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {u.role === "admin" ? "Admin" : "Uye"}
              </span>
              <button
                onClick={() => setEditUser(u)}
                className="size-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400 hover:text-primary"
              >
                <span className="material-symbols-outlined text-lg">edit</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      <UserEditModal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        user={editUser}
      />
      <AddUserModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}
