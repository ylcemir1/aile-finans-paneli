import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="w-full max-w-[440px] bg-white rounded-xl shadow-xl shadow-primary/5 overflow-hidden border border-slate-200">
      {/* Top branding */}
      <div className="pt-10 pb-6 px-8 flex flex-col items-center text-center">
        <div className="bg-primary/10 p-3 rounded-xl mb-4">
          <span className="material-symbols-outlined text-primary text-4xl leading-none">
            shield_lock
          </span>
        </div>
        <h1 className="text-slate-900 text-2xl font-bold tracking-tight">
          Aile Finans Paneli
        </h1>
        <p className="text-slate-500 mt-2 text-sm">
          Aile finanslarınızı güvenle yönetin
        </p>
      </div>

      {/* Form */}
      <div className="px-8 pb-10">
        {params.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{params.error}</p>
          </div>
        )}
        <LoginForm />
      </div>

      {/* Footer security note */}
      <div className="bg-slate-50 py-4 px-8 flex items-center justify-center gap-2 border-t border-slate-100">
        <span className="material-symbols-outlined text-green-500 text-lg">
          verified_user
        </span>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">
          UÇTAN UCA ŞİFRELİ VE GÜVENLİ
        </span>
      </div>
    </div>
  );
}
