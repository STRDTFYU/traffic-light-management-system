import { ESPConfiguration } from '../types/traffic';

export interface Environment {
  mode: 'development' | 'production';
  apiUrl: string;
  apiUrlFallbacks: string[];
  apiTimeout: number;
  apiKey: string;
  apiVersion: string;
  isDemoMode: boolean;
}

export class ConfigService {
  private static instance: ConfigService | null = null;
  private env: Environment;

  private constructor() {
    const mode = import.meta.env.VITE_APP_MODE || 'development';
    this.env = {
      mode,
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
      apiUrlFallbacks: (import.meta.env.VITE_API_URL_FALLBACKS || '').split(',').filter(Boolean),
      apiTimeout: Number(import.meta.env.VITE_API_TIMEOUT) || 5000,
      apiKey: import.meta.env.VITE_API_KEY || '',
      apiVersion: import.meta.env.VITE_API_VERSION || 'v1',
      isDemoMode: mode === 'production' ? false : this.getStoredDemoMode()
    };
  }

  private getStoredDemoMode(): boolean {
    // En production, toujours retourner false
    if (this.env?.mode === 'production') {
      return false;
    }
    
    // En développement, vérifier la préférence stockée
    const stored = localStorage.getItem('demo_mode');
    if (stored !== null) {
      return stored === 'true';
    }
    
    // Par défaut, utiliser la valeur de l'environnement
    return import.meta.env.VITE_DEMO_MODE === 'true';
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  public isProduction(): boolean {
    return this.env.mode === 'production';
  }

  public isDemoMode(): boolean {
    if (this.isProduction()) {
      return false;
    }
    return this.getStoredDemoMode();
  }

  public getConfig(): Environment {
    return this.env;
  }

  public getApiUrl(): string {
    return this.env.apiUrl;
  }

  public getApiTimeout(): number {
    return this.env.apiTimeout;
  }

  public getApiKey(): string {
    return this.env.apiKey;
  }

  public getApiVersion(): string {
    return this.env.apiVersion;
  }

  public getApiUrlFallbacks(): string[] {
    return this.env.apiUrlFallbacks;
  }

  private static defaultConfig: ESPConfiguration = {
    UMAX: 13.5,
    UWAX: 10.5,
    IMAX: 1.8,
    Ucc: 9.0,
    Icc: 2.0,
    SEUIL_PANNE_INTERMITTENTE: 5
  };

  static getConfiguration(): ESPConfiguration {
    const saved = localStorage.getItem('esp_configuration');
    return saved ? JSON.parse(saved) : this.defaultConfig;
  }

  static saveConfiguration(config: ESPConfiguration): void {
    localStorage.setItem('esp_configuration', JSON.stringify(config));
  }

  static async sendConfigurationToESP(carrefourId: string, config: ESPConfiguration): Promise<boolean> {
    try {
      // Simulation d'envoi de configuration à l'ESP
      console.log(`📡 Configuration envoyée à ${carrefourId}:`, config);
      
      // En production, faire un appel API vers l'ESP
      if (ConfigService.getInstance().isProduction()) {
        // const response = await fetch(`/api/esp/${carrefourId}/config`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(config)
        // });
        // return response.ok;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la configuration:', error);
      return false;
    }
  }
}

export const configService = ConfigService.getInstance();
export default configService;