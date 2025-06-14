import { useState, useEffect, useCallback, useRef } from 'react';
import { CarrefourStatus, TrafficAlert, MaintenanceTask } from '../types/traffic';
import { ApiClient } from '../services/apiClient';
import monitoringService from '../services/monitoringService';
import configService from '../services/configService';

export const useTrafficData = (isProductionMode: boolean = false) => {
    const [carrefours, setCarrefours] = useState<CarrefourStatus[]>([]);
    const [alerts, setAlerts] = useState<TrafficAlert[]>([]);
    const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
    const [error, setError] = useState<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    // WebSocket connection management
    const connectWebSocket = useCallback(() => {
        if (!isProductionMode || configService.isDemoMode()) return;

        const ws = new WebSocket('ws://localhost:3000');
        wsRef.current = ws;

        ws.onmessage = (event) => {
            const { type, data } = JSON.parse(event.data);
            switch (type) {
                case 'initial':
                    setCarrefours(data.carrefours);
                    setAlerts(data.alerts);
                    setMaintenanceTasks(data.maintenanceTasks);
                    monitoringService.updateCarrefourStats(data.carrefours);
                    break;
                case 'carrefours':
                    setCarrefours(data);
                    monitoringService.updateCarrefourStats(data);
                    break;
                case 'alerts':
                    setAlerts(data);
                    break;
                case 'maintenance':
                    if (data.type === 'new') {
                        setMaintenanceTasks(prev => [...prev, data.task]);
                    } else if (data.type === 'update') {
                        setMaintenanceTasks(prev => 
                            prev.map(task => task.id === data.task.id ? data.task : task)
                        );
                    }
                    break;
            }
        };

        ws.onclose = () => {
            console.log('WebSocket connection closed. Attempting to reconnect...');
            setTimeout(connectWebSocket, 5000);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setError('WebSocket connection error');
        };
    }, [isProductionMode]);

    const generateDemoData = useCallback(() => {
        const now = new Date().toISOString();
        const demoCarrefours: CarrefourStatus[] = Array.from({ length: 8 }, (_, i) => ({
            id: `DEMO_${i + 1}`,
            name: `Carrefour ${i + 1}`,
            location: `${45.5 + Math.random() * 0.1}, ${-73.6 + Math.random() * 0.1}`,
            status: Math.random() > 0.8 ? 'warning' : 'active',
            lastUpdate: now,                measures: {
                    timestamp: now,
                    carrefour_id: `DEMO_${i + 1}`,
                    cycle_courant: Math.floor(Math.random() * 4) + 1,
                    position_sequence: Math.floor(Math.random() * 100),
                    mode_operation: 'normal',
                    esp_status: {
                    porte: Math.random() > 0.9 ? 'ouverte' : 'fermee',
                    alimentation: 'normale',
                    batterie_niveau: 85 + Math.random() * 15,
                    temperature: 25 + Math.random() * 10
                },
                mesures: [
                    {
                        poteau: 1,
                        Feu: 'vert',
                        tension: 220 + Math.random() * 10,
                        intensite: 0.8 + Math.random() * 0.4,
                        etat: true,
                        pannes_consecutives: 0
                    },
                    {
                        poteau: 2,
                        Feu: 'rouge',
                        tension: 220 + Math.random() * 10,
                        intensite: 1 + Math.random() * 0.5,
                        etat: true,
                        pannes_consecutives: 0
                    }
                ]
            }
        }));

        const demoAlerts = Array.from({ length: 3 }, (_, i) => ({
            id: `ALERT_${i + 1}`,
            type: Math.random() > 0.5 ? 'SURTENSION' : 'PANNE_INTERMITTENTE',
            poteau: Math.random() > 0.5 ? 1 : 2,
            couleur: ['vert', 'jaune', 'rouge'][Math.floor(Math.random() * 3)] as 'vert' | 'jaune' | 'rouge',
            sur_le_carrefour: `DEMO_${Math.floor(Math.random() * 8) + 1}`,
            occurrences: Math.floor(Math.random() * 10) + 1,
            timestamp: now,
            carrefour_id: `DEMO_${Math.floor(Math.random() * 8) + 1}`
        }));

        return { carrefours: demoCarrefours, alerts: demoAlerts };
    }, []);

    const fetchInitialData = useCallback(async () => {
        if (!isProductionMode && configService.isDemoMode()) {
            const demoData = generateDemoData();
            setCarrefours(demoData.carrefours);
            setAlerts(demoData.alerts);
            setMaintenanceTasks([]);
            setError(null);
            monitoringService.updateCarrefourStats(demoData.carrefours);
            return;
        }

        try {
            const apiClient = ApiClient.getInstance();
            const [carrefoursData, alertsData, maintenanceData] = await Promise.all([
                apiClient.get<CarrefourStatus[]>('/carrefours'),
                apiClient.get<TrafficAlert[]>('/alerts'),
                apiClient.get<MaintenanceTask[]>('/maintenance')
            ]);
            
            setCarrefours(carrefoursData);
            setAlerts(alertsData);
            setMaintenanceTasks(maintenanceData);
            setError(null);
            monitoringService.updateCarrefourStats(carrefoursData);
            
        } catch (error) {
            handleApiError(error);
        }
    }, [isProductionMode, generateDemoData]);

    const handleApiError = (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('API communication error:', errorMessage);
        
        if (!isProductionMode && configService.isDemoMode()) {
            console.warn('Using demo data due to API error');
            const demoData = generateDemoData();
            setCarrefours(demoData.carrefours);
            setAlerts(demoData.alerts);
            setMaintenanceTasks([]);
            monitoringService.updateCarrefourStats(demoData.carrefours);
        } else {
            setCarrefours([]);
            setAlerts([]);
            setMaintenanceTasks([]);
            setError(errorMessage);
        }
    };

    const scheduleMaintenance = useCallback(async (carrefourId: string, type: 'routine' | 'major') => {
        if (!isProductionMode && configService.isDemoMode()) {
            console.warn('Maintenance scheduling not available in demo mode');
            return;
        }

        try {
            const apiClient = ApiClient.getInstance();
            const task = await apiClient.post<MaintenanceTask>('/maintenance', { carrefourId, type });
            setMaintenanceTasks(prev => [...prev, task]);
        } catch (error) {
            handleApiError(error);
        }
    }, [isProductionMode]);

    useEffect(() => {
        fetchInitialData();
        connectWebSocket();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [fetchInitialData, connectWebSocket]);

    return {
        carrefours,
        alerts,
        maintenanceTasks,
        error,
        scheduleMaintenance
    };
};