import { query, withTransaction } from '../db.js';
import { validationError } from '../errors.js';

export const CONDITIONS = ['free', 'moderate', 'slow', 'heavy', 'closed', 'unknown'];
export const CONDITION_LABELS = {
  free: 'Free flow', moderate: 'Moderate', slow: 'Slow', heavy: 'Heavy traffic',
  closed: 'Closed', unknown: 'Not measured',
};

export function positiveId(value) {
  if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value))) {
    throw validationError('That row is not valid. Reload the page and try again.');
  }
  return Number(value);
}

export function parseSection(form) {
  const id = positiveId(form.get('id'));
  const condition = String(form.get('condition_key') || '');
  const speedText = String(form.get('avg_speed_kmh') ?? '').trim();
  if (!CONDITIONS.includes(condition)) throw validationError('Choose a listed traffic condition.');
  if (speedText && (!/^\d+$/.test(speedText) || Number(speedText) > 250)) {
    throw validationError('Average speed must be a whole number from 0 to 250, or empty.');
  }
  const speed = speedText ? Number(speedText) : null;
  if ((condition === 'unknown' && speed !== null) || (condition === 'closed' && speed !== null && speed !== 0)) {
    throw validationError('Leave speed empty for an unmeasured section; a closed section can only have zero or no speed.');
  }
  return { id, condition, speed };
}

export function parseMonthly(form) {
  const idText = String(form.get('id') || '');
  const id = idText ? positiveId(idText) : null;
  const month = String(form.get('month') || '').trim();
  const plaza = String(form.get('plaza') || '').trim();
  const count = String(form.get('vehicles') ?? '').trim();
  if (!/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(month)) throw validationError('Enter a month in YYYY-MM format.');
  if (!/^[A-Za-z0-9][A-Za-z0-9 _()-]{0,31}$/.test(plaza)) {
    throw validationError('Use a plaza code of up to 32 letters, digits, spaces, hyphens or brackets. Use all for the corridor total.');
  }
  if (!/^\d+$/.test(count) || Number(count) > 2147483647) {
    throw validationError('Vehicle count must be a whole number from 0 to 2,147,483,647.');
  }
  return { id, month, plaza, vehicles: Number(count) };
}

export async function listMonthlyForAdmin() {
  return (await query('SELECT id, month, plaza, vehicles FROM traffic_monthly ORDER BY month DESC, plaza')) || [];
}

export async function saveSection(input) {
  return withTransaction(async (q) => {
    const setting = await q("SELECT CAST(value AS CHAR) AS value FROM site_settings WHERE setting_key = 'corridor.traffic_source' FOR UPDATE");
    if (setting[0]?.value === '"tomtom"') throw validationError('Switch the traffic source to operator before editing a TomTom measurement.');
    const rows = await q('SELECT id FROM corridor_sections WHERE id = ? FOR UPDATE', [input.id]);
    if (!rows.length) throw validationError('This section no longer exists. Reload the page.');
    await q(`UPDATE corridor_sections SET condition_key = ?, avg_speed_kmh = ?,
      measured_at = ${input.condition === 'unknown' ? 'NULL' : 'CURRENT_TIMESTAMP'} WHERE id = ?`,
    [input.condition, input.speed, input.id]);
  });
}

export async function saveMonthly(input) {
  return withTransaction(async (q) => {
    if (input.id) {
      const rows = await q('SELECT id FROM traffic_monthly WHERE id = ? FOR UPDATE', [input.id]);
      if (!rows.length) throw validationError('This monthly row no longer exists. Reload the page.');
      await q('UPDATE traffic_monthly SET month = ?, plaza = ?, vehicles = ? WHERE id = ?',
        [input.month, input.plaza, input.vehicles, input.id]);
    } else {
      await q('INSERT INTO traffic_monthly (month, plaza, vehicles) VALUES (?, ?, ?)',
        [input.month, input.plaza, input.vehicles]);
    }
  });
}

export async function deleteMonthly(id) {
  return withTransaction(async (q) => {
    const result = await q('DELETE FROM traffic_monthly WHERE id = ?', [id]);
    if (!result.affectedRows) throw validationError('This monthly row was already removed. Reload the page.');
  });
}

export async function saveSources(form) {
  const traffic = String(form.get('traffic_source') || '');
  const monthly = String(form.get('monthly_source') || '');
  if (!['sample', 'operator', 'tomtom'].includes(traffic) || !['sample', 'operator'].includes(monthly)) {
    throw validationError('Choose sample or operator. TomTom is enabled only by a successful refresh.');
  }
  if (traffic === 'operator' && form.get('confirm_sections') !== 'on') {
    throw validationError('Confirm that all section measurements have been checked against real operator data.');
  }
  if (monthly === 'operator' && form.get('confirm_monthly') !== 'on') {
    throw validationError('Confirm that all monthly rows are real counts and any sample rows have been removed.');
  }
  await withTransaction(async (q) => {
    if(traffic==='tomtom') {
      const current=await q("SELECT CAST(value AS CHAR) AS value FROM site_settings WHERE setting_key='corridor.traffic_source' FOR UPDATE");
      if(current[0]?.value!=='"tomtom"')throw validationError('TomTom can be enabled only by a successful traffic refresh.');
    }
    for (const [key, value] of [['corridor.traffic_source', traffic], ['corridor.monthly_source', monthly]]) {
      await q(`INSERT INTO site_settings (setting_key, value) VALUES (?, ?)
        ON DUPLICATE KEY UPDATE value = VALUES(value)`, [key, JSON.stringify(value)]);
    }
  });
}
