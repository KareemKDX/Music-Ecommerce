// "2026-10-27" → "tisdag 27/10"
export function formatDeliveryDate(date: string): string {
  return new Date(date).toLocaleDateString("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
  });
}
