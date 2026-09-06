import DataTableBlock from '../../../components/blocks/DataTableBlock.jsx';

/**
 * Published tabular data: the toll schedule, the Citizen Charter service
 * table, the land-acquisition entitlement matrix, the structures register.
 *
 * The row shape is the only unusual thing here. Every other list on this site
 * is a flat object of scalars, which cannot express a row of a table: the
 * number of cells is whatever the operator declared in `columns`, not
 * something a block type can name in advance. So a row is one declared
 * sub-field, `cells`, which is itself a list of plain strings — the
 * `{ cells: [...] }` shape lib/blocks/table.js already accepts, alongside the
 * bare array the seed files write.
 *
 * `caption` is required. A table with no caption is announced by a screen
 * reader as "table, two columns" and nothing else, and this block exists to
 * carry statutory rates: the reader has to know which schedule they are in.
 *
 * `note` is where the SRO/gazette number goes. A published rate without its
 * provenance is a rumour (see the plan's Global Constraints).
 */
export default {
  type: 'data-table',
  label: 'Data table',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    { name: 'caption', type: 'text', label: 'Table caption', required: true },
    {
      name: 'columns', type: 'list', label: 'Columns', default: [],
      itemLabel: 'column',
      itemFields: [
        { name: 'label', type: 'text', label: 'Column heading' },
        // 1 for a figures column: it is right-aligned and tabular-numbered by
        // .db-num. No boolean field type exists, and one flag does not earn
        // a whole primitive.
        { name: 'numeric', type: 'number', label: 'Numeric column (1 = yes)' },
      ],
    },
    {
      name: 'rows', type: 'list', label: 'Rows', default: [],
      itemLabel: 'row',
      itemFields: [
        { name: 'cells', type: 'list', label: 'Cells', itemType: 'text' },
      ],
    },
    // Which column identifies the row, as <th scope="row">. 0 is the usual
    // answer — the vehicle class, the service, the district. -1 for a table
    // where no column identifies the row.
    { name: 'rowHeaderColumn', type: 'number', label: 'Row header column (0 = first, -1 = none)', default: 0 },
    { name: 'note', type: 'text', label: 'Source note' },
  ],
  Component: DataTableBlock,
};
