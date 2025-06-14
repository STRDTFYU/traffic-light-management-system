import React from 'react';
import { MapPin, Clock, AlertTriangle, CheckCircle, XCircle, Shield, Zap, Battery, Thermometer } from 'lucide-react';
import { CarrefourStatus } from '../types/traffic';
import { TrafficLight } from './TrafficLight';

interface CarrefourCardProps {
  carrefour: CarrefourStatus;
  isDarkMode?: boolean;
}

export const CarrefourCard: React.FC<CarrefourCardProps> = ({ carrefour, isDarkMode = true }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'warning': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'error': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'offline': return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      case 'offline': return <XCircle className="w-4 h-4" />;
      default: return <XCircle className="w-4 h-4" />;
    }
  };

  const getPorteColor = (porte: 'ouverte' | 'fermee') => {
    return porte === 'ouverte' 
      ? 'text-red-400 bg-red-500/10' 
      : 'text-green-400 bg-green-500/10';
  };

  const getAlimentationColor = (alimentation: 'normale' | 'coupee') => {
    return alimentation === 'coupee' 
      ? 'text-red-400 bg-red-500/10' 
      : 'text-green-400 bg-green-500/10';
  };

  const getBatterieColor = (niveau: number) => {
    if (niveau > 60) return 'text-green-400';
    if (niveau > 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR');
  };

  const cardClasses = isDarkMode 
    ? 'bg-gray-900 border-gray-700 hover:border-gray-600' 
    : 'bg-white border-gray-200 hover:border-gray-300 shadow-lg';

  const textClasses = isDarkMode ? 'text-white' : 'text-gray-900';
  const subtextClasses = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const borderClasses = isDarkMode ? 'border-gray-700' : 'border-gray-200';

  return (
    <div className={`rounded-xl p-6 border transition-all duration-300 shadow-lg ${cardClasses}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={`text-xl font-semibold mb-1 ${textClasses}`}>{carrefour.name}</h3>
          <div className={`flex items-center text-sm ${subtextClasses}`}>
            <MapPin className="w-4 h-4 mr-1" />
            {carrefour.location}
          </div>
        </div>
        <div className={`flex items-center px-3 py-1 rounded-full border text-sm font-medium ${
          getStatusColor(carrefour.status)
        }`}>
          {getStatusIcon(carrefour.status)}
          <span className="ml-1 capitalize">{carrefour.status}</span>
        </div>
      </div>

      {/* État ESP */}
      {carrefour.measures?.esp_status && (
        <div className="mb-4">
          <div className={`text-sm font-medium mb-2 ${textClasses}`}>État ESP</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`flex items-center px-2 py-1 rounded ${getPorteColor(carrefour.measures.esp_status.porte)}`}>
              <Shield className="w-3 h-3 mr-1" />
              Porte: {carrefour.measures.esp_status.porte}
            </div>
            <div className={`flex items-center px-2 py-1 rounded ${getAlimentationColor(carrefour.measures.esp_status.alimentation)}`}>
              <Zap className="w-3 h-3 mr-1" />
              Alim: {carrefour.measures.esp_status.alimentation}
            </div>
            {carrefour.measures.esp_status.batterie_niveau && (
              <div className={`flex items-center px-2 py-1 rounded bg-gray-500/10 ${getBatterieColor(carrefour.measures.esp_status.batterie_niveau)}`}>
                <Battery className="w-3 h-3 mr-1" />
                Batt: {carrefour.measures.esp_status.batterie_niveau}%
              </div>
            )}
            {carrefour.measures.esp_status.temperature && (
              <div className={`flex items-center px-2 py-1 rounded bg-gray-500/10 ${
                carrefour.measures.esp_status.temperature > 40 ? 'text-red-400' : 'text-blue-400'
              }`}>
                <Thermometer className="w-3 h-3 mr-1" />
                {carrefour.measures.esp_status.temperature.toFixed(1)}°C
              </div>
            )}
          </div>
        </div>
      )}

      {carrefour.measures && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <span className={`text-sm ${subtextClasses}`}>État des Feux</span>
            <div className={`text-xs ${subtextClasses}`}>
              Cycle: {carrefour.measures.cycle_courant} | Étape: {carrefour.measures.position_sequence}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <TrafficLight measures={carrefour.measures.mesures} poteauNumber={1} isDarkMode={isDarkMode} />
            <TrafficLight measures={carrefour.measures.mesures} poteauNumber={2} isDarkMode={isDarkMode} />
          </div>
        </div>
      )}

      {carrefour.alerts && carrefour.alerts.length > 0 && (
        <div className="mb-4">
          <div className="text-sm text-red-400 mb-2 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-1" />
            Alertes Actives
          </div>
          <div className="space-y-1">
            {carrefour.alerts.slice(0, 3).map((alert, idx) => (
              <div key={idx} className="text-xs bg-red-500/10 text-red-300 px-2 py-1 rounded border border-red-500/20">
                {alert.type.replace(/_/g, ' ')} {alert.poteau ? `- Poteau ${alert.poteau}` : ''} {alert.couleur ? `- ${alert.couleur}` : ''}
              </div>
            ))}
            {carrefour.alerts.length > 3 && (
              <div className="text-xs text-gray-400 px-2 py-1">
                +{carrefour.alerts.length - 3} autre{carrefour.alerts.length - 3 > 1 ? 's' : ''} alerte{carrefour.alerts.length - 3 > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      )}

      <div className={`flex items-center justify-between text-xs pt-3 border-t ${borderClasses} ${subtextClasses}`}>
        <div className="flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          Dernière mise à jour: {formatTime(carrefour.lastUpdate)}
        </div>
        <div className="text-right">
          ID: {carrefour.id}
        </div>
      </div>
    </div>
  );
};