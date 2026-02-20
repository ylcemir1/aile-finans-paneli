"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";
import {
  loanSchema,
  loanUpdateSchema,
  getFirstError,
  parseFormData,
} from "@/lib/validations";
import { generateInstallmentSchedule } from "@/lib/utils/loan-calculations";
import {
  getUserRole,
  getUserFamilyMembership,
  canAccessFinanceEntity,
  hasFamilyPermission,
} from "@/lib/auth/family-permissions";

export async function createLoan(
  formData: FormData
): Promise<ActionResult<{ loanId: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Oturum bulunamadi" };

  const raw = parseFormData(formData, [
    "total_amount",
    "monthly_payment",
    "interest_rate",
    "paid_amount",
    "grace_period_months",
    "statement_day",
    "due_day",
    "installment_count",
    "paid_installment_count",
  ]);
  if (!raw.payer_id) raw.payer_id = user.id;

  const parsed = loanSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: getFirstError(parsed.error) };
  }

  const installmentCount = parsed.data.installment_count;
  const paidInstallmentCount = parsed.data.paid_installment_count ?? 0;
  const paidAmount = installmentCount
    ? paidInstallmentCount * parsed.data.monthly_payment
    : (parsed.data.paid_amount ?? 0);
  const remainingBalance = parsed.data.total_amount - paidAmount;

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

  const { data: loan, error: loanError } = await supabase
    .from("loans")
    .insert({
      bank_name: parsed.data.bank_name,
      loan_type: parsed.data.loan_type,
      total_amount: parsed.data.total_amount,
      monthly_payment: parsed.data.monthly_payment,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      payer_id: parsed.data.payer_id,
      created_by: user.id,
      interest_rate: parsed.data.interest_rate ?? 0,
      interest_type: parsed.data.interest_type ?? "fixed",
      paid_amount: paidAmount,
      remaining_balance: remainingBalance,
      status: "active",
      grace_period_months: parsed.data.grace_period_months ?? 0,
      statement_day: parsed.data.statement_day ?? null,
      due_day: parsed.data.due_day ?? null,
      notes: parsed.data.notes ?? "",
      family_id: targetFamilyId,
    })
    .select("id")
    .single();

  if (loanError || !loan) {
    return {
      success: false,
      error: loanError?.message ?? "Kredi olusturulamadi",
    };
  }

  const installments = generateInstallmentSchedule({
    loanId: loan.id,
    startDate: parsed.data.start_date,
    endDate: parsed.data.end_date,
    monthlyPayment: parsed.data.monthly_payment,
    dueDay: parsed.data.due_day,
    gracePeriodMonths: parsed.data.grace_period_months,
    paidAmount: installmentCount ? 0 : paidAmount,
    installmentCount,
    paidInstallmentCount,
  });

  if (installments.length > 0) {
    const { error: installError } = await supabase
      .from("installments")
      .insert(installments);

    if (installError) {
      await supabase.from("loans").delete().eq("id", loan.id);
      return { success: false, error: "Taksitler olusturulamadi" };
    }
  }

  revalidatePath("/loans");
  revalidatePath("/");
  return { success: true, data: { loanId: loan.id } };
}

export async function updateLoan(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Oturum bulunamadi" };

  // Ownership check
  const { data: existingLoan } = await supabase
    .from("loans")
    .select("payer_id, created_by, paid_amount, total_amount, family_id")
    .eq("id", id)
    .single();

  if (!existingLoan) return { success: false, error: "Kredi bulunamadi" };

  const isAdmin = (await getUserRole(supabase, user.id)) === "admin";
  const canAccess = await canAccessFinanceEntity(supabase, {
    userId: user.id,
    isAdmin,
    ownerId: existingLoan.payer_id,
    creatorId: existingLoan.created_by,
    familyId: existingLoan.family_id,
    permission: "edit_finance",
  });
  if (!canAccess) {
    return { success: false, error: "Bu krediyi duzenleme yetkiniz yok" };
  }

  const raw = parseFormData(formData, [
    "total_amount",
    "monthly_payment",
    "interest_rate",
    "grace_period_months",
    "statement_day",
    "due_day",
    "installment_count",
    "paid_installment_count",
  ]);

  // Handle regenerate_installments checkbox
  raw.regenerate_installments = formData.get("regenerate_installments") === "true";

  const parsed = loanUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: getFirstError(parsed.error) };
  }

  // Recalculate remaining balance
  const currentPaidAmount = existingLoan.paid_amount ?? 0;
  const remainingBalance = parsed.data.total_amount - currentPaidAmount;

  const { error } = await supabase
    .from("loans")
    .update({
      bank_name: parsed.data.bank_name,
      loan_type: parsed.data.loan_type,
      total_amount: parsed.data.total_amount,
      monthly_payment: parsed.data.monthly_payment,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      interest_rate: parsed.data.interest_rate ?? 0,
      interest_type: parsed.data.interest_type ?? "fixed",
      remaining_balance: remainingBalance,
      status: parsed.data.status ?? "active",
      grace_period_months: parsed.data.grace_period_months ?? 0,
      statement_day: parsed.data.statement_day ?? null,
      due_day: parsed.data.due_day ?? null,
      notes: parsed.data.notes ?? "",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  // Optionally regenerate installments
  if (parsed.data.regenerate_installments) {
    // Delete existing installments
    await supabase.from("installments").delete().eq("loan_id", id);

    // Generate new installments
    const installments = generateInstallmentSchedule({
      loanId: id,
      startDate: parsed.data.start_date,
      endDate: parsed.data.end_date,
      monthlyPayment: parsed.data.monthly_payment,
      dueDay: parsed.data.due_day,
      gracePeriodMonths: parsed.data.grace_period_months,
      paidAmount: currentPaidAmount,
    });

    if (installments.length > 0) {
      await supabase.from("installments").insert(installments);
    }

    // Recalculate paid_amount from fresh installments
    const { data: freshInstallments } = await supabase
      .from("installments")
      .select("amount, is_paid")
      .eq("loan_id", id);

    if (freshInstallments) {
      const newPaidAmount = freshInstallments
        .filter((i) => i.is_paid)
        .reduce((sum, i) => sum + i.amount, 0);

      await supabase
        .from("loans")
        .update({
          paid_amount: newPaidAmount,
          remaining_balance: parsed.data.total_amount - newPaidAmount,
        })
        .eq("id", id);
    }
  }

  revalidatePath("/loans");
  revalidatePath(`/loans/${id}`);
  revalidatePath("/");
  return { success: true, data: undefined };
}

export async function closeLoan(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Oturum bulunamadi" };

  // Ownership check
  const { data: loan } = await supabase
    .from("loans")
    .select("payer_id, created_by, family_id")
    .eq("id", id)
    .single();

  if (!loan) return { success: false, error: "Kredi bulunamadi" };

  const isAdmin = (await getUserRole(supabase, user.id)) === "admin";
  const canAccess = await canAccessFinanceEntity(supabase, {
    userId: user.id,
    isAdmin,
    ownerId: loan.payer_id,
    creatorId: loan.created_by,
    familyId: loan.family_id,
    permission: "edit_finance",
  });
  if (!canAccess) {
    return { success: false, error: "Bu krediyi kapatma yetkiniz yok" };
  }

  const { error } = await supabase
    .from("loans")
    .update({
      status: "closed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/loans");
  revalidatePath(`/loans/${id}`);
  revalidatePath("/");
  return { success: true, data: undefined };
}

export async function deleteLoan(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Oturum bulunamadi" };

  // Ownership check
  const { data: loan } = await supabase
    .from("loans")
    .select("payer_id, created_by, family_id")
    .eq("id", id)
    .single();

  if (!loan) return { success: false, error: "Kredi bulunamadi" };

  const isAdmin = (await getUserRole(supabase, user.id)) === "admin";
  const canAccess = await canAccessFinanceEntity(supabase, {
    userId: user.id,
    isAdmin,
    ownerId: loan.payer_id,
    creatorId: loan.created_by,
    familyId: loan.family_id,
    permission: "delete_finance",
  });
  if (!canAccess) {
    return { success: false, error: "Bu krediyi silme yetkiniz yok" };
  }

  const { error } = await supabase.from("loans").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/loans");
  revalidatePath("/");
  return { success: true, data: undefined };
}
