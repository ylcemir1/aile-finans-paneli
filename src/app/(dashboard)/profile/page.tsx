import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, created_at")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6 max-w-lg">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Profil Ayarlari</h1>
        <p className="text-sm text-slate-500 mt-1">
          Hesap bilgilerinizi goruntuleyin ve duzenleyin
        </p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-md shadow-black/[0.03] p-6">
        {/* Avatar section */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl">
              person
            </span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {profile?.full_name ?? user.email}
            </h2>
            <p className="text-xs text-slate-400">
              {user.email}
            </p>
          </div>
        </div>

        {/* Form */}
        <ProfileForm
          fullName={profile?.full_name ?? ""}
          email={user.email ?? ""}
          role={profile?.role ?? "member"}
        />
      </div>
    </div>
  );
}
