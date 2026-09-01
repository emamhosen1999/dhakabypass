import './globals.css';

export const metadata = {
  title: "Dhaka Bypass Expressway - Bangladesh's First Fully Access-Controlled Highway",
  description:
    'Official website of the Dhaka Bypass Expressway project, spanning 48km and connecting major national highways around Dhaka.',
  icons: { icon: [{ url: '/favicon.ico', type: 'image/x-icon', sizes: '16x16' }] },
};

/**
 * Root layout is html/body only. The public site chrome (header/footer) lives in
 * app/(site)/layout.jsx and the admin chrome in app/admin/(dash)/layout.jsx, so
 * the admin never inherits the public header.
 */
export default function RootLayout({ children }) {
  // suppressHydrationWarning is required, not cosmetic: the new site's theme
  // script (components/chrome/ThemeScript.jsx) stamps data-theme on this element
  // before paint so the page never flashes the wrong theme. That attribute is
  // absent from the server-rendered HTML by design, which React would otherwise
  // report as a hydration mismatch on every dark-theme load. It suppresses the
  // warning for this element's own attributes ONLY, one level deep — it does not
  // affect children, and it changes nothing for the legacy site.
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
