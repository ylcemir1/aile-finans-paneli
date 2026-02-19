"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, InsertInstallment } from "@/types";
import { loanSchema, getFirstError, parseFormData } from "@/lib/validations";

/**
 * Correctly calculate installment dates handling month overflow.
 * e.g., Jan 31 -> Feb 28 -> Mar 31 -> Apr 30
 */
function getInstallmentDate(startDate: Date, monthOffset: number): Date {
  const originalDay = startDate.getDate();
  const result = new Date(startDate.getFullYear(), startDate.getMonth() + monthOffset, 1);
  const lastDayOfMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(originalDay, lastDayOfMonth));
  return result;
}

export async function createLoan(
  formData: FormData
): Promise<ActionResult<{ loanId: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Oturum bulunamadi" };

  const raw = parseFormData(formData, ["total_amount", "monthly_payment"]);
  if (!raw.payer_id) raw.payer_id = user.id;

  const parsed = loanSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: getFirstError(parsed.error) };
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
    })
    .select("id")
    .single();

  if (loanError || !loan) {
    return {
      success: false,
      error: loanError?.message ?? "Kredi olusturulamadi",
    };
  }

  // Generate installments with correct date handling
  const installments: InsertInstallment[] = [];
  const start = new Date(parsed.data.start_date);
  const end = new Date(parsed.data.end_date);
  let monthOffset = 0;

  while (true) {
    const dueDate = getInstallmentDate(start, monthOffset);
    if (dueDate > end) break;

    installments.push({
      loan_id: loan.id,
      due_date: dueDate.toISOString().split("T")[0],
      amount: parsed.data.monthly_payment,
      is_paid: false,
    });
    monthOffset++;

    // Safety limit
    if (monthOffset > 600) break;
  }

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
  const { data: loan } = await supabase
    .from("loans")
    .select("created_by")
    .eq("id", id)
    .single();

  if (!loan) return { success: false, error: "Kredi bulunamadi" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  if (loan.created_by !== user.id && !isAdmin) {
    return { success: false, error: "Bu krediyi duzenleme yetkiniz yok" };
  }

  const { error } = await supabase
    .from("loans")
    .update({
      bank_name: formData.get("bank_name") as string,
      loan_type: formData.get("loan_type") as string,
      total_amount: parseFloat(formData.get("total_amount") as string),
      monthly_payment: parseFloat(formData.get("monthly_payment") as string),
      start_date: formData.get("start_date") as string,
      end_date: formData.get("end_date") as string,
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
    .select("created_by")
    .eq("id", id)
    .single();

  if (!loan) return { success: false, error: "Kredi bulunamadi" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  if (loan.created_by !== user.id && !isAdmin) {
    return { success: false, error: "Bu krediyi silme yetkiniz yok" };
  }

  const { error } = await supabase.from("loans").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/loans");
  revalidatePath("/");
  return { success: true, data: undefined };
}
