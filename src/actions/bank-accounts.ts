"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";
import { bankAccountSchema, getFirstError, parseFormData } from "@/lib/validations";
import {
  getUserRole,
  getUserFamilyMembership,
  canAccessFinanceEntity,
  hasFamilyPermission,
} from "@/lib/auth/family-permissions";

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

  const scope = String(formData.get("scope") ?? "personal");
  const membership = await getUserFamilyMembership(supabase, user.id);
  const targetFamilyId = scope === "family" ? membership?.family_id ?? null : null;

  if (scope === "family" && !targetFamilyId) {
    return { success: false, error: "Aile kapsaminda kayit icin bir aileye uye olmalisiniz" };
  }
  if (targetFamilyId) {
    const canCreate = await hasFamilyPermission(
      supabase,
      user.id,
      targetFamilyId,
      "create_finance"
    );
    if (!canCreate) {
      return { success: false, error: "Aile verisi olusturma yetkiniz yok" };
    }
  }

  const { error } = await supabase
    .from("bank_accounts")
    .insert({
      bank_name: parsed.data.bank_name,
      account_name: parsed.data.account_name,
      balance: parsed.data.balance,
      owner_id: parsed.data.owner_id ?? user.id,
      iban: parsed.data.iban ?? "",
      account_type: parsed.data.account_type ?? "vadesiz",
      currency: parsed.data.currency ?? "TRY",
      account_number: parsed.data.account_number ?? "",
      family_id: targetFamilyId,
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
    .select("owner_id, family_id")
    .eq("id", id)
    .single();

  if (!account) return { success: false, error: "Hesap bulunamadi" };

  const isAdmin = (await getUserRole(supabase, user.id)) === "admin";
  const canAccess = await canAccessFinanceEntity(supabase, {
    userId: user.id,
    isAdmin,
    ownerId: account.owner_id,
    familyId: account.family_id,
    permission: "edit_finance",
  });

  if (!canAccess) {
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
      iban: parsed.data.iban ?? "",
      account_type: parsed.data.account_type ?? "vadesiz",
      currency: parsed.data.currency ?? "TRY",
      account_number: parsed.data.account_number ?? "",
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
    .select("owner_id, family_id")
    .eq("id", id)
    .single();

  if (!account) return { success: false, error: "Hesap bulunamadi" };

  const isAdmin = (await getUserRole(supabase, user.id)) === "admin";
  const canAccess = await canAccessFinanceEntity(supabase, {
    userId: user.id,
    isAdmin,
    ownerId: account.owner_id,
    familyId: account.family_id,
    permission: "delete_finance",
  });

  if (!canAccess) {
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
