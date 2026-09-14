'use client';

import { useState } from 'react';
import { smsSegments } from '../../lib/alerts/policy';

/**
 * One language of a road alert, with the SMS segment count as it is typed
 * (audit C10): Bangla and Chinese are billed per 70 characters, English per 160.
 */
export default function SmsComposer({ name, label, required = false, placeholder = '' }) {
  const [text, setText] = useState('');
  const segments = text ? smsSegments(text) : 0;
  return (
    <label className="flex flex-col text-sm gap-1">
      <span className="font-semibold">{label}{required ? <span aria-hidden="true" className="text-red-700"> *</span> : null}</span>
      <textarea
        name={name}
        rows={3}
        maxLength={480}
        required={required}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="border rounded px-2 py-1"
      />
      <span className={`text-xs ${segments > 2 ? 'text-amber-800 font-semibold' : 'text-gray-500'}`} aria-live="polite">
        {text.length} characters · {segments} SMS segment{segments === 1 ? '' : 's'} per recipient
      </span>
    </label>
  );
}
