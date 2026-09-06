import { normaliseTable } from '../../lib/blocks/table.js';

/**
 * Published tabular data: toll schedules, traffic statistics, tariff tables.
 *
 * Three things are non-negotiable here and all three are accessibility, not
 * decoration. The caption is a real <caption>, so a screen reader announces
 * what the table is before reading it. Column headers are <th scope="col">
 * and the nominated first column is <th scope="row">, so a cell read out of
 * sequence still carries "Large bus, Amount, 310" rather than a bare number.
 * And the whole table sits in .db-scroll-x, so a wide tariff schedule scrolls
 * inside its own box on a phone instead of making the page body scroll
 * sideways under the reader's thumb.
 */
export default function DataTableBlock({ data }) {
  const { columns, rows } = normaliseTable(data);
  if (columns.length === 0 || rows.length === 0) return null;

  // -1, or anything outside the header range, means "no row header" — some
  // tables genuinely have no column that identifies the row.
  const headerCol = Number.isInteger(data.rowHeaderColumn) ? data.rowHeaderColumn : Number(data.rowHeaderColumn);
  const rowHeader = Number.isInteger(headerCol) && headerCol >= 0 && headerCol < columns.length ? headerCol : -1;

  return (
    <section className="db-block">
      {data.heading ? <h2 className="db-h2">{data.heading}</h2> : null}
      {data.intro ? <p className="db-lede">{data.intro}</p> : null}
      <div className="db-scroll-x db-datatable">
        <table className="db-table">
          <caption className="db-table-caption">{data.caption}</caption>
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} scope="col" className={col.numeric ? 'db-num' : undefined}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((cells, r) => (
              <tr key={r}>
                {cells.map((cell, c) => (
                  c === rowHeader
                    ? <th key={c} scope="row" className={columns[c].numeric ? 'db-num' : undefined}>{cell}</th>
                    : <td key={c} className={columns[c].numeric ? 'db-num' : undefined}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Provenance. A published rate without its SRO number is a rumour. */}
      {data.note ? <p className="db-table-note">{data.note}</p> : null}
    </section>
  );
}
