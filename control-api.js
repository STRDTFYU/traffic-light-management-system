const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'api-config.json');

// Default configuration
const defaultConfig = {
    latency: {
        enabled: false,
        min: 100,
        max: 500
    },
    errors: {
        enabled: false,
        probability: 0.1,
        codes: [500, 503, 504]
    },
    alerts: {
        frequency: 'normal', // low, normal, high
        types: ['SURTENSION', 'PANNE_INTERMITTENTE', 'ALIMENTATION_COUPEE']
    },
    carrefours: {
        failureProbability: 0.1,
        warningProbability: 0.2,
        updateFrequency: 5000
    }
};

// Load current configuration
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            return { ...defaultConfig, ...config };
        }
    } catch (error) {
        console.error('Error loading config:', error);
    }
    return defaultConfig;
}

// Save configuration
function saveConfig(config) {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        console.log('Configuration saved successfully');
    } catch (error) {
        console.error('Error saving config:', error);
    }
}

// Command handling
const commands = {
    'latency': (args) => {
        const config = loadConfig();
        if (args[0] === 'on') {
            config.latency.enabled = true;
            if (args[1] && args[2]) {
                config.latency.min = parseInt(args[1]);
                config.latency.max = parseInt(args[2]);
            }
        } else if (args[0] === 'off') {
            config.latency.enabled = false;
        }
        saveConfig(config);
    },
    'errors': (args) => {
        const config = loadConfig();
        if (args[0] === 'on') {
            config.errors.enabled = true;
            if (args[1]) {
                config.errors.probability = parseFloat(args[1]);
            }
        } else if (args[0] === 'off') {
            config.errors.enabled = false;
        }
        saveConfig(config);
    },
    'alerts': (args) => {
        const config = loadConfig();
        if (['low', 'normal', 'high'].includes(args[0])) {
            config.alerts.frequency = args[0];
            saveConfig(config);
        }
    },
    'failures': (args) => {
        const config = loadConfig();
        if (args[0]) {
            config.carrefours.failureProbability = parseFloat(args[0]);
            saveConfig(config);
        }
    },
    'reset': () => {
        saveConfig(defaultConfig);
        console.log('Configuration reset to defaults');
    },
    'status': () => {
        const config = loadConfig();
        console.log('\nCurrent API Server Configuration:');
        console.log('--------------------------------');
        console.log(`Latency: ${config.latency.enabled ? 'ON' : 'OFF'} (${config.latency.min}-${config.latency.max}ms)`);
        console.log(`Errors: ${config.errors.enabled ? 'ON' : 'OFF'} (${config.errors.probability * 100}% probability)`);
        console.log(`Alerts Frequency: ${config.alerts.frequency}`);
        console.log(`Failure Rate: ${config.carrefours.failureProbability * 100}%`);
        console.log(`Warning Rate: ${config.carrefours.warningProbability * 100}%`);
        console.log(`Update Frequency: ${config.carrefours.updateFrequency}ms`);
        console.log('--------------------------------\n');
    },
    'help': () => {
        console.log('\nAvailable commands:');
        console.log('  latency on <min> <max>  - Enable latency simulation (e.g., latency on 100 500)');
        console.log('  latency off             - Disable latency simulation');
        console.log('  errors on <probability> - Enable error simulation (e.g., errors on 0.1)');
        console.log('  errors off              - Disable error simulation');
        console.log('  alerts <frequency>      - Set alert frequency (low, normal, high)');
        console.log('  failures <probability>  - Set failure probability (0-1)');
        console.log('  reset                   - Reset all settings to defaults');
        console.log('  status                  - Show current configuration');
        console.log('  help                    - Show this help message\n');
    }
};

// Main
const args = process.argv.slice(2);
const command = args[0]?.toLowerCase();
const commandArgs = args.slice(1);

if (command && commands[command]) {
    commands[command](commandArgs);
} else {
    console.log('Unknown command. Use "help" to see available commands.');
}
