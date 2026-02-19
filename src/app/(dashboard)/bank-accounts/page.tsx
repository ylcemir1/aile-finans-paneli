import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BalanceSummaryCard } from "@/components/bank-accounts/BalanceSummaryCard";
import { BankAccountCard } from "@/components/bank-accounts/BankAccountCard";
import { BankAccountForm } from "@/components/bank-accounts/BankAccountForm";
import { SearchBar } from "@/components/bank-accounts/SearchBar";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function BankAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.toLowerCase() ?? "";
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: accounts }, { data: profiles }, { data: currentProfile }] =
    await Promise.all([
      supabase
        .from("bank_accounts")
        .select("*, owner:profiles(full_name)")
        .order("updated_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name"),
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single(),
    ]);

  const isAdmin = currentProfile?.role === "admin";
  const totalBalance = (accounts ?? []).reduce(
    (sum, a) => sum + Number(a.balance),
    0
  );

  // Filter accounts by search query
  const filteredAccounts = query
    ? (accounts ?? []).filter(
        (a) =>
          a.bank_name.toLowerCase().includes(query) ||
          a.account_name.toLowerCase().includes(query)
      )
    : (accounts ?? []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Banka Hesaplari</h1>
        <BankAccountForm
          profiles={profiles ?? []}
          currentUserId={user.id}
          isAdmin={isAdmin}
        />
      </div>

      {/* Summary card */}
      <BalanceSummaryCard totalBalance={totalBalance} />

      {/* Search */}
      {(accounts ?? []).length > 0 && <SearchBar />}

      {/* Account list */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 ml-1">
          {query
            ? `"${params.q}" ARAMA SONUCLARI (${filteredAccounts.length})`
            : "BANKA HESAPLARI"}
        </h3>
        <div className="space-y-3">
          {filteredAccounts.length === 0 ? (
            query ? (
              <EmptyState
                icon="search_off"
                title="Sonuc bulunamadi"
                description={`"${params.q}" ile eslesen hesap yok. Farkli bir arama deneyin.`}
                iconBg="bg-amber-50"
                iconColor="text-amber-500"
              />
            ) : (
              <EmptyState
                icon="account_balance"
                title="Henuz banka hesabi eklenmedi"
                description="Hesaplarinizi ekleyerek toplam bakiyenizi takip edin."
                actionLabel="+ Hesap Ekle"
                iconBg="bg-blue-50"
                iconColor="text-blue-500"
              />
            )
          ) : (
            filteredAccounts.map((account) => (
              <BankAccountCard
                key={account.id}
                account={account}
                isAdmin={isAdmin}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
