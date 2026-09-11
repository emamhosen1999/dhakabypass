import RequestFormBlock from '../../../components/blocks/RequestFormBlock.jsx';

/**
 * A tracked service request (INT.8).
 *
 * One block type serving the four needs the block catalogue found — grievance
 * redress, toll dispute, breakdown assistance, lost & found — plus a general
 * request, rather than four bespoke types. The operator picks the kind, which
 * fields to ask for, and the response deadline; the visitor gets a tracking
 * number; the request lands in the queue at /admin/requests with a due date.
 *
 * The kind is a `select`, not free text, for the reason every other select on
 * this site exists: a typo would silently file a request in no queue at all.
 */
const yesNo = (name, label, def) => ({
  name, type: 'select', label, default: def,
  options: [{ value: 'yes', label: 'Ask' }, { value: 'no', label: 'Do not ask' }],
});

export default {
  type: 'request-form',
  label: 'Service request form',
  fields: [
    {
      name: 'kind', type: 'select', label: 'Kind of request', default: 'general',
      options: [
        { value: 'grievance', label: 'Grievance (GR-)' },
        { value: 'toll_dispute', label: 'Toll dispute (TD-)' },
        { value: 'breakdown', label: 'Breakdown assistance (BA-)' },
        { value: 'lost_found', label: 'Lost & found (LF-)' },
        { value: 'general', label: 'General request (SR-)' },
      ],
    },
    { name: 'heading', type: 'text', label: 'Heading (blank = the standard name for this kind)' },
    { name: 'intro', type: 'text', label: 'Introduction' },
    yesNo('askPhone', 'Phone number', 'yes'),
    yesNo('askEmail', 'Email address', 'yes'),
    yesNo('askVehicle', 'Vehicle registration number', 'no'),
    yesNo('askLocation', 'Location on the expressway', 'no'),
    // 0 uses the kind's default: grievance 30, toll dispute 15, breakdown 1,
    // lost & found 7, general 14 (lib/requests/policy.js).
    { name: 'slaDays', type: 'number', label: 'Response deadline in days (0 = standard for this kind)', default: 0 },
    { name: 'successNote', type: 'text', label: 'Extra note shown with the tracking number' },
  ],
  Component: RequestFormBlock,
};
