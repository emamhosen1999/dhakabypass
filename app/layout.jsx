import './globals.css';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { getSections } from '../lib/content';

export const metadata = {
  title: "Dhaka Bypass Expressway - Bangladesh's First Fully Access-Controlled Highway",
  description:
    'Official website of the Dhaka Bypass Expressway project, spanning 48km and connecting major national highways around Dhaka.',
  icons: { icon: [{ url: '/favicon.ico', type: 'image/x-icon', sizes: '16x16' }] },
};

// Content is DB-backed, so never statically freeze the shell.
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }) {
  const { 'site.header': header, 'site.footer': footer } = await getSections([
    'site.header',
    'site.footer',
  ]);

  return (
    <html lang="en" className="scroll-smooth">
      <body>
        <SiteHeader content={header} />
        <div className="h-16" />
        <div className="min-h-screen bg-white text-gray-800 font-sans">
          {children}
          <SiteFooter content={footer} />
        </div>
      </body>
    </html>
  );
}
