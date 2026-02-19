"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { updateUserRole, updateUserProfile, deleteUser } from "@/actions/admin";

interface UserEditModalProps {
  open: boolean;
  onClose: () => void;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: "admin" | "member";
  } | null;
}

export function UserEditModal({ open, onClose, user }: UserEditModalProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!user) return null;

  function handleSubmit(formData: FormData) {
    setMessage(null);
    const fullName = formData.get("full_name") as string;
    const role = formData.get("role") as "admin" | "member";

    startTransition(async () => {
      const [nameRes, roleRes] = await Promise.all([
        fullName !== user!.full_name
          ? updateUserProfile(user!.id, fullName)
          : { success: true as const, data: undefined },
        role !== user!.role
          ? updateUserRole(user!.id, role)
          : { success: true as const, data: undefined },
      ]);

      if (!nameRes.success) {
        setMessage({ type: "error", text: nameRes.error });
      } else if (!roleRes.success) {
        setMessage({ type: "error", text: roleRes.error });
      } else {
        setMessage({ type: "success", text: "Kullanici guncellendi" });
        setTimeout(() => onClose(), 800);
      }
    });
  }

  function handleDelete() {
    setMessage(null);
    startTransition(async () => {
      const res = await deleteUser(user!.id);
      if (res.success) {
        onClose();
      } else {
        setMessage({ type: "error", text: res.error });
      }
    });
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        setConfirmDelete(false);
        setMessage(null);
        onClose();
      }}
      title="Kullaniciyi Duzenle"
    >
      <form action={handleSubmit} className="space-y-4">
        {/* Email (readonly) */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            E-posta
          </label>
          <input
            type="email"
            value={user.email}
            readOnly
            className="w-full bg-slate-100 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-400 cursor-not-allowed"
          />
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Ad Soyad
          </label>
          <input
            type="text"
            name="full_name"
            defaultValue={user.full_name}
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {/* Role */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Rol
          </label>
          <select
            name="role"
            defaultValue={user.role}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="member">Uye</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {message && (
          <div
            className={`text-sm font-medium px-3 py-2 rounded-lg ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setConfirmDelete(false);
              setMessage(null);
              onClose();
            }}
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

        {/* Delete section */}
        <div className="pt-3 border-t border-slate-100">
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full py-2 text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              Kullaniciyi Sil
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-red-600 text-center font-medium">
                Bu islem geri alinamaz. Emin misiniz?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Vazgec
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isPending ? "Siliniyor..." : "Evet, Sil"}
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
