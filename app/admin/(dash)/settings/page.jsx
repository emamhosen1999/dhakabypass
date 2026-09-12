import { assertCan } from '../../../../lib/auth/assert-can';
import { LOCALES, LOCALE_LABELS } from '../../../../lib/i18n/locales';
import { getSetting, CONTACT_KEYS, SOCIAL_KEYS } from '../../../../lib/settings';
import { getSeoSettings, SEO_DEFAULTS, SEO_KEYS } from '../../../../lib/seo/settings';
import { saveContactSettingsAction, saveSeoSettingsAction } from './actions';

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

  // The RAW stored values, not `getSeoSettings()`'s resolved ones, for the two
  // per-locale fields. The resolved object substitutes the code default for a
  // blank, which is right for the site and wrong for this form: rendering the
  // default INTO the box would make an untouched field look edited, and the
  // next save would store it as an override that outranks any later correction
  // — the same trap db/sql/09-ui-strings.sql refuses to seed itself into. The
  // placeholders below show the default instead.
  const [storedTitle, storedDescription] = await Promise.all([
    getSetting(SEO_KEYS.siteTitle, {}),
    getSetting(SEO_KEYS.siteDescription, {}),
  ]);
  // The single-valued fields have no such problem: an empty box and the code
  // default mean the same thing there, and showing the resolved value tells the
  // operator what the site is actually using right now.
  const seo = await getSeoSettings('en');

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

      <hr className="border-gray-200" />

      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-blue-900">Search engines and site identity</h1>
        <p className="text-gray-600">
          How the site describes itself to Google and to anything that shows a link preview.
          Every field here has a built-in value that the site uses while the box is empty —
          shown in grey inside each box. Clearing a field goes back to that built-in value; it
          does not blank the site.
        </p>
        <p className="text-sm text-gray-600">
          Individual pages set their own title and description on the page editor. These are
          the fallbacks, used where a page has said nothing.
        </p>
      </header>

      <form action={saveSeoSettingsAction} className="space-y-6">
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Site title</h2>
          <p className="text-sm text-gray-600">
            The browser tab and the blue line in a search result, for pages that do not set
            their own.
          </p>
          {LOCALES.map((l) => (
            <Text
              key={l} name={`site_title_${l}`} label={LOCALE_LABELS[l]}
              defaultValue={per(storedTitle, l)}
              placeholder={l === 'en' ? SEO_DEFAULTS.siteTitle : 'Falls back to English'}
            />
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold">Site description</h2>
          <p className="text-sm text-gray-600">
            The grey text under the link in a search result. Around 150 characters is what
            Google shows; longer is not wrong, it is just cut off.
          </p>
          {LOCALES.map((l) => (
            <Textarea
              key={l} name={`site_description_${l}`} label={LOCALE_LABELS[l]}
              defaultValue={per(storedDescription, l)} rows={2}
            />
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold">Images</h2>
          <Text
            name="favicon" label="Favicon" defaultValue={seo.favicon}
            placeholder={SEO_DEFAULTS.favicon}
            hint="The small icon in the browser tab. Upload it under Media first, then paste
                  its path here — it looks like /uploads/name.png."
          />
          <Text
            name="og_image" label="Default sharing image" defaultValue={seo.ogImage}
            placeholder="/uploads/share.webp"
            hint="Shown when somebody posts a link to this site on Facebook, LinkedIn or
                  WhatsApp. Leave it empty and no image is claimed, which is better than
                  claiming one that does not represent the page."
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold">Organisation</h2>
          <p className="text-sm text-gray-600">
            The short name is the header&rsquo;s brand line and the full name is the footer&rsquo;s;
            both are also published as structured data on every page — what a search engine may
            quote back to the public with DBEDC&rsquo;s name on it. Only the company&rsquo;s real,
            official name belongs here. The line under the short name (&ldquo;Dhaka Bypass
            Expressway&rdquo;) is the <em>brandTagline</em> string under Wording, per language.
          </p>
          <Text
            name="org_name" label="Full name" defaultValue={seo.orgName}
            placeholder={SEO_DEFAULTS.orgName}
          />
          <Text
            name="org_short_name" label="Short name" defaultValue={seo.orgShortName}
            placeholder={SEO_DEFAULTS.orgShortName}
          />
          <Text
            name="header_logo" label="Header logo" defaultValue={seo.headerLogo}
            placeholder="(blank = the built-in DBEDC mark)"
            hint="Shown at the top of every page beside the short name. Leave blank to keep
                  the built-in mark, which recolours itself for the dark header. A picture
                  here is shown at 30 pixels high; use a transparent PNG or WebP."
          />
          <Text
            name="logo_path" label="Logo" defaultValue={seo.logoPath}
            placeholder={SEO_DEFAULTS.logoPath}
            hint="The logo search engines use. Its size is read from the file itself, so
                  replacing the image is all that is needed. Use a PNG, JPEG or WebP at least
                  112 pixels on each side — an SVG has no fixed size and will be published
                  without one."
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold">Crawling</h2>
          <div className="space-y-1">
            <label htmlFor="robots_mode" className="block text-sm font-semibold">
              Search engine access
            </label>
            <select
              id="robots_mode" name="robots_mode" defaultValue={seo.robotsMode}
              className="w-full border rounded px-3 py-2"
            >
              <option value="default">Normal — the public site can be found in search</option>
              <option value="block_all">Blocked — ask every search engine to skip the whole site</option>
            </select>
            <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded p-3">
              <strong>&ldquo;Blocked&rdquo; hides the entire site from Google.</strong> It is
              for the period before launch. Turning it off again does not bring the pages back
              immediately — it can take days or weeks for search engines to re-crawl and list
              them.
            </p>
          </div>
          <Textarea
            name="robots_disallow" label="Additional paths to keep out of search"
            defaultValue={(seo.robotsDisallow || []).join('\n')} rows={4}
          />
          <p className="text-sm text-gray-600">
            One path per line, each starting with &ldquo;/&rdquo;. The admin and the API are
            already excluded and do not need listing. To hide a single page, use the Search
            settings on that page under SEO instead — that also removes it from the sitemap.
          </p>
        </section>

        <button type="submit" className="px-4 py-2 rounded bg-black text-white">
          Save SEO settings
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
