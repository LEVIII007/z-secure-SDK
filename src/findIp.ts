
import { randomBytes } from "crypto";

interface RequestLike {
    headers: Record<string, string | string[] | undefined>;
    socket?: { remoteAddress?: string };
    info?: { remoteAddress?: string };
    requestContext?: { identity?: { sourceIp?: string } };
  }
  
  interface Options {
    platform?: "cloudflare" | "fly-io" | "vercel";
    proxies?: Array<string>;
  }
  
  function getClientIp(request: RequestLike, options?: Options): string {
    // First, try to get IP from the `x-forwarded-for` header (common in proxies like Cloudflare, Vercel)
    const forwardedFor = request.headers["x-forwarded-for"];
    if (Array.isArray(forwardedFor)) {
      // If the header contains a list of IPs, the first one should be the original client IP
      return forwardedFor[0];
    } else if (typeof forwardedFor === "string") {
      // If it's a single IP string, use it directly
      return forwardedFor.split(",")[0].trim();
    }
  
    // Check the socket's remote address (useful if not behind a proxy)
    if (request.socket && request.socket.remoteAddress) {
      return request.socket.remoteAddress;
    }
  
    // Check requestContext.identity.sourceIp (used by AWS API Gateway, for example)
    if (request.requestContext && request.requestContext.identity?.sourceIp) {
      return request.requestContext.identity.sourceIp;
    }
  
    // Default fallback (use '127.0.0.1' if IP is not found)
    return "127.0.0.1";
  }
  

  /**
   * Generate a unique API key.
   * @param length - The length of the generated API key (default is 32 bytes).
   * @returns A base64-encoded unique API key.
   */
  function generateApiKey(length: number = 16): string {
    // Generate a random buffer with the specified length
    const apiKeyBuffer = randomBytes(length);
    
    // Convert the buffer to a base64 string
    return apiKeyBuffer.toString("base64").replace(/\//g, "_").replace(/\+/g, "-");
  }
  
  


  export {getClientIp , generateApiKey};
  