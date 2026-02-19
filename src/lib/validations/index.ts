import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "E-posta alani bos birakilamaz")
    .email("Gecerli bir e-posta adresi girin"),
  password: z
    .string()
    .min(1, "Sifre alani bos birakilamaz")
    .min(6, "Sifre en az 6 karakter olmalidir"),
});

export const bankAccountSchema = z.object({
  bank_name: z
    .string()
    .min(1, "Banka adi bos birakilamaz")
    .max(100, "Banka adi en fazla 100 karakter olabilir"),
  account_name: z
    .string()
    .min(1, "Hesap adi bos birakilamaz")
    .max(100, "Hesap adi en fazla 100 karakter olabilir"),
  balance: z
    .number({ error: "Gecerli bir bakiye girin" })
    .finite("Gecerli bir bakiye girin"),
  owner_id: z.string().uuid("Gecersiz kullanici").optional(),
});

export const loanSchema = z
  .object({
    bank_name: z
      .string()
      .min(1, "Banka adi bos birakilamaz")
      .max(100, "Banka adi en fazla 100 karakter olabilir"),
    loan_type: z
      .string()
      .min(1, "Kredi turu bos birakilamaz")
      .max(100, "Kredi turu en fazla 100 karakter olabilir"),
    total_amount: z
      .number({ error: "Gecerli bir tutar girin" })
      .positive("Toplam tutar pozitif olmalidir"),
    monthly_payment: z
      .number({ error: "Gecerli bir tutar girin" })
      .positive("Aylik odeme pozitif olmalidir"),
    start_date: z
      .string()
      .min(1, "Baslangic tarihi bos birakilamaz"),
    end_date: z
      .string()
      .min(1, "Bitis tarihi bos birakilamaz"),
    payer_id: z.string().uuid("Gecersiz kullanici"),
  })
  .refine((data) => new Date(data.end_date) > new Date(data.start_date), {
    message: "Bitis tarihi baslangic tarihinden sonra olmalidir",
    path: ["end_date"],
  });

export const profileSchema = z.object({
  full_name: z
    .string()
    .min(2, "Isim en az 2 karakter olmalidir")
    .max(100, "Isim en fazla 100 karakter olabilir")
    .trim(),
});

// Helper to extract first error message from a ZodError
export function getFirstError(error: z.ZodError): string {
  const issues = error.issues;
  return issues[0]?.message ?? "Gecersiz veri";
}

// Helper to parse FormData into an object with number coercion
export function parseFormData(
  formData: FormData,
  numberFields: string[] = []
): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    if (numberFields.includes(key)) {
      obj[key] = parseFloat(value as string);
    } else {
      obj[key] = value;
    }
  });
  return obj;
}
