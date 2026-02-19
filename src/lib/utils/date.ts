export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateString));
}

export function formatShortDate(dateString: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateString));
}

export function formatMonthDay(dateString: string): {
  month: string;
  day: string;
} {
  const date = new Date(dateString);
  const month = new Intl.DateTimeFormat("tr-TR", { month: "short" })
    .format(date)
    .toUpperCase();
  const day = date.getDate().toString();
  return { month, day };
}

export function daysUntil(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function isWithinDays(dateString: string, days: number): boolean {
  const d = daysUntil(dateString);
  return d >= 0 && d <= days;
}

export function isThisMonth(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}
