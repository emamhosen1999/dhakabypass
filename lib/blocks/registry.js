/**
 * The block registry. A block type is one module declaring its fields and its
 * renderer; the admin form and the validator are both derived from `fields`,
 * so adding a block type never means editing the admin or the renderer.
 */
const registry = new Map();

const FIELD_TYPES = ['text', 'richtext', 'image', 'number', 'list'];

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
    }
  }
  return { ok: errors.length === 0, errors };
}

export function defaultBlockData(type) {
  const def = getBlock(type);
  if (!def) return {};
  const out = {};
  for (const f of def.fields) {
    out[f.name] = f.default !== undefined ? f.default : f.type === 'number' ? 0 : f.type === 'list' ? [] : '';
  }
  return out;
}
