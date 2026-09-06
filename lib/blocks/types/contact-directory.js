import ContactDirectoryBlock from '../../../components/blocks/ContactDirectoryBlock.jsx';

/**
 * Departmental contacts: tolling, O&M, HSE, media, procurement, the RTI
 * officer, the grievance officer.
 *
 * No item field is required, and `name` least of all. DBEDC publishes ROLE
 * numbers — the duty manager's desk, the control room — not the personal
 * mobile of whoever holds the post this month, so an entry has to be
 * publishable with a department, a role and a number and no person at all.
 * Requiring a name here would invite an operator to fill it with one.
 *
 * The telephone number is authored as it should be PRINTED, with the grouping
 * a Bangladeshi reader expects; the block strips it to digits for the `tel:`
 * target, so the operator never has to type it twice.
 */
export default {
  type: 'contact-directory',
  label: 'Contact directory',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    {
      name: 'items', type: 'list', label: 'Contacts', default: [],
      itemLabel: 'contact',
      itemFields: [
        { name: 'department', type: 'text', label: 'Department' },
        { name: 'role', type: 'text', label: 'Role' },
        { name: 'name', type: 'text', label: 'Named person (optional)' },
        { name: 'phone', type: 'text', label: 'Telephone as printed' },
        { name: 'email', type: 'text', label: 'Email' },
        { name: 'hours', type: 'text', label: 'Hours' },
        { name: 'notes', type: 'text', label: 'Notes' },
      ],
    },
  ],
  Component: ContactDirectoryBlock,
};
