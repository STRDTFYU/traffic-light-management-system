import React, { useState } from 'react';
import { BarChart3, PieChart, TrendingUp, Zap, Activity, AlertTriangle } from 'lucide-react';
import { CarrefourStatus, TrafficAlert } from '../types/traffic';

interface GraphicsSectionProps {
  carrefours: CarrefourStatus[];
  alerts: TrafficAlert[];
}

export const GraphicsSection: React.FC<GraphicsSectionProps> = ({ carrefours, alerts }) => {
  const [selectedCarrefour, setSelectedCarrefour] = useState<string>('all');
  const [selectedPoteau, setSelectedPoteau] = useState<number>(1);
  const [timeRange, setTimeRange] = useState<string>('1h');

  // Fonction pour obtenir les statistiques d'alertes
  const getAlertStats = () => {
    const last24h = new Date();
    last24h.setHours(last24h.getHours() - 24);
    
    const recentAlerts = alerts.filter(alert => new Date(alert.timestamp) > last24h);
    
    return {
      total: recentAlerts.length,
      critical: recentAlerts.filter(a => 
        a.type.includes('PANNE') || 
        a.type.includes('ERREUR') || 
        a.type === 'COURT_CIRCUIT'
      ).length,
      warning: recentAlerts.filter(a => 
        a.type === 'PORTE_OUVERTE' || 
        a.type === 'BATTERIE_FAIBLE' || 
        a.type === 'TEMPERATURE_ELEVEE'
      ).length
    };
  };

  // Données simulées pour les graphiques
  const generateChartData = () => {
    const data = [];
    const now = new Date();
    const points = 20;
    
    for (let i = points; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 5 * 60 * 1000); // Points toutes les 5 minutes
      data.push({
        time: time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        tension: 220 + Math.random() * 20 - 10,
        intensite: 0.5 + Math.random() * 1.5,
        puissance: (220 + Math.random() * 20 - 10) * (0.5 + Math.random() * 1.5)
      });
    }
    return data;
  };

  const chartData = generateChartData();

  // Données pour le diagramme circulaire
  const getPieChartData = () => {
    const totalCarrefours = carrefours.length;
    const activeCount = carrefours.filter(c => c.status === 'active').length;
    const warningCount = carrefours.filter(c => c.status === 'warning').length;
    const errorCount = carrefours.filter(c => c.status === 'error').length;
    const offlineCount = carrefours.filter(c => c.status === 'offline').length;

    return [
      { label: 'Actifs', value: activeCount, color: 'bg-green-500', percentage: (activeCount / totalCarrefours * 100).toFixed(1) },
      { label: 'Attention', value: warningCount, color: 'bg-yellow-500', percentage: (warningCount / totalCarrefours * 100).toFixed(1) },
      { label: 'Erreur', value: errorCount, color: 'bg-red-500', percentage: (errorCount / totalCarrefours * 100).toFixed(1) },
      { label: 'Hors ligne', value: offlineCount, color: 'bg-gray-500', percentage: (offlineCount / totalCarrefours * 100).toFixed(1) }
    ];
  };

  const pieData = getPieChartData();
  const alertStats = getAlertStats();

  const LineChart: React.FC<{ data: any[], title: string, color: string, unit: string }> = ({ data, title, color, unit }) => {
    const getValue = (point: any) => {
      const value = point[title.toLowerCase().split(' ')[0]];
      return typeof value === 'number' ? value : 0;
    };

    const maxValue = Math.max(...data.map(d => getValue(d))) || 1; // Prevent division by zero

    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          {title}
        </h3>
        <div className="relative h-64">
          <svg className="w-full h-full" viewBox="0 0 400 200">
            {/* Grille */}
            <defs>
              <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#374151" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Ligne de données */}
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="2"
              points={data.map((point, index) => {
                const x = (index / Math.max(data.length - 1, 1)) * 380 + 10;
                const y = 190 - (getValue(point) / maxValue) * 170;
                return `${x},${y}`;
              }).join(' ')}
            />
            
            {/* Points */}
            {data.map((point, index) => {
              const x = (index / Math.max(data.length - 1, 1)) * 380 + 10;
              const y = 190 - (getValue(point) / maxValue) * 170;
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="3"
                  fill={color}
                />
              );
            })}
          </svg>
          
          {/* Valeurs sur les axes */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-400 px-2">
            <span>{data[0]?.time || ''}</span>
            <span>{data[Math.floor(data.length / 2)]?.time || ''}</span>
            <span>{data[data.length - 1]?.time || ''}</span>
          </div>
          
          <div className="absolute top-2 right-2 text-sm text-gray-400">
            {data[data.length - 1]?.[title.toLowerCase().split(' ')[0]]?.toFixed(1)} {unit}
          </div>
        </div>
      </div>
    );
  };

  const PieChartComponent: React.FC = () => (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <PieChart className="w-5 h-5 mr-2" />
        État du Réseau
      </h3>
      <div className="flex items-center justify-center">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {pieData.map((segment, index) => {
              const total = pieData.reduce((sum, item) => sum + item.value, 0);
              const percentage = segment.value / total;
              const angle = percentage * 360;
              const startAngle = pieData.slice(0, index).reduce((sum, item) => sum + (item.value / total * 360), 0);
              
              const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
              const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
              const x2 = 50 + 40 * Math.cos(((startAngle + angle) * Math.PI) / 180);
              const y2 = 50 + 40 * Math.sin(((startAngle + angle) * Math.PI) / 180);
              
              const largeArcFlag = angle > 180 ? 1 : 0;
              
              return (
                <path
                  key={index}
                  d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                  fill={segment.color.replace('bg-', '#')}
                  className={segment.color.replace('bg-', 'fill-')}
                />
              );
            })}
          </svg>
        </div>
      </div>
      
      <div className="mt-4 space-y-2">
        {pieData.map((segment, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${segment.color} mr-2`}></div>
              <span className="text-sm text-gray-300">{segment.label}</span>
            </div>
            <div className="text-sm text-gray-400">
              {segment.value} ({segment.percentage}%)
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <BarChart3 className="w-6 h-6 mr-3 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Analyse Graphique</h2>
        </div>
        <div className="text-sm text-gray-400">
          Données en temps réel
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Carrefour
            </label>
            <select
              value={selectedCarrefour}
              onChange={(e) => setSelectedCarrefour(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">Tous les carrefours</option>
              {carrefours.map(carrefour => (
                <option key={carrefour.id} value={carrefour.id}>
                  {carrefour.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Poteau
            </label>
            <select
              value={selectedPoteau}
              onChange={(e) => setSelectedPoteau(parseInt(e.target.value))}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value={1}>Poteau 1</option>
              <option value={2}>Poteau 2</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Période
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="1h">Dernière heure</option>
              <option value="6h">6 dernières heures</option>
              <option value="24h">24 dernières heures</option>
              <option value="7d">7 derniers jours</option>
            </select>
          </div>
        </div>
      </div>

      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <LineChart 
          data={chartData} 
          title="Tension" 
          color="#10b981" 
          unit="V"
        />
        <LineChart 
          data={chartData} 
          title="Intensité" 
          color="#f59e0b" 
          unit="A"
        />
        <LineChart 
          data={chartData} 
          title="Puissance" 
          color="#3b82f6" 
          unit="W"
        />
      </div>

      {/* Diagrammes et statistiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChartComponent />
        
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Statistiques Détaillées
          </h3>
          
          {/* Statistiques des alertes */}
          <div className="mb-4 p-4 bg-gray-700/50 rounded-lg">
            <h4 className="text-sm font-medium text-white mb-3 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-yellow-400" />
              Alertes (24 dernières heures)
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">{alertStats.total}</div>
                <div className="text-xs text-gray-400">Total</div>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="text-2xl font-bold text-red-400">{alertStats.critical}</div>
                <div className="text-xs text-gray-400">Critiques</div>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400">{alertStats.warning}</div>
                <div className="text-xs text-gray-400">Avertissements</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
              <div className="flex items-center">
                <Zap className="w-4 h-4 mr-2 text-yellow-400" />
                <span className="text-sm text-gray-300">Tension moyenne</span>
              </div>
              <span className="text-white font-semibold">
                {(chartData.reduce((sum, d) => sum + d.tension, 0) / chartData.length).toFixed(1)}V
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
              <div className="flex items-center">
                <Activity className="w-4 h-4 mr-2 text-blue-400" />
                <span className="text-sm text-gray-300">Intensité moyenne</span>
              </div>
              <span className="text-white font-semibold">
                {(chartData.reduce((sum, d) => sum + d.intensite, 0) / chartData.length).toFixed(2)}A
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-green-400" />
                <span className="text-sm text-gray-300">Puissance moyenne</span>
              </div>
              <span className="text-white font-semibold">
                {(chartData.reduce((sum, d) => sum + d.puissance, 0) / chartData.length).toFixed(0)}W
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-red-400" />
                <span className="text-sm text-gray-300">Alertes actives</span>
              </div>
              <span className="text-white font-semibold">
                {carrefours.reduce((sum, c) => sum + (c.alerts?.length || 0), 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};