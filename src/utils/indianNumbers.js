const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
];

function twoDigit(n) {
  if (n < 20) return ones[n];
  return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
}

function threeDigit(n) {
  if (n >= 100) {
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + twoDigit(n % 100) : '');
  }
  return twoDigit(n);
}

/**
 * Converts a number to Indian words.
 * e.g. 2500000 → "Twenty Five Lakh"
 * e.g. 550000  → "Five Lakh Fifty Thousand"
 */
export function numberToIndianWords(amount) {
  if (amount === 0) return 'Zero';
  amount = Math.round(amount);

  let result = '';
  let remaining = amount;

  const crore = Math.floor(remaining / 10_000_000);
  remaining %= 10_000_000;
  if (crore) result += threeDigit(crore) + ' Crore ';

  const lakh = Math.floor(remaining / 100_000);
  remaining %= 100_000;
  if (lakh) result += twoDigit(lakh) + ' Lakh ';

  const thousand = Math.floor(remaining / 1000);
  remaining %= 1000;
  if (thousand) result += twoDigit(thousand) + ' Thousand ';

  if (remaining) result += threeDigit(remaining);

  return result.trim() + ' Rupees Only';
}

/**
 * Format a number in Indian style with commas.
 * e.g. 2500000 → "25,00,000"
 */
export function formatIndian(num) {
  if (num === null || num === undefined) return '0';
  const n = Math.round(Number(num));
  const s = n.toString();
  if (s.length <= 3) return s;
  // Last 3 digits
  let result = s.slice(-3);
  let rest = s.slice(0, s.length - 3);
  while (rest.length > 2) {
    result = rest.slice(-2) + ',' + result;
    rest = rest.slice(0, rest.length - 2);
  }
  return rest + ',' + result;
}

/**
 * Format in Lakhs shorthand: 500000 → "₹5.00L"
 */
export function formatLakhs(num) {
  if (!num) return '₹0';
  const l = num / 100_000;
  if (l >= 100) return `₹${(l / 100).toFixed(2)}Cr`;
  return `₹${l.toFixed(2)}L`;
}
