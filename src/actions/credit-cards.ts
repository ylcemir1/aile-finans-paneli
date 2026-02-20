"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";
import {
  creditCardSchema,
  creditCardInstallmentSchema,
  getFirstError,
  parseFormData,
} from "@/lib/validations";
import {
  getUserRole,
  getUserFamilyMembership,
  canAccessFinanceEntity,
  hasFamilyPermission,
} from "@/lib/auth/family-permissions";

export async function createCreditCard(
  formData: FormData
): Promise<ActionResult<{ cardId: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Oturum bulunamadi" };

  const raw = parseFormData(formData, [
    "card_limit",
    "current_balance",
    "minimum_payment",
    "statement_day",
    "due_day",
  ]);
  if (!raw.owner_id) raw.owner_id = user.id;

  const parsed = creditCardSchema.safeParse(raw);
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

  const { data: card, error } = await supabase
    .from("credit_cards")
    .insert({
      card_name: parsed.data.card_name,
      bank_name: parsed.data.bank_name,
      card_limit: parsed.data.card_limit,
      current_balance: parsed.data.current_balance ?? 0,
      minimum_payment: parsed.data.minimum_payment ?? 0,
      statement_day: parsed.data.statement_day,
      due_day: parsed.data.due_day,
      status: parsed.data.status ?? "active",
      notes: parsed.data.notes ?? "",
      owner_id: parsed.data.owner_id ?? user.id,
      created_by: user.id,
      family_id: targetFamilyId,
    })
    .select("id")
    .single();

  if (error || !card) {
    return {
      success: false,
      error: error?.message ?? "Kredi karti olusturulamadi",
    };
  }

  revalidatePath("/credit-cards");
  revalidatePath("/");
  return { success: true, data: { cardId: card.id } };
}

export async function updateCreditCard(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Oturum bulunamadi" };

  const { data: cardAccess } = await supabase
    .from("credit_cards")
    .select("owner_id, created_by, family_id")
    .eq("id", id)
    .single();
  if (!cardAccess) return { success: false, error: "Kart bulunamadi" };

  const isAdmin = (await getUserRole(supabase, user.id)) === "admin";
  const canAccess = await canAccessFinanceEntity(supabase, {
    userId: user.id,
    isAdmin,
    ownerId: cardAccess.owner_id,
    creatorId: cardAccess.created_by,
    familyId: cardAccess.family_id,
    permission: "edit_finance",
  });

  if (!canAccess) {
    return { success: false, error: "Bu karti duzenleme yetkiniz yok" };
  }

  const raw = parseFormData(formData, [
    "card_limit",
    "current_balance",
    "minimum_payment",
    "statement_day",
    "due_day",
  ]);

  const parsed = creditCardSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: getFirstError(parsed.error) };
  }

  const { error } = await supabase
    .from("credit_cards")
    .update({
      card_name: parsed.data.card_name,
      bank_name: parsed.data.bank_name,
      card_limit: parsed.data.card_limit,
      current_balance: parsed.data.current_balance ?? 0,
      minimum_payment: parsed.data.minimum_payment ?? 0,
      statement_day: parsed.data.statement_day,
      due_day: parsed.data.due_day,
      status: parsed.data.status ?? "active",
      notes: parsed.data.notes ?? "",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/credit-cards");
  revalidatePath(`/credit-cards/${id}`);
  revalidatePath("/");
  return { success: true, data: undefined };
}

export async function deleteCreditCard(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Oturum bulunamadi" };

  const { data: cardAccess } = await supabase
    .from("credit_cards")
    .select("owner_id, created_by, family_id")
    .eq("id", id)
    .single();
  if (!cardAccess) return { success: false, error: "Kart bulunamadi" };

  const isAdmin = (await getUserRole(supabase, user.id)) === "admin";
  const canAccess = await canAccessFinanceEntity(supabase, {
    userId: user.id,
    isAdmin,
    ownerId: cardAccess.owner_id,
    creatorId: cardAccess.created_by,
    familyId: cardAccess.family_id,
    permission: "delete_finance",
  });

  if (!canAccess) {
    return { success: false, error: "Bu karti silme yetkiniz yok" };
  }

  const { error } = await supabase.from("credit_cards").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/credit-cards");
  revalidatePath("/");
  return { success: true, data: undefined };
}

export async function addCreditCardInstallment(
  cardId: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Oturum bulunamadi" };

  const raw = parseFormData(formData, ["total_amount", "installment_count"]);

  const parsed = creditCardInstallmentSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: getFirstError(parsed.error) };
  }

  const installmentAmount =
    parsed.data.total_amount / parsed.data.installment_count;

  const { error } = await supabase.from("credit_card_installments").insert({
    credit_card_id: cardId,
    merchant_name: parsed.data.merchant_name,
    description: parsed.data.description ?? "",
    total_amount: parsed.data.total_amount,
    installment_count: parsed.data.installment_count,
    installment_amount: Math.round(installmentAmount * 100) / 100,
    paid_installments: 0,
    start_date: parsed.data.start_date,
    is_completed: false,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath(`/credit-cards/${cardId}`);
  revalidatePath("/credit-cards");
  revalidatePath("/");
  return { success: true, data: undefined };
}

export async function markCCInstallmentPaid(
  installmentId: string,
  cardId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Oturum bulunamadi" };

  // Get current installment
  const { data: inst } = await supabase
    .from("credit_card_installments")
    .select("paid_installments, installment_count")
    .eq("id", installmentId)
    .single();

  if (!inst) return { success: false, error: "Taksit bulunamadi" };

  const newPaid = inst.paid_installments + 1;
  const isCompleted = newPaid >= inst.installment_count;

  const { error } = await supabase
    .from("credit_card_installments")
    .update({
      paid_installments: newPaid,
      is_completed: isCompleted,
    })
    .eq("id", installmentId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/credit-cards/${cardId}`);
  revalidatePath("/credit-cards");
  revalidatePath("/");
  return { success: true, data: undefined };
}
