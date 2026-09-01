/**
 * Highway chainage. Stored as integer metres; displayed as K<km>+<mmm>,
 * which is the notation the engineers and the gazette use.
 */

const isMetres = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;

export function formatChainage(metres) {
  if (!isMetres(metres)) return '';
  const km = Math.floor(metres / 1000);
  const m = Math.round(metres % 1000);
  return `K${km}+${String(m).padStart(3, '0')}`;
}

/** Reads "K3+900", "k3+900" or a bare metre count. Null when unreadable. */
export function parseChainage(text) {
  if (typeof text !== 'string') return null;
  const s = text.trim().toLowerCase();
  if (!s) return null;

  const withK = /^k(\d+)\+(\d{3})$/.exec(s);
  if (withK) return Number(withK[1]) * 1000 + Number(withK[2]);

  const bare = /^\d+$/.exec(s);
  if (bare) return Number(s);

  return null;
}

export function metresToKm(metres) {
  return isMetres(metres) ? metres / 1000 : 0;
}

export function formatKm(metres, digits = 1) {
  if (!isMetres(metres)) return '';
  return metresToKm(metres).toFixed(digits);
}
