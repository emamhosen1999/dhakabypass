'use client';

import { useState } from 'react';
import { uploadImage, listMediaLibrary } from './upload-image';

/**
 * W1.1 — the image field for the pages-v2 block editor.
 *
 * Before this, a field of `type: 'image'` fell through to a bare text input
 * and the operator typed `/photo/20.webp` from memory. Four affordances
 * replace that: a thumbnail of the current value, a picker over the `media`
 * table, an upload that goes through the same endpoint the legacy FieldInput
 * uses, and — last, because it is the fallback rather than the path — an
 * editable box for pasting a path that is already known.
 *
 * Two modes, because the repeater (ListField) owns its own rows:
 *  - uncontrolled: pass `name`, and the value is submitted as a hidden input
 *  - controlled:   pass `onChange`, and the parent serialises the value
 *
 * The hidden input is what makes the uncontrolled mode work without
 * JavaScript having to run first: the value the operator arrived with is
 * submitted as-is, so opening a block and pressing Save can never blank an
 * image.
 */
export default function ImageField({ name, label, value, onChange, hint }) {
  const [own, setOwn] = useState(value ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [picking, setPicking] = useState(false);
  const [library, setLibrary] = useState(null);

  const val = onChange ? (value ?? '') : own;
  const set = (next) => {
    if (onChange) onChange(next);
    else setOwn(next);
  };

  async function onUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      set(await uploadImage(file));
      setPicking(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      // Let the operator pick the same file again after a failure.
      e.target.value = '';
    }
  }

  async function onPick() {
    const next = !picking;
    setPicking(next);
    if (!next || library) return;
    setError('');
    try {
      setLibrary(await listMediaLibrary());
    } catch (err) {
      setError(err.message);
      setLibrary([]);
    }
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      <span className="font-medium">{label}</span>
      <div className="flex items-start gap-3">
        {val ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={val} alt="" className="w-20 h-20 object-cover rounded border bg-gray-50 shrink-0" />
        ) : (
          <div className="w-20 h-20 rounded border border-dashed bg-gray-50 shrink-0" />
        )}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            <button type="button" onClick={onPick} className="px-2 py-1 border rounded text-xs">
              {picking ? 'Close media library' : 'Choose from media'}
            </button>
            <label className="px-2 py-1 border rounded text-xs cursor-pointer">
              {uploading ? 'Uploading…' : 'Upload new'}
              <input type="file" accept="image/*" onChange={onUpload} disabled={uploading} className="hidden" />
            </label>
            {val ? (
              <button type="button" onClick={() => set('')} className="px-2 py-1 border rounded text-xs text-red-600">
                Clear
              </button>
            ) : null}
          </div>
          {/* Deliberately unnamed: the hidden input below is what submits.
              This is for pasting a path that is already known, and it must
              not become a second value under the same form key. */}
          <input
            type="text"
            value={val}
            onChange={(e) => set(e.target.value)}
            placeholder="/uploads/example.webp"
            aria-label={`${label || 'Image'} path`}
            className="w-full border rounded px-2 py-1 font-mono text-xs"
          />
          {hint ? <p className="text-xs text-gray-400">{hint}</p> : null}
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </div>
      </div>

      {picking ? (
        <div className="border rounded p-2 max-h-64 overflow-y-auto">
          {library === null ? (
            <p className="text-xs text-gray-500">Loading…</p>
          ) : library.length === 0 ? (
            <p className="text-xs text-gray-500">No images in the media library yet. Upload one above.</p>
          ) : (
            <ul className="grid grid-cols-4 gap-2">
              {library.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => { set(m.path); setPicking(false); }}
                    className={`block w-full border rounded overflow-hidden ${m.path === val ? 'ring-2 ring-black' : ''}`}
                    title={m.path}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.path} alt="" className="w-full h-16 object-cover bg-gray-50" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {name ? <input type="hidden" name={name} value={val} readOnly /> : null}
    </div>
  );
}
