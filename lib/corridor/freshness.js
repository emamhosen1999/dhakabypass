/** The newest measured_at across the sections, as an ISO string, or null. */
export function newestMeasurement(sections) {
  let best = null;
  for (const s of Array.isArray(sections) ? sections : []) {
    const t = s?.measured_at ?? s?.measuredAt;
    const ms = t ? new Date(t).getTime() : NaN;
    if (Number.isFinite(ms) && (best === null || ms > best)) best = ms;
  }
  return best === null ? null : new Date(best).toISOString();
}
