export function formatCurrency(value: number | null | undefined, fractionDigits = 2): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    useGrouping: 'always',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatPercent(value: number | null | undefined, fractionDigits = 2): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('it-IT', {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/** A plain number with Italian grouping and no currency sign */
export function formatNumber(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat('it-IT', {
    useGrouping: 'always',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}
