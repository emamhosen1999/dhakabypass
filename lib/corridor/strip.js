// lib/corridor/strip.js
import { corridorExtent, positionPercent, sortByChainage } from './geometry.js';
import { formatChainage } from './chainage.js';
import { localeName, localeText } from './interchanges.js';

/**
 * Turns segment and interchange rows into positioned bands and markers.
 * Pure on purpose: the strip's maths is unit-tested without a browser, and the
 * component stays a thin renderer.
 */
export function buildStripModel({ segments = [], interchanges = [], locale = 'en' } = {}) {
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

  const markers = sortByChainage(interchanges).map((i) => ({
    id: i.id,
    name: localeName(i, locale),
    kind: i.kind,
    status: i.status,
    connectsTo: i.connects_to || '',
    chainage: formatChainage(i.chainage_m),
    leftPct: positionPercent(i.chainage_m, extent),
  }));

  // Only the statuses actually present — a legend listing states that never
  // appear is noise.
  const legend = [...new Set(bands.map((b) => b.status))];

  return { extent, bands, markers, legend };
}
