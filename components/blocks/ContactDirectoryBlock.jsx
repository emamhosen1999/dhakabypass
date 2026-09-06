import { listItems, text } from '../../lib/blocks/items.js';

/**
 * Departmental contacts: tolling, O&M, HSE, media, procurement, the RTI
 * officer, the grievance officer.
 *
 * A named individual is optional and always will be. DBEDC publishes role
 * numbers — the duty manager's desk, the control room — not the personal
 * mobile of whoever is holding that post this month. So the heading of an
 * entry is the ROLE, and the person's name appears only when one has been
 * supplied. Nothing renders a placeholder in their absence: an em dash where
 * a name should be reads as a data-entry failure and invites someone to
 * "fix" it with a private number.
 *
 * The tel: target is stripped to digits because a dialler will not accept
 * spaces, while the printed number keeps the grouping a Bangladeshi reader
 * expects.
 */
export default function ContactDirectoryBlock({ data }) {
  const items = listItems(data.items)
    .filter((row) => text(row.department) || text(row.role) || text(row.name));
  if (items.length === 0) return null;

  return (
    <section className="db-block">
      {data.heading ? <h2 className="db-h2">{data.heading}</h2> : null}
      {data.intro ? <p className="db-lede">{data.intro}</p> : null}
      <ul className="db-directory">
        {items.map((row, i) => {
          const department = text(row.department);
          const role = text(row.role);
          const name = text(row.name);
          const phone = text(row.phone);
          const email = text(row.email);
          const hours = text(row.hours);
          const notes = text(row.notes);
          const title = role || name || department;
          return (
            <li key={i} className="db-directory-item">
              {department && department !== title
                ? <p className="db-directory-dept">{department}</p> : null}
              <h3 className="db-directory-role">{title}</h3>
              {name && name !== title ? <p className="db-directory-name">{name}</p> : null}
              {phone || email ? (
                <p className="db-directory-contact">
                  {phone ? (
                    <a className="db-directory-link" href={`tel:${dial(phone)}`}>{phone}</a>
                  ) : null}
                  {email ? (
                    <a className="db-directory-link" href={`mailto:${email}`}>{email}</a>
                  ) : null}
                </p>
              ) : null}
              {hours ? <p className="db-directory-hours">{hours}</p> : null}
              {notes ? <p className="db-directory-notes">{notes}</p> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Everything a dialler cannot use, removed; a leading + kept. */
const dial = (value) => {
  const digits = value.replace(/[^\d]/g, '');
  return value.trim().startsWith('+') ? `+${digits}` : digits;
};
