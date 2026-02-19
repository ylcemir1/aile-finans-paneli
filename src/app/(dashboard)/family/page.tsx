import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyFamily, getPendingInvitationsForUser } from "@/actions/family";
import { CreateFamilyForm } from "@/components/family/CreateFamilyForm";
import { FamilyMembers } from "@/components/family/FamilyMembers";
import { InviteMemberForm } from "@/components/family/InviteMemberForm";
import { PendingInvitations } from "@/components/family/PendingInvitations";
import { FamilyLeaveButton } from "@/components/family/FamilyLeaveButton";

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

            {/* Invite form (admin only) */}
            {familyData.myRole === "admin" && (
              <div className="mb-6 relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Uye Davet Et
                </label>
                <InviteMemberForm />
              </div>
            )}

            {/* Pending invitations sent */}
            {familyData.pendingInvitations.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Gonderilen Davetler
                </h3>
                <div className="space-y-2">
                  {familyData.pendingInvitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 border border-amber-100"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500 text-base">
                          hourglass_top
                        </span>
                        <span className="text-sm text-slate-700">
                          {inv.invited_email}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-600 uppercase">
                        Bekliyor
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Members list */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Uyeler
              </h3>
              <FamilyMembers
                members={familyData.members}
                myRole={familyData.myRole}
                currentUserId={user.id}
              />
            </div>

            {/* Leave family */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <FamilyLeaveButton myRole={familyData.myRole} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
