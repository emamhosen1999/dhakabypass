import Link from 'next/link';
import { stampOf } from '../../lib/admin/history';

/**
 * The admin's shared pieces (W7.11): one page shell, one set of buttons, one
 * "no access" panel, and the small controls every record form carries —
 * the stamp that detects a concurrent edit and the link to its history.
 */

const BUTTON = {
  primary: 'bg-blue-900 text-white hover:bg-blue-800 border border-blue-900',
  secondary: 'bg-white text-blue-900 hover:bg-blue-50 border border-blue-900',
  danger: 'bg-white text-red-800 hover:bg-red-50 border border-red-700',
  quiet: 'bg-transparent text-blue-900 underline border border-transparent',
};

export function Button({ variant = 'primary', className = '', children, type = 'submit', ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-60 ${BUTTON[variant] || BUTTON.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function AdminPage({ title, intro = null, actions = null, children, width = 'max-w-6xl' }) {
  return (
    <div className={`${width} space-y-6`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl font-bold text-blue-900">{title}</h1>
          {intro ? <div className="text-gray-600 max-w-3xl">{intro}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </header>
      {children}
    </div>
  );
}

export function NoAccess({ what = 'this screen' }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
      <p className="text-gray-700 font-medium">Your role does not have access to {what}.</p>
      <p className="text-gray-500 text-sm mt-2">Ask an administrator if you need it.</p>
    </div>
  );
}

export function formatWhen(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dhaka' });
}

/** The record's last-saved time, sent back with the form (lib/admin/record-actions.js). */
export function Stamp({ value }) {
  const v = stampOf(value);
  return v ? <input type="hidden" name="_stamp" value={v} /> : null;
}

export function HistoryLink({ type, id, count = null, className = '' }) {
  if (id === null || id === undefined || id === '') return null;
  const label = count ? `History (${count})` : 'History';
  return (
    <Link href={`/admin/history?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`} className={`text-sm text-blue-900 underline ${className}`}>
      {label}
    </Link>
  );
}

export function Pager({ total, page, perPage, basePath, params = {} }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages <= 1) return null;
  const href = (p) => {
    const sp = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null)), page: String(p) });
    return `${basePath}?${sp.toString()}`;
  };
  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center gap-2 text-sm">
      {page > 1 ? <Link className="underline text-blue-900" href={href(page - 1)}>Previous</Link> : null}
      <span className="text-gray-600">Page {page} of {pages} · {total} in all</span>
      {page < pages ? <Link className="underline text-blue-900" href={href(page + 1)}>Next</Link> : null}
    </nav>
  );
}

export function SearchBox({ basePath, q = '', placeholder = 'Search', hidden = {}, children = null }) {
  return (
    <form action={basePath} method="get" role="search" className="flex flex-wrap items-end gap-2">
      <label className="flex-1 min-w-[12rem]">
        <span className="sr-only">{placeholder}</span>
        <input type="search" name="q" defaultValue={q} placeholder={placeholder} className="w-full rounded-md border px-3 py-1.5 text-sm" />
      </label>
      {Object.entries(hidden).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      {children}
      <Button variant="secondary" data-noconfirm="">Search</Button>
    </form>
  );
}

export function pageNumber(sp) {
  const n = Number(sp?.page);
  return Number.isInteger(n) && n > 0 ? n : 1;
}
