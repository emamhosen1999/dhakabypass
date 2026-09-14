'use client';

import { useId, useState } from 'react';

/**
 * A text input or textarea with a live character count against a soft limit
 * (audit V6): search engines cut a title near 60 characters and a description
 * near 155, so the operator sees the count turn amber before that happens.
 */
export default function CountedField({ name, label, defaultValue = '', soft, max, multiline = false, hint = '', required = false, placeholder = '' }) {
  const id = useId();
  const [value, setValue] = useState(String(defaultValue ?? ''));
  const over = soft && value.length > soft;
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <div className="flex flex-col gap-1 text-sm">
      <label htmlFor={id} className="font-semibold">
        {label}{required ? <span aria-hidden="true" className="text-red-700"> *</span> : null}
      </label>
      <Tag
        id={id}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={max}
        required={required}
        placeholder={placeholder}
        rows={multiline ? 3 : undefined}
        aria-describedby={`${id}-count`}
        className="border rounded px-3 py-2"
      />
      <span id={`${id}-count`} className={`text-xs ${over ? 'text-amber-800 font-semibold' : 'text-gray-500'}`} aria-live="polite">
        {value.length}{soft ? ` / ${soft}` : ''} characters{over ? ' — search results will cut this short' : ''}{hint ? ` · ${hint}` : ''}
      </span>
    </div>
  );
}
