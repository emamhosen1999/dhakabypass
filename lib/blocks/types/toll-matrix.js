import TollMatrixBlock from '../../../components/blocks/TollMatrixBlock.jsx';

/**
 * The origin–destination fare matrix. A LIVE-DATA block, and — unlike
 * `toll-table` — a purely live one.
 *
 * THERE IS NO AMOUNT FIELD HERE, NO DISTANCE FIELD AND NO PLAZA FIELD, and
 * there must never be one. Every fare, every distance and every plaza name is
 * read from `toll_od_rates` and `interchanges` at render time. This block owns
 * presentation only: which vehicle class, what the heading says, what to print
 * when there is nothing to print. That is the records-vs-blocks rule the
 * client locked on 2026-09-06 — change the fact in its record screen, change
 * how it looks in the page.
 *
 * THE S.R.O. CITATION IS NOT A FIELD HERE EITHER, and that is the one place
 * this block deliberately parts company with `toll-table`. On the flat
 * schedule one gazette notification fixes every rate in the table, so the
 * citation is a property of the schedule and is authored on the block. A
 * matrix is different: DBEDC will confirm it pair by pair, and a single
 * block-level citation would certify all 270 fares the moment one of them was
 * real. So the citation lives per row, on the record, and this block renders
 * whichever citations the rows it shows actually carry.
 *
 * NOTHING HERE CAN SWITCH OFF THE PROVISIONAL NOTICE. The notice is driven by
 * `is_provisional`, a generated column on the row (see
 * db/sql/12-toll-od-matrix.sql). A field that could hide it would make the
 * whole mechanism decorative, so the absence of one is asserted rather than
 * assumed — tests/unit/blocks-toll-matrix.test.jsx fails if a field name ever
 * matches /provisional|notice|confirm|warn|disclaim/, and renders the block
 * under eight hostile configurations to prove the notice survives all of them.
 *
 * This block DISPLAYS the matrix. The interactive origin/destination
 * calculator is INT.2 and is a separate component.
 */
export default {
  type: 'toll-matrix',
  label: 'Toll fare matrix (live)',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    // Falls back to the editable `tollCaption` string rather than being
    // required, for the reason toll-table's caption does: a table without a
    // real <caption> is an accessibility defect, and guaranteeing the outcome
    // beats blocking a save on it.
    { name: 'caption', type: 'text', label: 'Table caption' },
    // A matrix is two dimensions already; a third would be unreadable. Blank
    // shows the lowest class in the gazette schedule order — a car, not
    // whichever row the database returned first. Not a select: the classes
    // are records, and a closed list here would go stale the first time an
    // operator added one.
    { name: 'vehicleClass', type: 'text', label: 'Vehicle class key (blank = the first class)' },
    { name: 'emptyMessage', type: 'text', label: 'Message when no fares are published' },
  ],
  Component: TollMatrixBlock,
};
