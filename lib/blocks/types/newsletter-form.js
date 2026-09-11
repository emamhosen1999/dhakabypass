import NewsletterFormBlock from '../../../components/blocks/NewsletterFormBlock.jsx';

/**
 * An email sign-up for operational notices.
 *
 * The legacy site had one on the home page and on /latest-updates, writing
 * to `newsletter_subscribers` through an action with no honeypot and English
 * -only messages. This block writes to the same table through
 * lib/newsletter/actions.js, which has the honeypot, the shared rate limit
 * and per-locale outcome messages the contact form has. The operator authors
 * the heading, the invitation and the button label; the field label and the
 * outcome messages come from ui_strings.
 */
export default {
  type: 'newsletter-form',
  label: 'Email sign-up',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Invitation' },
    { name: 'buttonLabel', type: 'text', label: 'Button label (blank = "Subscribe")' },
    { name: 'note', type: 'text', label: 'Note under the field (blank = the standard privacy line)' },
  ],
  Component: NewsletterFormBlock,
};
