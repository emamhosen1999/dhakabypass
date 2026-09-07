import { registerBlock, getBlock } from './registry.js';
import cardGrid from './types/card-grid.js';
import contactDirectory from './types/contact-directory.js';
import ctaBand from './types/cta-band.js';
import dataTable from './types/data-table.js';
import documentList from './types/document-list.js';
import faq from './types/faq.js';
import figureGrid from './types/figure-grid.js';
import hero from './types/hero.js';
import interchangeTable from './types/interchange-table.js';
import logoRow from './types/logo-row.js';
import mapPinList from './types/map-pin-list.js';
import mediaProse from './types/media-prose.js';
import partnerRow from './types/partner-row.js';
import personCard from './types/person-card.js';
import richText from './types/rich-text.js';
import statDashboard from './types/stat-dashboard.js';
import statRow from './types/stat-row.js';
import tabs from './types/tabs.js';
import timeline from './types/timeline.js';
import tollPreview from './types/toll-preview.js';
import tollTable from './types/toll-table.js';
import trafficStatus from './types/traffic-status.js';

/**
 * Every block type the site can render.
 *
 * A type that is not in this array does not exist as far as the site is
 * concerned: BlockRenderer resolves through `getBlock(block.type)` and
 * renders NOTHING when that returns null, silently. Ten components (W1.22)
 * were written, tested and shipped to disk without ever being added here,
 * and every one of them was invisible on every page — which is what
 * tests/unit/blocks-registry-coverage.test.js now makes impossible.
 */
const ALL = [
  hero, mediaProse, figureGrid, cardGrid, ctaBand, partnerRow, tollPreview, richText, statRow,
  personCard, documentList, faq, dataTable, timeline,
  tabs, contactDirectory, mapPinList, statDashboard, logoRow,
  // Live-data corridor blocks (build-order item 6). Every one of these reads
  // its facts from the corridor records — toll_rates, corridor_sections,
  // advisories, interchanges — and stores presentation only, which is what
  // lets the fixed-layout travel pages become real block documents.
  tollTable, trafficStatus, interchangeTable,
];

/** Idempotent: safe to call from every entry point that needs the registry. */
export function registerAllBlocks() {
  for (const def of ALL) {
    if (!getBlock(def.type)) registerBlock(def);
  }
}

registerAllBlocks();
