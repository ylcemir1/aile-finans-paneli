"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";

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

    const { data: membership } = await supabase
      .from("family_members")
      .select("family_id, role, families(id, name, created_by, created_at)")
      .eq("user_id", user.id)
      .single();

    if (!membership || !membership.families) {
      return { success: true as const, data: null };
    }

    const family = Array.isArray(membership.families)
      ? membership.families[0]
      : membership.families;

    const { data: members } = await supabase
      .from("family_members")
      .select("id, user_id, role, joined_at, profiles:profiles(id, full_name)")
      .eq("family_id", family.id);

    const { data: invitations } = await supabase
      .from("family_invitations")
      .select("*")
      .eq("family_id", family.id)
      .eq("status", "pending");

    return {
      success: true as const,
      data: {
        family,
        myRole: membership.role as "admin" | "member",
        members: (members ?? []).map((m) => ({
          id: m.id,
          user_id: m.user_id,
          role: m.role as "admin" | "member",
          joined_at: m.joined_at,
          full_name: Array.isArray(m.profiles)
            ? m.profiles[0]?.full_name ?? ""
            : m.profiles?.full_name ?? "",
        })),
        pendingInvitations: invitations ?? [],
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
    const { supabase, user } = await getAuthUser();

    const { data: invitations } = await supabase
      .from("family_invitations")
      .select("*, families(name), inviter:profiles!family_invitations_invited_by_fkey(full_name)")
      .eq("invited_email", user.email!)
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
    const { supabase } = await getAuthUser();

    const { error } = await supabase.rpc("create_family_with_admin", {
      family_name: name,
    });

    if (error) {
      if (error.message.includes("Already a member")) {
        return { success: false, error: "Zaten bir aileye uyesiniz" };
      }
      return { success: false, error: `Aile olusturulamadi: ${error.message}` };
    }

    revalidatePath("/family");
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

    const { data: membership } = await supabase
      .from("family_members")
      .select("family_id, role")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { success: false, error: "Bir aileye uye degilsiniz" };
    }

    if (membership.role !== "admin") {
      return { success: false, error: "Sadece aile adminleri davet gonderebilir" };
    }

    if (email === user.email) {
      return { success: false, error: "Kendinizi davet edemezsiniz" };
    }

    const { data: existingInvite } = await supabase
      .from("family_invitations")
      .select("id")
      .eq("family_id", membership.family_id)
      .eq("invited_email", email)
      .eq("status", "pending")
      .limit(1);

    if (existingInvite && existingInvite.length > 0) {
      return { success: false, error: "Bu e-postaya zaten davet gonderilmis" };
    }

    const { error } = await supabase.from("family_invitations").insert({
      family_id: membership.family_id,
      invited_by: user.id,
      invited_email: email,
    });

    if (error) {
      return { success: false, error: "Davet gonderilemedi" };
    }

    revalidatePath("/family");
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

    const { data: invitation } = await supabase
      .from("family_invitations")
      .select("*")
      .eq("id", invitationId)
      .eq("invited_email", user.email!)
      .eq("status", "pending")
      .single();

    if (!invitation) {
      return { success: false, error: "Davet bulunamadi" };
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

    const { error: memberError } = await supabase
      .from("family_members")
      .insert({
        family_id: invitation.family_id,
        user_id: user.id,
        role: "member",
      });

    if (memberError) {
      return { success: false, error: "Aileye katilinamadi" };
    }

    await supabase
      .from("family_invitations")
      .update({ status: "accepted" })
      .eq("id", invitationId);

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

export async function rejectInvitation(
  invitationId: string
): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthUser();

    const { error } = await supabase
      .from("family_invitations")
      .update({ status: "rejected" })
      .eq("id", invitationId)
      .eq("invited_email", user.email!);

    if (error) {
      return { success: false, error: "Davet reddedilemedi" };
    }

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

    if (!membership || membership.role !== "admin") {
      return { success: false, error: "Sadece aile adminleri uye cikarabilir" };
    }

    if (userId === user.id) {
      return { success: false, error: "Kendinizi cikaramazsiniz" };
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
