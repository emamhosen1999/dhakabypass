import { NextResponse } from 'next/server';

/**
 * Serves the admin on its own subdomain: admin.dhakabypass.com/* maps onto the
 * /admin/* route tree of this same app, so there is one deployment.
 *
 * Auth is NOT enforced here — it's enforced in app/admin/layout.jsx (server
 * component), which can use bcrypt/mysql. Middleware runs on the edge runtime
 * where those aren't available.
 */
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
