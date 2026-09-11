import EmergencyStripBlock from '../../../components/blocks/EmergencyStripBlock.jsx';

/**
 * The emergency numbers, placeable on a page.
 *
 * The footer carries them on every page already (SiteFooterV2), read from
 * the `contact_emergency` setting. This block puts the same strip where a
 * page needs it in the reading order — the top of the rules page, beneath
 * a breakdown form — and reads the same setting, so there is one number and
 * one place to change it. The national 999 line is always shown beside it.
 *
 * An empty setting renders nothing at all rather than a placeholder: a
 * number nobody answers is worse than no number.
 */
export default {
  type: 'emergency-strip',
  label: 'Emergency numbers (live)',
  fields: [
    { name: 'heading', type: 'text', label: 'Label before the DBEDC number (blank = "Emergency")' },
    { name: 'note', type: 'text', label: 'Short note under the numbers' },
  ],
  Component: EmergencyStripBlock,
};
