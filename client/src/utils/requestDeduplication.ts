interface DeduplicationOptions {
  maxRetries?: number;
  retryDelay?: number;
  throttle?: boolean;
}

class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();
  private requestCounts = new Map<string, number>();
  private lastRequestTimes = new Map<string, number>();
  private readonly THROTTLE_DELAY = 2000;

  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>,
    options: DeduplicationOptions = {}
  ): Promise<T> {
    const { maxRetries = 1, retryDelay = 2000, throttle = true } = options;

    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      console.log(`🔄 Reusing pending request for key: ${key}`);
      return this.pendingRequests.get(key)!;
    }

    // Check throttling
    if (throttle) {
      const lastRequestTime = this.lastRequestTimes.get(key) || 0;
      const timeSinceLastRequest = Date.now() - lastRequestTime;

      if (timeSinceLastRequest < this.THROTTLE_DELAY) {
        console.log(`🚫 Request throttled for key: ${key}`);
        throw new Error(`Request throttled for ${key}`);
      }
    }

    // Check request count
    const requestCount = this.requestCounts.get(key) || 0;
    if (requestCount >= 2) {
      // Reduced from 3 to 2
      console.warn(`🚫 Too many requests for key: ${key}`);
      throw new Error(`Too many requests for ${key}`);
    }

    // Execute the request
    this.requestCounts.set(key, requestCount + 1);
    this.lastRequestTimes.set(key, Date.now());

    const requestPromise = this.executeWithRetry(
      requestFn,
      maxRetries,
      retryDelay,
      key
    );
    this.pendingRequests.set(key, requestPromise);

    try {
      const result = await requestPromise;
      this.requestCounts.set(key, 0);
      return result;
    } catch (error) {
      console.error(`💥 Request failed for key: ${key}:`, error);
      throw error;
    } finally {
      this.pendingRequests.delete(key);
      setTimeout(() => {
        if ((this.requestCounts.get(key) || 0) === 0) {
          this.requestCounts.delete(key);
          this.lastRequestTimes.delete(key);
        }
      }, 15000); // Reduced cleanup time
    }
  }

  private async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    maxRetries: number,
    retryDelay: number,
    key: string
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const result = await requestFn();
        if (attempt > 1) {
          console.log(
            `✅ Request succeeded on attempt ${attempt} for key: ${key}`
          );
        }
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(
          `❌ Request failed (attempt ${attempt}/${
            maxRetries + 1
          }) for key: ${key}:`,
          error
        );

        if (attempt <= maxRetries) {
          console.log(`⏳ Retrying in ${retryDelay}ms for key: ${key}`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }

    throw lastError!;
  }

  clear(): void {
    console.log("🧹 Clearing all pending requests");
    this.pendingRequests.clear();
    this.requestCounts.clear();
    this.lastRequestTimes.clear();
  }

  getStatus(): {
    pendingRequests: number;
    activeKeys: string[];
  } {
    return {
      pendingRequests: this.pendingRequests.size,
      activeKeys: Array.from(this.pendingRequests.keys()),
    };
  }

  clearKey(key: string): void {
    console.log(`🧹 Clearing requests for key: ${key}`);
    this.pendingRequests.delete(key);
    this.requestCounts.delete(key);
    this.lastRequestTimes.delete(key);
  }
}

export const requestDeduplicator = new RequestDeduplicator();

export const createRequestKey = (
  method: string,
  url: string,
  params?: any
): string => {
  const paramString = params ? JSON.stringify(params) : "";
  return `${method}:${url}:${paramString}`;
};
