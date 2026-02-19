"use client";

import { useState, useTransition } from "react";
import { createFamily } from "@/actions/family";

export function CreateFamilyForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(formData: FormData) {
    setError("");
    const name = formData.get("name") as string;
    if (!name || name.trim().length < 2) {
      setError("Aile adi en az 2 karakter olmalidir");
      return;
    }
    startTransition(async () => {
      const res = await createFamily(name.trim());
      if (!res.success) setError(res.error);
    });
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-md shadow-black/[0.03] p-6 max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-2xl">
            family_restroom
          </span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Aile Olustur</h2>
          <p className="text-sm text-slate-500">
            Ailenizi olusturun ve uyeleri davet edin
          </p>
        </div>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Aile Adi
          </label>
          <input
            type="text"
            name="name"
            required
            placeholder="orn. Yilmaz Ailesi"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 bg-primary text-white font-bold rounded-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending ? "Olusturuluyor..." : "Aile Olustur"}
        </button>
      </form>
    </div>
  );
}
