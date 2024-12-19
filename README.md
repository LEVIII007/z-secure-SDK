# ZSecure - Rate Limiting and API Protection Middleware

ZSecure is a powerful middleware package for rate limiting, bot protection, and shielding your APIs. With built-in protection mechanisms like token bucket, sliding window, and fixed window algorithms, it helps secure your API from abuse while offering developers a flexible and simple way to integrate API protection into their applications.

---

## Features

- **Rate Limiting**: Implements multiple rate-limiting algorithms such as Token Bucket, Fixed Window, and Sliding Window.
- **Shielding**: Protects your API endpoints from malicious requests, including bot attacks and SQL injection.
- **Easy Integration**: Simple integration into any Node.js-based application with support for TypeScript.

---

## Installation

To install the package, run:

```bash
npm install z-secure-service
```


## Usage
```typescript
import ZSecure from 'z-secure-service';

// Initialize ZSecure with your API key and protection rules
const rate = new ZSecure({
    API_KEY: "your-api-key",
    rateLimitingRule: {
        algorithm: "TokenBucketRule",
        rule: {
            capacity: 10,
            refillRate: 1,
            interval: 60,
            mode: "LIVE"
        }
    },
    shieldRule: {
        mode: "LIVE",
        limit: 100,
        threshold: 5,
        windowMs: 60
    }
});

// Example API endpoint handler
export async function GET(req: Request) {
    const userId = "user123"; // Replace with your authenticated user ID

    // Apply both rate-limiting and shielding protection
    const decision = await rate.protect(req, { userId, requested: 1 });

    // If rate-limiting is exceeded, deny the request
    if (decision.isDenied()) {
        return new Response(
            JSON.stringify({ error: "Too Many Requests", reason: decision.reason }),
            { status: 429 }
        );
    }

    return new Response(JSON.stringify({ message: "Hello world" }));
}
```

