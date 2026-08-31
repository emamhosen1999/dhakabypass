import SiteHeader from '../../components/SiteHeader';
import SiteFooter from '../../components/SiteFooter';
import { getSections } from '../../lib/content';

// Content is DB-backed, so never statically freeze the shell.
export const dynamic = 'force-dynamic';

/** Public site chrome: fixed header + spacer + content + footer. */
export default async function SiteLayout({ children }) {
  const { 'site.header': header, 'site.footer': footer } = await getSections([
    'site.header',
    'site.footer',
  ]);

  return (
    <>
      <SiteHeader content={header} />
      <div className="h-16" />
      <div className="min-h-screen bg-white text-gray-800 font-sans">
        {children}
        <SiteFooter content={footer} />
      </div>
    </>
  );
}
