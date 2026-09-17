import CorridorWeatherBlock from '../../../components/blocks/CorridorWeatherBlock.jsx';

/**
 * Weather along the corridor, from Open-Meteo, at the road's two ends and
 * its middle. The block owns wording only; the thresholds that turn a
 * reading into a fog, rain or wind advisory are settings at /admin/corridor,
 * and the readings are never stored here. When the service cannot be
 * reached the block says so rather than showing the last thing it saw.
 */
export default {
  type: 'corridor-weather',
  label: 'Corridor weather and fog advisory (live)',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    { name: 'adviceFog', type: 'text', label: 'Advice shown during a fog advisory (blank = standard wording)' },
    { name: 'adviceRain', type: 'text', label: 'Advice shown during a heavy-rain advisory (blank = standard wording)' },
    { name: 'adviceWind', type: 'text', label: 'Advice shown during a strong-wind advisory (blank = standard wording)' },
    { name: 'unavailableMessage', type: 'text', label: 'Message when the weather service cannot be reached' },
  ],
  Component: CorridorWeatherBlock,
};
