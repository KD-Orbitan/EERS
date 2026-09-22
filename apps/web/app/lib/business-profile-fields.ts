export const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const PRICE_UNITS = ['person', 'item', 'service', 'hour', 'night'] as const;
export const AMENITIES = ['Wi-Fi', 'Parking', 'Air conditioning', 'Wheelchair access', 'Outdoor seating', 'Delivery', 'Takeaway', 'Reservations', 'Pet friendly'];
export const PAYMENTS = ['Cash', 'Bank transfer', 'Credit / debit card', 'MoMo', 'ZaloPay', 'VNPay'];
export type DayHours = { status: 'Not specified' | 'Closed' | '24 hours' | 'Open'; start: string; end: string };
export const emptyWeek = (): DayHours[] => WEEK_DAYS.map(() => ({ status: 'Not specified', start: '08:00', end: '18:00' }));
export function formatHours(days: DayHours[]) {
  if (days.every(day => day.status === 'Not specified')) return '';
  return days.map((day, i) => `${WEEK_DAYS[i]}: ${day.status === 'Open' ? `${day.start}-${day.end}${day.end < day.start ? ' (next day)' : ''}` : day.status}`).join('\n');
}
export function parseHours(value: string): DayHours[] | null {
  if (!value) return emptyWeek();
  const lines = value.split('\n');
  if (lines.length !== 7) return null;
  const result = emptyWeek();
  for (let i = 0; i < 7; i++) {
    if (!lines[i].startsWith(`${WEEK_DAYS[i]}: `)) return null;
    const text = lines[i].slice(WEEK_DAYS[i].length + 2);
    if (['Not specified', 'Closed', '24 hours'].includes(text)) result[i].status = text as DayHours['status'];
    else {
      const match = text.match(/^([0-2]\d:[0-5]\d)-([0-2]\d:[0-5]\d)(?: \(next day\))?$/);
      if (!match || Number(match[1].slice(0, 2)) > 23 || Number(match[2].slice(0, 2)) > 23 || match[1] === match[2]) return null;
      result[i] = { status: 'Open', start: match[1], end: match[2] };
    }
  }
  return result;
}
export function formatPrice(min: string, max: string, unit: string) {
  if (!min && !max) return '';
  const format = (value: string) => value === '' ? '' : new Intl.NumberFormat('en-US').format(Number(value));
  return `${format(min)}-${format(max)} VND / ${unit}`;
}
export function parsePrice(value: string) {
  if (!value) return { min: '', max: '', unit: 'person' };
  const match = value.match(/^([\d,]+)-([\d,]+) VND \/ (person|item|service|hour|night)$/);
  return match ? { min: match[1].replaceAll(',', ''), max: match[2].replaceAll(',', ''), unit: match[3] } : null;
}
