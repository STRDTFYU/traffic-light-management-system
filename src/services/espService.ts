import { CarrefourMeasures, ESPStatus, TrafficAlert } from '../types/traffic';
import apiClient from './apiClient';

export class ESPService {
    static async getMeasures(carrefourId: string): Promise<CarrefourMeasures> {
        try {
            return await apiClient.get<CarrefourMeasures>(`/api/carrefours/${carrefourId}/measures`);
        } catch (error) {
            console.error(`Erreur lors de la récupération des mesures pour ${carrefourId}:`, error);
            throw error;
        }
    }

    static async getESPStatus(carrefourId: string): Promise<ESPStatus> {
        try {
            return await apiClient.get<ESPStatus>(`/api/carrefours/${carrefourId}/status`);
        } catch (error) {
            console.error(`Erreur lors de la récupération du status ESP pour ${carrefourId}:`, error);
            throw error;
        }
    }

    static async getAlerts(carrefourId: string): Promise<TrafficAlert[]> {
        try {
            return await apiClient.get<TrafficAlert[]>(`/api/carrefours/${carrefourId}/alerts`);
        } catch (error) {
            console.error(`Erreur lors de la récupération des alertes pour ${carrefourId}:`, error);
            throw error;
        }
    }
}
