"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";
import { bankAccountSchema, getFirstError, parseFormData } from "@/lib/validations";

export async function createBankAccount(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Oturum bulunamadi" };

  const raw = parseFormData(formData, ["balance"]);
  if (!raw.owner_id) raw.owner_id = user.id;

  const parsed = bankAccountSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: getFirstError(parsed.error) };
  }

  const { error } = await supabase
    .from("bank_accounts")
    .insert({
      bank_name: parsed.data.bank_name,
      account_name: parsed.data.account_name,
      balance: parsed.data.balance,
      owner_id: parsed.data.owner_id ?? user.id,
    });

  if (error) return { success: false, error: error.message };

  revalidatePath("/bank-accounts");
  revalidatePath("/");
  return { success: true, data: undefined };
}

export async function updateBankAccount(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Oturum bulunamadi" };

  // Ownership check
  const { data: account } = await supabase
    .from("bank_accounts")
    .select("owner_id")
    .eq("id", id)
    .single();

  if (!account) return { success: false, error: "Hesap bulunamadi" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  if (account.owner_id !== user.id && !isAdmin) {
    return { success: false, error: "Bu hesabi duzenleme yetkiniz yok" };
  }

  const raw = parseFormData(formData, ["balance"]);
  const parsed = bankAccountSchema.omit({ owner_id: true }).safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: getFirstError(parsed.error) };
  }

  const { error } = await supabase
    .from("bank_accounts")
    .update({
      bank_name: parsed.data.bank_name,
      account_name: parsed.data.account_name,
      balance: parsed.data.balance,
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/bank-accounts");
  revalidatePath("/");
  return { success: true, data: undefined };
}

export async function deleteBankAccount(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Oturum bulunamadi" };

  // Ownership check
  const { data: account } = await supabase
    .from("bank_accounts")
    .select("owner_id")
    .eq("id", id)
    .single();

  if (!account) return { success: false, error: "Hesap bulunamadi" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  if (account.owner_id !== user.id && !isAdmin) {
    return { success: false, error: "Bu hesabi silme yetkiniz yok" };
  }

  const { error } = await supabase
    .from("bank_accounts")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/bank-accounts");
  revalidatePath("/");
  return { success: true, data: undefined };
}
