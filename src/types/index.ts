import type { Database } from "./database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type BankAccount = Database["public"]["Tables"]["bank_accounts"]["Row"];
export type Loan = Database["public"]["Tables"]["loans"]["Row"];
export type Installment = Database["public"]["Tables"]["installments"]["Row"];

export type InsertBankAccount =
  Database["public"]["Tables"]["bank_accounts"]["Insert"];
export type InsertLoan = Database["public"]["Tables"]["loans"]["Insert"];
export type InsertInstallment =
  Database["public"]["Tables"]["installments"]["Insert"];

export type UpdateBankAccount =
  Database["public"]["Tables"]["bank_accounts"]["Update"];
export type UpdateLoan = Database["public"]["Tables"]["loans"]["Update"];
export type UpdateInstallment =
  Database["public"]["Tables"]["installments"]["Update"];

export type LoanWithInstallments = Loan & {
  installments: Installment[];
  payer: Pick<Profile, "id" | "full_name">;
};

export type InstallmentWithLoan = Installment & {
  loan: Pick<Loan, "id" | "bank_name" | "loan_type">;
};

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
