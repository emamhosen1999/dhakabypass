import AlertSignupBlock from '../../../components/blocks/AlertSignupBlock.jsx';

/** Road alerts by SMS or WhatsApp (W4.13): sign-up and unsubscribe. */
export default {
  type: 'alert-signup',
  label: 'SMS / WhatsApp alerts sign-up',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading (blank = the standard wording)' },
    { name: 'intro', type: 'text', label: 'Introduction' },
  ],
  Component: AlertSignupBlock,
};
