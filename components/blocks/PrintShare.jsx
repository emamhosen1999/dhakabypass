'use client';

import { useState } from 'react';
import { track } from '../../lib/analytics/events.js';

/**
 * Print and share for a schedule (W5.18, B-E8): a driver prints the toll
 * table for the cab or sends the link to a colleague. Share uses the
 * device's share sheet where there is one and copies the link otherwise.
 * Rendered only once JavaScript runs — without it the browser's own print
 * and address bar do the same job — and hidden from the printed page.
 */
export default function PrintShare({ printLabel, shareLabel, copiedLabel, title }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: title || document.title, url });
        track('page_shared', { method: 'share_sheet' });
        return;
      }
      await navigator.clipboard.writeText(url);
      track('page_shared', { method: 'clipboard' });
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch { /* the reader cancelled, or the clipboard is blocked */ }
  };
  return (
    <p className="db-printshare">
      <button type="button" className="db-btn db-btn-secondary" onClick={() => window.print()}>{printLabel}</button>
      <button type="button" className="db-btn db-btn-secondary" onClick={share}>{shareLabel}</button>
      <span role="status" aria-live="polite" className="db-printshare-status">{copied ? copiedLabel : ''}</span>
    </p>
  );
}
