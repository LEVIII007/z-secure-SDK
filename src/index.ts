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
  async protect(req: any, userId: string, requestedTokens: number = 1): Promise<any> {
    let userIp;
    if (!userId) {
      userIp = getClientIp({
        ...req,
        headers: req.headers as Record<string, string | string[] | undefined>,
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

    if (this.logging) {
      console.log("[ZSecure] Sending payload to server:", payload);
    }

    try {
      const response = await axios.post(`${this.serverUrl}/protection`, payload);
      if (this.logging) {
        console.log("[ZSecure] Server response:", response.data);
      }
      return response.data;
    } catch (error) {
      console.error("[ZSecure] Error in protect function:", error);
      throw new Error("Protection request failed.");
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
