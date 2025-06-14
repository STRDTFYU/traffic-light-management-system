import { ApiClient } from './apiClient';
import { CarrefourStatus } from '../types/traffic';

type ApiHealthStatus = 'healthy' | 'degraded' | 'failing';

interface ApiHealth {
    status: ApiHealthStatus;
    successRate: number;
    responseTime: number;
    failureCount: number;
}

interface CarrefoursHealth {
    total: number;
    active: number;
    warning: number;
    error: number;
    offline: number;
}

interface SystemHealth {
    apiHealth: ApiHealth;
    carrefoursHealth: CarrefoursHealth;
}

interface MonitoringAlert {
    id: string;
    timestamp: string;
    type: 'api' | 'carrefour' | 'system';
    severity: 'info' | 'warning' | 'error';
    message: string;
    details?: any;
}

class MonitoringService {
    private static instance: MonitoringService;
    private healthCheckInterval: number = 60000; // 1 minute
    private healthStatus: SystemHealth | null = null;
    private alerts: MonitoringAlert[] = [];
    private readonly maxAlerts = 100;

    private constructor() {
        this.startHealthCheck();
    }

    public static getInstance(): MonitoringService {
        if (!MonitoringService.instance) {
            MonitoringService.instance = new MonitoringService();
        }
        return MonitoringService.instance;
    }

    private startHealthCheck(): void {
        setInterval(() => this.checkSystemHealth(), this.healthCheckInterval);
    }

    private emitAlert(alert: Omit<MonitoringAlert, 'id' | 'timestamp'>): void {
        const newAlert = {
            ...alert,
            id: Math.random().toString(36).substring(2),
            timestamp: new Date().toISOString()
        };

        this.alerts.unshift(newAlert);
        if (this.alerts.length > this.maxAlerts) {
            this.alerts.pop();
        }

        // Log alert to console in development
        if (import.meta.env.DEV) {
            console.log(`[${alert.severity.toUpperCase()}] ${alert.message}`, alert.details || '');
        }
    }    public async checkSystemHealth(): Promise<SystemHealth> {
        const metrics = ApiClient.getInstance().getMetrics();
        
        const apiHealth: ApiHealth = {
            status: 'healthy',
            successRate: (metrics.totalRequests - metrics.failedRequests) / Math.max(metrics.totalRequests, 1) * 100,
            responseTime: metrics.averageResponseTime,
            failureCount: metrics.failedRequests
        };

        // Déterminer le statut en fonction des métriques
        if (metrics.failedRequests > 10 || apiHealth.successRate < 70) {
            apiHealth.status = 'failing';
            this.emitAlert({
                type: 'api',
                severity: 'error',
                message: 'Performance API dégradée',
                details: {
                    successRate: apiHealth.successRate,
                    failureCount: metrics.failedRequests
                }
            });
        } else if (metrics.failedRequests > 5 || apiHealth.successRate < 90) {
            apiHealth.status = 'degraded';
            this.emitAlert({
                type: 'api',
                severity: 'warning',
                message: 'Dégradation légère des performances API',
                details: {
                    successRate: apiHealth.successRate,
                    failureCount: metrics.failedRequests
                }
            });
        }

        if (!this.healthStatus) {
            this.healthStatus = {
                apiHealth,
                carrefoursHealth: {
                    total: 0,
                    active: 0,
                    warning: 0,
                    error: 0,
                    offline: 0
                }
            };
        } else {
            this.healthStatus.apiHealth = apiHealth;
        }

        return this.healthStatus;
    }

    public updateCarrefourStats(carrefours: CarrefourStatus[]): void {
        if (!this.healthStatus) {
            this.healthStatus = {
                apiHealth: {
                    status: 'healthy',
                    successRate: 100,
                    responseTime: 0,
                    failureCount: 0
                },
                carrefoursHealth: {
                    total: 0,
                    active: 0,
                    warning: 0,
                    error: 0,
                    offline: 0
                }
            };
        }

        const stats: CarrefoursHealth = {
            total: carrefours.length,
            active: carrefours.filter(c => c.status === 'active').length,
            warning: carrefours.filter(c => c.status === 'warning').length,
            error: carrefours.filter(c => c.status === 'error').length,
            offline: carrefours.filter(c => c.status === 'offline').length
        };

        this.healthStatus.carrefoursHealth = stats;

        // Émettre des alertes basées sur les statistiques
        if (stats.offline > stats.total * 0.3) {
            this.emitAlert({
                type: 'carrefour',
                severity: 'error',
                message: 'Nombre élevé de carrefours hors ligne',
                details: {
                    offlineCount: stats.offline,
                    totalCount: stats.total,
                    percentage: (stats.offline / stats.total * 100).toFixed(1)
                }
            });
        }

        if (stats.error > stats.total * 0.2) {
            this.emitAlert({
                type: 'carrefour',
                severity: 'error',
                message: 'Nombre élevé de carrefours en erreur',
                details: {
                    errorCount: stats.error,
                    totalCount: stats.total,
                    percentage: (stats.error / stats.total * 100).toFixed(1)
                }
            });
        }
    }

    public getAlerts(): MonitoringAlert[] {
        return this.alerts;
    }

    public getSystemHealth(): SystemHealth | null {
        return this.healthStatus;
    }
}

export default MonitoringService.getInstance();
