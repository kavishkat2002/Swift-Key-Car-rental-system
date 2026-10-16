import dotenv from 'dotenv';
dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || 'swiftdrive-secret-key-cse5009-academic-2026';
export const JWT_EXPIRES_IN = '7d';
