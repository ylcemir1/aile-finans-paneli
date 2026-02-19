"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";

async function checkInstallmentAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  installmentId: string,
  userId: string
): Promise<{ allowed: boolean; error?: string; loanId?: string }> {
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

  return { allowed: true, loanId: installment.loan_id };
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

  // Get installment amount for loan balance update
  const { data: installment } = await supabase
    .from("installments")
    .select("amount")
    .eq("id", id)
    .single();

  if (!installment) return { success: false, error: "Taksit bulunamadi" };

  // Mark installment as paid
  const { error } = await supabase
    .from("installments")
    .update({ is_paid: true, paid_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  // Update loan paid_amount and remaining_balance
  const { data: loan } = await supabase
    .from("loans")
    .select("total_amount, paid_amount")
    .eq("id", loanId)
    .single();

  if (loan) {
    const newPaidAmount = (loan.paid_amount ?? 0) + installment.amount;
    const newRemainingBalance = loan.total_amount - newPaidAmount;

    const updateData: Record<string, unknown> = {
      paid_amount: newPaidAmount,
      remaining_balance: Math.max(0, newRemainingBalance),
      updated_at: new Date().toISOString(),
    };

    // Check if all installments are paid -> auto-close loan
    const { data: allInstallments } = await supabase
      .from("installments")
      .select("is_paid")
      .eq("loan_id", loanId);

    if (allInstallments && allInstallments.every((i) => i.is_paid)) {
      updateData.status = "closed";
    }

    await supabase.from("loans").update(updateData).eq("id", loanId);
  }

  revalidatePath("/installments");
  revalidatePath(`/loans/${loanId}`);
  revalidatePath("/loans");
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

  // Get installment amount for loan balance update
  const { data: installment } = await supabase
    .from("installments")
    .select("amount")
    .eq("id", id)
    .single();

  if (!installment) return { success: false, error: "Taksit bulunamadi" };

  // Mark installment as unpaid
  const { error } = await supabase
    .from("installments")
    .update({ is_paid: false, paid_at: null })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  // Update loan paid_amount and remaining_balance
  const { data: loan } = await supabase
    .from("loans")
    .select("total_amount, paid_amount")
    .eq("id", loanId)
    .single();

  if (loan) {
    const newPaidAmount = Math.max(0, (loan.paid_amount ?? 0) - installment.amount);
    const newRemainingBalance = loan.total_amount - newPaidAmount;

    await supabase
      .from("loans")
      .update({
        paid_amount: newPaidAmount,
        remaining_balance: Math.max(0, newRemainingBalance),
        status: "active", // Re-open if was closed
        updated_at: new Date().toISOString(),
      })
      .eq("id", loanId);
  }

  revalidatePath("/installments");
  revalidatePath(`/loans/${loanId}`);
  revalidatePath("/loans");
  revalidatePath("/");
  return { success: true, data: undefined };
}
