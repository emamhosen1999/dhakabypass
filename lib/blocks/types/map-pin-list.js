import MapPinListBlock from '../../../components/blocks/MapPinListBlock.jsx';
import { SHOW_FILTER_FIELD } from '../filter.js';

/**
 * Locations with coordinates: the head office, the control centre, the toll
 * plazas, the rest areas, the patrol bases. This is the text half of a map,
 * and it is the half that works on a screen reader, on a 2G connection and on
 * a printout pinned in a transport office.
 *
 * Nothing is required and nothing is dropped for want of a coordinate: a pin
 * with an address and no latitude still lists, because the address is what
 * most visitors actually want. lib/blocks/coords.js treats 0,0 as unset for
 * the same reason — it is what a half-filled form produces, and it is
 * 1,600 km off West Africa.
 *
 * `amenities` is a nested list of plain tags (fuel, food, prayer room,
 * toilets, EV charging) so the rest-area directory can be filtered on them
 * rather than searched through free prose. `hours` sits beside it because a
 * rest area that is shut at 03:00 is the first thing a night driver needs.
 */
export default {
  type: 'map-pin-list',
  label: 'Locations',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    SHOW_FILTER_FIELD,
    {
      name: 'items', type: 'list', label: 'Locations', default: [],
      itemLabel: 'location',
      itemFields: [
        { name: 'name', type: 'text', label: 'Name' },
        { name: 'type', type: 'text', label: 'Kind of place' },
        { name: 'address', type: 'text', label: 'Address' },
        { name: 'lat', type: 'number', label: 'Latitude' },
        { name: 'lng', type: 'number', label: 'Longitude' },
        { name: 'hours', type: 'text', label: 'Opening hours' },
        { name: 'amenities', type: 'list', label: 'Amenities', itemType: 'text' },
        { name: 'notes', type: 'text', label: 'Notes' },
        { name: 'mapHref', type: 'text', label: 'Map link' },
        { name: 'mapLabel', type: 'text', label: 'Map link label' },
      ],
    },
  ],
  Component: MapPinListBlock,
};
