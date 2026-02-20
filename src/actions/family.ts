"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/types";
import {
  hasFamilyPermission,
  addFamilyAuditLog,
} from "@/lib/auth/family-permissions";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function resolveUserIdByEmail(email: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) return null;
  const normalized = normalizeEmail(email);
  const match = data.users.find(
    (u) => normalizeEmail(u.email ?? "") === normalized
  );
  return match?.id ?? null;
}

async function attachExistingDataToFamily(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  familyId: string
) {
  await Promise.all([
    supabase
      .from("bank_accounts")
      .update({ family_id: familyId })
      .eq("owner_id", userId)
      .is("family_id", null),
    supabase
      .from("loans")
      .update({ family_id: familyId })
      .eq("payer_id", userId)
      .is("family_id", null),
    supabase
      .from("credit_cards")
      .update({ family_id: familyId })
      .eq("owner_id", userId)
      .is("family_id", null),
  ]);
}

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Oturum bulunamadi");
  return { supabase, user };
}

export async function getMyFamily() {
  try {
    const { supabase, user } = await getAuthUser();
    const admin = createAdminClient();

    // Admin client bypasses RLS - ensures user always sees their family when they're a member
    const { data: membership } = await admin
      .from("family_members")
      .select(
        "family_id, role, can_view_finance, can_create_finance, can_edit_finance, can_delete_finance, can_manage_members, can_manage_invitations, can_assign_permissions, families(id, name, created_by, created_at)"
      )
      .eq("user_id", user.id)
      .single();

    if (!membership || !membership.families) {
      return { success: true as const, data: null };
    }

    const family = Array.isArray(membership.families)
      ? membership.families[0]
      : membership.families;

    const { data: members } = await admin
      .from("family_members")
      .select(
        "id, user_id, role, joined_at, can_view_finance, can_create_finance, can_edit_finance, can_delete_finance, can_manage_members, can_manage_invitations, can_assign_permissions, profiles:profiles(id, full_name)"
      )
      .eq("family_id", family.id);

    const { data: invitations } = await admin
      .from("family_invitations")
      .select("*")
      .eq("family_id", family.id);

    return {
      success: true as const,
      data: {
        family,
        myRole: membership.role as "admin" | "member",
        myPermissions: {
          can_view_finance: !!membership.can_view_finance,
          can_create_finance: !!membership.can_create_finance,
          can_edit_finance: !!membership.can_edit_finance,
          can_delete_finance: !!membership.can_delete_finance,
          can_manage_members: !!membership.can_manage_members,
          can_manage_invitations: !!membership.can_manage_invitations,
          can_assign_permissions: !!membership.can_assign_permissions,
        },
        members: (members ?? []).map((m) => ({
          id: m.id,
          user_id: m.user_id,
          role: m.role as "admin" | "member",
          joined_at: m.joined_at,
          can_view_finance: !!m.can_view_finance,
          can_create_finance: !!m.can_create_finance,
          can_edit_finance: !!m.can_edit_finance,
          can_delete_finance: !!m.can_delete_finance,
          can_manage_members: !!m.can_manage_members,
          can_manage_invitations: !!m.can_manage_invitations,
          can_assign_permissions: !!m.can_assign_permissions,
          full_name: Array.isArray(m.profiles)
            ? m.profiles[0]?.full_name ?? ""
            : m.profiles?.full_name ?? "",
        })),
        invitations: invitations ?? [],
      },
    };
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Bir hata olustu",
    };
  }
}

export async function getPendingInvitationsForUser() {
  try {
    const { user } = await getAuthUser();
    const admin = createAdminClient();
    const email = normalizeEmail(user.email ?? "");

    await admin
      .from("family_invitations")
      .update({ status: "expired" })
      .eq("invited_email", email)
      .eq("status", "pending")
      .lt("expires_at", new Date().toISOString());

    const { data: invitations } = await admin
      .from("family_invitations")
      .select("*, families(name), inviter:profiles!family_invitations_invited_by_fkey(full_name)")
      .eq("invited_email", email)
      .eq("status", "pending");

    return {
      success: true as const,
      data: (invitations ?? []).map((inv) => ({
        id: inv.id,
        family_id: inv.family_id,
        family_name: Array.isArray(inv.families)
          ? inv.families[0]?.name ?? ""
          : inv.families?.name ?? "",
        invited_by_name: Array.isArray(inv.inviter)
          ? inv.inviter[0]?.full_name ?? ""
          : inv.inviter?.full_name ?? "",
        created_at: inv.created_at,
        expires_at: inv.expires_at,
      })),
    };
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Bir hata olustu",
    };
  }
}

export async function createFamily(name: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthUser();

    const { data: familyId, error } = await supabase.rpc("create_family_with_admin", {
      family_name: name,
    });

    if (error) {
      if (error.message.includes("Already a member")) {
        return { success: false, error: "Zaten bir aileye uyesiniz" };
      }
      return { success: false, error: `Aile olusturulamadi: ${error.message}` };
    }

    if (familyId) {
      await attachExistingDataToFamily(supabase, user.id, familyId);
    }

    revalidatePath("/family");
    revalidatePath("/bank-accounts");
    revalidatePath("/loans");
    revalidatePath("/credit-cards");
    revalidatePath("/installments");
    return { success: true, data: undefined };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Bir hata olustu",
    };
  }
}

export async function inviteMember(email: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthUser();
    const normalizedEmail = normalizeEmail(email);

    const { data: membership } = await supabase
      .from("family_members")
      .select("family_id, role")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { success: false, error: "Bir aileye uye degilsiniz" };
    }

    const canManageInvitations = await hasFamilyPermission(
      supabase,
      user.id,
      membership.family_id,
      "manage_invitations"
    );
    if (!canManageInvitations) {
      return { success: false, error: "Davet gonderme yetkiniz yok" };
    }

    if (normalizedEmail === normalizeEmail(user.email ?? "")) {
      return { success: false, error: "Kendinizi davet edemezsiniz" };
    }

    const invitedUserId = await resolveUserIdByEmail(normalizedEmail);
    if (invitedUserId) {
      const { data: existingMember } = await supabase
        .from("family_members")
        .select("id")
        .eq("family_id", membership.family_id)
        .eq("user_id", invitedUserId)
        .single();
      if (existingMember) {
        return { success: false, error: "Bu kisi zaten ailenizde" };
      }
    }

    await supabase
      .from("family_invitations")
      .update({ status: "expired" })
      .eq("family_id", membership.family_id)
      .eq("invited_email", normalizedEmail)
      .eq("status", "pending")
      .lt("expires_at", new Date().toISOString());

    const { data: existingInvite } = await supabase
      .from("family_invitations")
      .select("id, status")
      .eq("family_id", membership.family_id)
      .eq("invited_email", normalizedEmail)
      .eq("status", "pending")
      .limit(1);

    if (existingInvite && existingInvite.length > 0) {
      return { success: false, error: "Bu e-postaya zaten davet gonderilmis" };
    }

    const { error } = await supabase.from("family_invitations").insert({
      family_id: membership.family_id,
      invited_by: user.id,
      invited_email: normalizedEmail,
      invited_user_id: invitedUserId,
      status: "pending",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (error) {
      return { success: false, error: "Davet gonderilemedi" };
    }

    revalidatePath("/family");
    await addFamilyAuditLog(
      supabase,
      membership.family_id,
      user.id,
      "invite_created",
      "family_invitations",
      undefined,
      { invited_email: normalizedEmail }
    );
    return { success: true, data: undefined };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Bir hata olustu",
    };
  }
}

export async function acceptInvitation(
  invitationId: string
): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthUser();
    const admin = createAdminClient();
    const email = normalizeEmail(user.email ?? "");

    const { data: invitation } = await admin
      .from("family_invitations")
      .select("*")
      .eq("id", invitationId)
      .eq("invited_email", email)
      .eq("status", "pending")
      .single();

    if (!invitation) {
      return { success: false, error: "Davet bulunamadi" };
    }
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      await admin
        .from("family_invitations")
        .update({ status: "expired" })
        .eq("id", invitationId);
      return { success: false, error: "Davet suresi dolmus" };
    }

    const { data: existingMembership } = await supabase
      .from("family_members")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    if (existingMembership && existingMembership.length > 0) {
      return {
        success: false,
        error: "Zaten bir aileye uyesiniz. Once mevcut ailenizden ayrilmaniz gerekiyor.",
      };
    }

    const { error: memberError } = await admin
      .from("family_members")
      .insert({
        family_id: invitation.family_id,
        user_id: user.id,
        role: "member",
      });

    if (memberError) {
      return { success: false, error: "Aileye katilinamadi" };
    }

    await admin
      .from("family_invitations")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", invitationId);

    await attachExistingDataToFamily(supabase, user.id, invitation.family_id);
    await addFamilyAuditLog(
      supabase,
      invitation.family_id,
      user.id,
      "invite_accepted",
      "family_invitations",
      invitationId
    );

    revalidatePath("/family");
    revalidatePath("/bank-accounts");
    revalidatePath("/loans");
    revalidatePath("/credit-cards");
    revalidatePath("/installments");
    revalidatePath("/");
    return { success: true, data: undefined };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Bir hata olustu",
    };
  }
}

export async function rejectInvitation(
  invitationId: string
): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthUser();
    const admin = createAdminClient();
    const email = normalizeEmail(user.email ?? "");

    const { data: existing } = await admin
      .from("family_invitations")
      .select("family_id")
      .eq("id", invitationId)
      .eq("invited_email", email)
      .single();

    const { error } = await admin
      .from("family_invitations")
      .update({ status: "rejected", rejected_at: new Date().toISOString() })
      .eq("id", invitationId)
      .eq("invited_email", email);

    if (error) {
      return { success: false, error: "Davet reddedilemedi" };
    }

    revalidatePath("/family");
    if (existing?.family_id) {
      await addFamilyAuditLog(
        supabase,
        existing.family_id,
        user.id,
        "invite_rejected",
        "family_invitations",
        invitationId
      );
    }
    return { success: true, data: undefined };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Bir hata olustu",
    };
  }
}

export async function cancelInvitation(
  invitationId: string
): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthUser();

    const { data: membership } = await supabase
      .from("family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .single();
    if (!membership) return { success: false, error: "Bir aileye uye degilsiniz" };

    const canManageInvitations = await hasFamilyPermission(
      supabase,
      user.id,
      membership.family_id,
      "manage_invitations"
    );
    if (!canManageInvitations) {
      return { success: false, error: "Davet yonetim yetkiniz yok" };
    }

    const { error } = await supabase
      .from("family_invitations")
      .update({ status: "canceled", canceled_at: new Date().toISOString() })
      .eq("id", invitationId)
      .eq("family_id", membership.family_id)
      .eq("status", "pending");

    if (error) return { success: false, error: "Davet iptal edilemedi" };

    await addFamilyAuditLog(
      supabase,
      membership.family_id,
      user.id,
      "invite_canceled",
      "family_invitations",
      invitationId
    );
    revalidatePath("/family");
    return { success: true, data: undefined };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Bir hata olustu",
    };
  }
}

export async function updateFamilyMemberPermissions(
  memberUserId: string,
  permissions: {
    can_view_finance: boolean;
    can_create_finance: boolean;
    can_edit_finance: boolean;
    can_delete_finance: boolean;
    can_manage_members: boolean;
    can_manage_invitations: boolean;
    can_assign_permissions: boolean;
  }
): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthUser();
    const { data: myMembership } = await supabase
      .from("family_members")
      .select("family_id, role")
      .eq("user_id", user.id)
      .single();
    if (!myMembership) return { success: false, error: "Bir aileye uye degilsiniz" };

    const canAssign = await hasFamilyPermission(
      supabase,
      user.id,
      myMembership.family_id,
      "assign_permissions"
    );
    if (!canAssign) {
      return { success: false, error: "Izin atama yetkiniz yok" };
    }

    if (memberUserId === user.id) {
      return { success: false, error: "Kendi izinlerinizi buradan degistiremezsiniz" };
    }

    const { data: targetMembership } = await supabase
      .from("family_members")
      .select("role")
      .eq("family_id", myMembership.family_id)
      .eq("user_id", memberUserId)
      .single();
    if (!targetMembership) return { success: false, error: "Uye bulunamadi" };
    if (targetMembership.role === "admin") {
      return {
        success: false,
        error: "Admin izinleri rolden gelir, bu ekrandan degistirilemez",
      };
    }

    const { error } = await supabase
      .from("family_members")
      .update(permissions)
      .eq("family_id", myMembership.family_id)
      .eq("user_id", memberUserId);
    if (error) return { success: false, error: "Izinler guncellenemedi" };

    await addFamilyAuditLog(
      supabase,
      myMembership.family_id,
      user.id,
      "member_permissions_updated",
      "profiles",
      memberUserId,
      permissions as Record<string, unknown>
    );
    revalidatePath("/family");
    return { success: true, data: undefined };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Bir hata olustu",
    };
  }
}

export async function updateFamilyMemberRole(
  memberUserId: string,
  role: "admin" | "member"
): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthUser();
    const { data: myMembership } = await supabase
      .from("family_members")
      .select("family_id, role")
      .eq("user_id", user.id)
      .single();
    if (!myMembership) return { success: false, error: "Bir aileye uye degilsiniz" };

    const canManageMembers = await hasFamilyPermission(
      supabase,
      user.id,
      myMembership.family_id,
      "manage_members"
    );
    if (!canManageMembers) {
      return { success: false, error: "Uye rolu guncelleme yetkiniz yok" };
    }

    if (memberUserId === user.id && role !== myMembership.role) {
      return { success: false, error: "Kendi rolunuzu buradan degistiremezsiniz" };
    }

    const { error } = await supabase
      .from("family_members")
      .update({ role })
      .eq("family_id", myMembership.family_id)
      .eq("user_id", memberUserId);
    if (error) return { success: false, error: "Uye rolu guncellenemedi" };

    if (role === "admin") {
      await supabase
        .from("family_members")
        .update({
          can_view_finance: true,
          can_create_finance: true,
          can_edit_finance: true,
          can_delete_finance: true,
          can_manage_members: true,
          can_manage_invitations: true,
          can_assign_permissions: true,
        })
        .eq("family_id", myMembership.family_id)
        .eq("user_id", memberUserId);
    }

    await addFamilyAuditLog(
      supabase,
      myMembership.family_id,
      user.id,
      "member_role_updated",
      "profiles",
      memberUserId,
      { role }
    );
    revalidatePath("/family");
    return { success: true, data: undefined };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Bir hata olustu",
    };
  }
}

export async function removeMember(userId: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthUser();

    const { data: membership } = await supabase
      .from("family_members")
      .select("family_id, role")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { success: false, error: "Bir aileye uye degilsiniz" };
    }
    const canManageMembers = await hasFamilyPermission(
      supabase,
      user.id,
      membership.family_id,
      "manage_members"
    );
    if (!canManageMembers) {
      return { success: false, error: "Uye yonetim yetkiniz yok" };
    }

    if (userId === user.id) {
      return { success: false, error: "Kendinizi cikaramazsiniz" };
    }

    const { data: targetMembership } = await supabase
      .from("family_members")
      .select("role")
      .eq("family_id", membership.family_id)
      .eq("user_id", userId)
      .single();

    if (!targetMembership) {
      return { success: false, error: "Uye bulunamadi" };
    }

    if (targetMembership.role === "admin") {
      const { data: otherAdmins } = await supabase
        .from("family_members")
        .select("id")
        .eq("family_id", membership.family_id)
        .eq("role", "admin")
        .neq("user_id", userId);

      if (!otherAdmins || otherAdmins.length === 0) {
        return { success: false, error: "Ailede en az bir admin kalmalidir" };
      }
    }

    const { error } = await supabase
      .from("family_members")
      .delete()
      .eq("family_id", membership.family_id)
      .eq("user_id", userId);

    if (error) {
      return { success: false, error: "Uye cikarilamadi" };
    }

    revalidatePath("/family");
    await addFamilyAuditLog(
      supabase,
      membership.family_id,
      user.id,
      "member_removed",
      "profiles",
      userId
    );
    return { success: true, data: undefined };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Bir hata olustu",
    };
  }
}

export async function leaveFamily(): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthUser();

    const { data: membership } = await supabase
      .from("family_members")
      .select("family_id, role")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { success: false, error: "Bir aileye uye degilsiniz" };
    }

    if (membership.role === "admin") {
      const { data: otherMembers } = await supabase
        .from("family_members")
        .select("id")
        .eq("family_id", membership.family_id)
        .neq("user_id", user.id);

      if (otherMembers && otherMembers.length > 0) {
        return {
          success: false,
          error:
            "Aileden ayrilmadan once baska bir uyeyi admin yapin veya tum uyeleri cikarin",
        };
      }

      await supabase
        .from("families")
        .delete()
        .eq("id", membership.family_id);
    } else {
      await supabase
        .from("family_members")
        .delete()
        .eq("family_id", membership.family_id)
        .eq("user_id", user.id);
    }

    revalidatePath("/family");
    revalidatePath("/");
    return { success: true, data: undefined };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Bir hata olustu",
    };
  }
}
