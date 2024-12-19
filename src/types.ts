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
    timeout : number;
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
  
  // Create a union type for the different rate-limiting algorithms
  type RateLimitingAlgorithm =
    | { algorithm: "TokenBucketRule"; rules: TokenBucketRule }
    | { algorithm: "FixedWindowRule"; rules: FixedWindowRule }
    | { algorithm: "LeakyBucketRule"; rules: LeakyBucketRule }
    | { algorithm: "SlidingWindowRule"; rules: SlidingWindowRule };
  
  // // Define the main options interface with rate limiting and shield options
  // interface zsecureOptions {
  //   API_KEY: string;
  //   rateLimitingRule?: RateLimitingAlgorithm; // This ensures the right rule is selected based on the algorithm
  //   shieldRule?: ShieldRule;
  //   baseUrl?: string;
  // }

  type zsecureOptions = {
    API_KEY: string;
    baseUrl?: string;
    loggin?: boolean;
  } & (
    | { rateLimitingRule: RateLimitingAlgorithm; shieldRule?: ShieldRule } // Rate limiting is required, shield is optional
    | { rateLimitingRule?: RateLimitingAlgorithm; shieldRule: ShieldRule } // Shield is required, rate limiting is optional
  );


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
    zsecureOptions,
    ProtectOptions,
    ShieldOptions
  };
  