import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getDbPool } from '@/lib/db/pool';

export const USER_BETA_CAP_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB
export const PER_FILE_CAP_BYTES = 500 * 1024 * 1024;       // 500 MB
export const GLOBAL_BETA_LIMIT_BYTES = 9 * 1024 * 1024 * 1024; // 9 GB

export interface R2ConfigStatus {
  isConfigured: boolean;
  missingKeys: string[];
  accountId?: string;
  bucketName?: string;
  publicUrl?: string;
}

export function getR2ConfigStatus(): R2ConfigStatus {
  const keys = [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
    'R2_PUBLIC_URL',
  ];

  const missingKeys = keys.filter(k => !process.env[k]?.trim());

  return {
    isConfigured: missingKeys.length === 0,
    missingKeys,
    accountId: process.env.R2_ACCOUNT_ID,
    bucketName: process.env.R2_BUCKET_NAME,
    publicUrl: process.env.R2_PUBLIC_URL,
  };
}

let s3ClientInstance: S3Client | null = null;

function getS3Client(): S3Client | null {
  const status = getR2ConfigStatus();
  if (!status.isConfigured) return null;

  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3ClientInstance;
}

const LOCAL_FALLBACK_DIR = path.join(process.cwd(), '.storage-beta-fallback');

function ensureLocalFallbackDir(subPath?: string) {
  const target = subPath ? path.join(LOCAL_FALLBACK_DIR, subPath) : LOCAL_FALLBACK_DIR;
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  return target;
}

/**
 * Upload a file blob to Cloudflare R2 or the beta-only local fallback.
 */
export async function uploadBlob(
  key: string,
  buffer: Buffer,
  contentType: string = 'application/octet-stream'
): Promise<{ key: string; publicUrl: string; isFallback: boolean }> {
  const status = getR2ConfigStatus();

  if (status.isConfigured) {
    const s3 = getS3Client()!;
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    const publicBase = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '');
    const publicUrl = `${publicBase}/${key}`;

    return { key, publicUrl, isFallback: false };
  }

  // Beta-only local fallback storage
  const localFilePath = path.join(LOCAL_FALLBACK_DIR, key);
  ensureLocalFallbackDir(path.dirname(key));
  fs.writeFileSync(localFilePath, buffer);

  // Expose via local storage raw endpoint for audio streaming
  const publicUrl = `/api/storage/raw/${encodeURI(key)}`;
  return { key, publicUrl, isFallback: true };
}

/**
 * Delete a file blob from Cloudflare R2 or beta-only local fallback.
 */
export async function deleteBlob(key: string): Promise<void> {
  const status = getR2ConfigStatus();

  if (status.isConfigured) {
    const s3 = getS3Client();
    if (s3) {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: key,
        })
      );
    }
    return;
  }

  const localFilePath = path.join(LOCAL_FALLBACK_DIR, key);
  if (fs.existsSync(localFilePath)) {
    try {
      fs.unlinkSync(localFilePath);
    } catch (e) {
      console.warn(`[storage] Could not delete local fallback file ${localFilePath}:`, e);
    }
  }
}

/**
 * Read local fallback file path if it exists.
 */
export function getLocalFallbackFilePath(key: string): string | null {
  const filePath = path.join(LOCAL_FALLBACK_DIR, key);
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  return null;
}

/**
 * Calculate total storage used by a specific user in bytes.
 */
export async function getUserStorageUsed(userId: string): Promise<number> {
  const pool = getDbPool();

  const [tracksRes, mixesRes] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(mt.size_bytes), 0)::bigint as total
       FROM public.multi_tracks mt
       JOIN public.multis m ON mt.multi_id = m.id
       WHERE m.owner_id = $1`,
      [userId]
    ),
    pool.query(
      `SELECT COALESCE(SUM(size_bytes), 0)::bigint as total
       FROM public.mixes
       WHERE owner_id = $1`,
      [userId]
    ),
  ]);

  const tracksTotal = BigInt(tracksRes.rows[0]?.total || 0);
  const mixesTotal = BigInt(mixesRes.rows[0]?.total || 0);

  return Number(tracksTotal + mixesTotal);
}

/**
 * Calculate global total storage used across all users in bytes.
 */
export async function getGlobalStorageUsed(): Promise<number> {
  const pool = getDbPool();

  const [tracksRes, mixesRes] = await Promise.all([
    pool.query(`SELECT COALESCE(SUM(size_bytes), 0)::bigint as total FROM public.multi_tracks`),
    pool.query(`SELECT COALESCE(SUM(size_bytes), 0)::bigint as total FROM public.mixes`),
  ]);

  const tracksTotal = BigInt(tracksRes.rows[0]?.total || 0);
  const mixesTotal = BigInt(mixesRes.rows[0]?.total || 0);

  return Number(tracksTotal + mixesTotal);
}

/**
 * Validate upload against beta quotas:
 * - File cap: 500 MB
 * - User cap: 2 GB
 * - Global limit: 9 GB warning & hard refusal
 */
export async function validateBetaUploadQuotas(
  userId: string,
  newUploadBytes: number,
  isAdmin: boolean = false
): Promise<{ allowed: boolean; error?: string }> {
  // Admins have unlimited storage and no upload size caps
  if (isAdmin) {
    return { allowed: true };
  }
  if (newUploadBytes > PER_FILE_CAP_BYTES) {
    return {
      allowed: false,
      error: `Upload exceeds beta limit of 500 MB per file (attempted: ${(newUploadBytes / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  const [userUsed, globalUsed] = await Promise.all([
    getUserStorageUsed(userId),
    getGlobalStorageUsed(),
  ]);

  if (globalUsed + newUploadBytes > GLOBAL_BETA_LIMIT_BYTES) {
    return {
      allowed: false,
      error: `Global storage limit approaching 9 GB free tier limit (${(globalUsed / (1024 * 1024 * 1024)).toFixed(2)} GB currently used). New uploads are paused to protect free tier limits.`,
    };
  }

  if (userUsed + newUploadBytes > USER_BETA_CAP_BYTES) {
    return {
      allowed: false,
      error: `You have reached your 2 GB beta storage quota (${(userUsed / (1024 * 1024)).toFixed(1)} MB used). Please delete older uploads before uploading more.`,
    };
  }

  return { allowed: true };
}
