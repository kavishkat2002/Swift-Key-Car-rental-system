import { Request, Response, NextFunction } from 'express';

export interface RateLimiterOptions {
  windowMs: number;
  max: number;
  message?: string;
  skip?: (req: Request) => boolean;
  prefix?: string;
}

interface ClientRecord {
  timestamps: number[];
}

export class InMemoryRateLimiter {
  private records = new Map<string, ClientRecord>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Run cleanup every 2 minutes without blocking process termination
    this.cleanupInterval = setInterval(() => this.cleanup(), 2 * 60 * 1000);
    if (this.cleanupInterval && typeof this.cleanupInterval.unref === 'function') {
      this.cleanupInterval.unref();
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      const validTimestamps = record.timestamps.filter(ts => now - ts < 60 * 60 * 1000);
      if (validTimestamps.length === 0) {
        this.records.delete(key);
      } else {
        record.timestamps = validTimestamps;
      }
    }
  }

  public reset(): void {
    this.records.clear();
  }

  public createMiddleware(options: RateLimiterOptions) {
    const { windowMs, max, message, skip, prefix = 'rl' } = options;
    const errorMessage = message || 'Too many requests. Please try again later.';

    return (req: Request, res: Response, next: NextFunction): void => {
      if (skip && skip(req)) {
        return next();
      }

      const ip = getClientIp(req);
      const key = `${prefix}:${ip}`;
      const now = Date.now();

      let record = this.records.get(key);
      if (!record) {
        record = { timestamps: [] };
        this.records.set(key, record);
      }

      // Filter out timestamps outside current sliding window
      record.timestamps = record.timestamps.filter(ts => now - ts < windowMs);

      const count = record.timestamps.length;
      const oldestTimestamp = count > 0 ? record.timestamps[0] : now;
      const resetTimeSeconds = Math.ceil((oldestTimestamp + windowMs) / 1000);
      const retryAfterSeconds = Math.max(1, Math.ceil((oldestTimestamp + windowMs - now) / 1000));

      res.setHeader('RateLimit-Limit', max);
      res.setHeader('RateLimit-Remaining', Math.max(0, max - count));
      res.setHeader('RateLimit-Reset', resetTimeSeconds);

      if (count >= max) {
        res.setHeader('Retry-After', retryAfterSeconds);
        res.status(429).json({
          success: false,
          error: errorMessage,
          retryAfter: retryAfterSeconds
        });
        return;
      }

      // Record this attempt
      record.timestamps.push(now);
      res.setHeader('RateLimit-Remaining', Math.max(0, max - (count + 1)));

      next();
    };
  }
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}

export const rateLimiterStore = new InMemoryRateLimiter();

export function resetRateLimits(): void {
  rateLimiterStore.reset();
}

// Configurable login rate limiter: 10 attempts per 15 minutes by default
const loginWindowMs = Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const loginMax = Number(process.env.LOGIN_RATE_LIMIT_MAX) || 10;

export const loginRateLimiter = rateLimiterStore.createMiddleware({
  prefix: 'login',
  windowMs: loginWindowMs,
  max: loginMax,
  message: 'Too many login attempts from this IP address. Please wait 15 minutes before trying again.',
  skip: (req) => {
    // In test environment, skip unless explicit test header is provided
    return process.env.NODE_ENV === 'test' && req.headers['x-test-rate-limit'] !== 'true';
  }
});

// Configurable registration rate limiter: 5 accounts per 1 hour by default
const registerWindowMs = Number(process.env.REGISTER_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000;
const registerMax = Number(process.env.REGISTER_RATE_LIMIT_MAX) || 5;

export const registerRateLimiter = rateLimiterStore.createMiddleware({
  prefix: 'register',
  windowMs: registerWindowMs,
  max: registerMax,
  message: 'Registration rate limit exceeded from this IP address. Please try again later.',
  skip: (req) => {
    return process.env.NODE_ENV === 'test' && req.headers['x-test-rate-limit'] !== 'true';
  }
});
