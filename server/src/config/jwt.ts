import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded from server or workspace root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const DEFAULT_DEV_TEST_SECRET = 'swiftdrive-secret-key-cse5009-dev-academic-2026';

export function validateJwtSecret(secret?: string, nodeEnv?: string): string {
  const env = nodeEnv || process.env.NODE_ENV || 'development';
  const isProd = env === 'production';
  const trimmed = secret?.trim();

  if (isProd) {
    if (
      !trimmed ||
      trimmed === DEFAULT_DEV_TEST_SECRET ||
      trimmed === 'swiftdrive-secret-key-cse5009-academic-2026' ||
      trimmed.length < 32
    ) {
      throw new Error(
        'FATAL CONFIGURATION ERROR: A cryptographically secure JWT_SECRET (minimum 32 characters, no public defaults) is required in production environment.'
      );
    }
    return trimmed;
  }

  // Development and testing fallback
  return trimmed && trimmed.length >= 16 ? trimmed : DEFAULT_DEV_TEST_SECRET;
}

export const JWT_SECRET = validateJwtSecret(process.env.JWT_SECRET, process.env.NODE_ENV);
export const JWT_EXPIRES_IN = '7d';
