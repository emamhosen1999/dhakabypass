import { assertCan } from '../../../../lib/auth/assert-can';
import { LOCALES, LOCALE_LABELS } from '../../../../lib/i18n/locales';
import { getSetting, CONTACT_KEYS, SOCIAL_KEYS } from '../../../../lib/settings';
import { saveContactSettingsAction } from './actions';

export const dynamic = 'force-dynamic';

/**
 * Contact details and social links.
 *
 * Every field on this screen is something the site currently says is "not yet
 * published". Filling one in makes the callout on the public page disappear and
 * the real detail appear, with no deploy — which is the whole reason these live
 * in `site_settings` rather than in the page source.
 *
 * The screen says so, in those terms, because the person filling it in is more
 * likely to be a DBEDC administrator than a developer.
 */
export default async function SettingsPage() {
  await assertCan('manage_users');

  const [phone, email, emergency, address, hours] = await Promise.all([
    getSetting(CONTACT_KEYS.phone, ''),
    getSetting(CONTACT_KEYS.email, ''),
    getSetting(CONTACT_KEYS.emergency, ''),
    getSetting(CONTACT_KEYS.address, {}),
    getSetting(CONTACT_KEYS.hours, {}),
  ]);
  const social = {};
  for (const [name, key] of Object.entries(SOCIAL_KEYS)) {
    social[name] = await getSetting(key, '');
  }

  const per = (value, locale) =>
    (value && typeof value === 'object' ? value[locale] : locale === 'en' ? value : '') || '';

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-blue-900">Contact details</h1>
        <p className="text-gray-600">
          These appear on the contact page and in the footer. While a field is empty the site
          says that detail has not been published yet — filling it in replaces that notice
          with the real thing, immediately, with no need to rebuild the site.
        </p>
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded p-3">
          <strong>Leaving a field empty is a real choice.</strong> Clearing one removes it from
          the site and brings the notice back. Please do that rather than leaving a number
          published that no longer works — an emergency number nobody answers is worse than
          none, because the caller believes they have tried.
        </p>
      </header>

      <form action={saveContactSettingsAction} className="space-y-6">
        <section className="space-y-4">
          <h2 className="text-lg font-bold">How to reach DBEDC</h2>
          <Text
            name="phone" label="Telephone" defaultValue={phone}
            hint="The main office number, in the form a caller would dial."
          />
          <Text
            name="email" label="Email address" defaultValue={email} type="email"
            hint="Where general enquiries should go."
          />
          <Text
            name="emergency" label="Emergency assistance number" defaultValue={emergency}
            hint="The number a driver calls from the expressway. The safety page and the breakdown
                  instructions both use this. Leave it blank until it is confirmed to be answered."
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold">Office address</h2>
          <p className="text-sm text-gray-600">
            One per language. If only English is filled in, readers on the other languages see
            the English — which is better than seeing nothing.
          </p>
          {LOCALES.map((l) => (
            <Textarea
              key={l} name={`address_${l}`} label={LOCALE_LABELS[l]}
              defaultValue={per(address, l)} rows={3}
            />
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold">Opening hours</h2>
          {LOCALES.map((l) => (
            <Text
              key={l} name={`hours_${l}`} label={LOCALE_LABELS[l]}
              defaultValue={per(hours, l)}
            />
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold">Official accounts</h2>
          <p className="text-sm text-gray-600">
            Only add an account DBEDC actually controls. A link here tells search engines this
            account speaks for the company.
          </p>
          {Object.keys(SOCIAL_KEYS).map((name) => (
            <Text
              key={name} name={`social_${name}`} label={name[0].toUpperCase() + name.slice(1)}
              defaultValue={social[name]} placeholder="https://…"
            />
          ))}
        </section>

        <button type="submit" className="px-4 py-2 rounded bg-black text-white">
          Save contact details
        </button>
      </form>
    </div>
  );
}

function Text({ name, label, hint, defaultValue, type = 'text', placeholder }) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-semibold">{label}</label>
      {hint ? <p className="text-sm text-gray-600">{hint}</p> : null}
      <input
        id={name} name={name} type={type} defaultValue={defaultValue} placeholder={placeholder}
        className="w-full border rounded px-3 py-2"
      />
    </div>
  );
}

function Textarea({ name, label, defaultValue, rows }) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-semibold">{label}</label>
      <textarea
        id={name} name={name} rows={rows} defaultValue={defaultValue}
        className="w-full border rounded px-3 py-2"
      />
    </div>
  );
}
