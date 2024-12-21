import axios from "axios";
import {
  zsecureOptions,
  ProtectOptions,
  ShieldOptions,
  RateLimitingRule,
  ShieldRule,
} from "./types.js"; // Adjust path as necessary
import { getClientIp, generateApiKey } from "./findIp.js";

class ZSecure {
  private API_KEY: string;
  private rateLimitingRule?: RateLimitingRule;
  private shieldRule?: ShieldRule;
  private serverUrl: string;
  private identificationKey: string;
  private logging: boolean;

  constructor(options: zsecureOptions) {
    if (!options.API_KEY) {
      throw new Error("API key is required");
    }

    if (!options.rateLimitingRule && !options.shieldRule) {
      throw new Error("At least one of rateLimitingRule or shieldRule must be defined");
    }

    this.API_KEY = options.API_KEY;
    this.rateLimitingRule = options.rateLimitingRule;
    this.shieldRule = options.shieldRule;
    this.serverUrl = options.baseUrl ?? process.env.BASE_URL ?? "http://localhost:3000";
    this.identificationKey = generateApiKey(16); // Adjust length if necessary
    this.logging = options.logs ?? false; // Default to false if not provided

    if (this.logging) {
      console.log("[ZSecure] Initialized with options:", options);
    }
  }

  /**
   * Send combined request for both rate-limiting and shield protection.
   */
  async protect(req: any, userId: string, requestedTokens = 1) {
    let userIp;
    if (!userId) {
        userIp = getClientIp({
            ...req,
            headers: req.headers,
        });
    }

    // Prepare the shield request payload
    const shieldRequest = this.shieldRule
        ? {
            params: JSON.stringify(req.params) ?? "",
            url: JSON.stringify(req.url),
            query: JSON.stringify(req.query) ?? "",
            body: JSON.stringify(req.body) ?? "", // Optional: Include body for POST/PUT requests
        }
        : undefined;

    if (this.logging) {
        console.log("[ZSecure] Shield request data:", shieldRequest);
    }

    const payload = {
        key: this.API_KEY,
        identificationKey: this.identificationKey,
        userId: userId || userIp, // Use IP if userId is not provided
        rateLimiting: this.rateLimitingRule
            ? {
                ...this.rateLimitingRule, // Flatten the rule structure
                requested: requestedTokens,
            }
            : undefined,
        shield: this.shieldRule
            ? {
                ...this.shieldRule,
                request: shieldRequest,
            }
            : undefined,
    };

    // Validate the payload
    try {
        // Validate API key and identification key
        if (!payload.key) {
            throw new Error("API key is missing.");
        }
        if (!payload.identificationKey) {
            throw new Error("Identification key is missing.");
        }

        // Validate rateLimiting
        if (payload.rateLimiting) {
            const { algorithm } = payload.rateLimiting;
            let rule;
            if (algorithm === "TokenBucketRule") {
                const { refillRate, interval, capacity } = payload.rateLimiting;
                rule = { refillRate, interval, capacity };
            } else if (algorithm === "FixedWindowRule") {
                const { windowMs, limit } = payload.rateLimiting;
                rule = { windowMs, limit };
            } else if (algorithm === "LeakyBucketRule") {
                const { leakRate, capacity, timeout } = payload.rateLimiting;
                rule = { leakRate, capacity, timeout };
            } else if (algorithm === "SlidingWindowRule") {
                const { windowMs, limit } = payload.rateLimiting;
                rule = { windowMs, limit };
            }
            if (!algorithm) {
                throw new Error("Rate limiting algorithm is missing.");
            }
            if (!rule) {
                throw new Error(`Rate limiting rule for algorithm '${algorithm}' is missing.`);
            }
            if (algorithm === "TokenBucketRule") {
                const { refillRate, interval, capacity } = rule;
                if (!refillRate || !interval || !capacity) {
                    throw new Error("TokenBucketRule requires refillRate, interval, and capacity.");
                }
            } else if (algorithm === "FixedWindowRule") {
                const { windowMs, limit } = rule;
                if (!windowMs || !limit) {
                    throw new Error("FixedWindowRule requires windowMs and limit.");
                }
            } else if (algorithm === "LeakyBucketRule") {
                const { leakRate, capacity, timeout } = rule;
                if (!leakRate || !capacity || !timeout) {
                    throw new Error("LeakyBucketRule requires leakRate, capacity, and timeout.");
                }
            } else if (algorithm === "SlidingWindowRule") {
                const { windowMs, limit } = rule;
                if (!windowMs || !limit) {
                    throw new Error("SlidingWindowRule requires windowMs and limit.");
                }
            } else {
                throw new Error(`Unsupported rate limiting algorithm: ${algorithm}`);
            }
        }

        // Validate shield
        if (payload.shield) {
            const { windowMs, limit, threshold, request } = payload.shield;
            if (!windowMs || !limit || !threshold) {
                throw new Error("Shield requires windowMs, limit, and threshold.");
            }
            if (!request) {
                throw new Error("Shield request data is missing.");
            }
        }
    } catch (validationError) {
        if (this.logging) {
            if (validationError instanceof Error) {
                console.error("[ZSecure] Validation Error:", validationError.message);
            } else {
                console.error("[ZSecure] Validation Error:", validationError);
            }
        }
        return { isdenied: true, status: 400, message: validationError instanceof Error ? validationError.message : "Unknown validation error" };
    }

    // If validation passes, proceed with the protection logic
    try {
        const response = await axios.post(`${this.serverUrl}/protection`, payload);
        if (this.logging) {
            console.log("[ZSecure] Server response:", response.data);
        }
        return response.data;
    } catch (error) {
        if (this.logging) {
            if (error instanceof Error) {
                console.error("[ZSecure] Error in protect function:", error.message);
            } else {
                console.error("[ZSecure] Unknown error in protect function:", error);
            }
        }

        // Handle specific errors
        if (axios.isAxiosError(error) && error.response && error.response.status === 429) {
            return { isdenied: true, status: 429, message: "Rate limit exceeded" };
        }
        return { isdenied: true, status: 500, message: "Internal server error" };
    }
}
}

export default (options: zsecureOptions) => new ZSecure(options);

// Example usage:
// const rate = new ZSecure({
//   API_KEY: "AAA",
//   baseUrl: "http://localhost:3000",
//   logging: true, // Enable debugging logs
//   rateLimitingRule: {
//     algorithm: "FixedWindowRule",
//     mode: "LIVE",
//     limit: 5,
//     windowMs: 15 * 60 * 1000, // 15 minutes
//   },
//   shieldRule: {
//     mode: "LIVE",
//     limit: 100,
//     threshold: 5,
//     windowMs: 60000, // 1 minute
//   },
// });
