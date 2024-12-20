// Define the rate-limiting rules
interface TokenBucketRule {
  mode: "LIVE" | "DRY_RUN";
  refillRate: number;
  interval: number;
  capacity: number;
}

interface FixedWindowRule {
  mode: "LIVE" | "DRY_RUN";
  windowMs: number;
  limit: number;
}

interface LeakyBucketRule {
  mode: "LIVE" | "DRY_RUN";
  leakRate: number;
  timeout: number;
  capacity: number;
}

interface SlidingWindowRule {
  mode: "LIVE" | "DRY_RUN";
  windowMs: number;
  limit: number;
}

// Shield rule
interface ShieldRule {
  mode: "LIVE" | "DRY_RUN";
  windowMs: number;
  limit: number;
  threshold: number;
}

// Unified RateLimitingRule type
type RateLimitingRule =
  | (TokenBucketRule & { algorithm: "TokenBucketRule" })
  | (FixedWindowRule & { algorithm: "FixedWindowRule" })
  | (LeakyBucketRule & { algorithm: "LeakyBucketRule" })
  | (SlidingWindowRule & { algorithm: "SlidingWindowRule" });

// Main options interface
interface zsecureOptions {
  API_KEY: string;
  baseUrl?: string;
  logs?: boolean;
  rateLimitingRule?: RateLimitingRule; // Rate limiting rule (optional)
  shieldRule?: ShieldRule;            // Shield rule (optional)
}

// Protect and shield options interfaces
interface ProtectOptions {
  userId: string;
  requested?: number;
}

interface ShieldOptions {
  req: any;
  requested?: number;
}

// Exporting all types
export {
  TokenBucketRule,
  FixedWindowRule,
  LeakyBucketRule,
  SlidingWindowRule,
  ShieldRule,
  RateLimitingRule,
  zsecureOptions,
  ProtectOptions,
  ShieldOptions,
};
