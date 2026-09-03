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
 * Minimum horizontal room one marker label needs, as a percentage of the
 * marker area's width.
 *
 * The value must be derived from the NARROWEST width at which the strip is
 * visible, not from a comfortable desktop width, because the label is a fixed
 * 84px (.db-marker) while the area it sits in shrinks with the viewport. The
 * percentage a label occupies therefore GROWS as the screen narrows:
 *
 *   marker area = min(viewport, --db-shell 1180px)
 *                 - 2 x .db-strip-wrap padding (up to 20px)
 *                 - 2 x .db-strip padding (44px)
 *
 *   at 1440px viewport -> 1180 - 40 - 88 = 1052px -> 84/1052 =  8.0%
 *   at  768px viewport ->  768 - 40 - 88 =  640px -> 84/640  = 13.1%
 *   at  700px viewport ->  700 - 40 - 88 =  572px -> 84/572  = 14.7%
 *
 * 700px is the floor: below it .db-strip is display:none and the interchange
 * table carries the data instead. So the binding case is 14.7%, and 15 adds a
 * little slack.
 *
 * The earlier value of 7 was picked from the desktop case alone and was below
 * every one of these, which is why labels still collided at all three widths
 * after the row assignment was fixed — the rows were right, the threshold that
 * decides how many rows are needed was not.
 *
 * The cost of 15 is extra rows on a wide screen, where 8 would have done. That
 * is vertical space in a diagram. The cost of erring low is overlapping text,
 * which is a correctness bug. Prefer the rows.
 *
 * It is a percentage rather than pixels because the model is pure — it has no
 * DOM to measure. Callers that know their real width may pass their own.
 */
const DEFAULT_MIN_GAP_PCT = 15;

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
