/**
 * The block registry. A block type is one module declaring its fields and its
 * renderer; the admin form and the validator are both derived from `fields`,
 * so adding a block type never means editing the admin or the renderer.
 */
import { ITEM_FIELD_TYPES } from './list.js';

const registry = new Map();

const FIELD_TYPES = ['text', 'richtext', 'image', 'number', 'list', 'select'];

/**
 * A `list` field may declare the shape of one row so the admin can render a
 * repeater instead of a JSON textarea (W1.2) — either `itemFields` for
 * object rows or `itemType` for scalar rows. Both are optional; a list that
 * declares neither keeps the old behaviour.
 */
function validateListShape(type, f) {
  if (f.itemFields !== undefined) {
    if (f.type !== 'list') {
      throw new Error(`Block type "${type}" declares itemFields on "${f.name}", which is not a list field`);
    }
    if (!Array.isArray(f.itemFields)) {
      throw new Error(`Block type "${type}" field "${f.name}" needs itemFields to be an array`);
    }
    for (const sub of f.itemFields) {
      if (!sub || typeof sub.name !== 'string' || !sub.name) {
        throw new Error(`Block type "${type}" field "${f.name}" has an item field with no name`);
      }
      if (!ITEM_FIELD_TYPES.includes(sub.type)) {
        throw new Error(
          `Block type "${type}" field "${f.name}" has item field "${sub.name}" of unknown type "${sub.type}"`
        );
      }
    }
  }
  if (f.itemType !== undefined) {
    if (f.type !== 'list') {
      throw new Error(`Block type "${type}" declares itemType on "${f.name}", which is not a list field`);
    }
    if (!ITEM_FIELD_TYPES.includes(f.itemType)) {
      throw new Error(`Block type "${type}" field "${f.name}" has an unknown itemType "${f.itemType}"`);
    }
  }
}

/**
 * A `select` field declares the values it will accept, and the validator
 * refuses anything else.
 *
 * The case that motivated it: `media-prose.side` was free text, and
 * MediaProseBlock tests `data.side === 'left'` — so an operator typing
 * `Left` got a silently right-hand image and no error anywhere. A field with
 * a closed set of values now says so once, and the admin form, the validator
 * and the default record are all derived from that one declaration.
 */
function validateSelectShape(type, f) {
  if (f.type !== 'select') {
    if (f.options !== undefined) {
      throw new Error(`Block type "${type}" declares options on "${f.name}", which is not a select field`);
    }
    return;
  }
  if (!Array.isArray(f.options) || f.options.length === 0) {
    throw new Error(`Block type "${type}" field "${f.name}" needs a non-empty options array`);
  }
  for (const option of f.options) {
    if (!option || typeof option.value !== 'string' || !option.value
      || typeof option.label !== 'string' || !option.label) {
      throw new Error(`Block type "${type}" field "${f.name}" has an option with no value or label`);
    }
  }
}

const optionValues = (field) => (Array.isArray(field.options) ? field.options.map((o) => o.value) : []);

export function registerBlock(def) {
  if (!def || typeof def.type !== 'string' || !def.type) {
    throw new Error('Block definition needs a type');
  }
  if (registry.has(def.type)) {
    throw new Error(`Block type "${def.type}" is already registered`);
  }
  if (!Array.isArray(def.fields)) {
    throw new Error(`Block type "${def.type}" needs a fields array`);
  }
  for (const f of def.fields) {
    if (!FIELD_TYPES.includes(f.type)) {
      throw new Error(`Block type "${def.type}" has field "${f.name}" of unknown type "${f.type}"`);
    }
    validateListShape(def.type, f);
    validateSelectShape(def.type, f);
  }
  if (typeof def.Component !== 'function') {
    throw new Error(`Block type "${def.type}" needs a Component`);
  }
  registry.set(def.type, def);
}

export function getBlock(type) {
  return registry.get(type) || null;
}

export function allBlocks() {
  return [...registry.values()];
}

export function resetRegistry() {
  registry.clear();
}

function typeOk(field, value) {
  switch (field.type) {
    case 'number': return typeof value === 'number' && Number.isFinite(value);
    case 'list': return Array.isArray(value);
    default: return typeof value === 'string';
  }
}

export function validateBlockData(type, data) {
  const def = getBlock(type);
  if (!def) return { ok: false, errors: [`Unknown block type "${type}"`] };

  const errors = [];
  const record = data || {};
  for (const field of def.fields) {
    const value = record[field.name];
    const absent = value === undefined || value === null || value === '';
    if (field.required && absent) {
      errors.push(`"${field.label}" (${field.name}) is required`);
      continue;
    }
    if (!absent && !typeOk(field, value)) {
      errors.push(`"${field.label}" (${field.name}) must be a ${field.type}`);
      continue;
    }
    if (!absent && field.type === 'select' && !optionValues(field).includes(value)) {
      errors.push(`"${field.label}" (${field.name}) must be one of: ${optionValues(field).join(', ')}`);
    }
  }
  return { ok: errors.length === 0, errors };
}

export function defaultBlockData(type) {
  const def = getBlock(type);
  if (!def) return {};
  const out = {};
  for (const f of def.fields) {
    if (f.default !== undefined) out[f.name] = f.default;
    else if (f.type === 'number') out[f.name] = 0;
    else if (f.type === 'list') out[f.name] = [];
    // A select with no declared default starts on its first option: an empty
    // string is not one of the values the field accepts.
    else if (f.type === 'select') out[f.name] = optionValues(f)[0] ?? '';
    else out[f.name] = '';
  }
  return out;
}
