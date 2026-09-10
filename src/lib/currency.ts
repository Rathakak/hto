/**
 * Cambodian Currency & Exchange Utilities
 * Standard default exchange rate is typically 4,100 KHR per 1 USD
 */

export const DEFAULT_EXCHANGE_RATE = 4100;

/**
 * Cambodian cash rounding rule:
 * Cash change in Cambodian Riel (KHR) is rounded up to the nearest 100 Riels (100៛)
 * because banknotes smaller than 100៛ are not in general circulation.
 */
export function roundKhrTo100(amount: number): number {
  return Math.ceil(amount / 100) * 100;
}

export function usdToKhr(usd: number, exchangeRate: number = DEFAULT_EXCHANGE_RATE): number {
  return roundKhrTo100(usd * exchangeRate);
}

export function khrToUsd(khr: number, exchangeRate: number = DEFAULT_EXCHANGE_RATE): number {
  return exchangeRate > 0 ? Number((khr / exchangeRate).toFixed(2)) : 0;
}

/**
 * Format USD currency
 */
export function formatUsd(amount: number | string): string {
  const val = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
  return `$${val.toFixed(2)}`;
}

/**
 * Format KHR currency with comma separators
 */
export function formatKhr(amount: number | string): string {
  const val = typeof amount === 'string' ? Math.round(parseFloat(amount) || 0) : Math.round(amount);
  return `${val.toLocaleString('en-US')} ៛`;
}

/**
 * Calculate change when receiving mixed cash (USD and/or KHR)
 */
export function calculatePaymentChange({
  totalUsd,
  paidUsd = 0,
  paidKhr = 0,
  exchangeRate = DEFAULT_EXCHANGE_RATE,
}: {
  totalUsd: number;
  paidUsd?: number;
  paidKhr?: number;
  exchangeRate?: number;
}) {
  const totalKhr = roundKhrTo100(totalUsd * exchangeRate);
  const totalPaidInUsd = paidUsd + (paidKhr / exchangeRate);
  const totalPaidInKhr = (paidUsd * exchangeRate) + paidKhr;

  const remainingUsd = totalUsd - totalPaidInUsd;
  const isPaidInFull = totalPaidInUsd >= totalUsd - 0.001;

  // If customer overpaid, calculate change
  let changeUsd = 0;
  let changeKhr = 0;

  if (isPaidInFull) {
    const rawChangeUsd = Math.max(0, totalPaidInUsd - totalUsd);
    // In Cambodia, change can be given in KHR (rounded to 100៛) or whole USD + KHR remainder
    changeUsd = Math.floor(rawChangeUsd);
    const remainderUsd = rawChangeUsd - changeUsd;
    changeKhr = roundKhrTo100(remainderUsd * exchangeRate);

    // If changeUsd is 0 and there is change, all change is in KHR
    const totalChangeKhrAll = roundKhrTo100(rawChangeUsd * exchangeRate);
    
    return {
      totalUsd,
      totalKhr,
      totalPaidInUsd,
      totalPaidInKhr,
      isPaidInFull: true,
      changeUsd,
      changeKhr,
      totalChangeKhrAll,
      remainingUsd: 0,
      remainingKhr: 0,
    };
  }

  return {
    totalUsd,
    totalKhr,
    totalPaidInUsd,
    totalPaidInKhr,
    isPaidInFull: false,
    changeUsd: 0,
    changeKhr: 0,
    totalChangeKhrAll: 0,
    remainingUsd: Math.max(0, remainingUsd),
    remainingKhr: roundKhrTo100(Math.max(0, remainingUsd * exchangeRate)),
  };
}
