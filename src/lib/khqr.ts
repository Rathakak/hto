/**
 * Bakong KHQR (National Bank of Cambodia standard QR) generator and payload helper
 */

export interface KhqrPayloadOptions {
  bakongAccountId?: string;
  merchantName?: string;
  merchantCity?: string;
  amount: number;
  currency: 'USD' | 'KHR';
  orderNumber: string;
}

/**
 * Generate standard Bakong EMVCo TLV (Tag-Length-Value) string for KHQR
 */
export function generateKhqrPayload({
  bakongAccountId = 'restaurant_cambodia@aba',
  merchantName = 'BOPHA ANGKOR RESTAURANT',
  merchantCity = 'Phnom Penh',
  amount,
  currency = 'USD',
  orderNumber,
}: KhqrPayloadOptions): string {
  // Simple EMVCo QR representation for Cambodian Bakong KHQR
  const currencyCode = currency === 'USD' ? '840' : '116';
  const formattedAmount = currency === 'USD' ? amount.toFixed(2) : Math.round(amount).toString();

  // Create standard KHQR simulated QR data
  return `00020101021229370016bakong@abaa0110${bakongAccountId}520458125303${currencyCode}54${String(
    formattedAmount.length
  ).padStart(2, '0')}${formattedAmount}5802KH59${String(merchantName.length).padStart(
    2,
    '0'
  )}${merchantName}60${String(merchantCity.length).padStart(2, '0')}${merchantCity}62${String(
    orderNumber.length + 4
  ).padStart(2, '0')}0104${orderNumber}6304ABCD`;
}
