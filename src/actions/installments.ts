"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";

async function checkInstallmentAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  installmentId: string,
  userId: string
): Promise<{ allowed: boolean; error?: string }> {
  // Get installment's loan, then check loan payer
  const { data: installment } = await supabase
    .from("installments")
    .select("loan_id")
    .eq("id", installmentId)
    .single();

  if (!installment) return { allowed: false, error: "Taksit bulunamadi" };

  const { data: loan } = await supabase
    .from("loans")
    .select("payer_id, created_by")
    .eq("id", installment.loan_id)
    .single();

  if (!loan) return { allowed: false, error: "Kredi bulunamadi" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const isAdmin = profile?.role === "admin";
  if (loan.payer_id !== userId && loan.created_by !== userId && !isAdmin) {
    return { allowed: false, error: "Bu taksiti guncelleme yetkiniz yok" };
  }

  return { allowed: true };
}

export async function markInstallmentPaid(
  id: string,
  loanId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Oturum bulunamadi" };

  const access = await checkInstallmentAccess(supabase, id, user.id);
  if (!access.allowed) {
    return { success: false, error: access.error ?? "Yetki hatasi" };
  }

  const { error } = await supabase
    .from("installments")
    .update({ is_paid: true, paid_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/installments");
  revalidatePath(`/loans/${loanId}`);
  revalidatePath("/");
  return { success: true, data: undefined };
}

export async function markInstallmentUnpaid(
  id: string,
  loanId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Oturum bulunamadi" };

  const access = await checkInstallmentAccess(supabase, id, user.id);
  if (!access.allowed) {
    return { success: false, error: access.error ?? "Yetki hatasi" };
  }

  const { error } = await supabase
    .from("installments")
    .update({ is_paid: false, paid_at: null })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/installments");
  revalidatePath(`/loans/${loanId}`);
  revalidatePath("/");
  return { success: true, data: undefined };
}
