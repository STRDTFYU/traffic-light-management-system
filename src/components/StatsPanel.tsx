import React from 'react';
import { Activity, Zap, AlertCircle, TrendingUp } from 'lucide-react';
import { CarrefourStatus } from '../types/traffic';

interface StatsPanelProps {
  carrefours: CarrefourStatus[];
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ carrefours }) => {
  const getStats = () => {
    const totalCarrefours = carrefours.length;
    const activeCarrefours = carrefours.filter(c => c.status === 'active').length;
    const warningCarrefours = carrefours.filter(c => c.status === 'warning').length;
    const errorCarrefours = carrefours.filter(c => c.status === 'error').length;
    const offlineCarrefours = carrefours.filter(c => c.status === 'offline').length;

    const totalAlerts = carrefours.reduce((sum, c) => sum + (c.alerts?.length || 0), 0);
    
    const avgTension = carrefours.reduce((sum, c) => {
      if (!c.measures) return sum;
      const tensions = c.measures.mesures.map(m => m.tension);
      return sum + tensions.reduce((a, b) => a + b, 0) / tensions.length;
    }, 0) / carrefours.filter(c => c.measures).length || 0;

    const totalPannes = carrefours.reduce((sum, c) => {
      if (!c.measures) return sum;
      return sum + c.measures.mesures.reduce((pSum, m) => pSum + m.pannes_consecutives, 0);
    }, 0);

    return {
      totalCarrefours,
      activeCarrefours,
      warningCarrefours,
      errorCarrefours,
      offlineCarrefours,
      totalAlerts,
      avgTension: avgTension || 0,
      totalPannes,
      uptime: totalCarrefours > 0 ? ((activeCarrefours + warningCarrefours) / totalCarrefours * 100) : 0
    };
  };

  const stats = getStats();

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    trend?: string;
  }> = ({ title, value, icon, color, trend }) => (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
        {trend && (
          <div className="text-xs text-green-400 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" />
            {trend}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">
        {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}
      </div>
      <div className="text-sm text-gray-400">{title}</div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Carrefours Actifs"
        value={`${stats.activeCarrefours}/${stats.totalCarrefours}`}
        icon={<Activity className="w-5 h-5 text-green-400" />}
        color="bg-green-500/10"
        trend={`${stats.uptime.toFixed(1)}%`}
      />
      
      <StatCard
        title="Alertes Totales"
        value={stats.totalAlerts}
        icon={<AlertCircle className="w-5 h-5 text-red-400" />}
        color="bg-red-500/10"
      />
      
      <StatCard
        title="Tension Moyenne"
        value={`${stats.avgTension.toFixed(1)}V`}
        icon={<Zap className="w-5 h-5 text-yellow-400" />}
        color="bg-yellow-500/10"
      />
      
      <StatCard
        title="Pannes Totales"
        value={stats.totalPannes}
        icon={<AlertCircle className="w-5 h-5 text-orange-400" />}
        color="bg-orange-500/10"
      />

      <div className="col-span-2 lg:col-span-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3">État du Réseau</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{stats.activeCarrefours}</div>
              <div className="text-xs text-gray-400">Actifs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.warningCarrefours}</div>
              <div className="text-xs text-gray-400">Attention</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{stats.errorCarrefours}</div>
              <div className="text-xs text-gray-400">Erreur</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">{stats.offlineCarrefours}</div>
              <div className="text-xs text-gray-400">Hors ligne</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};