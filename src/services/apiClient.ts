import config from '../config';

interface RetryOptions {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
}

interface ApiClientOptions {
    timeout: number;
    retryOptions: RetryOptions;
    headers?: Record<string, string>;
}

interface RequestMetrics {
    timestamp: number;
    duration: number;
    url: string;
    success: boolean;
    statusCode?: number;
    retryCount: number;
}

export class ApiClient {
    private static _instance: ApiClient | null = null;
    private options: ApiClientOptions;
    private metrics: {
        requests: RequestMetrics[];
        totalRequests: number;
        failedRequests: number;
        averageResponseTime: number;
    };
    private isOffline: boolean = false;
    private lastOnlineCheck: number = 0;
    private readonly onlineCheckInterval = 10000; // 10 secondes
    private readonly apiConfig = config.getConfig();

    private constructor() {
        this.options = {
            timeout: this.apiConfig.apiTimeout,
            retryOptions: {
                maxRetries: 2,
                baseDelay: 1000,
                maxDelay: 3000
            },
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Key': this.apiConfig.apiKey,
                'X-API-Version': this.apiConfig.apiVersion
            }
        };

        this.metrics = {
            requests: [],
            totalRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0
        };

        setInterval(() => this.cleanupOldMetrics(), 3600000);
    }

    public static getInstance(): ApiClient {
        if (!this._instance) {
            this._instance = new ApiClient();
        }
        return this._instance;
    }

    private cleanupOldMetrics(): void {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        this.metrics.requests = this.metrics.requests.filter(m => m.timestamp > oneDayAgo);
        this.updateAggregateMetrics();
    }

    private updateAggregateMetrics(): void {
        const recentRequests = this.metrics.requests;
        this.metrics.totalRequests = recentRequests.length;
        this.metrics.failedRequests = recentRequests.filter(m => !m.success).length;
        this.metrics.averageResponseTime = recentRequests.reduce((acc, m) => acc + m.duration, 0) / recentRequests.length || 0;
    }

    private addMetric(metric: RequestMetrics): void {
        this.metrics.requests.push(metric);
        this.updateAggregateMetrics();
    }

    public getMetrics() {
        return {
            totalRequests: this.metrics.totalRequests,
            failedRequests: this.metrics.failedRequests,
            successRate: ((this.metrics.totalRequests - this.metrics.failedRequests) / this.metrics.totalRequests) * 100,
            averageResponseTime: this.metrics.averageResponseTime
        };
    }

    private async checkOnlineStatus(): Promise<boolean> {
        const now = Date.now();
        if (now - this.lastOnlineCheck < this.onlineCheckInterval) {
            return !this.isOffline;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            await fetch(this.apiConfig.apiUrl + '/health', {
                signal: controller.signal,
                method: 'HEAD'
            });
            
            clearTimeout(timeoutId);
            this.isOffline = false;
            this.lastOnlineCheck = now;
            return true;
        } catch (error) {
            this.isOffline = true;
            this.lastOnlineCheck = now;
            return false;
        }
    }

    private async fetchWithRetry<T>(
        url: string,
        options: RequestInit = {},
        attempt: number = 1
    ): Promise<T> {
        const startTime = Date.now();

        try {
            if (attempt === 1 && await this.checkOnlineStatus() === false) {
                throw new Error('API is offline');
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    ...this.options.headers,
                    ...options.headers
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            this.addMetric({
                timestamp: startTime,
                duration: Date.now() - startTime,
                url,
                success: true,
                statusCode: response.status,
                retryCount: attempt - 1
            });

            return data as T;

        } catch (error) {
            this.addMetric({
                timestamp: startTime,
                duration: Date.now() - startTime,
                url,
                success: false,
                retryCount: attempt - 1
            });

            if (error instanceof Error && error.message === 'API is offline') {
                throw new Error('Service unavailable - Working in offline mode');
            }

            if (attempt >= this.options.retryOptions.maxRetries) {
                throw error;
            }

            const jitter = Math.random() * 1000;
            const delay = Math.min(
                this.options.retryOptions.baseDelay * Math.pow(2, attempt - 1) + jitter,
                this.options.retryOptions.maxDelay
            );

            await new Promise(resolve => setTimeout(resolve, delay));
            return this.fetchWithRetry<T>(url, options, attempt + 1);
        }
    }

    public async get<T>(path: string): Promise<T> {
        const baseUrls = [this.apiConfig.apiUrl, ...this.apiConfig.apiUrlFallbacks];
        let lastError: Error | null = null;

        for (const baseUrl of baseUrls) {
            try {
                const url = `${baseUrl}${path}`;
                return await this.fetchWithRetry<T>(url);
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                console.warn(`Failed to fetch from ${baseUrl}${path}: ${lastError.message}`);
                continue;
            }
        }

        throw new Error(`All API endpoints failed. Last error: ${lastError?.message}`);
    }

    public async post<T>(path: string, data: any): Promise<T> {
        const baseUrls = [this.apiConfig.apiUrl, ...this.apiConfig.apiUrlFallbacks];
        let lastError: Error | null = null;

        for (const baseUrl of baseUrls) {
            try {
                const url = `${baseUrl}${path}`;
                return await this.fetchWithRetry<T>(url, {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                console.warn(`Failed to post to ${baseUrl}${path}: ${lastError.message}`);
                continue;
            }
        }

        throw new Error(`All API endpoints failed. Last error: ${lastError?.message}`);
    }
}

export default ApiClient.getInstance();
