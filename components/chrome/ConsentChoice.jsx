'use client';

import { CONSENT_REOPEN } from './consent-key.js';

/**
 * "Cookie choice" in the footer's legal row.
 *
 * Consent that cannot be withdrawn is not consent. Until this existed the
 * banner asked once and stored the answer in localStorage, and a visitor who
 * accepted had no way back short of clearing site data — which is not a
 * control anybody can be expected to find.
 *
 * Rendered only where the banner is: the footer checks the provider, so a
 * site running a cookieless provider, or none, shows nothing rather than a
 * control for a decision it never asked anyone to make.
 */
export default function ConsentChoice({ label }) {
  return (
    <li>
      <button
        type="button"
        className="db-footer-legal-button"
        onClick={() => window.dispatchEvent(new CustomEvent(CONSENT_REOPEN))}
      >
        {label}
      </button>
    </li>
  );
}
