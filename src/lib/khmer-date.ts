/**
 * Khmer Numerals and Date Formatting Utilities
 */

export const KHMER_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];

export const KHMER_DAYS = [
  'ថ្ងៃអាទិត្យ',
  'ថ្ងៃច័ន្ទ',
  'ថ្ងៃអង្គារ',
  'ថ្ងៃពុធ',
  'ថ្ងៃព្រហស្បតិ៍',
  'ថ្ងៃសុក្រ',
  'ថ្ងៃសៅរ៍',
];

export const KHMER_MONTHS = [
  'មករា',
  'កុម្ភៈ',
  'មីនា',
  'មេសា',
  'ឧសភា',
  'មិថុនា',
  'កក្កដា',
  'សីហា',
  'កញ្ញា',
  'តុលា',
  'វិច្ឆិកា',
  'ធ្នូ',
];

/**
 * Converts numbers or strings containing Arabic digits to Khmer digits
 */
export function toKhmerDigits(input: number | string | null | undefined): string {
  if (input === null || input === undefined) return '';
  return String(input).replace(/[0-9]/g, (digit) => KHMER_DIGITS[parseInt(digit, 10)]);
}

/**
 * Format a Date object or timestamp into full Khmer date string
 * e.g., "ថ្ងៃច័ន្ទ ១២ សីហា ២០២៦ ម៉ោង ១៤:៣០"
 */
export function formatKhmerDate(
  dateInput: Date | string | number,
  options: { includeTime?: boolean; useKhmerDigits?: boolean } = {
    includeTime: true,
    useKhmerDigits: false,
  }
): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  const dayName = KHMER_DAYS[d.getDay()];
  const dayNum = d.getDate();
  const monthName = KHMER_MONTHS[d.getMonth()];
  const year = d.getFullYear();

  const formattedDay = options.useKhmerDigits ? toKhmerDigits(dayNum) : dayNum;
  const formattedYear = options.useKhmerDigits ? toKhmerDigits(year) : year;

  let result = `${dayName} ${formattedDay} ${monthName} ${formattedYear}`;

  if (options.includeTime) {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    const formattedTime = options.useKhmerDigits ? toKhmerDigits(timeStr) : timeStr;
    result += ` ម៉ោង ${formattedTime}`;
  }

  return result;
}

/**
 * Short relative or table time in Khmer (e.g., "5 នាទីមុន")
 */
export function getElapsedTimeMinutes(dateInput: Date | string | number): number {
  const d = new Date(dateInput);
  const diffMs = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diffMs / 60000));
}
