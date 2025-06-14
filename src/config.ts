interface Environment {
    apiUrl: string;
    apiUrlFallbacks: string[];
    apiTimeout: number;
    apiKey: string;
    apiVersion: string;
    isProduction: boolean;
}

class Config {
    private static instance: Config;
    private env: Environment;    private constructor() {
        const fallbackUrls = import.meta.env.VITE_API_URL_FALLBACKS ? 
            import.meta.env.VITE_API_URL_FALLBACKS.split(',') : 
            ['http://localhost:3000'];

        this.env = {
            apiUrl: import.meta.env.VITE_API_URL || fallbackUrls[0],
            apiUrlFallbacks: fallbackUrls,
            apiTimeout: Number(import.meta.env.VITE_API_TIMEOUT) || 5000,
            apiKey: import.meta.env.VITE_API_KEY || '',
            apiVersion: import.meta.env.VITE_API_VERSION || 'v1',
            isProduction: import.meta.env.MODE === 'production'
        };
    }

    public static getInstance(): Config {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    }

    public getConfig(): Environment {
        return this.env;
    }

    public getApiUrl(): string {
        return this.env.apiUrl;
    }    public getApiTimeout(): number {
        return this.env.apiTimeout;
    }

    public getApiKey(): string {
        return this.env.apiKey;
    }

    public getApiVersion(): string {
        return this.env.apiVersion;
    }

    public isProduction(): boolean {
        return this.env.isProduction;
    }
}

export default Config.getInstance();
