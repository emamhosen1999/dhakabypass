export default function BlockFields({ fields, data }) {
  return (
    <div className="flex flex-col gap-3">
      {fields.map((field) => {
        const value = data?.[field.name];
        const name = `f.${field.name}`;
        if (field.type === 'list') {
          return (
            <label key={field.name} className="flex flex-col text-sm">
              {field.label} <span className="text-gray-400">(JSON list)</span>
              <textarea name={name} rows={5} defaultValue={JSON.stringify(value ?? [], null, 2)}
                className="border rounded px-3 py-2 font-mono text-xs" />
            </label>
          );
        }
        if (field.type === 'richtext') {
          return (
            <label key={field.name} className="flex flex-col text-sm">
              {field.label}
              <textarea name={name} rows={6} defaultValue={value ?? ''} className="border rounded px-3 py-2" />
            </label>
          );
        }
        return (
          <label key={field.name} className="flex flex-col text-sm">
            {field.label}
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
