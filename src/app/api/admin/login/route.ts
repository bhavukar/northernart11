import { NextResponse } from 'next/server';
import { signJWT } from '@/lib/jwt';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const allowedEmail = process.env.ALLOWED_ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const jwtSecret = process.env.JWT_SECRET;

    if (!allowedEmail || !adminPassword || !jwtSecret) {
      console.error('Server configuration error: Admin auth environment variables are missing.');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (email === allowedEmail && password === adminPassword) {
      // Create JWT valid for 7 days (7 * 24 * 60 * 60 seconds)
      const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
      const token = await signJWT({ email, exp }, jwtSecret);

      const response = NextResponse.json({ success: true });
      
      // Set secure HTTP-only session cookie
      response.cookies.set('admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        path: '/',
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Admin login API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
