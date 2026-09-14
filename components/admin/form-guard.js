/**
 * The pure parts of AdminFormGuard: which buttons ask first, what they ask,
 * what the toast says, and how a form's typed values are kept and put back.
 */
const DESTRUCTIVE = /\b(delete|remove|clear|discard|empty|reset to built-in|use the built-in)\b/i;
export const LAST = 'admin:last-submit';
export const TYPED = 'admin:typed';
export const SKIP_TYPES = new Set(['hidden', 'file', 'password', 'submit', 'button', 'image', 'reset']);

export function labelOf(button) {
  if (!button) return '';
  return (button.getAttribute('aria-label') || button.getAttribute('title') || button.textContent || '').trim();
}

export function isDestructive(button) {
  if (!button || button.hasAttribute('data-noconfirm')) return false;
  return button.hasAttribute('data-confirm') || DESTRUCTIVE.test(labelOf(button));
}

export function flashText(label, flashAttr = '') {
  if (flashAttr) return flashAttr;
  if (DESTRUCTIVE.test(label || '')) return 'Deleted.';
  if (/unpublish/i.test(label || '')) return 'Unpublished.';
  if (/publish/i.test(label || '')) return 'Published.';
  if (/restore|undo/i.test(label || '')) return 'Restored.';
  if (/send/i.test(label || '')) return 'Sent.';
  return 'Saved.';
}

export function questionFor(button) {
  const explicit = button.getAttribute('data-confirm');
  if (explicit) return explicit;
  const label = labelOf(button) || 'Delete this';
  const record = button.closest('[data-record-label]')?.getAttribute('data-record-label');
  if (record) return `${label.replace(/\s*this\s+\w+$/i, '')} ${record}?\n\nIt goes to the trash, where it can be restored.`;
  return `${label}?`;
}

/** A form's identity on the page: its hidden id-like fields, else its position. */
export function formKey(form) {
  const forms = [...document.querySelectorAll('form')];
  const ids = [...form.querySelectorAll('input[type="hidden"]')]
    .filter((i) => i.name && !i.name.startsWith('$ACTION') && i.name !== '_stamp')
    .map((i) => `${i.name}=${i.value}`)
    .join('&');
  return `${ids}#${ids ? '' : forms.indexOf(form)}`;
}

export function typedValues(form) {
  return [...form.elements]
    .filter((el) => el.name && !SKIP_TYPES.has(el.type) && !el.name.startsWith('$ACTION'))
    .map((el) => ({ name: el.name, type: el.type, value: el.value, checked: Boolean(el.checked) }));
}

export function writeBack(form, values) {
  const els = [...form.elements];
  for (const saved of values) {
    const el = els.find((e) => e.name === saved.name && ((saved.type !== 'radio' && saved.type !== 'checkbox') || e.value === saved.value));
    if (!el) continue;
    if (saved.type === 'checkbox' || saved.type === 'radio') el.checked = saved.checked;
    else if (el.value !== saved.value) {
      el.value = saved.value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}
