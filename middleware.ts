import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('admin_token')?.value;
    const { pathname } = request.nextUrl;

    // Define public routes that don't require authentication
    const publicRoutes = ['/login', '/'];
    const isPublicRoute = publicRoutes.some(route => pathname === route);

    // Define protected routes (dashboard and all its sub-routes)
    const isProtectedRoute = pathname.startsWith('/dashboard') ||
        pathname.startsWith('/properties') ||
        pathname.startsWith('/units') ||
        pathname.startsWith('/tenants') ||
        pathname.startsWith('/finance') ||
        pathname.startsWith('/maintenance') ||
        pathname.startsWith('/expenses') ||
        pathname.startsWith('/reports') ||
        pathname.startsWith('/super-admin');

    // If user is not authenticated and trying to access protected route
    if (!token && isProtectedRoute) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // If user is authenticated and trying to access login page
    // We allow this to enable re-login if session is stale
    // if (token && pathname === '/login') {
    //     return NextResponse.redirect(new URL('/dashboard', request.url));
    // }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
