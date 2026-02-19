import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReminderEmail } from "@/lib/email/reminder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const LOAN_TYPE_LABELS: Record<string, string> = {
  konut: "Konut Kredisi",
  tasit: "Tasit Kredisi",
  ihtiyac: "Ihtiyac Kredisi",
  kobi: "KOBi Kredisi",
  esnaf: "Esnaf Kredisi",
  tarim: "Tarim Kredisi",
  egitim: "Egitim Kredisi",
  diger: "Diger",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const isTest = url.searchParams.get("test") === "1";

  if (!isTest) {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createAdminClient();
  const today = new Date();
  const todayStr = toDateStr(today);

  const threeDaysLater = new Date(today);
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  const threeDaysStr = toDateStr(threeDaysLater);

  const [
    { data: overdueInstallments },
    { data: todayInstallments },
    { data: upcomingInstallments },
  ] = await Promise.all([
    supabase
      .from("installments")
      .select("*, loan:loans(id, bank_name, loan_type, payer_id)")
      .eq("is_paid", false)
      .lt("due_date", todayStr)
      .order("due_date", { ascending: true }),
    supabase
      .from("installments")
      .select("*, loan:loans(id, bank_name, loan_type, payer_id)")
      .eq("is_paid", false)
      .eq("due_date", todayStr)
      .order("due_date", { ascending: true }),
    supabase
      .from("installments")
      .select("*, loan:loans(id, bank_name, loan_type, payer_id)")
      .eq("is_paid", false)
      .gt("due_date", todayStr)
      .lte("due_date", threeDaysStr)
      .order("due_date", { ascending: true }),
  ]);

  const allInstallments = [
    ...(overdueInstallments ?? []).map((i) => ({ ...i, _type: "overdue" as const })),
    ...(todayInstallments ?? []).map((i) => ({ ...i, _type: "due_today" as const })),
    ...(upcomingInstallments ?? []).map((i) => ({ ...i, _type: "upcoming" as const })),
  ];

  if (allInstallments.length === 0 && !isTest) {
    return NextResponse.json({ message: "No reminders needed", sent: 0 });
  }

  // Test mode: fetch all unpaid installments if no natural reminders exist
  if (isTest && allInstallments.length === 0) {
    const { data: testInstallments } = await supabase
      .from("installments")
      .select("*, loan:loans(id, bank_name, loan_type, payer_id)")
      .eq("is_paid", false)
      .order("due_date", { ascending: true })
      .limit(5);

    if (!testInstallments || testInstallments.length === 0) {
      return NextResponse.json({ message: "No unpaid installments found for test", sent: 0 });
    }

    for (const inst of testInstallments) {
      allInstallments.push({ ...inst, _type: "upcoming" as const });
    }
  }

  const payerIds = [...new Set(allInstallments.map((i) => i.loan?.payer_id).filter(Boolean))] as string[];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", payerIds);

  const { data: authUsers } = await supabase.auth.admin.listUsers();

  const userEmailMap = new Map<string, string>();
  const userNameMap = new Map<string, string>();

  for (const u of authUsers?.users ?? []) {
    if (u.email) userEmailMap.set(u.id, u.email);
  }
  for (const p of profiles ?? []) {
    userNameMap.set(p.id, p.full_name || userEmailMap.get(p.id) || "Kullanici");
  }

  type GroupKey = string;
  const grouped = new Map<GroupKey, typeof allInstallments>();
  for (const inst of allInstallments) {
    const payerId = inst.loan?.payer_id;
    if (!payerId) continue;
    const key = `${payerId}__${inst._type}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(inst);
  }

  let sentCount = 0;
  const errors: string[] = [];

  for (const [key, installments] of grouped) {
    const [payerId, type] = key.split("__") as [string, "overdue" | "due_today" | "upcoming"];
    const email = userEmailMap.get(payerId);
    if (!email) {
      errors.push(`No email found for payer ${payerId}`);
      continue;
    }

    const userName = userNameMap.get(payerId) || "Kullanici";

    const daysUntilFn = (d: string) => {
      const dt = new Date(d);
      dt.setHours(0, 0, 0, 0);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return Math.ceil((dt.getTime() - now.getTime()) / 86400000);
    };

    const mapped = installments.map((inst) => ({
      bankName: inst.loan?.bank_name ?? "Bilinmiyor",
      loanType: LOAN_TYPE_LABELS[inst.loan?.loan_type ?? ""] ?? inst.loan?.loan_type ?? "Kredi",
      amount: Number(inst.amount),
      dueDate: inst.due_date,
      daysLeft: daysUntilFn(inst.due_date),
      installmentNumber: inst.installment_number ?? 0,
    }));

    const success = await sendReminderEmail({
      to: email,
      userName,
      installments: mapped,
      type,
    });

    if (success) {
      sentCount++;
    } else {
      errors.push(`Failed to send email to ${email}`);
    }
  }

  return NextResponse.json({
    message: sentCount > 0 ? "Reminders sent successfully" : "No emails sent",
    sent: sentCount,
    totalInstallments: allInstallments.length,
    overdue: overdueInstallments?.length ?? 0,
    dueToday: todayInstallments?.length ?? 0,
    upcoming: upcomingInstallments?.length ?? 0,
    payerCount: payerIds.length,
    emailCount: userEmailMap.size,
    isTest,
    errors: errors.length > 0 ? errors : undefined,
  });
}