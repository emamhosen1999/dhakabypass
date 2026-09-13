/**
 * A form submitted from a page that was loaded before a deploy points at the
 * previous build's Server Action, which the new server no longer has. Nothing
 * was saved and nothing is broken: reloading the page fixes it. Next reports
 * it with this wording.
 */
export function isStaleDeployment(error) {
  const text = String(error?.message || '');
  return /Server Action/i.test(text) && /(not found|older or newer deployment|Failed to find)/i.test(text);
}

