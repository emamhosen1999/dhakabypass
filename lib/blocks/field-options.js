import { sectionMenuSlugs } from '../menus/section-menus.js';

/**
 * Fields whose options are records (W8N.3).
 *
 * A block type declares `optionsFrom: '<source>'` on a select; the admin calls
 * this before rendering the form so the control lists what exists now. The
 * block definition keeps its literal options as the fallback, so a failure here
 * costs the operator the newer choices, never the form.
 */
const SOURCES = {
  'section-menus': async () => (await sectionMenuSlugs())
    .map((slug) => ({ value: slug, label: `${slug} (edited under Navigation)` })),
};

export async function resolveFieldOptions(fields) {
  if (!Array.isArray(fields) || !fields.some((f) => f?.optionsFrom)) return fields;
  return Promise.all(fields.map(async (field) => {
    const source = field?.optionsFrom ? SOURCES[field.optionsFrom] : null;
    if (!source) return field;
    try {
      const options = await source();
      return options.length ? { ...field, options } : field;
    } catch {
      return field;
    }
  }));
}
