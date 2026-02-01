export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('it-IT', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
