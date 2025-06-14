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

    // Fonction pour ajouter un nouveau carrefour (mode démo uniquement)
    const addCarrefour = useCallback((newCarrefour: Omit<CarrefourStatus, 'status' | 'lastUpdate' | 'measures' | 'alerts'>) => {
        if (!configService.isDemoMode()) {
            console.warn('Ajout de carrefour disponible uniquement en mode démo');
            return;
        }

        const now = new Date().toISOString();
        const carrefourWithDefaults: CarrefourStatus = {
            ...newCarrefour,
            status: 'active',
            lastUpdate: now,
            measures: {
                timestamp: now,
                carrefour_id: newCarrefour.id,
                cycle_courant: 1,
                position_sequence: 0,
                mode_operation: 'normal',
                esp_status: {
                    porte: 'fermee',
                    alimentation: 'normale',
                    batterie_niveau: 95,
                    temperature: 28
                },
                mesures: [
                    {
                        poteau: 1,
                        Feu: 'vert',
                        tension: 220,
                        intensite: 0.8,
                        etat: true,
                        pannes_consecutives: 0
                    },
                    {
                        poteau: 2,
                        Feu: 'rouge',
                        tension: 220,
                        intensite: 1.0,
                        etat: true,
                        pannes_consecutives: 0
                    }
                ]
            },
            alerts: []
        };

        setCarrefours(prev => [...prev, carrefourWithDefaults]);
        monitoringService.updateCarrefourStats([...carrefours, carrefourWithDefaults]);
    }, [carrefours]);

    // WebSocket connection management
    const connectWebSocket = useCallback(() => {
        // Ne connecter WebSocket qu'en mode production ET si le mode démo est désactivé
        if (!isProductionMode || configService.isDemoMode()) {
            console.log('WebSocket non connecté:', { isProductionMode, isDemoMode: configService.isDemoMode() });
            return;
        }

        console.log('Tentative de connexion WebSocket...');
        const ws = new WebSocket('ws://localhost:3000');
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket connecté avec succès');
            setError(null);
        };

        ws.onmessage = (event) => {
            const { type, data } = JSON.parse(event.data);
            console.log('Message WebSocket reçu:', type);
            
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
            console.log('WebSocket connection fermée. Tentative de reconnexion...');
            setTimeout(connectWebSocket, 5000);
        };

        ws.onerror = (error) => {
            console.error('Erreur WebSocket:', error);
            setError('Erreur de connexion WebSocket');
        };
    }, [isProductionMode]);

    const generateDemoData = useCallback(() => {
        const now = new Date().toISOString();
        const demoCarrefours: CarrefourStatus[] = Array.from({ length: 8 }, (_, i) => ({
            id: `DEMO_${i + 1}`,
            name: `Carrefour ${i + 1}`,
            location: `Zone ${String.fromCharCode(65 + i)}, Secteur ${i + 1}`,
            status: Math.random() > 0.8 ? (Math.random() > 0.5 ? 'warning' : 'error') : 'active',
            lastUpdate: now,
            measures: {
                timestamp: now,
                carrefour_id: `DEMO_${i + 1}`,
                cycle_courant: Math.floor(Math.random() * 4) + 1,
                position_sequence: Math.floor(Math.random() * 100),
                mode_operation: 'normal',
                esp_status: {
                    porte: Math.random() > 0.9 ? 'ouverte' : 'fermee',
                    alimentation: Math.random() > 0.95 ? 'coupee' : 'normale',
                    batterie_niveau: 85 + Math.random() * 15,
                    temperature: 25 + Math.random() * 10
                },
                mesures: [
                    {
                        poteau: 1,
                        Feu: Math.random() > 0.5 ? 'vert' : 'rouge',
                        tension: 220 + Math.random() * 10 - 5,
                        intensite: 0.8 + Math.random() * 0.4,
                        etat: Math.random() > 0.05,
                        pannes_consecutives: Math.floor(Math.random() * 3)
                    },
                    {
                        poteau: 2,
                        Feu: Math.random() > 0.5 ? 'rouge' : 'vert',
                        tension: 220 + Math.random() * 10 - 5,
                        intensite: 1 + Math.random() * 0.5,
                        etat: Math.random() > 0.05,
                        pannes_consecutives: Math.floor(Math.random() * 3)
                    }
                ]
            },
            alerts: []
        }));

        // Générer quelques alertes aléatoirement
        const demoAlerts: TrafficAlert[] = [];
        demoCarrefours.forEach((carrefour, index) => {
            if (Math.random() > 0.7) { // 30% de chance d'avoir une alerte
                const alertTypes = ['PANNE_FEU', 'SURTENSION', 'PANNE_INTERMITTENTE', 'PORTE_OUVERTE', 'BATTERIE_FAIBLE'];
                const alert: TrafficAlert = {
                    id: `ALERT_DEMO_${index}_${Date.now()}`,
                    type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
                    poteau: Math.random() > 0.5 ? 1 : 2,
                    couleur: ['vert', 'jaune', 'rouge'][Math.floor(Math.random() * 3)] as 'vert' | 'jaune' | 'rouge',
                    sur_le_carrefour: carrefour.id,
                    occurrences: Math.floor(Math.random() * 10) + 1,
                    timestamp: now,
                    carrefour_id: carrefour.id,
                    isProgrammed: false
                };
                demoAlerts.push(alert);
                carrefour.alerts = [alert];
            }
        });

        return { carrefours: demoCarrefours, alerts: demoAlerts };
    }, []);

    const fetchInitialData = useCallback(async () => {
        console.log('Récupération des données initiales...', {
            isProductionMode,
            isDemoMode: configService.isDemoMode()
        });

        // Si on est en mode démo OU si on n'est pas en mode production, utiliser les données de démo
        if (configService.isDemoMode() || !isProductionMode) {
            console.log('Utilisation des données de démonstration');
            const demoData = generateDemoData();
            setCarrefours(demoData.carrefours);
            setAlerts(demoData.alerts);
            setMaintenanceTasks([]);
            setError(null);
            monitoringService.updateCarrefourStats(demoData.carrefours);
            return;
        }

        // Mode production avec données réelles
        try {
            console.log('Récupération des données de production depuis l\'API...');
            const apiClient = ApiClient.getInstance();
            const [carrefoursData, alertsData, maintenanceData] = await Promise.all([
                apiClient.get<CarrefourStatus[]>('/carrefours'),
                apiClient.get<TrafficAlert[]>('/alerts'),
                apiClient.get<MaintenanceTask[]>('/maintenance')
            ]);
            
            console.log('Données de production récupérées:', {
                carrefours: carrefoursData.length,
                alerts: alertsData.length,
                maintenance: maintenanceData.length
            });
            
            setCarrefours(carrefoursData);
            setAlerts(alertsData);
            setMaintenanceTasks(maintenanceData);
            setError(null);
            monitoringService.updateCarrefourStats(carrefoursData);
            
        } catch (error) {
            console.error('Erreur lors de la récupération des données de production:', error);
            handleApiError(error);
        }
    }, [isProductionMode, generateDemoData]);

    const handleApiError = (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error('Erreur de communication API:', errorMessage);
        
        // En cas d'erreur en production, ne pas basculer vers les données de démo
        if (isProductionMode && !configService.isDemoMode()) {
            setCarrefours([]);
            setAlerts([]);
            setMaintenanceTasks([]);
            setError(`Erreur de connexion à l'API: ${errorMessage}`);
        } else {
            // En développement ou mode démo, utiliser les données de démo comme fallback
            console.warn('Utilisation des données de démo suite à l\'erreur API');
            const demoData = generateDemoData();
            setCarrefours(demoData.carrefours);
            setAlerts(demoData.alerts);
            setMaintenanceTasks([]);
            setError(null);
            monitoringService.updateCarrefourStats(demoData.carrefours);
        }
    };

    const scheduleMaintenance = useCallback(async (carrefourId: string, type: 'routine' | 'major') => {
        if (configService.isDemoMode()) {
            console.warn('Programmation de maintenance non disponible en mode démo');
            return;
        }

        try {
            const apiClient = ApiClient.getInstance();
            const task = await apiClient.post<MaintenanceTask>('/maintenance', { carrefourId, type });
            setMaintenanceTasks(prev => [...prev, task]);
        } catch (error) {
            handleApiError(error);
        }
    }, []);

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
        scheduleMaintenance,
        addCarrefour
    };
};