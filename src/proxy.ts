import { NextResponse, type NextRequest } from 'next/server';
import { verifyJwt } from './lib/db/jwt';

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  const sessionToken =
    request.cookies.get('mv_session_token')?.value ||
    request.cookies.get('sb-access-token')?.value;

  if (sessionToken) {
    const payload = verifyJwt<any>(sessionToken);
    if (payload && payload.sub) {
      // Valid authenticated session
      response.headers.set('x-user-id', payload.sub);
      response.headers.set('x-user-role', payload.role || 'authenticated');
    }
  }

  return response;
}

export const middleware = proxy;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
