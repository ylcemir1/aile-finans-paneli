import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyFamily, getPendingInvitationsForUser } from "@/actions/family";
import { CreateFamilyForm } from "@/components/family/CreateFamilyForm";
import { PendingInvitations } from "@/components/family/PendingInvitations";
import { FamilyManagementTabs } from "@/components/family/FamilyManagementTabs";

export default async function FamilyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [familyResult, invitationsResult] = await Promise.all([
    getMyFamily(),
    getPendingInvitationsForUser(),
  ]);

  const pendingInvitations =
    invitationsResult.success ? invitationsResult.data : [];

  if (!familyResult.success) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-slate-900">Ailem</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{familyResult.error}</p>
        </div>
      </div>
    );
  }

  const familyData = familyResult.data;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Ailem</h1>

      {!invitationsResult.success && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">
            Davetler yuklenirken hata oldu: {invitationsResult.error}
          </p>
        </div>
      )}

      {/* Pending invitations for this user */}
      <PendingInvitations invitations={pendingInvitations} />

      {!familyData ? (
        <CreateFamilyForm />
      ) : (
        <>
          {/* Family info card */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-md shadow-black/[0.03] p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-2xl">
                    family_restroom
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {familyData.family.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {familyData.members.length} uye
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                  familyData.myRole === "admin"
                    ? "bg-primary/10 text-primary"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {familyData.myRole === "admin" ? "Admin" : "Uye"}
              </span>
            </div>

            <FamilyManagementTabs
              members={familyData.members}
              invitations={familyData.invitations}
              myRole={familyData.myRole}
              myPermissions={familyData.myPermissions}
              currentUserId={user.id}
            />
          </div>
        </>
      )}
    </div>
  );
}
