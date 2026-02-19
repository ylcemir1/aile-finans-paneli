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
  iban: z.string().max(34, "IBAN en fazla 34 karakter olabilir").optional().default(""),
  account_type: z.string().optional().default("vadesiz"),
  currency: z.string().optional().default("TRY"),
  account_number: z.string().max(30, "Hesap numarasi en fazla 30 karakter olabilir").optional().default(""),
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
    interest_rate: z
      .number({ error: "Gecerli bir oran girin" })
      .min(0, "Faiz orani negatif olamaz")
      .max(100, "Faiz orani 100'den buyuk olamaz")
      .optional()
      .default(0),
    interest_type: z
      .string()
      .optional()
      .default("fixed"),
    paid_amount: z
      .number({ error: "Gecerli bir tutar girin" })
      .min(0, "Odenen tutar negatif olamaz")
      .optional()
      .default(0),
    installment_count: z
      .number({ error: "Gecerli bir sayi girin" })
      .int("Tam sayi olmalidir")
      .min(1, "Taksit sayisi en az 1 olmalidir")
      .max(600, "Taksit sayisi en fazla 600 olabilir")
      .optional(),
    paid_installment_count: z
      .number({ error: "Gecerli bir sayi girin" })
      .int("Tam sayi olmalidir")
      .min(0, "Odenmis taksit sayisi negatif olamaz")
      .optional()
      .default(0),
    grace_period_months: z
      .number({ error: "Gecerli bir sayi girin" })
      .int("Tam sayi olmalidir")
      .min(0, "Odemesiz donem negatif olamaz")
      .optional()
      .default(0),
    statement_day: z
      .number({ error: "Gecerli bir gun girin" })
      .int("Tam sayi olmalidir")
      .min(1, "Kesim gunu 1-31 arasi olmalidir")
      .max(31, "Kesim gunu 1-31 arasi olmalidir")
      .nullable()
      .optional(),
    due_day: z
      .number({ error: "Gecerli bir gun girin" })
      .int("Tam sayi olmalidir")
      .min(1, "Son odeme gunu 1-31 arasi olmalidir")
      .max(31, "Son odeme gunu 1-31 arasi olmalidir")
      .nullable()
      .optional(),
    notes: z
      .string()
      .max(500, "Notlar en fazla 500 karakter olabilir")
      .optional()
      .default(""),
  })
  .refine((data) => new Date(data.end_date) > new Date(data.start_date), {
    message: "Bitis tarihi baslangic tarihinden sonra olmalidir",
    path: ["end_date"],
  });

export const loanUpdateSchema = z
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
    interest_rate: z
      .number({ error: "Gecerli bir oran girin" })
      .min(0, "Faiz orani negatif olamaz")
      .max(100, "Faiz orani 100'den buyuk olamaz")
      .optional()
      .default(0),
    interest_type: z
      .string()
      .optional()
      .default("fixed"),
    grace_period_months: z
      .number({ error: "Gecerli bir sayi girin" })
      .int("Tam sayi olmalidir")
      .min(0, "Odemesiz donem negatif olamaz")
      .optional()
      .default(0),
    statement_day: z
      .number({ error: "Gecerli bir gun girin" })
      .int("Tam sayi olmalidir")
      .min(1, "Kesim gunu 1-31 arasi olmalidir")
      .max(31, "Kesim gunu 1-31 arasi olmalidir")
      .nullable()
      .optional(),
    due_day: z
      .number({ error: "Gecerli bir gun girin" })
      .int("Tam sayi olmalidir")
      .min(1, "Son odeme gunu 1-31 arasi olmalidir")
      .max(31, "Son odeme gunu 1-31 arasi olmalidir")
      .nullable()
      .optional(),
    status: z
      .string()
      .optional()
      .default("active"),
    notes: z
      .string()
      .max(500, "Notlar en fazla 500 karakter olabilir")
      .optional()
      .default(""),
    installment_count: z
      .number({ error: "Gecerli bir sayi girin" })
      .int("Tam sayi olmalidir")
      .min(1, "Taksit sayisi en az 1 olmalidir")
      .max(600, "Taksit sayisi en fazla 600 olabilir")
      .optional(),
    paid_installment_count: z
      .number({ error: "Gecerli bir sayi girin" })
      .int("Tam sayi olmalidir")
      .min(0, "Odenmis taksit sayisi negatif olamaz")
      .optional()
      .default(0),
    regenerate_installments: z
      .boolean()
      .optional()
      .default(false),
  })
  .refine((data) => new Date(data.end_date) > new Date(data.start_date), {
    message: "Bitis tarihi baslangic tarihinden sonra olmalidir",
    path: ["end_date"],
  });

export const creditCardSchema = z.object({
  card_name: z
    .string()
    .min(1, "Kart adi bos birakilamaz")
    .max(100, "Kart adi en fazla 100 karakter olabilir"),
  bank_name: z
    .string()
    .min(1, "Banka adi bos birakilamaz")
    .max(100, "Banka adi en fazla 100 karakter olabilir"),
  card_limit: z
    .number({ error: "Gecerli bir limit girin" })
    .positive("Kart limiti pozitif olmalidir"),
  current_balance: z
    .number({ error: "Gecerli bir tutar girin" })
    .min(0, "Guncel borc negatif olamaz")
    .optional()
    .default(0),
  minimum_payment: z
    .number({ error: "Gecerli bir tutar girin" })
    .min(0, "Asgari odeme negatif olamaz")
    .optional()
    .default(0),
  statement_day: z
    .number({ error: "Gecerli bir gun girin" })
    .int("Tam sayi olmalidir")
    .min(1, "Ekstre kesim gunu 1-31 arasi olmalidir")
    .max(31, "Ekstre kesim gunu 1-31 arasi olmalidir"),
  due_day: z
    .number({ error: "Gecerli bir gun girin" })
    .int("Tam sayi olmalidir")
    .min(1, "Son odeme gunu 1-31 arasi olmalidir")
    .max(31, "Son odeme gunu 1-31 arasi olmalidir"),
  status: z.string().optional().default("active"),
  notes: z
    .string()
    .max(500, "Notlar en fazla 500 karakter olabilir")
    .optional()
    .default(""),
  owner_id: z.string().uuid("Gecersiz kullanici").optional(),
});

export const creditCardInstallmentSchema = z.object({
  merchant_name: z
    .string()
    .min(1, "Magaza adi bos birakilamaz")
    .max(200, "Magaza adi en fazla 200 karakter olabilir"),
  description: z
    .string()
    .max(500, "Aciklama en fazla 500 karakter olabilir")
    .optional()
    .default(""),
  total_amount: z
    .number({ error: "Gecerli bir tutar girin" })
    .positive("Toplam tutar pozitif olmalidir"),
  installment_count: z
    .number({ error: "Gecerli bir sayi girin" })
    .int("Tam sayi olmalidir")
    .min(2, "Taksit sayisi en az 2 olmalidir")
    .max(48, "Taksit sayisi en fazla 48 olabilir"),
  start_date: z
    .string()
    .min(1, "Baslangic tarihi bos birakilamaz"),
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
      const parsed = parseFloat(value as string);
      obj[key] = isNaN(parsed) ? null : parsed;
    } else {
      obj[key] = value;
    }
  });
  return obj;
}
