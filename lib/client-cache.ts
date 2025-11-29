interface CacheItem {
    data: any;
    timestamp: number;
    expiry: number;
}

class ClientCache {
    private cache: Map<string, CacheItem> = new Map();
    private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes in milliseconds

    set(key: string, data: any, ttl?: number): void {
        const now = Date.now();
        const expiry = now + (ttl || this.defaultTTL);

        this.cache.set(key, {
            data,
            timestamp: now,
            expiry
        });

        // Clean up expired entries periodically
        if (this.cache.size > 100) {
            this.cleanup();
        }
    }

    get(key: string): any | null {
        const item = this.cache.get(key);

        if (!item) {
            return null;
        }

        // Check if expired
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    has(key: string): boolean {
        const item = this.cache.get(key);

        if (!item) {
            return false;
        }

        // Check if expired
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    private cleanup(): void {
        const now = Date.now();

        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiry) {
                this.cache.delete(key);
            }
        }
    }

    // Get cache stats for debugging
    getStats() {
        const now = Date.now();
        const validEntries = Array.from(this.cache.values()).filter(item => now <= item.expiry);

        return {
            total: this.cache.size,
            valid: validEntries.length,
            expired: this.cache.size - validEntries.length
        };
    }
}

// Create a singleton instance
const clientCache = new ClientCache();

// Export helper functions similar to the inspiration example
export const setCache = (key: string, data: any, ttl?: number) => {
    clientCache.set(key, data, ttl);
};

export const getCache = (key: string) => {
    return clientCache.get(key);
};

export const hasCache = (key: string) => {
    return clientCache.has(key);
};

export const deleteCache = (key: string) => {
    clientCache.delete(key);
};

export const clearCache = () => {
    clientCache.clear();
};

export const getCacheStats = () => {
    return clientCache.getStats();
};

export default clientCache; 