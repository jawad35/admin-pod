export function formatCurrency(amount: string | number) {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
}

export function formatCurrencyWithDecimals(amount: string | number) {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

export function parseCurrency(currencyString: string): number {
  return parseFloat(currencyString.replace(/[^\d.-]/g, ''));
}
