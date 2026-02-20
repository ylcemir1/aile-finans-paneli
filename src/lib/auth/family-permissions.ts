import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";

export type FamilyPermissionKey =
  | "view_finance"
  | "create_finance"
  | "edit_finance"
  | "delete_finance"
  | "manage_members"
  | "manage_invitations"
  | "assign_permissions";

export async function getUserRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return profile?.role ?? "member";
}

export async function getUserFamilyMembership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data } = await supabase
    .from("family_members")
    .select(
      "family_id, role, can_view_finance, can_create_finance, can_edit_finance, can_delete_finance, can_manage_members, can_manage_invitations, can_assign_permissions"
    )
    .eq("user_id", userId)
    .single();

  return data;
}

export async function hasFamilyPermission(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  familyId: string | null | undefined,
  permission: FamilyPermissionKey
) {
  if (!familyId) return false;

  const { data, error } = await supabase.rpc("has_family_permission", {
    p_user_id: userId,
    p_family_id: familyId,
    p_permission: permission,
  });

  if (!error) return !!data;

  // Fallback for environments where migration 006 is not applied yet.
  const membership = await getUserFamilyMembership(supabase, userId);
  if (!membership || membership.family_id !== familyId) return false;
  if (membership.role === "admin") return true;

  switch (permission) {
    case "view_finance":
      return !!membership.can_view_finance;
    case "create_finance":
      return !!membership.can_create_finance;
    case "edit_finance":
      return !!membership.can_edit_finance;
    case "delete_finance":
      return !!membership.can_delete_finance;
    case "manage_members":
      return !!membership.can_manage_members;
    case "manage_invitations":
      return !!membership.can_manage_invitations;
    case "assign_permissions":
      return !!membership.can_assign_permissions;
    default:
      return false;
  }
}

type FinanceAccessInput = {
  userId: string;
  isAdmin: boolean;
  ownerId?: string | null;
  creatorId?: string | null;
  familyId?: string | null;
  permission: FamilyPermissionKey;
};

export async function canAccessFinanceEntity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: FinanceAccessInput
) {
  const { userId, isAdmin, ownerId, creatorId, familyId, permission } = input;

  if (isAdmin) return true;
  if (ownerId && ownerId === userId) return true;
  if (creatorId && creatorId === userId) return true;

  if (familyId) {
    return hasFamilyPermission(supabase, userId, familyId, permission);
  }

  return false;
}

export async function addFamilyAuditLog(
  supabase: Awaited<ReturnType<typeof createClient>>,
  familyId: string,
  actorUserId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  metadata?: Record<string, unknown>
) {
  try {
    await supabase.rpc("add_family_audit_log", {
      p_family_id: familyId,
      p_actor_user_id: actorUserId,
      p_action: action,
      p_target_type: targetType,
      p_target_id: targetId,
      p_metadata: (metadata ?? {}) as Json,
    });
  } catch {
    // Non-blocking in case migration 006 is not applied yet.
  }
}
