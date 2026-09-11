import ContactFormBlock from '../../../components/blocks/ContactFormBlock.jsx';

/**
 * The contact form and the office details beside it.
 *
 * What /contact rendered, as a block. The form itself is the existing
 * ContactForm - the Server Action, the honeypot, the rate limit and the
 * per-outcome live-region messaging are all unchanged. Office details come
 * from site_settings, so they are edited at /admin/settings and not here.
 * Field labels come from ui_strings. This block adds only the heading and
 * intro the operator wants around it.
 */
export default {
  type: 'contact-form',
  label: 'Contact form',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Introduction' },
    {
      name: 'showDetails', type: 'select', label: 'Show office details beside the form', default: 'yes',
      options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }],
    },
  ],
  Component: ContactFormBlock,
};
