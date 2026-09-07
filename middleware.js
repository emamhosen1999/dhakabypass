import { NextResponse } from 'next/server';

/**
 * Serves the admin on its own subdomain: admin.dhakabypass.com/* maps onto the
 * /admin/* route tree of this same app, so there is one deployment.
 *
 * Auth is NOT enforced here — it's enforced in app/admin/layout.jsx (server
 * component), which can use bcrypt/mysql. Middleware runs on the edge runtime
 * where those aren't available.
 */
/**
 * `/{locale}/preview/{pageId}` is the block editor's draft preview. It lives in
 * the PUBLIC route tree on purpose — that is the only way it can inherit
 * app/[locale]/layout.jsx and render identically to the live page — but the
 * editor that iframes it is served from the admin host. Without this
 * exemption the rewrite below would turn it into `/admin/{locale}/preview/...`,
 * which does not exist, and the preview pane would show a 404 on
 * admin.dhakabypass.com while working on the main host.
 *
 * The route itself is session-gated (app/[locale]/preview/[id]/page.jsx); this
 * grants no access, only the correct path.
 */
const PREVIEW_PATH = /^\/(en|bn|zh)\/preview(\/|$)/;
const isPreviewPath = (pathname) => PREVIEW_PATH.test(pathname);

export function middleware(request) {
  const host = (request.headers.get('host') || '').split(':')[0].toLowerCase();
  const isAdminHost = host.startsWith('admin.');
  const { pathname } = request.nextUrl;

  if (!isAdminHost) return NextResponse.next();

  // Let internal/asset routes through untouched.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    isPreviewPath(pathname) ||
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/admin${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
