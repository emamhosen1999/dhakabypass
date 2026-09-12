import { localeHref } from '../../lib/blocks/href.js';
import { t } from '../../lib/i18n/ui.js';
import ListFilter from './ListFilter.jsx';
import { filterText, wantsFilter, tagUnion, tagValue } from '../../lib/blocks/filter.js';
import { formatCoordinates } from '../../lib/blocks/coords.js';
import { listItems, text } from '../../lib/blocks/items.js';

/** The amenity tags of one pin. Authored per locale, so nothing here is a
 *  code-side vocabulary; a blank the operator left in the repeater is
 *  dropped rather than rendered as an empty tag. */
const tags = (value) => (Array.isArray(value) ? value.map(text).filter(Boolean) : []);

/**
 * Locations with coordinates: the head office, the control centre, the toll
 * plazas, the rest areas, the patrol bases.
 *
 * This is the text half of a map, and it is the half that works — on a screen
 * reader, on a 2G connection, on a printout pinned in a transport office, and
 * for anyone who needs to copy a coordinate into a dispatcher's system. The
 * corridor map (lib/corridor/*) is the graphical half and is a separate
 * apparatus; this block never tries to be it.
 *
 * A pin with no usable coordinate still lists — an address is what most
 * visitors actually want — and a coordinate that is not a real place on earth
 * prints as nothing rather than as NaN.
 */
export default function MapPinListBlock({ data, locale, blockId }) {
  const items = listItems(data.items).filter((pin) => text(pin.name));
  if (items.length === 0) return null;

  return (
    <section className="db-block">
      {data.heading ? <h2 className="db-h2">{data.heading}</h2> : null}
      {data.intro ? <p className="db-lede">{data.intro}</p> : null}
      {wantsFilter(data) ? (
        /* INT.3: the amenity tags become checkboxes; a stop must carry every
           ticked one. With script off, the full directory renders as always. */
        <ListFilter
          scope={`pins-${blockId}`} label={t(locale, 'filterLabel')} placeholder={t(locale, 'filterPlaceholder')}
          countLabel={t(locale, 'filterCount')}
          tags={tagUnion(items.map((pin) => tags(pin.amenities))).map((tg, n) => (n === 0 ? { ...tg, legend: t(locale, 'filterAmenities') } : tg))}
        />
      ) : null}
      <ul className="db-pinlist" id={`pins-${blockId}`}>
        {items.map((pin, i) => {
          const coords = formatCoordinates(pin.lat, pin.lng);
          const amenities = tags(pin.amenities);
          const href = localeHref(text(pin.mapHref), locale);
          const linkLabel = text(pin.mapLabel);
          return (
            <li
              key={i} className="db-pin"
              data-filter-text={filterText(pin.name, pin.type, pin.address, pin.hours, pin.notes, amenities.join(' '))}
              data-filter-tags={amenities.map(tagValue).join('|')}
            >
              {text(pin.type) ? <p className="db-pin-type">{text(pin.type)}</p> : null}
              <h3 className="db-pin-name">{text(pin.name)}</h3>
              {text(pin.address) ? <p className="db-pin-address">{text(pin.address)}</p> : null}
              {coords ? <p className="db-pin-coords db-num">{coords}</p> : null}
              {text(pin.hours) ? <p className="db-pin-hours">{text(pin.hours)}</p> : null}
              {amenities.length > 0 ? (
                /* A list, not a run of prose: this is what the rest-area
                   directory filters on, and a screen reader announces how
                   many facilities a stop has before reading them. */
                <ul className="db-pin-amenities">
                  {amenities.map((amenity, n) => (
                    <li key={n} className="db-tag">{amenity}</li>
                  ))}
                </ul>
              ) : null}
              {text(pin.notes) ? <p className="db-pin-notes">{text(pin.notes)}</p> : null}
              {href && linkLabel ? (
                <p className="db-actions">
                  {/* Often an external mapping service, so a plain anchor. */}
                  <a className="db-btn db-btn-secondary" href={href}>{linkLabel}</a>
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
