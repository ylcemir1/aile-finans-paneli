import type { Database } from "./database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type BankAccount = Database["public"]["Tables"]["bank_accounts"]["Row"];
export type Loan = Database["public"]["Tables"]["loans"]["Row"];
export type Installment = Database["public"]["Tables"]["installments"]["Row"];
export type CreditCard = Database["public"]["Tables"]["credit_cards"]["Row"];
export type CreditCardInstallment =
  Database["public"]["Tables"]["credit_card_installments"]["Row"];
export type Family = Database["public"]["Tables"]["families"]["Row"];
export type FamilyMember = Database["public"]["Tables"]["family_members"]["Row"];
export type FamilyInvitation =
  Database["public"]["Tables"]["family_invitations"]["Row"];
export type FamilyAuditLog =
  Database["public"]["Tables"]["family_audit_logs"]["Row"];

export type FamilyPermission = {
  can_view_finance: boolean;
  can_create_finance: boolean;
  can_edit_finance: boolean;
  can_delete_finance: boolean;
  can_manage_members: boolean;
  can_manage_invitations: boolean;
  can_assign_permissions: boolean;
};

export type InsertBankAccount =
  Database["public"]["Tables"]["bank_accounts"]["Insert"];
export type InsertLoan = Database["public"]["Tables"]["loans"]["Insert"];
export type InsertInstallment =
  Database["public"]["Tables"]["installments"]["Insert"];
export type InsertCreditCard =
  Database["public"]["Tables"]["credit_cards"]["Insert"];
export type InsertCreditCardInstallment =
  Database["public"]["Tables"]["credit_card_installments"]["Insert"];

export type UpdateBankAccount =
  Database["public"]["Tables"]["bank_accounts"]["Update"];
export type UpdateLoan = Database["public"]["Tables"]["loans"]["Update"];
export type UpdateInstallment =
  Database["public"]["Tables"]["installments"]["Update"];
export type UpdateCreditCard =
  Database["public"]["Tables"]["credit_cards"]["Update"];
export type UpdateCreditCardInstallment =
  Database["public"]["Tables"]["credit_card_installments"]["Update"];

export type LoanWithInstallments = Loan & {
  installments: Installment[];
  payer: Pick<Profile, "id" | "full_name">;
};

export type InstallmentWithLoan = Installment & {
  loan: Pick<Loan, "id" | "bank_name" | "loan_type">;
};

export type CreditCardWithInstallments = CreditCard & {
  credit_card_installments: CreditCardInstallment[];
  owner: Pick<Profile, "id" | "full_name">;
};

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// Loan statuses
export type LoanStatus = "active" | "closed" | "restructured";

// Interest types
export type InterestType = "fixed" | "variable";

// Account types
export type AccountType = "vadesiz" | "vadeli" | "doviz" | "altin" | "yatirim";

// Currencies
export type Currency = "TRY" | "USD" | "EUR" | "GBP" | "XAU";

// Credit card statuses
export type CreditCardStatus = "active" | "blocked" | "closed";

// Loan type constants
export const LOAN_TYPES = [
  { value: "konut", label: "Konut Kredisi" },
  { value: "tasit", label: "Tasit Kredisi" },
  { value: "ihtiyac", label: "Ihtiyac Kredisi" },
  { value: "kobi", label: "KOBi Kredisi" },
  { value: "esnaf", label: "Esnaf Kredisi" },
  { value: "tarim", label: "Tarim Kredisi" },
  { value: "egitim", label: "Egitim Kredisi" },
  { value: "diger", label: "Diger" },
] as const;

// Account type constants
export const ACCOUNT_TYPES = [
  { value: "vadesiz", label: "Vadesiz Hesap" },
  { value: "vadeli", label: "Vadeli Hesap" },
  { value: "doviz", label: "Doviz Hesabi" },
  { value: "altin", label: "Altin Hesabi" },
  { value: "yatirim", label: "Yatirim Hesabi" },
] as const;

// Currency constants
export const CURRENCIES = [
  { value: "TRY", label: "TL", symbol: "₺" },
  { value: "USD", label: "USD", symbol: "$" },
  { value: "EUR", label: "EUR", symbol: "€" },
  { value: "GBP", label: "GBP", symbol: "£" },
  { value: "XAU", label: "Altin (gr)", symbol: "gr" },
] as const;

// Loan status labels
export const LOAN_STATUS_LABELS: Record<LoanStatus, string> = {
  active: "Aktif",
  closed: "Kapali",
  restructured: "Y. Yapilandirilmis",
};

// Credit card status labels
export const CREDIT_CARD_STATUS_LABELS: Record<CreditCardStatus, string> = {
  active: "Aktif",
  blocked: "Blokeli",
  closed: "Kapali",
};
