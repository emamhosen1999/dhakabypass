'use client';

import { useState } from 'react';

/**
 * A hex text field with a native colour picker beside it. The text field is
 * what submits: it may be blank ("the shipped value"), which a native colour
 * input cannot express. The picker only writes into it.
 */
export default function ColorField({ name, label, defaultValue = '', placeholder }) {
  const [value, setValue] = useState(defaultValue);
  const swatch = /^#[0-9a-fA-F]{6}$/.test(value) ? value : (placeholder || '#000000');
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold">{label}</label>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="color" aria-label={`Pick: ${label}`} value={swatch}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          className="h-9 w-12 border rounded p-0"
        />
        <input
          id={name} name={name} value={value} placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          pattern="#[0-9a-fA-F]{6}" className="w-full border rounded px-3 py-2 font-mono"
        />
      </div>
    </div>
  );
}
