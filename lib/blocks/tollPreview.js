/**
 * Choose which rates the home page shows.
 *
 * A class the operator asked for that has no rate in force is dropped rather
 * than rendered blank: showing a vehicle class with no price on the front page
 * of a toll road reads as "free", which is the one wrong answer.
 */
export function pickRates(rates, wanted) {
  if (!Array.isArray(rates)) return [];
  const list = rates.filter((r) => r && typeof r.vehicle_class === 'string');
  if (!Array.isArray(wanted) || wanted.length === 0) return list.slice(0, 3);
  const out = [];
  const seen = new Set();
  for (const cls of wanted) {
    if (typeof cls !== 'string' || seen.has(cls)) continue;
    const hit = list.find((r) => r.vehicle_class === cls);
    if (hit) { out.push(hit); seen.add(cls); }
  }
  return out;
}
