const CURRENCY_CONFIG: Record<
  string,
  { currency: string; locale: string; suffix?: string }
> = {
  TRY: { currency: "TRY", locale: "tr-TR" },
  USD: { currency: "USD", locale: "en-US" },
  EUR: { currency: "EUR", locale: "de-DE" },
  GBP: { currency: "GBP", locale: "en-GB" },
  XAU: { currency: "TRY", locale: "tr-TR", suffix: " gr" },
};

export function formatCurrency(
  amount: number,
  currencyCode: string = "TRY"
): string {
  const config = CURRENCY_CONFIG[currencyCode] ?? CURRENCY_CONFIG.TRY;

  if (currencyCode === "XAU") {
    // Gold: show as grams with TRY formatting but replace currency symbol
    const formatted = new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${formatted} gr`;
  }

  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
