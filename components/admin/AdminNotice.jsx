'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';

/**
 * The sentence an action sent back (lib/admin/run-action.js), shown at the
 * top of whichever admin page the form was on. Dismissing it removes the
 * query parameter so a refresh does not repeat it.
 */
export default function AdminNotice() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const notice = params.get('notice');
  if (!notice) return null;

  const dismiss = () => {
    const next = new URLSearchParams(params.toString());
    next.delete('notice');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div role="alert" className="container mx-auto px-4 pt-4">
      <div className="flex items-start gap-3 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
        <p className="grow font-medium">{notice}</p>
        <button type="button" onClick={dismiss} aria-label="Dismiss" className="shrink-0 rounded px-2 py-0.5 hover:bg-red-100">×</button>
      </div>
    </div>
  );
}
