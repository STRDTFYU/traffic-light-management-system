import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Helper function to get current traffic pattern
const getTrafficPattern = (time) => {
    const hour = time.getHours();
    if (hour >= 7 && hour < 9) return { ...trafficPatterns.morningRush, period: 'morningRush' };
    if (hour >= 16 && hour < 19) return { ...trafficPatterns.eveningRush, period: 'eveningRush' };
    if (hour >= 9 && hour < 16) return { ...trafficPatterns.daytime, period: 'daytime' };
    return { ...trafficPatterns.night, period: 'night' };
};

// Helper function to calculate maintenance efficiency
const calculateMaintenanceEfficiency = () => {
    const completedTasks = maintenanceTasks.filter(t => t.status === 'completed');
    if (completedTasks.length === 0) return 1;

    return completedTasks.reduce((acc, task) => {
        const start = new Date(task.scheduledStart);
        const end = new Date(start.getTime() + task.duration);
        const actualEnd = task.completedAt ? new Date(task.completedAt) : end;
        const efficiency = task.duration / (actualEnd - start);
        return acc + efficiency;
    }, 0) / completedTasks.length;
};

// Helper function to get next pattern transition
const getNextPatternTransition = (currentTime) => {
    const hour = currentTime.getHours();
    const nextTime = new Date(currentTime);
    nextTime.setMinutes(0);
    nextTime.setSeconds(0);
    nextTime.setMilliseconds(0);

    if (hour < 7) {
        nextTime.setHours(7);
        return { pattern: 'morningRush', time: nextTime.toISOString() };
    } else if (hour < 9) {
        nextTime.setHours(9);
        return { pattern: 'daytime', time: nextTime.toISOString() };
    } else if (hour < 16) {
        nextTime.setHours(16);
        return { pattern: 'eveningRush', time: nextTime.toISOString() };
    } else if (hour < 19) {
        nextTime.setHours(19);
        return { pattern: 'night', time: nextTime.toISOString() };
    } else {
        nextTime.setDate(nextTime.getDate() + 1);
        nextTime.setHours(7);
        return { pattern: 'morningRush', time: nextTime.toISOString() };
    }
};

// Traffic patterns based on time of day
const trafficPatterns = {
    morningRush: { // 7-9 AM
        cycleLength: 120,
        greenTimes: { main: 80, secondary: 40 },
        probability: { 
            pedestrian: 0.8, 
            emergency: 0.2,
            vehicleVolume: 0.9, // 90% of max volume
            congestion: 0.8     // 80% chance of congestion
        },
        adaptiveTiming: {
            congestionThreshold: 0.7,
            maxGreenExtension: 20, // seconds
            minGreenTime: 30      // seconds
        }
    },
    daytime: { // 9 AM - 4 PM
        cycleLength: 90,
        greenTimes: { main: 50, secondary: 40 },
        probability: { 
            pedestrian: 0.5, 
            emergency: 0.1,
            vehicleVolume: 0.6,
            congestion: 0.4
        },
        adaptiveTiming: {
            congestionThreshold: 0.6,
            maxGreenExtension: 15,
            minGreenTime: 25
        }
    },
    eveningRush: { // 4-7 PM
        cycleLength: 120,
        greenTimes: { main: 80, secondary: 40 },
        probability: { 
            pedestrian: 0.8, 
            emergency: 0.2,
            vehicleVolume: 0.95,
            congestion: 0.85
        },
        adaptiveTiming: {
            congestionThreshold: 0.75,
            maxGreenExtension: 25,
            minGreenTime: 35
        }
    },
    night: { // 7 PM - 7 AM
        cycleLength: 60,
        greenTimes: { main: 35, secondary: 25 },
        probability: { 
            pedestrian: 0.2, 
            emergency: 0.05,
            vehicleVolume: 0.2,
            congestion: 0.1
        },
        adaptiveTiming: {
            congestionThreshold: 0.3,
            maxGreenExtension: 10,
            minGreenTime: 20
        }
    }
};

// Maintenance types and priorities
const maintenanceTypes = {
    routine: {
        interval: 7 * 24 * 60 * 60 * 1000, // Weekly
        duration: 2 * 60 * 60 * 1000, // 2 hours
        impact: 'low',
        priority: 1,
        staffRequired: 1,
        tasks: ['inspection', 'cleaning', 'basic-testing']
    },
    preventive: {
        interval: 14 * 24 * 60 * 60 * 1000, // Bi-weekly
        duration: 4 * 60 * 60 * 1000, // 4 hours
        impact: 'medium',
        priority: 2,
        staffRequired: 2,
        tasks: ['calibration', 'component-check', 'software-update']
    },
    major: {
        interval: 30 * 24 * 60 * 60 * 1000, // Monthly
        duration: 8 * 60 * 60 * 1000, // 8 hours
        impact: 'high',
        priority: 3,
        staffRequired: 3,
        tasks: ['hardware-replacement', 'full-testing', 'certification']
    },
    emergency: {
        interval: 0, // On-demand
        duration: 4 * 60 * 60 * 1000, // 4 hours
        impact: 'critical',
        priority: 4,
        staffRequired: 2,
        tasks: ['fault-diagnosis', 'emergency-repair']
    }
};

// Maintenance schedule constraints
const maintenanceConstraints = {
    maxConcurrent: 2, // Maximum concurrent maintenance tasks
    minInterval: 12 * 60 * 60 * 1000, // Minimum 12 hours between maintenance on same carrefour
    maxImpactScore: 5, // Maximum combined impact score for concurrent maintenance
    staffAvailable: 4, // Total maintenance staff available
    preferredHours: { // Preferred maintenance hours (24-hour format)
        start: 22, // 10 PM
        end: 5    // 5 AM
    }
};

let maintenanceTasks = [];

// Load API configuration
function loadConfig() {
    const configPath = path.join(__dirname, 'api-config.json');
    try {
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading config:', error);
    }
    return {
        latency: { enabled: false },
        errors: { enabled: false },
        alerts: { frequency: 'normal' },
        carrefours: { 
            failureProbability: 0.1,
            warningProbability: 0.2,
            updateFrequency: 5000
        }
    };
}

// Configuration
const config = {
    simulateErrors: false,
    errorRate: 0.1, // 10% chance of error
    minLatency: 100,
    maxLatency: 1000,
    updateInterval: 5000, // 5 seconds
};

// Middleware
app.use(cors());
app.use(express.json());

// Simulated error middleware
const simulateErrors = (req, res, next) => {
    if (config.simulateErrors && Math.random() < config.errorRate) {
        const errors = [
            { status: 500, message: 'Internal Server Error' },
            { status: 503, message: 'Service Temporarily Unavailable' },
            { status: 504, message: 'Gateway Timeout' },
        ];
        const error = errors[Math.floor(Math.random() * errors.length)];
        return res.status(error.status).json({ error: error.message });
    }
    next();
};

// Simulated latency middleware
const simulateLatency = (req, res, next) => {
    const latency = Math.floor(Math.random() * (config.maxLatency - config.minLatency)) + config.minLatency;
    setTimeout(next, latency);
};

app.use(simulateLatency);
app.use(simulateErrors);

// Enhanced measure generation with traffic patterns
const generateMeasures = (id) => {
    const hour = new Date().getHours();
    let pattern;
    
    if (hour >= 7 && hour < 9) pattern = trafficPatterns.morningRush;
    else if (hour >= 16 && hour < 19) pattern = trafficPatterns.eveningRush;
    else if (hour >= 9 && hour < 16) pattern = trafficPatterns.daytime;
    else pattern = trafficPatterns.night;

    const isUnderMaintenance = maintenanceTasks.some(task => 
        task.carrefourId === id && 
        task.status === 'in-progress'
    );

    const measures = {
        timestamp: new Date().toISOString(),
        carrefour_id: id,
        cycle_courant: Math.floor(Math.random() * 4) + 1,
        position_sequence: Math.floor(Math.random() * pattern.cycleLength),
        mode_operation: isUnderMaintenance ? 'maintenance' : 'normal',
        esp_status: {
            porte: Math.random() > 0.9 ? 'ouverte' : 'fermee',
            alimentation: Math.random() > 0.95 ? 'coupee' : 'normale',
            batterie_niveau: 85 + Math.random() * 15,
            temperature: 25 + Math.random() * 10
        },
        mesures: []
    };    // Calculate traffic conditions
    const hasCongestion = Math.random() < pattern.probability.congestion;
    const vehicleVolume = pattern.probability.vehicleVolume * (0.8 + Math.random() * 0.4); // 80-120% of expected volume
    const hasEmergency = Math.random() < pattern.probability.emergency;
    
    // Generate measures for each traffic light
    ['main', 'secondary'].forEach((road, index) => {
        let timeInCycle = measures.position_sequence % pattern.cycleLength;
        let baseGreenTime = pattern.greenTimes[road];
        
        // Apply adaptive timing if congested
        if (hasCongestion && vehicleVolume > pattern.adaptiveTiming.congestionThreshold) {
            const extension = Math.min(
                pattern.adaptiveTiming.maxGreenExtension,
                Math.floor((vehicleVolume - pattern.adaptiveTiming.congestionThreshold) * 50)
            );
            baseGreenTime = Math.max(pattern.adaptiveTiming.minGreenTime, baseGreenTime + extension);
        }
        
        // Emergency vehicle override
        const isGreen = hasEmergency ? (road === 'main') : (timeInCycle < baseGreenTime);
        
        measures.mesures.push({
            poteau: index + 1,
            Feu: isGreen ? 'vert' : 'rouge',
            tension: 220 + Math.random() * 10,
            intensite: isGreen ? (1 + Math.random() * 0.5) : (0.5 + Math.random() * 0.3),
            etat: isUnderMaintenance ? false : (Math.random() > 0.05),
            pannes_consecutives: Math.floor(Math.random() * 3),
            statistiques: {
                congestion: hasCongestion,
                vehicleVolume: vehicleVolume,
                emergencyOverride: hasEmergency,
                adaptedGreenTime: baseGreenTime
            }
        });
    });

    return measures;
};

// Initial data
let carrefours = Array.from({ length: 8 }, (_, i) => ({
    id: `API_${i + 1}`,
    name: `Carrefour ${i + 1}`,
    location: `${45.5 + Math.random() * 0.1}, ${-73.6 + Math.random() * 0.1}`,
    status: 'active',
    lastUpdate: new Date().toISOString(),
    measures: generateMeasures(`API_${i + 1}`)
}));

let alerts = [];

// WebSocket broadcast function
const broadcastUpdate = (type, data) => {
    wss.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN = 1
            client.send(JSON.stringify({ type, data }));
        }
    });
};

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.send(JSON.stringify({ 
        type: 'initial', 
        data: { 
            carrefours,
            alerts,
            maintenanceTasks
        }
    }));

    ws.on('close', () => console.log('Client disconnected'));
});

// Maintenance scheduling validation
const validateMaintenanceSchedule = (carrefourId, type, proposedStart) => {
    const maintenanceType = maintenanceTypes[type];
    const proposedEnd = new Date(proposedStart.getTime() + maintenanceType.duration);
    
    // Check concurrent maintenance limit
    const concurrentTasks = maintenanceTasks.filter(task => {
        const taskStart = new Date(task.scheduledStart);
        const taskEnd = new Date(taskStart.getTime() + maintenanceTypes[task.type].duration);
        return (proposedStart <= taskEnd && taskStart <= proposedEnd) && task.status !== 'completed';
    });

    if (concurrentTasks.length >= maintenanceConstraints.maxConcurrent) {
        throw new Error(`Maximum concurrent maintenance limit (${maintenanceConstraints.maxConcurrent}) exceeded`);
    }

    // Check minimum interval between maintenance on same carrefour
    const recentTasks = maintenanceTasks.filter(task => 
        task.carrefourId === carrefourId && 
        new Date(task.scheduledStart) > new Date(Date.now() - maintenanceConstraints.minInterval)
    );

    if (recentTasks.length > 0) {
        throw new Error(`Minimum interval between maintenance tasks not met for carrefour ${carrefourId}`);
    }

    // Check staff availability
    const requiredStaff = concurrentTasks.reduce((total, task) => 
        total + maintenanceTypes[task.type].staffRequired, 0
    ) + maintenanceType.staffRequired;

    if (requiredStaff > maintenanceConstraints.staffAvailable) {
        throw new Error(`Insufficient staff available (need ${requiredStaff}, have ${maintenanceConstraints.staffAvailable})`);
    }

    // Calculate optimal start time within constraints
    const hour = proposedStart.getHours();
    const isPreferredHours = hour >= maintenanceConstraints.preferredHours.start || 
                            hour < maintenanceConstraints.preferredHours.end;

    return {
        isPreferredHours,
        concurrentTasks: concurrentTasks.length,
        staffNeeded: requiredStaff
    };
};

// Maintenance task management
const scheduleMaintenanceTask = (carrefourId, type = 'routine') => {
    const maintenanceType = maintenanceTypes[type];
    let proposedStart = new Date(Date.now() + Math.random() * maintenanceType.interval);
    
    // Try to schedule during preferred hours
    for (let attempts = 0; attempts < 5; attempts++) {
        try {
            const validation = validateMaintenanceSchedule(carrefourId, type, proposedStart);
            if (validation.isPreferredHours || attempts === 4) {
                const task = {
                    id: `MAINT_${Date.now()}_${carrefourId}`,
                    carrefourId,
                    type,
                    scheduledStart: proposedStart.toISOString(),
                    duration: maintenanceType.duration,
                    status: 'scheduled',
                    impact: maintenanceType.impact,
                    staffRequired: maintenanceType.staffRequired,
                    tasks: [...maintenanceType.tasks],
                    validation: validation
                };
                maintenanceTasks.push(task);
                broadcastUpdate('maintenance', { type: 'new', task });
                return task;
            }
            // Try next day during preferred hours
            proposedStart.setDate(proposedStart.getDate() + 1);
            proposedStart.setHours(maintenanceConstraints.preferredHours.start);
        } catch (error) {
            if (attempts === 4) throw error;
            // Try next day
            proposedStart.setDate(proposedStart.getDate() + 1);
        }
    }
    throw new Error('Failed to schedule maintenance after multiple attempts');
};

// Update data periodically
const updateData = () => {
    const currentTime = new Date();
    const timeString = currentTime.toISOString();
    
    // Update maintenance tasks
    maintenanceTasks = maintenanceTasks.map(task => {
        const taskStart = new Date(task.scheduledStart);
        const taskEnd = new Date(taskStart.getTime() + task.duration);

        if (currentTime >= taskStart && currentTime < taskEnd && task.status === 'scheduled') {
            task.status = 'in-progress';
            broadcastUpdate('maintenance', { type: 'update', task });
        } else if (currentTime >= taskEnd && task.status === 'in-progress') {
            task.status = 'completed';
            broadcastUpdate('maintenance', { type: 'update', task });
        }
        return task;
    });
    
    // Update carrefours
    carrefours = carrefours.map(c => {
        const measures = generateMeasures(c.id);
        const hasIssue = measures.mesures.some(m => !m.etat || m.pannes_consecutives > 0);
        const isOffline = measures.esp_status.alimentation === 'coupee';
        
        let status = 'active';
        if (isOffline) status = 'offline';
        else if (hasIssue) status = Math.random() > 0.5 ? 'error' : 'warning';
        
        return {
            ...c,
            status,            lastUpdate: timeString,
            measures
        };
    });

    // Generate new alerts
    const newAlerts = carrefours.flatMap(c => {
        if (c.status === 'active') return [];
        
        const alertTypes = {
            offline: 'ALIMENTATION_COUPEE',
            error: 'PANNE',
            warning: 'PANNE_INTERMITTENTE'
        };

        return {
            id: `ALERT_${Date.now()}_${c.id}`,
            type: alertTypes[c.status],
            poteau: Math.random() > 0.5 ? 1 : 2,
            couleur: ['vert', 'jaune', 'rouge'][Math.floor(Math.random() * 3)],
            sur_le_carrefour: c.id,
            occurrences: Math.floor(Math.random() * 10) + 1,            timestamp: timeString,
            carrefour_id: c.id
        };
    });    // Keep only recent alerts (last 1 hour) and compute statistics
    const oneHourAgo = new Date(currentTime.getTime() - 3600000);
    const currentAlerts = [...newAlerts, ...alerts.filter(a => new Date(a.timestamp) > oneHourAgo)];
    
    // Compute alert statistics before assignment
    const alertStats = {
        total: currentAlerts.length,
        byType: currentAlerts.reduce((acc, alert) => {
            acc[alert.type] = (acc[alert.type] || 0) + 1;
            return acc;
        }, {}),
        byCarrefour: currentAlerts.reduce((acc, alert) => {
            acc[alert.carrefour_id] = (acc[alert.carrefour_id] || 0) + 1;
            return acc;
        }, {}),
        lastUpdate: timeString
    };

    alerts = currentAlerts;    // Update visualization data
    updateVisualizationData();

    // Broadcast updates with statistics
    broadcastUpdate('carrefours', carrefours);
    broadcastUpdate('alerts', alerts);
    broadcastUpdate('visualization', {
        traffic: timeSeriesData.traffic,
        maintenance: timeSeriesData.maintenance,
        alerts: timeSeriesData.alerts
    });
};

setInterval(updateData, config.updateInterval);
updateData(); // Initial update

// Routes
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        config
    });
});

// Configure simulation settings
app.post('/admin/config', (req, res) => {
    Object.assign(config, req.body);
    res.json(config);
});

app.get('/carrefours', (req, res) => {
    res.json(carrefours);
});

app.get('/alerts', (req, res) => {
    res.json(alerts);
});

app.post('/carrefours', (req, res) => {
    const newCarrefour = {
        ...req.body,
        id: `API_${carrefours.length + 1}`,
        status: 'active',
        lastUpdate: new Date().toISOString(),
        measures: generateMeasures(`API_${carrefours.length + 1}`)
    };
    carrefours.push(newCarrefour);
    res.status(201).json(newCarrefour);
});

// New endpoints for maintenance
app.get('/maintenance', (req, res) => {
    res.json(maintenanceTasks);
});

app.get('/traffic-pattern', (req, res) => {
    const time = req.query.time ? new Date(req.query.time) : new Date();
    const hour = time.getHours();
    
    let pattern;
    if (hour >= 7 && hour < 9) pattern = { ...trafficPatterns.morningRush, period: 'morningRush' };
    else if (hour >= 16 && hour < 19) pattern = { ...trafficPatterns.eveningRush, period: 'eveningRush' };
    else if (hour >= 9 && hour < 16) pattern = { ...trafficPatterns.daytime, period: 'daytime' };
    else pattern = { ...trafficPatterns.night, period: 'night' };
    
    res.json({
        time: time.toISOString(),
        pattern,
        nextTransition: getNextPatternTransition(time)
    });
});

app.get('/statistics', (req, res) => {
    const now = new Date();
    const currentPattern = getTrafficPattern(now);
    
    // Calculate traffic metrics
    const trafficMetrics = carrefours.reduce((acc, c) => {
        const measures = c.measures.mesures;
        measures.forEach(m => {
            if (m.statistiques) {
                acc.totalCongestion += m.statistiques.congestion ? 1 : 0;
                acc.totalVehicleVolume += m.statistiques.vehicleVolume;
                acc.emergencyOverrides += m.statistiques.emergencyOverride ? 1 : 0;
                acc.adaptedSignals += m.statistiques.adaptedGreenTime !== currentPattern.greenTimes[measures.indexOf(m) === 0 ? 'main' : 'secondary'] ? 1 : 0;
            }
        });
        return acc;
    }, { 
        totalCongestion: 0, 
        totalVehicleVolume: 0, 
        emergencyOverrides: 0,
        adaptedSignals: 0
    });
    
    const stats = {
        carrefours: {
            total: carrefours.length,
            byStatus: carrefours.reduce((acc, c) => {
                acc[c.status] = (acc[c.status] || 0) + 1;
                return acc;
            }, {}),
            active: carrefours.filter(c => c.status === 'active').length
        },
        traffic: {
            currentPattern: currentPattern.period,
            congestionLevel: trafficMetrics.totalCongestion / (carrefours.length * 2), // Per signal
            averageVehicleVolume: trafficMetrics.totalVehicleVolume / (carrefours.length * 2),
            emergencyOverrides: trafficMetrics.emergencyOverrides,
            adaptiveTimingActivations: trafficMetrics.adaptedSignals,
            nextTransition: getNextPatternTransition(now)
        },
        alerts: alertStats,
        maintenance: {
            scheduled: maintenanceTasks.filter(t => t.status === 'scheduled').length,
            inProgress: maintenanceTasks.filter(t => t.status === 'in-progress').length,
            completed: maintenanceTasks.filter(t => t.status === 'completed').length,
            efficiency: calculateMaintenanceEfficiency()
        },
        timestamp: now.toISOString()
    };
    res.json(stats);
});

app.post('/maintenance', (req, res) => {
    const { carrefourId, type } = req.body;
    const task = scheduleMaintenanceTask(carrefourId, type);
    res.status(201).json(task);
});

// Time series data storage (last 24 hours)
const timeSeriesData = {
    traffic: {
        congestionLevels: [],
        vehicleVolumes: [],
        emergencyEvents: [],
        adaptiveTimingChanges: []
    },
    maintenance: {
        scheduledTasks: [],
        completedTasks: [],
        efficiency: []
    },
    alerts: {
        byType: {},
        byCarrefour: {}
    }
};

// Server performance tracking
const serverMetrics = {
    startTime: Date.now(),
    requestCount: 0,
    errorCount: 0,
    lastUpdate: new Date().toISOString()
};

// Helper function to maintain time series data
const updateTimeSeriesData = (category, metric, value) => {
    const maxDataPoints = 24 * 60; // 24 hours of minute-by-minute data
    const timeSeriesArray = timeSeriesData[category][metric];
    
    timeSeriesArray.push({
        timestamp: new Date().toISOString(),
        value: value
    });

    // Keep only last 24 hours of data
    if (timeSeriesArray.length > maxDataPoints) {
        timeSeriesArray.shift();
    }
};

// Helper function to predict traffic patterns
const predictTrafficPatterns = (hours = 24) => {
    const predictions = [];
    const startTime = new Date();
    
    for (let i = 1; i <= hours; i++) {
        const time = new Date(startTime.getTime() + i * 3600000);
        const currentPattern = getTrafficPattern(time);
        const nextTransition = getNextPatternTransition(time);
        
        if (nextTransition.time) {
            predictions.push({
                from: currentPattern.period,
                to: nextTransition.pattern,
                time: nextTransition.time,
                congestionProbability: currentPattern.probability.congestion
            });
        }
    }
    
    return predictions;
};

// Update visualization data in the updateData function
const updateVisualizationData = () => {
    const now = new Date();
    
    // Update traffic metrics
    const trafficMetrics = carrefours.reduce((acc, c) => {
        c.measures.mesures.forEach(m => {
            if (m.statistiques) {
                acc.congestion += m.statistiques.congestion ? 1 : 0;
                acc.volume += m.statistiques.vehicleVolume;
                acc.emergency += m.statistiques.emergencyOverride ? 1 : 0;
                acc.adaptive += m.statistiques.adaptedGreenTime !== undefined ? 1 : 0;
            }
        });
        return acc;
    }, { congestion: 0, volume: 0, emergency: 0, adaptive: 0 });
    
    updateTimeSeriesData('traffic', 'congestionLevels', trafficMetrics.congestion / (carrefours.length * 2));
    updateTimeSeriesData('traffic', 'vehicleVolumes', trafficMetrics.volume / (carrefours.length * 2));
    updateTimeSeriesData('traffic', 'emergencyEvents', trafficMetrics.emergency);
    updateTimeSeriesData('traffic', 'adaptiveTimingChanges', trafficMetrics.adaptive);
    
    // Update maintenance metrics
    updateTimeSeriesData('maintenance', 'scheduledTasks', 
        maintenanceTasks.filter(t => t.status === 'scheduled').length);
    updateTimeSeriesData('maintenance', 'completedTasks',
        maintenanceTasks.filter(t => t.status === 'completed').length);
    updateTimeSeriesData('maintenance', 'efficiency', calculateMaintenanceEfficiency());
    
    // Update alert metrics
    const alertsByType = {};
    const alertsByCarrefour = {};
    
    alerts.forEach(alert => {
        alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1;
        alertsByCarrefour[alert.carrefour_id] = (alertsByCarrefour[alert.carrefour_id] || 0) + 1;
    });
    
    Object.entries(alertsByType).forEach(([type, count]) => {
        if (!timeSeriesData.alerts.byType[type]) {
            timeSeriesData.alerts.byType[type] = [];
        }
        updateTimeSeriesData('alerts', `byType.${type}`, count);
    });
    
    Object.entries(alertsByCarrefour).forEach(([id, count]) => {
        if (!timeSeriesData.alerts.byCarrefour[id]) {
            timeSeriesData.alerts.byCarrefour[id] = [];
        }
        updateTimeSeriesData('alerts', `byCarrefour.${id}`, count);
    });
};

// Add visualization endpoints
app.get('/visualization/traffic', (req, res) => {
    res.json(timeSeriesData.traffic);
});

app.get('/visualization/maintenance', (req, res) => {
    res.json(timeSeriesData.maintenance);
});

app.get('/visualization/alerts', (req, res) => {
    res.json(timeSeriesData.alerts);
});

app.get('/visualization/predictions', (req, res) => {
    const hours = parseInt(req.query.hours) || 24;
    res.json(predictTrafficPatterns(hours));
});

app.get('/visualization/performance', (req, res) => {
    const uptime = Date.now() - serverMetrics.startTime;
    res.json({
        responseTime: config.minLatency + (config.maxLatency - config.minLatency) / 2,
        uptime: Math.floor(uptime / 1000), // in seconds
        lastUpdate: serverMetrics.lastUpdate,
        errorRate: serverMetrics.errorCount / Math.max(1, serverMetrics.requestCount)
    });
});

// Middleware to track server metrics
app.use((req, res, next) => {
    serverMetrics.requestCount++;
    const start = Date.now();
    
    res.on('finish', () => {
        if (res.statusCode >= 400) {
            serverMetrics.errorCount++;
        }
        serverMetrics.lastUpdate = new Date().toISOString();
    });
    
    next();
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`
🚦 Traffic Light Management API Server
------------------------------------
Server running on http://localhost:${PORT}
Mode: Development
Features:
- Random errors (${config.errorRate * 100}% chance)
- Latency simulation (${config.minLatency}-${config.maxLatency}ms)
- Auto-updating data every ${config.updateInterval}ms
- Real-time alerts generation
- Error simulation endpoints
- WebSocket support for real-time updates
- Enhanced traffic patterns

Use POST /admin/config to configure:
{
    "simulateErrors": boolean,
    "errorRate": number,
    "minLatency": number,
    "maxLatency": number,
    "updateInterval": number
}
`);
});
