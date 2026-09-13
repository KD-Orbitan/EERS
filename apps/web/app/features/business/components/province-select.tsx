import type { ComponentPropsWithRef } from 'react';
import { VIETNAM_PROVINCES } from '../constants/provinces';

type ProvinceSelectProps = ComponentPropsWithRef<'select'> & {
  placeholder?: string;
  legacyValue?: string;
};

export function ProvinceSelect({ placeholder = 'Select province / city', legacyValue, ...props }: ProvinceSelectProps) {
  const current = typeof props.value === 'string' ? props.value : legacyValue;
  const hasLegacyValue = current && !VIETNAM_PROVINCES.some((name) => name === current);
  return (
    <select aria-label="Province / city" {...props}>
      <option value="">{placeholder}</option>
      {hasLegacyValue ? <option value={current}>{current} (current value)</option> : null}
      {VIETNAM_PROVINCES.map((name) => <option key={name} value={name}>{name}</option>)}
    </select>
  );
}
