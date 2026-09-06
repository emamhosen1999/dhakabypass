import { notFound, redirect } from 'next/navigation';
import { auth } from '../../../../auth';
import { isLocale } from '../../../../lib/i18n/locales.js';
import { listPages, getPageBlocks } from '../../../../lib/content/pages.js';
import { withDraftTranslations } from '../../../../lib/content/preview.js';
import BlockRenderer from '../../../../components/blocks/BlockRenderer.jsx';

/**
 * `/{locale}/preview/{pageId}` — the operator's draft preview.
 *
 * WHY IT LIVES IN THE PUBLIC TREE. It sits under app/[locale]/ so it inherits
 * app/[locale]/layout.jsx — the real header, footer, advisory bar, theme
 * script, fonts and design tokens — and renders its blocks through the same
 * BlockRenderer the live page uses. A preview built under /admin would need a
 * second copy of the site chrome, and a second copy drifts. Nothing here
 * renders content differently from production; the ONLY difference is that
 * lib/content/preview.js promotes `draft` translations to renderable first.
 *
 * WHAT KEEPS DRAFTS PRIVATE. The session gate below, mirroring
 * app/admin/(dash)/layout.jsx: an unauthenticated or non-admin request is sent
 * to the admin sign-in, never served unpublished content. Being in the public
 * tree buys the correct rendering, not public access.
 *
 * It is uncached and uncacheable — `force-dynamic` plus the uncached readers
 * from lib/content/pages.js (the public route uses lib/content/cache.js), so a
 * draft is never written into the ISR cache and can never be served from it to
 * a visitor.
 */
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Draft preview',
  // Belt and braces on top of the session gate: never index, never follow.
  robots: { index: false, follow: false, nocache: true },
};

export default async function PreviewPage({ params }) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect('/admin/login');

  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const pageId = Number(id);
  if (!Number.isInteger(pageId) || pageId <= 0) notFound();

  // listPages() is what the editor itself resolves the page from, so the
  // preview cannot show a page the editor would not open.
  const page = (await listPages()).find((p) => p.id === pageId);
  if (!page) notFound();

  // Unlike the public route there is NO `page.status !== 'published'` check —
  // previewing an unpublished page is the entire point.
  const blocks = await getPageBlocks(pageId);
  return <BlockRenderer blocks={withDraftTranslations(blocks)} locale={locale} />;
}
