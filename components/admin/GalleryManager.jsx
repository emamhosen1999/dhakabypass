'use client';

import { useState } from 'react';
import { Trash2, Upload } from 'lucide-react';

export default function GalleryManager({ images, saveAction, deleteAction }) {
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function onSave(e) {
    e.preventDefault();
    setSaving(true);
    setStatus('');
    try {
      await saveAction(new FormData(e.currentTarget));
      setStatus('Saved.');
    } catch (err) {
      setStatus(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function onUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setStatus('');
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('target', 'gallery');
        const res = await fetch('/admin/api/upload', { method: 'POST', body: fd });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error || 'Upload failed');
      }
      // reload so the new rows (with their DB ids) appear
      window.location.reload();
    } catch (err) {
      setStatus(`Upload failed: ${err.message}`);
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="inline-flex items-center gap-2 cursor-pointer bg-blue-900 hover:bg-blue-800 text-white px-5 py-2.5 rounded-md font-semibold transition-all mb-6">
        <Upload className="w-4 h-4" />
        {uploading ? 'Uploading…' : 'Upload photos'}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={onUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>

      <form onSubmit={onSave}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {images.map((img) => (
            <div
              key={img.id ?? img.file}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <img src={img.file} alt="" className="w-full aspect-square object-cover bg-gray-100" />
              <div className="p-3 space-y-2">
                <input type="hidden" name="id" value={img.id ?? ''} />
                <input
                  name={`caption_${img.id}`}
                  defaultValue={img.caption || ''}
                  placeholder="Caption (optional)"
                  className="w-full px-2 py-1.5 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 shrink-0">Order</label>
                  <input
                    name={`sort_${img.id}`}
                    type="number"
                    defaultValue={img.sort ?? 0}
                    className="w-20 px-2 py-1 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="submit"
                    formAction={deleteAction}
                    name="id"
                    value={img.id}
                    formNoValidate
                    className="ml-auto text-red-600 hover:text-red-800 p-1.5 rounded hover:bg-red-50 transition-all"
                    aria-label="Delete photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {images.length === 0 && (
          <p className="text-gray-500 bg-white rounded-lg border border-gray-200 p-6">
            No photos yet — upload some above.
          </p>
        )}

        <div className="sticky bottom-0 mt-4 flex items-center gap-4 bg-gray-50/95 backdrop-blur py-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white px-6 py-2.5 rounded-md font-semibold transition-all"
          >
            {saving ? 'Saving…' : 'Save captions & order'}
          </button>
          {status && (
            <span
              className={`text-sm ${status.includes('failed') ? 'text-red-600' : 'text-green-700'}`}
            >
              {status}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
