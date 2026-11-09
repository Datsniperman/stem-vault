import crypto from 'crypto';

const STREAM_SECRET =
  (process.env.STREAM_SECRET || process.env.JWT_SECRET || 'secure-mixingvault-hls-stream-secret-key-32').trim();

export interface StreamTokenPayload {
  sessionId: string;
  userId: string;
  tier: 'PLUS' | 'PREMIUM';
  exp: number; // unix timestamp in seconds
}

/**
 * Generate a cryptographically signed HMAC token for an HLS playback session.
 * Token expires in 15 minutes by default.
 */
export function generateStreamToken(
  sessionId: string,
  userId: string,
  tier: 'PLUS' | 'PREMIUM',
  expiresInSeconds: number = 900
): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload: StreamTokenPayload = {
    sessionId,
    userId,
    tier,
    exp,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = crypto
    .createHmac('sha256', STREAM_SECRET)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${hmac}`;
}

/**
 * Verify an HMAC stream token and ensure it has not expired and matches the requested session.
 */
export function verifyStreamToken(
  token: string,
  expectedSessionId?: string
): StreamTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, providedHmac] = parts;
    const expectedHmac = crypto
      .createHmac('sha256', STREAM_SECRET)
      .update(payloadB64)
      .digest('base64url');

    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(providedHmac), Buffer.from(expectedHmac))) {
      return null;
    }

    const payload: StreamTokenPayload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf-8')
    );

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null; // Expired
    }

    if (expectedSessionId && payload.sessionId !== expectedSessionId) {
      return null; // Session ID mismatch
    }

    return payload;
  } catch {
    return null;
  }
}
