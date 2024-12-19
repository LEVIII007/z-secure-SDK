import axios from "axios";
import {
  zsecureOptions,
  ProtectOptions,
  ShieldOptions
} from "./types"; // Adjust path as necessary
import { getClientIp, generateApiKey } from "./findIp";

class ZSecure {
  private API_KEY: string;
  private rateLimitingRule: zsecureOptions["rateLimitingRule"];
  private shieldRule: zsecureOptions["shieldRule"];
  private serverUrl: string;
  private identificationKey: string;

  constructor(options: zsecureOptions) {
    if (!options.API_KEY) {
      throw new Error("API key is required");
    }
    this.API_KEY = options.API_KEY;
    this.rateLimitingRule = options.rateLimitingRule;
    this.shieldRule = options.shieldRule;
    this.serverUrl = options?.baseUrl ?? (process.env.BASE_URL ?? "http://localhost:3000");
    this.identificationKey = generateApiKey(16); // You can consider adjusting this length
  }

  /**
   * Send combined request for both rate-limiting and shield protection.
   */
  async protect(req: Request, userID : string, requestedTokens: number): Promise<any> {
    const userIp = getClientIp({
      ...req,
      headers: req.headers as unknown as Record<string, string | string[] | undefined>, // Ensure headers are cast correctly
    });

    // Validate `req` and `options` here if necessary

    const payload = {
      key: this.API_KEY,
      identificationKey: this.identificationKey,
      rateLimiting: {
        rule: this.rateLimitingRule,
        userId: userID ??  userIp, // Use IP for rate-limiting
        requested: requestedTokens || 1,
      },
      shield: {
        rule: this.shieldRule,
        requestDetails: {
          request: req,
        },
      },
    };

    try {
      const response = await axios.post(`${this.serverUrl}/protection`, payload);
      return response.data;
    } catch (error) {
      console.error("Error in protectAndShield function:", error);
      throw new Error("Combined protection request failed.");
    }
  }
}

/**
 * Export initialization function.
 */
export default (options: zsecureOptions) => new ZSecure(options);



// const rate = new ZSecure({
//     API_KEY: "flekcnl;ekal",
//     rateLimitingRule: {
//         algorithm: "TokenBucketRule",
//         rule: {
//             capacity: 10,
//             refillRate: 1,
//             interval: 60,
//             mode: "LIVE"
//         }
//     },
//     shieldRule: {
//         mode: "LIVE",
//         limit: 100,
//         threshold: 5,
//         windowMs: 60
//     }
// });


// export async function GET(req: Request) {
//     const userId = "user123"; // Replace with your authenticated user ID
//     const decision = await rate.protect(req, "ser123", 1 ); // Deduct 5 tokens from the bucket
//     console.log("Arcjet decision", decision);
  
//     if (decision.isDenied()) {
//       return Response.json(
//         { error: "Too Many Requests", reason: decision.reason },
//         { status: 429 },
//       );
//     }
  
//     return Response.json({ message: "Hello world" });
//   }

