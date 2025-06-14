export interface TimeSeriesDataPoint {
    timestamp: string;
    value: number;
}

export interface TrafficMetricsTimeSeries {
    congestionLevels: TimeSeriesDataPoint[];
    vehicleVolumes: TimeSeriesDataPoint[];
    emergencyEvents: TimeSeriesDataPoint[];
    adaptiveTimingChanges: TimeSeriesDataPoint[];
}

export interface MaintenanceMetricsTimeSeries {
    scheduledTasks: TimeSeriesDataPoint[];
    completedTasks: TimeSeriesDataPoint[];
    efficiency: TimeSeriesDataPoint[];
}

export interface AlertMetricsTimeSeries {
    byType: {
        [type: string]: TimeSeriesDataPoint[];
    };
    byCarrefour: {
        [id: string]: TimeSeriesDataPoint[];
    };
}

export interface PerformanceMetrics {
    responseTime: number;
    uptime: number;
    lastUpdate: string;
    errorRate: number;
}

export interface TrafficPatternTransition {
    from: string;
    to: string;
    time: string;
    congestionProbability: number;
}

export interface VisualizationData {
    trafficMetrics: TrafficMetricsTimeSeries;
    maintenanceMetrics: MaintenanceMetricsTimeSeries;
    alertMetrics: AlertMetricsTimeSeries;
    performance: PerformanceMetrics;
    predictions: TrafficPatternTransition[];
}
