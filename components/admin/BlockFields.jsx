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
export default function BlockFields({ fields, data }) {
  return (
    <div className="flex flex-col gap-4">
      {fields.map((field) => {
        const value = data?.[field.name];
        const name = `f.${field.name}`;

        if (field.type === 'image') {
          return <ImageField key={field.name} name={name} label={field.label} value={value ?? ''} />;
        }

        if (field.type === 'richtext') {
          return <RichTextField key={field.name} name={name} label={field.label} value={value ?? ''} />;
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
            <label key={field.name} className="flex flex-col text-sm gap-1">
              <span className="font-medium">{field.label}</span>
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
            return <ListField key={field.name} name={name} field={field} value={value} />;
          }
          // A list that declares no row shape is still hand-authored JSON.
          // Guessing a shape here is the one way to lose data nobody can
          // describe — see the note in lib/blocks/list.js.
          return (
            <label key={field.name} className="flex flex-col text-sm">
              {field.label} <span className="text-gray-400">(JSON list)</span>
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
          <label key={field.name} className="flex flex-col text-sm gap-1">
            <span className="font-medium">{field.label}</span>
            <input
              name={name}
              type={field.type === 'number' ? 'number' : 'text'}
              defaultValue={value ?? (field.type === 'number' ? 0 : '')}
              className="border rounded px-3 py-2"
            />
          </label>
        );
      })}
    </div>
  );
}
