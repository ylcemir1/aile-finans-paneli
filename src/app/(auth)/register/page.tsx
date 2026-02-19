import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="w-full max-w-[440px] bg-white rounded-xl shadow-xl shadow-primary/5 overflow-hidden border border-slate-200">
      {/* Top branding */}
      <div className="pt-10 pb-6 px-8 flex flex-col items-center text-center">
        <div className="bg-primary/10 p-3 rounded-xl mb-4">
          <span className="material-symbols-outlined text-primary text-4xl leading-none">
            person_add
          </span>
        </div>
        <h1 className="text-slate-900 text-2xl font-bold tracking-tight">
          Hesap Oluştur
        </h1>
        <p className="text-slate-500 mt-2 text-sm">
          Aile Finans Paneli&apos;ne kayıt olun
        </p>
      </div>

      {/* Form */}
      <div className="px-8 pb-8">
        {params.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{params.error}</p>
          </div>
        )}
        {params.success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm text-emerald-700">{params.success}</p>
          </div>
        )}
        <RegisterForm />
      </div>

      {/* Footer */}
      <div className="bg-slate-50 py-4 px-8 flex items-center justify-center gap-1.5 border-t border-slate-100">
        <span className="text-sm text-slate-500">Zaten hesabınız var mı?</span>
        <Link
          href="/login"
          className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
        >
          Giriş Yap
        </Link>
      </div>
    </div>
  );
}
