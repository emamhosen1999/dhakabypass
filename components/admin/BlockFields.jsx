import ImageField from './ImageField';
import ListField from './ListField';
import RichTextField from './RichTextField';

/**
 * The block editor's field layer: one control per declared field, chosen by
 * `field.type`.
 *
 * This file is the whole reason a block type never has to touch the admin.
 * Until W1.1–W1.3 it only knew `list` and `richtext`, and both of those were
 * a textarea: an `image` field fell through to a bare text box the operator
 * typed `/photo/20.webp` into from memory, a `list` was hand-written JSON,
 * and a `select` — a field whose whole point is that the validator refuses
 * anything outside its options — was a free-text input that let the operator
 * type an invalid value and discover it only when the save was rejected.
 *
 * Stays a server component. The three controls below are the client
 * components; keeping the dispatcher on the server means the per-locale flow
 * in app/admin/(dash)/pages-v2/[id]/page.jsx is unchanged — it still renders
 * `<BlockFields fields={def.fields} data={data} />` inside the locale's own
 * `saveTranslationAction` form, and every field still posts under `f.<name>`.
 */
export default function BlockFields({ fields, data, source = null }) {
  return (
    <div className="flex flex-col gap-4">
      {fields.map((field) => (
        <FieldFrame field={field} source={source}>
          {control(field, data)}
        </FieldFrame>
      ))}
    </div>
  );
}

/** Plain text of an English value, for a translator to read beside the field. */
export function sourceText(value) {
  if (value === undefined || value === null || value === '') return '';
  if (Array.isArray(value)) {
    return value.map((item) => (item && typeof item === 'object'
      ? Object.values(item).filter((v) => typeof v === 'string' && v.trim()).join(' · ')
      : String(item))).filter(Boolean).join('\n');
  }
  if (typeof value === 'object') return Object.values(value).filter((v) => typeof v === 'string').join(' · ');
  return String(value).replace(/<(br|\/p|\/li|\/h[1-6])[^>]*>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/[ \t]+/g, ' ').trim();
}

/**
 * Marks a required field, prints its guidance, and, when a translator is
 * working in another language, the English it translates (audit V1, V2).
 */
function FieldFrame({ field, source, children }) {
  const english = source ? sourceText(source[field.name]) : '';
  return (
    <div className="flex flex-col gap-1" data-field={field.name}>
      {children}
      {field.required ? <span className="text-xs text-gray-500"><span aria-hidden="true" className="text-red-700">*</span> Required to publish.</span> : null}
      {field.hint ? <span className="text-xs text-gray-500">{field.hint}</span> : null}
      {english ? (
        <div className="text-xs rounded bg-gray-50 border border-gray-200 px-2 py-1 text-gray-700 whitespace-pre-line max-h-40 overflow-auto">
          <span className="font-semibold text-gray-500">English: </span>{english}
        </div>
      ) : null}
    </div>
  );
}

function control(field, data) {
  const value = data?.[field.name];
  const name = `f.${field.name}`;
  const label = field.required ? `${field.label} *` : field.label;

  if (field.type === 'image') {
    return <ImageField name={name} label={label} value={value ?? ''} />;
  }

  if (field.type === 'richtext') {
    return <RichTextField name={name} label={label} value={value ?? ''} />;
  }

  if (field.type === 'select') {
    const options = Array.isArray(field.options) ? field.options : [];
    // The registry guarantees a non-empty options array and refuses to
    // store a value outside it, so the control offers exactly those and
    // falls back to the declared default rather than to an empty
    // string, which is not one of the accepted values.
    const selected = options.some((o) => o.value === value)
      ? value
      : field.default ?? options[0]?.value ?? '';
    return (
      <label className="flex flex-col text-sm gap-1">
        <span className="font-medium">{label}</span>
        <select name={name} defaultValue={selected} className="border rounded px-3 py-2">
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === 'list') {
    const shaped = (Array.isArray(field.itemFields) && field.itemFields.length > 0)
      || (typeof field.itemType === 'string' && field.itemType);
    if (shaped) {
      return <ListField name={name} field={field} value={value} />;
    }
    // A list that declares no row shape is still hand-authored JSON.
    // Guessing a shape here is the one way to lose data nobody can
    // describe — see the note in lib/blocks/list.js.
    return (
      <label className="flex flex-col text-sm">
        {label} <span className="text-gray-400">(JSON list)</span>
        <textarea
          name={name}
          rows={5}
          defaultValue={JSON.stringify(value ?? [], null, 2)}
          className="border rounded px-3 py-2 font-mono text-xs"
        />
      </label>
    );
  }

  return (
    <label className="flex flex-col text-sm gap-1">
      <span className="font-medium">{label}</span>
      <input
        name={name}
        type={field.type === 'number' ? 'number' : 'text'}
        min={field.type === 'number' && Number.isFinite(field.min) ? field.min : undefined}
        max={field.type === 'number' && Number.isFinite(field.max) ? field.max : undefined}
        defaultValue={value ?? (field.type === 'number' ? 0 : '')}
        className="border rounded px-3 py-2"
      />
    </label>
  );
}
