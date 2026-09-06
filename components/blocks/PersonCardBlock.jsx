import SiteImage from '../SiteImage.jsx';
import { getMediaByPath } from '../../lib/media/repo.js';
import { listItems, text } from '../../lib/blocks/items.js';

/**
 * The board and senior management (benchmark A3: absence of named people
 * reads as a shell entity).
 *
 * A person is never dropped because their photograph is missing. That is the
 * one difference from figure-grid, which skips a tile it cannot resolve: a
 * tile with no photo has nothing to say, whereas a director with no photo is
 * still the disclosure. Photographs arrive late and one at a time; the board
 * list has to be publishable the day the names are confirmed.
 */
export default async function PersonCardBlock({ data, locale }) {
  const people = listItems(data.people).filter((person) => text(person.name));
  if (people.length === 0) return null;

  // One query per portrait, resolved together; a missing row yields a card
  // with no photograph rather than a broken image.
  const photos = await Promise.all(people.map(async (person) => {
    if (!text(person.photo)) return null;
    try { return await getMediaByPath(person.photo); } catch { return null; }
  }));

  return (
    <section className="db-block">
      {data.heading ? <h2 className="db-h2">{data.heading}</h2> : null}
      {data.intro ? <p className="db-lede">{data.intro}</p> : null}
      <ul className="db-people">
        {people.map((person, i) => (
          <li key={i} className="db-person">
            {photos[i] ? (
              <div className="db-figure db-ratio-square db-person-photo">
                <SiteImage media={photos[i]} locale={locale} sizes="(max-width: 700px) 50vw, 22vw" />
              </div>
            ) : null}
            <h3 className="db-person-name">{text(person.name)}</h3>
            {text(person.role) ? <p className="db-person-role">{text(person.role)}</p> : null}
            {text(person.affiliation) ? <p className="db-person-affil">{text(person.affiliation)}</p> : null}
            {text(person.bio) ? (
              /* Sanitised on save: lib/blocks/form.js runs every declared
                 `richtext` sub-field of a list row through the same
                 sanitizeHtml() as a top-level rich field. */
              <div className="db-prose db-person-bio" dangerouslySetInnerHTML={{ __html: person.bio }} />
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
