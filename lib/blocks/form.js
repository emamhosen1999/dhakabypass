import { getBlock } from './registry.js';

/**
 * Reads only the fields the block type declares — anything else posted is
 * ignored. Form keys are prefixed `f.`.
 * Pure and synchronous, so it cannot live in the 'use server' module.
 */
export function parseBlockForm(type, formData) {
  const def = getBlock(type);
  if (!def) return {};
  const out = {};
  for (const field of def.fields) {
    const raw = formData.get(`f.${field.name}`);
    if (field.type === 'number') {
      out[field.name] = Number(raw ?? 0) || 0;
    } else if (field.type === 'list') {
      try {
        const parsed = JSON.parse(String(raw ?? '[]'));
        out[field.name] = Array.isArray(parsed) ? parsed : [];
      } catch {
        out[field.name] = [];
      }
    } else {
      out[field.name] = String(raw ?? '');
    }
  }
  return out;
}
