# Traffic Light Management System

A real-time traffic light management system with simulation capabilities for testing and development.

## Features

- Real-time traffic light monitoring and control
- Traffic pattern simulation based on time of day
- Maintenance scheduling and tracking
- Alert management system
- Real-time statistics and visualization
- WebSocket support for live updates
- Configurable error and latency simulation

## Getting Started

### Prerequisites

- Node.js v16 or higher
- npm v7 or higher

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd traffic-light-management
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Start the API server:
```bash
npm run api
```

## API Documentation

### Main Endpoints

- `GET /health` - Server health check
- `GET /carrefours` - List all traffic lights
- `GET /alerts` - Get current alerts
- `GET /maintenance` - Get maintenance tasks
- `GET /statistics` - Get system statistics

### Visualization Endpoints

- `GET /visualization/traffic` - Traffic metrics time series
- `GET /visualization/maintenance` - Maintenance metrics
- `GET /visualization/alerts` - Alert trends
- `GET /visualization/predictions` - Traffic pattern predictions
- `GET /visualization/performance` - Server performance metrics

### Control Endpoints

- `POST /admin/config` - Update server configuration
- `POST /maintenance` - Schedule maintenance task

## Development Tools

### Control Scripts

- `control-api.cmd` - Control API behavior (Windows)
  - `control-api latency on [min max]` - Enable latency simulation
  - `control-api errors on [rate]` - Enable error simulation
  - `control-api update <interval>` - Set update interval
  - `control-api reset` - Reset to defaults

### Test Script

- `test-api.cmd` - Run API tests

## Architecture

The system consists of:

1. Frontend (React + TypeScript)
   - Real-time monitoring dashboard
   - Configuration interface
   - Visualization components

2. Backend (Node.js + Express)
   - RESTful API
   - WebSocket server
   - Simulation engine

## Configuration

Server configuration can be modified through:
1. `api-config.json`
2. Runtime through `/admin/config` endpoint
3. Environment variables

## License

[MIT License](LICENSE)
