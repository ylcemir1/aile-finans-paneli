"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/types";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Oturum bulunamadi");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Yetkiniz yok");

  return user;
}

export async function getUsers(): Promise<
  ActionResult<
    {
      id: string;
      email: string;
      full_name: string;
      role: "admin" | "member";
      created_at: string;
    }[]
  >
> {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const { data: authData, error: authError } =
      await admin.auth.admin.listUsers({ perPage: 1000 });

    if (authError) {
      return { success: false, error: "Kullanicilar yuklenemedi" };
    }

    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, role, created_at");

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id, p])
    );

    const users = authData.users.map((u) => {
      const profile = profileMap.get(u.id);
      return {
        id: u.id,
        email: u.email ?? "",
        full_name: profile?.full_name ?? u.user_metadata?.full_name ?? "",
        role: (profile?.role ?? "member") as "admin" | "member",
        created_at: profile?.created_at ?? u.created_at,
      };
    });

    return { success: true, data: users };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Bir hata olustu",
    };
  }
}

export async function updateUserRole(
  userId: string,
  role: "admin" | "member"
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const { error } = await admin
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    if (error) {
      return { success: false, error: "Rol guncellenemedi" };
    }

    revalidatePath("/admin/users");
    return { success: true, data: undefined };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Bir hata olustu",
    };
  }
}

export async function updateUserProfile(
  userId: string,
  fullName: string
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const { error } = await admin
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", userId);

    if (error) {
      return { success: false, error: "Profil guncellenemedi" };
    }

    revalidatePath("/admin/users");
    return { success: true, data: undefined };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Bir hata olustu",
    };
  }
}

export async function createUserByAdmin(
  email: string,
  password: string,
  fullName: string,
  role: "admin" | "member" = "member"
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const { data, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    if (data.user) {
      await admin.from("profiles").upsert({
        id: data.user.id,
        full_name: fullName,
        role,
      });
    }

    revalidatePath("/admin/users");
    return { success: true, data: undefined };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Bir hata olustu",
    };
  }
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  try {
    const currentUser = await requireAdmin();

    if (currentUser.id === userId) {
      return { success: false, error: "Kendinizi silemezsiniz" };
    }

    const admin = createAdminClient();

    const { error: profileError } = await admin
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      return { success: false, error: "Profil silinemedi" };
    }

    const { error: authError } = await admin.auth.admin.deleteUser(userId);

    if (authError) {
      return { success: false, error: "Kullanici silinemedi" };
    }

    revalidatePath("/admin/users");
    return { success: true, data: undefined };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Bir hata olustu",
    };
  }
}
