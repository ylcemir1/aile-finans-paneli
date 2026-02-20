import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsers } from "@/actions/admin";
import { UserList } from "@/components/admin/UserList";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  const result = await getUsers();

  if (!result.success) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-slate-900">Kullanici Yonetimi</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{result.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          Bu sayfa yalnizca uygulama kullanici yonetimi icindir. Aile uye/izin
          yonetimi icin <span className="font-semibold">Ailem</span> sayfasini
          kullanin.
        </p>
      </div>
      <UserList users={result.data} />
    </div>
  );
}
