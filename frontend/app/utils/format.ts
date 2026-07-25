// Auto-imported by Nuxt (app/utils/*) — no manual import needed in components.

export function formatMoney(value: number | string): string {
  const amount = typeof value === 'string' ? Number(value) : value;
  return `${new Intl.NumberFormat('uz-UZ').format(Math.round(amount))} UZS`;
}
