'use client';

import { useState } from 'react';
import FieldInput from './FieldInput';

/**
 * Renders a structured form for an arbitrary content object by walking it.
 * Nested objects/arrays become grouped fieldsets; leaves become inputs whose
 * `name` is the dotted path ("stats.0.value"), which the server action writes
 * back into the object.
 */
function walk(value, prefix, out) {
  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, `${prefix}.${i}`, out));
    return out;
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      walk(v, prefix ? `${prefix}.${k}` : k, out);
    }
    return out;
  }
  out.push({ name: prefix, value });
  return out;
}

export default function SectionForm({ sectionKey, data, action, title }) {
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const fields = walk(data ?? {}, '', []);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setStatus('');
    try {
      const fd = new FormData(e.currentTarget);
      await action(sectionKey, fd);
      setStatus('Saved. Changes are live on the site.');
    } catch (err) {
      setStatus(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {fields.length === 0 && (
          <p className="text-gray-500">This section has no editable fields.</p>
        )}
        {fields.map((f) => (
          <FieldInput key={f.name} name={f.name} value={f.value} />
        ))}
      </div>

      <div className="sticky bottom-0 mt-4 flex items-center gap-4 bg-gray-50/95 backdrop-blur py-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white px-6 py-2.5 rounded-md font-semibold transition-all"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {status && (
          <span
            className={`text-sm ${status.startsWith('Save failed') ? 'text-red-600' : 'text-green-700'}`}
          >
            {status}
          </span>
        )}
      </div>
    </form>
  );
}
