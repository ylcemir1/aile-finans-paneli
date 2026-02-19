"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { createUserByAdmin } from "@/actions/admin";

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddUserModal({ open, onClose }: AddUserModalProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("full_name") as string;
    const role = formData.get("role") as "admin" | "member";

    if (!email || !password || !fullName) {
      setMessage({ type: "error", text: "Tum alanlari doldurun" });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: "error", text: "Sifre en az 6 karakter olmalidir" });
      return;
    }

    startTransition(async () => {
      const res = await createUserByAdmin(email, password, fullName, role);
      if (res.success) {
        setMessage({ type: "success", text: "Kullanici olusturuldu!" });
        setTimeout(() => {
          setMessage(null);
          onClose();
        }, 800);
      } else {
        setMessage({ type: "error", text: res.error });
      }
    });
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        setMessage(null);
        onClose();
      }}
      title="Yeni Kullanici Ekle"
    >
      <form action={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Ad Soyad
          </label>
          <input
            type="text"
            name="full_name"
            required
            placeholder="Adiniz Soyadiniz"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            E-posta
          </label>
          <input
            type="email"
            name="email"
            required
            placeholder="eposta@ornek.com"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Sifre
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              required
              placeholder="En az 6 karakter"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 pr-11 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined text-lg">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        </div>

        {/* Role */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Rol
          </label>
          <select
            name="role"
            defaultValue="member"
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
            {isPending ? "Olusturuluyor..." : "Kullanici Olustur"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
