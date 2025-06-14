import React from 'react';
import { AlertTriangle, Clock, MapPin } from 'lucide-react';
import { CarrefourAlerts } from '../types/traffic';

interface AlertPanelProps {
  alerts: CarrefourAlerts[];
  isDarkMode?: boolean;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({ alerts, isDarkMode = true }) => {
  const getAllAlerts = () => {
    const allAlerts: Array<{
      carrefour_id: string;
      timestamp: string;
      alert: any;
    }> = [];

    alerts.forEach(carrefourAlert => {
      carrefourAlert.alertes.forEach(alert => {
        allAlerts.push({
          carrefour_id: carrefourAlert.carrefour_id,
          timestamp: carrefourAlert.timestamp,
          alert
        });
      });
    });

    return allAlerts.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  const getSeverityColor = (alertType: string) => {
    if (alertType.includes('PANNE') || alertType.includes('ERREUR')) {
      return 'text-red-400 bg-red-500/10 border-red-500/20';
    }
    if (alertType.includes('WARNING') || alertType.includes('ATTENTION')) {
      return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    }
    return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      time: date.toLocaleTimeString('fr-FR'),
      date: date.toLocaleDateString('fr-FR')
    };
  };

  const allAlerts = getAllAlerts();

  const containerClasses = isDarkMode 
    ? 'bg-gray-900 border-gray-700' 
    : 'bg-white border-gray-200 shadow-lg';

  const textClasses = isDarkMode ? 'text-white' : 'text-gray-900';
  const subtextClasses = isDarkMode ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className={`rounded-xl p-6 border transition-colors duration-300 ${containerClasses}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl font-semibold flex items-center ${textClasses}`}>
          <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
          Centre d'Alertes
        </h2>
        <div className={`text-sm ${subtextClasses}`}>
          {allAlerts.length} alerte{allAlerts.length > 1 ? 's' : ''} active{allAlerts.length > 1 ? 's' : ''}
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {allAlerts.length === 0 ? (
          <div className={`text-center py-8 ${subtextClasses}`}>
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucune alerte active</p>
          </div>
        ) : (
          allAlerts.map((item, idx) => {
            const timeInfo = formatTime(item.timestamp);
            return (
              <div key={idx} className={`border rounded-lg p-4 transition-all duration-200 hover:scale-[1.02] ${
                getSeverityColor(item.alert.type)
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="font-medium">{item.carrefour_id}</span>
                  </div>
                  <div className="text-xs opacity-75">
                    <div>{timeInfo.time}</div>
                    <div>{timeInfo.date}</div>
                  </div>
                </div>
                
                <div className="text-sm font-medium mb-1">
                  {item.alert.type}
                </div>
                
                <div className="text-xs opacity-75 space-y-1">
                  {item.alert.poteau && (
                    <div>Poteau: {item.alert.poteau}</div>
                  )}
                  {item.alert.couleur && (
                    <div>Couleur: {item.alert.couleur}</div>
                  )}
                  {item.alert.occurrences && (
                    <div>Occurrences: {item.alert.occurrences}</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};