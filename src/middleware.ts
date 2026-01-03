import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('admin_token');
    const isLoginPage = request.nextUrl.pathname === '/login';

    // If trying to access dashboard without token, redirect to login
    // If trying to access dashboard without token, redirect to login
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        if (!token) {
            // TEMPORARY: Allow access without token for viewing
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // If trying to access login page with token, redirect to dashboard
    if (isLoginPage && token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/login'],
};
