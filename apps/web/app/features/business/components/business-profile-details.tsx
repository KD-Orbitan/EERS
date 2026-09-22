import { PAYMENTS, WEEK_DAYS, parseHours, parsePrice } from '@/lib/business-profile-fields';

export function OpeningHoursDetails({ value }: { value: string }) {
  const days = parseHours(value);
  if (!days) return <span className="whitespace-pre-line">{value}</span>;
  return <div className="mt-2 space-y-1">{days.map((day, i) => <div key={WEEK_DAYS[i]} className="flex flex-wrap justify-between gap-x-4">
    <span>{WEEK_DAYS[i]}</span><span>{day.status === 'Open' ? `${day.start}?${day.end}${day.end < day.start ? ' (+1 day)' : ''}` : day.status}</span>
  </div>)}<p className="mt-2 text-xs text-ink-500">Vietnam local time</p></div>;
}
export function PriceRangeDetails({ value }: { value: string }) {
  const price = parsePrice(value);
  if (!price) return <>{value}</>;
  const format = (value: string) => new Intl.NumberFormat('vi-VN').format(Number(value));
  return <>{format(price.min)}?{format(price.max)} VND / {price.unit}</>;
}
export function AmenitiesDetails({ value }: { value: string }) {
  const selected = value.split(',').map(item => item.trim()).filter(Boolean);
  const amenities = selected.filter(item => !PAYMENTS.includes(item));
  const payments = selected.filter(item => PAYMENTS.includes(item));
  return <div className="mt-2 space-y-3">{[{ title: 'Amenities', items: amenities }, { title: 'Payment methods', items: payments }].filter(group => group.items.length).map(group => <div key={group.title}>
    <p className="mb-1 text-xs text-ink-500">{group.title}</p>
    <div className="flex flex-wrap gap-2">{group.items.map(item => <span key={item} className="rounded-lg bg-primary-50 px-2 py-1 text-xs">{item}</span>)}</div>
  </div>)}</div>;
}
