'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import FieldInput from './FieldInput';

/**
 * Editor for an auto-extracted page. Fields are grouped by the section they
 * appear in on the live page (from content/schema/<slug>.json), collapsible, and
 * filterable — some pages have 190+ fields, so a flat list would be unusable.
 */
export default function PageFieldsForm({ sectionKey, data, schema, action }) {
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState('');
  const [collapsed, setCollapsed] = useState({});

  // Group by schema section, keeping schema order. Any key missing from the
  // schema still gets rendered so nothing is silently uneditable.
  const groups = useMemo(() => {
    const byKey = new Map(schema.map((f) => [f.key, f]));
    const out = new Map();
    const push = (section, field) => {
      if (!out.has(section)) out.set(section, []);
      out.get(section).push(field);
    };

    for (const [key, value] of Object.entries(data)) {
      const meta = byKey.get(key);
      push(meta?.section || 'Other', { key, value, label: meta?.label });
    }
    return [...out.entries()];
  }, [data, schema]);

  const needle = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!needle) return groups;
    return groups
      .map(([section, fields]) => [
        section,
        fields.filter(
          (f) =>
            String(f.value).toLowerCase().includes(needle) ||
            section.toLowerCase().includes(needle) ||
            f.key.toLowerCase().includes(needle)
        ),
      ])
      .filter(([, fields]) => fields.length > 0);
  }, [groups, needle]);

  const total = Object.keys(data).length;
  const shown = filtered.reduce((s, [, f]) => s + f.length, 0);

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
      <div className="relative mb-4">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter fields by text, section or key…"
          className="w-full pl-9 pr-3 py-2.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        {needle && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            {shown} / {total}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {filtered.map(([section, fields]) => {
          const isCollapsed = collapsed[section] && !needle;
          return (
            <div key={section} className="bg-white rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={() => setCollapsed((c) => ({ ...c, [section]: !c[section] }))}
                className="w-full flex items-center justify-between gap-3 px-5 py-3 text-left hover:bg-gray-50 transition-all"
              >
                <span className="font-semibold text-blue-900 truncate">{section}</span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-400">{fields.length}</span>
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </span>
              </button>

              {!isCollapsed && (
                <div className="px-5 pb-5 pt-1 border-t border-gray-100">
                  {fields.map((f) => (
                    <FieldInput key={f.key} name={f.key} value={f.value} />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-gray-500 bg-white rounded-lg border border-gray-200 p-6">
            No fields match “{q}”.
          </p>
        )}
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
