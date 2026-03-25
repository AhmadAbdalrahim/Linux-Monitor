type RateLimitRecord = {
  count: number;
  resetTime: number;
};

const store = new Map<string, RateLimitRecord>();

/**
 * Basic in-memory rate limiter for API routes.
 * @param key Unique key (e.g., IP or agentKey)
 * @param limit Max requests per window
 * @param windowMs Window size in milliseconds
 * @returns { success: boolean, remaining: number, reset: number }
 */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetTime) {
    const newRecord = {
      count: 1,
      resetTime: now + windowMs,
    };
    store.set(key, newRecord);
    return { success: true, remaining: limit - 1, reset: newRecord.resetTime };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, reset: record.resetTime };
  }

  record.count++;
  return { success: true, remaining: limit - record.count, reset: record.resetTime };
}

// Optional: Cleanup old records every hour
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, 60 * 60 * 1000);
}
