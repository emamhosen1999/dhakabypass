import RootDocument from '../../components/chrome/RootDocument.jsx';
import { generateRootMetadata } from '../../lib/seo/root-metadata.js';

/** Root layout for the last-resort catch-all: a redirect or a plain 404. */
export async function generateMetadata() {
  return generateRootMetadata('en');
}

export default function UnmatchedRootLayout({ children }) {
  return <RootDocument lang="en">{children}</RootDocument>;
}
