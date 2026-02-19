"use client";

import { useState, useTransition } from "react";
import { inviteMember } from "@/actions/family";

export function InviteMemberForm() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    const email = formData.get("email") as string;
    if (!email) {
      setMessage({ type: "error", text: "E-posta adresi girin" });
      return;
    }
    startTransition(async () => {
      const res = await inviteMember(email.trim());
      if (res.success) {
        setMessage({ type: "success", text: "Davet gonderildi!" });
      } else {
        setMessage({ type: "error", text: res.error });
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
          mail
        </span>
        <input
          type="email"
          name="email"
          required
          placeholder="E-posta adresi girin"
          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
      >
        {isPending ? "..." : "Davet Et"}
      </button>
      {message && (
        <div
          className={`absolute -bottom-7 left-0 text-xs font-medium ${
            message.type === "success" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}
    </form>
  );
}
