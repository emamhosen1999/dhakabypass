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
  return (
    <html lang="en" className="scroll-smooth">
      <body>{children}</body>
    </html>
  );
}
