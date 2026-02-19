import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function getUserFamilyId(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", userId)
    .single();

  return data?.family_id ?? null;
}
