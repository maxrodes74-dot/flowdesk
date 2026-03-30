import crypto from 'crypto';

interface GeneratedApiKey {
  key: string;
  hash: string;
  prefix: string;
}

/**
 * Generate a new API key with format: sk_scopepad_{random_part}
 * Returns the key, its SHA-256 hash, and a displayable prefix
 */
export function generateApiKey(): GeneratedApiKey {
  const randomPart = crypto.randomBytes(32).toString('hex');
  const key = `sk_scopepad_${randomPart}`;
  const hash = hashApiKey(key);
  const prefix = `sk_scope_${randomPart.substring(0, 8)}`;

  return {
    key,
    hash,
    prefix,
  };
}

/**
 * Hash an API key using SHA-256
 * Used for secure storage and fast lookups
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Mask an API key for display purposes
 * Shows first 12 chars + "..." + last 4
 */
export function maskApiKey(key: string): string {
  if (key.length < 16) {
    return key;
  }
  const start = key.substring(0, 12);
  const end = key.substring(key.length - 4);
  return `${start}...${end}`;
}
