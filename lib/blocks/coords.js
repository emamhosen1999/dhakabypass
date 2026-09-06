/**
 * Print a latitude/longitude pair authored in the admin.
 *
 * The admin posts every field as text, so `'23.9012'` and `23.9012` must both
 * work. A pair that is not a real place is printed as nothing rather than as
 * `NaN` or `0, 0` — the block still lists the location by name and address,
 * which is what a visitor needs; a wrong coordinate on a toll plaza is worse
 * than no coordinate.
 *
 * `0, 0` is treated as unset on purpose. It is the value a half-filled form
 * produces, it is 1,600 km off West Africa, and nothing DBEDC operates is
 * anywhere near it.
 *
 * Six decimals is roughly 0.1 m — more precision than any surveyed asset on
 * this corridor is published to, and enough that the trailing zeros of a
 * round value can be dropped without changing the place.
 */
export function formatCoordinates(lat, lng) {
  const a = coordinate(lat, 90);
  const b = coordinate(lng, 180);
  if (a === null || b === null) return '';
  if (a === 0 && b === 0) return '';
  return `${trim(a)}, ${trim(b)}`;
}

function coordinate(value, limit) {
  if (typeof value === 'number') {
    return Number.isFinite(value) && Math.abs(value) <= limit ? value : null;
  }
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
}

const trim = (n) => String(Number(n.toFixed(6)));
