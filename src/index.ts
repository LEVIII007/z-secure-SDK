import axios from "axios";
import {
  zsecureOptions,
  ProtectOptions,
  ShieldOptions
} from "./types.js"; // Adjust path as necessary
import { getClientIp, generateApiKey } from "./findIp.js";

class ZSecure {
  private API_KEY: string;
  private rateLimitingRule?: zsecureOptions["rateLimitingRule"];
  private shieldRule?: zsecureOptions["shieldRule"];
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
    this.identificationKey = generateApiKey(16); // You can consider adjusting this length
    this.logging = options.loggin ?? false; // Default to false if not provided

    if (this.logging) {
      console.log("[ZSecure] Initialized with options:", options);
    }
  }

  /**
   * Send combined request for both rate-limiting and shield protection.
   */

  async protect(req: any, userID: string, requestedTokens: number): Promise<any> {
    let userIp;
    if (!userID) {
      userIp = getClientIp({
        ...req,
        headers: req.headers as unknown as Record<string, string | string[] | undefined>, // Ensure headers are cast correctly
      });
    }
    
      // Prepare the shield request payload by including only relevant data
    let shieldRequest = {}
    if(this.shieldRule){
    
    shieldRequest = {
    params : req.params ?? '',
    url: req.url,
    query: req.query ?? '',
    body: req.body ?? '', // Optional: send body if necessary (POST/PUT requests)
  };
    }
    if(this.logging){
      console.log("Shield Request",shieldRequest)
    }

    const payload = {
      key: this.API_KEY,
      identificationKey: this.identificationKey,
      userId: userID ?? userIp, // Use IP for rate-limiting if userID is not provided
      rateLimiting: {
        rule: this.rateLimitingRule,
        requested: requestedTokens || 1,
      },
      shield: {
        rule: this.shieldRule,
        request: shieldRequest, // Send only relevant request parts
      },
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
      console.error("[ZSecure] Error in protectAndShield function:", error);
      throw new Error("Combined protection request failed.");
    }
  }
}

export default (options: zsecureOptions) => new ZSecure(options);


// const rate = new ZSecure({
//   API_KEY: "AAA",
//   baseUrl: "http://localhost:3000",
//   loggin: true, // Enable debugging logs
//   rateLimitingRule: {
//     algorithm: "FixedWindowRule",
//     rule: {
//       mode: "LIVE",
//       limit: 5,
//       windowMs: 15 * 60 * 1000,
//     },
//   },
//   shieldRule: {
//     mode: "LIVE",
//     limit: 100,
//     threshold: 5,
//     windowMs: 60000,
//   },
// });
