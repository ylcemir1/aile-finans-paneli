"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSchema, getFirstError } from "@/lib/validations";

export async function updateProfile(
  formData: FormData
): Promise<{ success: true; data: null } | { success: false; error: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Oturum bulunamadi" };
  }

  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
  });

  if (!parsed.success) {
    return { success: false, error: getFirstError(parsed.error) };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: "Profil guncellenirken bir hata olustu" };
  }

  revalidatePath("/", "layout");
  return { success: true, data: null };
}
