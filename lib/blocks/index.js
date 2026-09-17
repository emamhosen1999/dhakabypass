import { registerBlock, getBlock } from './registry.js';
import callout from './types/callout.js';
import cardGrid from './types/card-grid.js';
import corridorMap from './types/corridor-map.js';
import corridorStrip from './types/corridor-strip.js';
import contactDirectory from './types/contact-directory.js';
import contactForm from './types/contact-form.js';
import requestForm from './types/request-form.js';
import newsletterForm from './types/newsletter-form.js';
import emergencyStrip from './types/emergency-strip.js';
import sitemapList from './types/sitemap-list.js';
import ctaBand from './types/cta-band.js';
import dataTable from './types/data-table.js';
import documentList from './types/document-list.js';
import facilityList from './types/facility-list.js';
import faq from './types/faq.js';
import figureGrid from './types/figure-grid.js';
import galleryGrid from './types/gallery-grid.js';
import hero from './types/hero.js';
import interchangeTable from './types/interchange-table.js';
import logoRow from './types/logo-row.js';
import mapPinList from './types/map-pin-list.js';
import mediaProse from './types/media-prose.js';
import newsList from './types/news-list.js';
import siteSearch from './types/site-search.js';
import advisoryList from './types/advisory-list.js';
import cameraGrid from './types/camera-grid.js';
import alertSignup from './types/alert-signup.js';
import requestStatus from './types/request-status.js';
import panorama from './types/panorama.js';
import pageHeader from './types/page-header.js';
import partnerRow from './types/partner-row.js';
import personCard from './types/person-card.js';
import progressBar from './types/progress-bar.js';
import prohibitedVehicles from './types/prohibited-vehicles.js';
import pullQuote from './types/pull-quote.js';
import richText from './types/rich-text.js';
import sectionSubnav from './types/section-subnav.js';
import statDashboard from './types/stat-dashboard.js';
import statRow from './types/stat-row.js';
import tabs from './types/tabs.js';
import timeline from './types/timeline.js';
import tollCalculator from './types/toll-calculator.js';
import tollMatrix from './types/toll-matrix.js';
import tollPreview from './types/toll-preview.js';
import videoEmbed from './types/video-embed.js';
import tollTable from './types/toll-table.js';
import trafficStatus from './types/traffic-status.js';
import travelTimeHistory from './types/travel-time-history.js';
import kmFinder from './types/km-finder.js';
import corridorWeather from './types/corridor-weather.js';
import openData from './types/open-data.js';
import concessionScorecard from './types/concession-scorecard.js';

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
  // INT.1. Purely live: the fares, distances, plaza names and the provisional
  // flag all come from toll_od_rates / interchanges. It DISPLAYS the matrix —
  // the interactive calculator over it is INT.2.
  tollMatrix,
  // INT.2. The same rows, asked one journey at a time. A real GET form, so the
  // fare is server-rendered from the query string and arrives with no
  // JavaScript at all; the client component over it only makes that instant.
  tollCalculator,
  callout,
  videoEmbed,
  pullQuote,
  progressBar, corridorStrip, corridorMap,
  sectionSubnav, facilityList, prohibitedVehicles,
  pageHeader,
  newsList, galleryGrid, contactForm, requestForm,
  // The last three of the catalogue's 41: sign-up, the emergency numbers in
  // reading order, and an HTML sitemap that can never point at a dead page.
  newsletterForm, emergencyStrip, sitemapList,
  // W5.14: search over every published page and article, in the reader's language.
  siteSearch,
  // W4.8: closures and roadworks, in force and ahead, from the advisory records.
  advisoryList,
  // CCTV: live stills and streams from the camera records, relayed by this server.
  cameraGrid,
  // W4.13 road alerts by SMS / WhatsApp; W5.10 a 360° view.
  alertSignup, panorama, requestStatus,
  // 17 September: what a concession company can publish that no other
  // expressway here does. Typical speed by hour from the kept measurements,
  // the kilometre-post finder, weather along the road, the open-data feeds
  // and the concession scorecard.
  travelTimeHistory, kmFinder, corridorWeather, openData, concessionScorecard,
];

/** Idempotent: safe to call from every entry point that needs the registry. */
export function registerAllBlocks() {
  for (const def of ALL) {
    if (!getBlock(def.type)) registerBlock(def);
  }
}

registerAllBlocks();
