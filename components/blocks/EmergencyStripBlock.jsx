import { getContactDetailsCached } from '../../lib/settings-cache.js';
import EmergencyNumbers from '../contact/EmergencyNumbers.jsx';

const text = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * The emergency numbers, in the page's reading order. Reads the same two
 * settings the footer reads (contact.emergency_phone,
 * contact.national_emergency_phone) through the same component, so there is
 * one place to change either number. Renders nothing when both are blank.
 */
export default async function EmergencyStripBlock({ data, locale }) {
  let details = {};
  try { details = await getContactDetailsCached(locale); } catch { details = {}; }
  if (!details.emergency && !details.nationalEmergency) return null;

  const label = text(data?.heading);
  const note = text(data?.note);

  return (
    <section className="db-block db-emergency-block" aria-label={label || undefined}>
      <div className="db-footer-emergency db-emergency-strip">
        <EmergencyNumbers locale={locale} emergency={details.emergency} national={details.nationalEmergency} label={label} />
      </div>
      {note ? <p className="db-form-note db-emergency-note">{note}</p> : null}
    </section>
  );
}
