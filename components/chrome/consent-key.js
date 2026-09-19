/**
 * The two names the consent banner and the footer control share.
 *
 * In one file so the storage key cannot drift between the component that
 * writes it and the one that asks for it back.
 */
export const CONSENT_KEY = 'db-analytics-consent';
export const CONSENT_REOPEN = 'db-consent-reopen';
