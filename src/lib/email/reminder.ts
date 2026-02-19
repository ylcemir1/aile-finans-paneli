import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

interface InstallmentInfo {
  bankName: string;
  loanType: string;
  amount: number;
  dueDate: string;
  daysLeft: number;
  installmentNumber: number;
}

interface ReminderEmailParams {
  to: string;
  userName: string;
  installments: InstallmentInfo[];
  type: "upcoming" | "due_today" | "overdue";
}

function formatTRY(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDateTR(dateStr: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

function getSubject(type: ReminderEmailParams["type"], count: number): string {
  switch (type) {
    case "due_today":
      return `Bugun ${count} taksit odemeniz var`;
    case "overdue":
      return `${count} geciken taksitiniz var!`;
    case "upcoming":
      return `Yaklasan ${count} taksit hatirlatmasi`;
  }
}

function getHeaderColor(type: ReminderEmailParams["type"]): string {
  switch (type) {
    case "due_today":
      return "#f59e0b";
    case "overdue":
      return "#ef4444";
    case "upcoming":
      return "#3b82f6";
  }
}

function getHeaderIcon(type: ReminderEmailParams["type"]): string {
  switch (type) {
    case "due_today":
      return "Bugun Odenmesi Gereken Taksitler";
    case "overdue":
      return "Geciken Taksitler";
    case "upcoming":
      return "Yaklasan Taksitler";
  }
}

function buildHTML(params: ReminderEmailParams): string {
  const { userName, installments, type } = params;
  const headerColor = getHeaderColor(type);
  const headerTitle = getHeaderIcon(type);
  const totalAmount = installments.reduce((s, i) => s + i.amount, 0);

  const rows = installments
    .map(
      (inst) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9">
        <strong style="color:#1e293b;font-size:14px">${inst.bankName}</strong>
        <br><span style="color:#64748b;font-size:12px">${inst.loanType} - Taksit #${inst.installmentNumber}</span>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;text-align:right">
        <strong style="color:#1e293b;font-size:14px">${formatTRY(inst.amount)}</strong>
        <br><span style="color:#64748b;font-size:12px">${formatDateTR(inst.dueDate)}</span>
      </td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px">
    <div style="background:${headerColor};border-radius:16px 16px 0 0;padding:24px 24px 20px">
      <h1 style="color:#fff;font-size:18px;margin:0 0 4px">Aile Finans Paneli</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:0">${headerTitle}</p>
    </div>
    <div style="background:#fff;padding:24px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none">
      <p style="color:#475569;font-size:14px;margin:0 0 16px">
        Merhaba <strong>${userName}</strong>,
      </p>
      <p style="color:#475569;font-size:14px;margin:0 0 20px">
        ${type === "overdue" ? "Asagidaki taksitlerinizin odeme tarihi gecmistir. Lutfen en kisa surede odeme yapin." : type === "due_today" ? "Bugun odenmesi gereken taksitleriniz:" : "Onumuzdeki 3 gun icinde odenmesi gereken taksitleriniz:"}
      </p>
      <table style="width:100%;border-collapse:collapse;background:#fafbfc;border-radius:8px;overflow:hidden">
        <thead>
          <tr style="background:#f1f5f9">
            <th style="padding:10px 16px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Kredi</th>
            <th style="padding:10px 16px;text-align:right;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Tutar</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr style="background:#f1f5f9">
            <td style="padding:12px 16px;font-size:13px;font-weight:700;color:#1e293b">Toplam</td>
            <td style="padding:12px 16px;font-size:15px;font-weight:700;color:${headerColor};text-align:right">${formatTRY(totalAmount)}</td>
          </tr>
        </tfoot>
      </table>
      <div style="margin-top:24px;text-align:center">
        <a href="https://aile-finans-paneli.vercel.app/loans" style="display:inline-block;background:${headerColor};color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">Panele Git</a>
      </div>
      <p style="color:#94a3b8;font-size:11px;text-align:center;margin:24px 0 0">
        Bu email Aile Finans Paneli tarafindan otomatik gonderilmistir.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendReminderEmail(params: ReminderEmailParams) {
  const subject = getSubject(params.type, params.installments.length);

  const { error } = await getResend().emails.send({
    from: "Aile Finans <onboarding@resend.dev>",
    to: params.to,
    subject,
    html: buildHTML(params),
  });

  if (error) {
    console.error("[Email Error]", JSON.stringify(error));
    return { success: false, error: error.message || JSON.stringify(error) };
  }
  return { success: true, error: null };
}