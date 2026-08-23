export function formatMoney(value: number | string) {
  return new Intl.NumberFormat(undefined, {
    currency: 'EUR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(Number(value))
}
