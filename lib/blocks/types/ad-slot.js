import AdSlotBlock from '../../../components/blocks/AdSlotBlock.jsx';

/**
 * An advertisement slot.
 *
 * The operator places it and chooses the format; the publisher account comes
 * from the server environment, so a slot cannot point at somebody else's
 * account, and the ad unit ID is the only thing typed here.
 *
 * It renders nothing on the pages listed in lib/ads/config.js — the emergency
 * and grievance pages, the statutory disclosures and the toll rates — unless
 * DBEDC overrides that list explicitly.
 */
export default {
  type: 'ad-slot',
  label: 'Advertisement',
  fields: [
    {
      name: 'format', type: 'select', label: 'Size', default: 'rectangle',
      options: [
        { value: 'rectangle', label: 'Rectangle — 336×280 (300×250 on a phone)' },
        { value: 'leaderboard', label: 'Leaderboard — 728×90 (320×100 on a phone)' },
        { value: 'banner', label: 'Banner — 468×60 (320×50 on a phone)' },
      ],
    },
    {
      name: 'slot', type: 'text', label: 'Ad unit ID',
      required: true,
      help: 'The digits from the ad unit in AdSense, e.g. 1234567890. Not the ca-pub- number.',
    },
  ],
  Component: AdSlotBlock,
};
