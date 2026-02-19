import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/ui/Navbar";
import { BottomNav } from "@/components/ui/BottomNav";
import { Sidebar } from "@/components/ui/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const today = new Date().toISOString().split("T")[0];

  const [{ data: profile }, { count: overdueCount }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single(),
    supabase
      .from("installments")
      .select("id", { count: "exact", head: true })
      .eq("is_paid", false)
      .lt("due_date", today),
  ]);

  const profileData = {
    full_name: profile?.full_name ?? user.email ?? "",
    role: profile?.role ?? "member",
  };

  return (
    <div className="min-h-screen bg-background-light pb-24 md:pb-0">
      <Sidebar profile={profileData} overdueCount={overdueCount ?? 0} />
      <div className="md:ml-64">
        <Navbar profile={profileData} />
        <main className="px-6 space-y-6">{children}</main>
      </div>
      <BottomNav overdueCount={overdueCount ?? 0} />
    </div>
  );
}
