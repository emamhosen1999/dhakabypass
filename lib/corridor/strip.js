// lib/corridor/strip.js
import { corridorExtent, positionPercent, sortByChainage } from './geometry.js';
import { formatChainage } from './chainage.js';
import { localeName, localeText } from './interchanges.js';

/**
 * Turns segment and interchange rows into positioned bands and markers.
 * Pure on purpose: the strip's maths is unit-tested without a browser, and the
 * component stays a thin renderer.
 */

/**
 * How much horizontal room one marker label needs, as a percentage of the
 * strip's width. A label runs roughly 90-110px; on a ~1180px strip that is
 * about 8%, and 7 leaves a little slack before two labels actually touch.
 *
 * It is a percentage rather than pixels because the model is pure — it has no
 * DOM to measure. Erring low costs an occasional tight pair; erring high costs
 * extra rows, so this is deliberately near the low end.
 */
const DEFAULT_MIN_GAP_PCT = 7;

/**
 * Assign each marker to the lowest row where its label will not collide.
 *
 * The strip previously staggered by index parity (`i % 2`), which works only
 * when markers are roughly evenly spaced. They are not: this corridor has four
 * markers between K11+365 and K13+403, inside 4% of the strip's width. Parity
 * put K11+365 and K13+184 on the SAME row about 45px apart, with labels twice
 * that wide, so they printed on top of each other on the home page.
 *
 * Greedy first-fit down the rows. Markers arrive sorted by chainage, so each
 * row only needs to remember its own rightmost occupied edge.
 */
function assignRows(markers, minGapPct) {
  const rowRightEdge = [];
  return markers.map((m) => {
    const left = Number.isFinite(m.leftPct) ? m.leftPct : 0;
    let row = rowRightEdge.findIndex((edge) => left - edge >= minGapPct);
    if (row === -1) {
      row = rowRightEdge.length;
    }
    rowRightEdge[row] = left;
    return { ...m, row };
  });
}

export function buildStripModel({
  segments = [], interchanges = [], locale = 'en', minGapPct = DEFAULT_MIN_GAP_PCT,
} = {}) {
  const extent = corridorExtent(segments);

  const bands = (segments || []).map((s) => {
    const leftPct = positionPercent(s.from_m, extent);
    const rightPct = positionPercent(s.to_m, extent);
    return {
      id: s.id,
      status: s.status,
      leftPct,
      widthPct: Math.max(0, rightPct - leftPct),
      // labels is data — Object.hasOwn read via localeText, not bracket
      // access, so a key like "constructor" can't resolve up the prototype
      // chain (same reasoning as localeName, which this shares the helper with).
      label: localeText(s.labels, locale),
      fromChainage: formatChainage(s.from_m),
      toChainage: formatChainage(s.to_m),
    };
  });

  const placed = sortByChainage(interchanges).map((i) => ({
    id: i.id,
    name: localeName(i, locale),
    kind: i.kind,
    status: i.status,
    connectsTo: i.connects_to || '',
    chainage: formatChainage(i.chainage_m),
    leftPct: positionPercent(i.chainage_m, extent),
  }));

  const markers = assignRows(placed, minGapPct);
  const rowCount = markers.reduce((max, m) => Math.max(max, m.row + 1), 1);

  // Only the statuses actually present — a legend listing states that never
  // appear is noise.
  const legend = [...new Set(bands.map((b) => b.status))];

  return { extent, bands, markers, legend, rowCount };
}
