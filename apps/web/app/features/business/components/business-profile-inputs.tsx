'use client';
import { useState } from 'react';
import { AMENITIES, PAYMENTS, WEEK_DAYS, PRICE_UNITS, emptyWeek, formatHours, parseHours, formatPrice, parsePrice, type DayHours } from '@/lib/business-profile-fields';

type Props = { value: string; onChange: (value: string) => void; disabled?: boolean };
const inputClass = 'rounded-lg border border-ink-200 bg-ink-50 px-2 py-2 text-sm';

export function OpeningHoursInput({ value, onChange, disabled }: Props) {
  const [days, setDays] = useState(() => parseHours(value) ?? emptyWeek());
  const [legacy, setLegacy] = useState(() => Boolean(value && !parseHours(value)));
  const update = (next: DayHours[]) => { setDays(next); onChange(formatHours(next)); };
  return <fieldset disabled={disabled} className="space-y-3">
    <legend className="mb-2 text-sm font-medium text-ink-700">Opening hours</legend>
    <p className="text-xs text-ink-500">Local time in Vietnam. Choose hours for each day. A closing time before opening means the following day.</p>
    {legacy ? <div className="rounded border border-ink-200 p-3"><p className="whitespace-pre-line text-sm">Current hours: {value}</p><button type="button" onClick={() => { setLegacy(false); update(emptyWeek()); }} className="mt-2 text-sm text-primary-600">Set a weekly schedule</button></div> : <>
      <div className="flex flex-wrap gap-3 text-sm text-primary-600">
        <button type="button" onClick={() => update(days.map(() => ({ ...days[0] })))}>Apply Monday to all days</button>
        <button type="button" onClick={() => update(days.map(day => ({ ...day, status: '24 hours' })))}>Open 24/7</button>
        <button type="button" onClick={() => update(emptyWeek())}>Clear hours</button>
      </div>
      {days.map((day, index) => <div key={WEEK_DAYS[index]} className="flex flex-wrap items-center gap-2 rounded-lg bg-primary-50 p-2">
        <span className="w-24 text-sm">{WEEK_DAYS[index]}</span>
        <select aria-label={`${WEEK_DAYS[index]} status`} className={inputClass} value={day.status} onChange={event => update(days.map((item, i) => i === index ? { ...item, status: event.target.value as DayHours['status'] } : item))}>
          {['Not specified', 'Open', 'Closed', '24 hours'].map(status => <option key={status}>{status}</option>)}
        </select>
        {day.status === 'Open' ? <>
          <label className="text-xs">From <input required type="time" aria-label={`${WEEK_DAYS[index]} opening time`} value={day.start} className={inputClass} onChange={event => update(days.map((item, i) => i === index ? { ...item, start: event.target.value } : item))} /></label>
          <label className="text-xs">To <input required type="time" aria-label={`${WEEK_DAYS[index]} closing time`} value={day.end} className={inputClass} onChange={event => update(days.map((item, i) => i === index ? { ...item, end: event.target.value } : item))} /></label>
          {day.start === day.end ? <p className="w-full text-xs text-red-600">Use ?24 hours? for all-day opening, or choose different times.</p> : day.end < day.start ? <span className="text-xs">Closes next day</span> : null}
        </> : null}
      </div>)}
    </>}
  </fieldset>;
}

export function PriceRangeInput({ value, onChange, disabled }: Props) {
  const [price, setPrice] = useState(() => parsePrice(value) ?? { min: '', max: '', unit: 'person' });
  const [legacy, setLegacy] = useState(() => Boolean(value && !parsePrice(value)));
  const update = (next: typeof price) => { setPrice(next); onChange(formatPrice(next.min, next.max, next.unit)); };
  return <fieldset disabled={disabled} className="space-y-2">
    <legend className="mb-2 text-sm font-medium text-ink-700">Price range</legend>
    {legacy ? <div className="rounded border border-ink-200 p-3"><p className="text-sm">Current price: {value}</p><button type="button" onClick={() => { setLegacy(false); update({ min: '', max: '', unit: 'person' }); }} className="mt-2 text-sm text-primary-600">Set a price range</button></div> : <>
      <p className="text-xs text-ink-500">Typical prices in VND. Leave both amounts empty if prices are not available.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">From (VND)<input type="number" min="0" max="1000000000000" step="1" required={Boolean(price.max)} placeholder="50000" value={price.min} onChange={event => update({ ...price, min: event.target.value })} className={`${inputClass} mt-1 w-full`} /></label>
        <label className="text-sm">To (VND)<input type="number" min={price.min || '0'} max="1000000000000" step="1" required={Boolean(price.min)} placeholder="200000" value={price.max} onChange={event => update({ ...price, max: event.target.value })} className={`${inputClass} mt-1 w-full`} /></label>
        <label className="text-sm">Per<select value={price.unit} onChange={event => update({ ...price, unit: event.target.value })} className={`${inputClass} mt-1 w-full`}>{PRICE_UNITS.map(unit => <option key={unit}>{unit}</option>)}</select></label>
      </div>
      {price.min && price.max ? <p className="text-sm text-ink-700">Preview: {formatPrice(price.min, price.max, price.unit)}</p> : null}
    </>}
  </fieldset>;
}

export function AmenitiesInput({ value, onChange, disabled }: Props) {
  const selected = value.split(',').map(item => item.trim()).filter(Boolean);
  const unknown = selected.filter(item => ![...AMENITIES, ...PAYMENTS].includes(item));
  return <div className="space-y-4">
    {[{ label: 'Amenities', options: AMENITIES }, { label: 'Payment methods', options: PAYMENTS }, ...(unknown.length ? [{ label: 'Previously entered options', options: unknown }] : [])].map(group => <fieldset key={group.label} disabled={disabled}>
      <legend className="mb-2 text-sm font-medium text-ink-700">{group.label}</legend>
      <div className="flex flex-wrap gap-2">{group.options.map(option => <label key={option} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${selected.includes(option) ? 'border-primary-600 bg-primary-50' : 'border-ink-200'}`}>
        <input type="checkbox" checked={selected.includes(option)} onChange={event => onChange((event.target.checked ? [...selected, option] : selected.filter(item => item !== option)).join(', '))} />{option}
      </label>)}</div>
    </fieldset>)}
  </div>;
}
