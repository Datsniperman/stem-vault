import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDbPool } from '@/lib/db/pool';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const pool = getDbPool();
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date().toISOString();

    await pool.query(
      `UPDATE auth.users
       SET recovery_token = $1, recovery_sent_at = $2
       WHERE lower(email) = lower($3)`,
      [token, now, email.trim()]
    );

    return NextResponse.json({ message: 'If an account exists, a reset link has been dispatched.' });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Error processing request' }, { status: 500 });
  }
}
