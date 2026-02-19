"use client";

import { useTransition, useState } from "react";
import { updateProfile } from "@/actions/profile";

interface ProfileFormProps {
  fullName: string;
  email: string;
  role: string;
}

export function ProfileForm({ fullName, email, role }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result.success) {
        setMessage({ type: "success", text: "Profil basariyla guncellendi!" });
      } else {
        setMessage({ type: "error", text: result.error });
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {/* Full name */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Ad Soyad
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            person
          </span>
          <input
            type="text"
            name="full_name"
            defaultValue={fullName}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            placeholder="Adinizi girin"
          />
        </div>
      </div>

      {/* Email (read only) */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          E-posta
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            mail
          </span>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full bg-slate-100 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-sm font-medium text-slate-400 cursor-not-allowed"
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          E-posta degistirilemez
        </p>
      </div>

      {/* Role badge */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Rol
        </label>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-3 py-1.5 rounded-full ${
              role === "admin"
                ? "bg-primary/10 text-primary"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {role === "admin" ? "Admin" : "Uye"}
          </span>
          <span className="text-[10px] text-slate-400">
            {role === "admin"
              ? "Tum verileri gorebilir ve duzenleyebilirsiniz"
              : "Sadece kendi verilerinizi gorebilirsiniz"}
          </span>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`text-sm font-medium px-4 py-3 rounded-lg ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-primary text-white font-bold py-3.5 rounded-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {isPending ? "Kaydediliyor..." : "Degisiklikleri Kaydet"}
      </button>
    </form>
  );
}
