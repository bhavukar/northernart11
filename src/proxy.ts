import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/jwt';

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Exclude login UI and login API routes
  if (path === '/admin/login' || path === '/api/admin/login') {
    return NextResponse.next();
  }

  const token = request.cookies.get('admin_session')?.value;
  const jwtSecret = process.env.JWT_SECRET || '';
  const allowedAdminEmail = process.env.ALLOWED_ADMIN_EMAIL || '';

  let isAuthorized = false;
  if (token && jwtSecret && allowedAdminEmail) {
    const decoded = await verifyJWT(token, jwtSecret);
    if (decoded && decoded.email === allowedAdminEmail) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    // If it's an API request, return a JSON error
    if (path.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }
    // Otherwise, redirect user to the admin login page
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Match all admin routes and admin api routes
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
