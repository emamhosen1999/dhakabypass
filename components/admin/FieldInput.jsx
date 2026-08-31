'use client';

import { useState } from 'react';

/** Heuristics: which fields are images, and which want a textarea. */
const isImagePath = (v) =>
  typeof v === 'string' && /^\/[\w./-]+\.(webp|png|jpe?g|gif|svg|avif)$/i.test(v);

const looksLikeImageKey = (k) =>
  /(^|\.)(image|img\d*|logo|icon|photo|backgroundImage|translateIcon|routeMapImage)$/i.test(k);

function Label({ name }) {
  const parts = name.split('.');
  const last = parts.at(-1);
  const pretty = last
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
  return (
    <label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-1">
      {pretty}
      {parts.length > 1 && (
        <span className="ml-2 font-normal text-xs text-gray-400">{parts.slice(0, -1).join(' › ')}</span>
      )}
    </label>
  );
}

/** One editable leaf value: image picker, textarea, or text input. */
export default function FieldInput({ name, value }) {
  const [val, setVal] = useState(value ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const isImage = isImagePath(value) || looksLikeImageKey(name);
  const multiline = typeof val === 'string' && (val.length > 90 || val.includes('\n'));

  async function onUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/admin/api/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Upload failed');
      setVal(json.path);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  if (isImage) {
    return (
      <div className="mb-5">
        <Label name={name} />
        <div className="flex items-start gap-4">
          {val ? (
            <img
              src={val}
              alt=""
              className="w-24 h-24 object-cover rounded-md border border-gray-200 bg-gray-50 shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-md border border-dashed border-gray-300 bg-gray-50 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <input
              id={name}
              name={name}
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div className="mt-2 flex items-center gap-3">
              <label className="cursor-pointer text-sm font-semibold text-blue-900 hover:text-blue-700">
                {uploading ? 'Uploading…' : 'Upload new image'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={onUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              {error && <span className="text-sm text-red-600">{error}</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5">
      <Label name={name} />
      {multiline ? (
        <textarea
          id={name}
          name={name}
          value={val}
          rows={Math.min(10, Math.ceil(String(val).length / 80) + 2)}
          onChange={(e) => setVal(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      ) : (
        <input
          id={name}
          name={name}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      )}
    </div>
  );
}
