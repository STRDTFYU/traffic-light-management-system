export type MaintenanceType = 'routine' | 'major';

export type MaintenanceStatus = 'scheduled' | 'in-progress' | 'completed';

export interface MaintenanceTask {
  id: string;
  carrefourId: string;
  type: MaintenanceType;
  scheduledStart: string;
  duration: number;
  status: MaintenanceStatus;
  impact: 'low' | 'high';
}

export interface TrafficLightMeasure {
  poteau: 1 | 2;
  Feu: 'vert' | 'jaune' | 'rouge';
  tension: number;
  intensite: number;
  etat: boolean;
  pannes_consecutives: number;
}

export interface ESPStatus {
  porte: 'ouverte' | 'fermee';
  alimentation: 'normale' | 'coupee';
  batterie_niveau?: number; // Niveau de batterie en pourcentage (optionnel)
  temperature?: number; // Température interne de l'ESP (optionnel)
}

export interface CarrefourMeasures {
  timestamp: string;
  carrefour_id: string;
  cycle_courant: number;
  position_sequence: number;
  mode_operation: 'normal' | 'maintenance';
  esp_status: {
    porte: 'ouverte' | 'fermee';
    alimentation: 'normale' | 'coupee';
    batterie_niveau: number;
    temperature: number;
  };
  mesures: Array<{
    poteau: number;
    Feu: 'vert' | 'jaune' | 'rouge';
    tension: number;
    intensite: number;
    etat: boolean;
    pannes_consecutives: number;
  }>;
}

export interface TrafficAlert {
  id: string;
  type: string;
  poteau?: number;
  couleur?: 'vert' | 'jaune' | 'rouge';
  sur_le_carrefour?: string;
  occurrences?: number;
  timestamp: string;
  carrefour_id: string;
  isProgrammed?: boolean;
}

export interface CarrefourAlerts {
  timestamp: string;
  carrefour_id: string;
  alertes: TrafficAlert[];
}

export interface CarrefourStatus {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'warning' | 'error' | 'offline';
  lastUpdate: string;
  measures?: CarrefourMeasures;
  alerts?: TrafficAlert[];
}

export interface ESPConfiguration {
  UMAX: number;              // Seuil de surtension (en Volts)
  UWAX: number;              // Seuil minimal de tension de fonctionnement (en Volts)
  IMAX: number;              // Seuil de surintensité (en Ampères)
  Ucc: number;               // Seuil de tension pour court-circuit (en Volts)
  Icc: number;               // Seuil de courant pour court-circuit (en Ampères)
  SEUIL_PANNE_INTERMITTENTE: number;  // Nombre d'occurrences avant alerte
}

export interface EmailConfig {
  senderEmail: string;
  senderPassword: string;
  adminEmail: string;
}

export interface ReportData {
  carrefours: CarrefourStatus[];
  alerts: TrafficAlert[];
  maintenanceTasks: MaintenanceTask[];
  dateGeneration: string;
  periode: {
    debut: string;
    fin: string;
  };
}

export interface ReportFilters {
  dateDebut: string;
  dateFin: string;
  carrefourIds: string[];
  typeAlertes: string[];
  statusCarrefours: string[];
  includeESPStatus: boolean;
  includeMaintenance: boolean;
  includeStatistiques: boolean;
}