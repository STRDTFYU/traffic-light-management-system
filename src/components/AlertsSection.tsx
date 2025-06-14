import React, { useState, useEffect } from 'react';
import { AlertTriangle, Mail, Clock, MapPin, Filter, Shield, Zap, Battery, Thermometer } from 'lucide-react';
import { TrafficAlert } from '../types/traffic';
import { EmailService } from '../services/emailService';

interface AlertsSectionProps {
  alerts: TrafficAlert[];
}

export const AlertsSection: React.FC<AlertsSectionProps> = ({ alerts }) => {
  const [filteredAlerts, setFilteredAlerts] = useState<TrafficAlert[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [emailsSent, setEmailsSent] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Filtrer les alertes
    let filtered = alerts;
    if (filterType !== 'all') {
      filtered = alerts.filter(alert => alert.type === filterType);
    }
    setFilteredAlerts(filtered);

    // Envoyer des emails pour les nouvelles alertes
    alerts.forEach(async (alert) => {
      if (!emailsSent.has(alert.id)) {
        const details = `Poteau: ${alert.poteau || 'N/A'}, Couleur: ${alert.couleur || 'N/A'}`;
        const success = await EmailService.sendAlertNotification(
          alert.type,
          alert.carrefour_id,
          details
        );
        
        if (success) {
          setEmailsSent(prev => new Set([...prev, alert.id]));
        }
      }
    });
  }, [alerts, filterType, emailsSent]);

  const getSeverityColor = (alertType: string) => {
    if (alertType.includes('PANNE') || alertType.includes('ERREUR') || alertType === 'ALIMENTATION_COUPEE') {
      return 'bg-red-500/10 border-red-500/20 text-red-400';
    }
    if (alertType.includes('WARNING') || alertType.includes('ATTENTION') || 
        alertType === 'PORTE_OUVERTE' || alertType === 'BATTERIE_FAIBLE' || alertType === 'TEMPERATURE_ELEVEE') {
      return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
    }
    return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'PORTE_OUVERTE': return <Shield className="w-4 h-4" />;
      case 'ALIMENTATION_COUPEE': return <Zap className="w-4 h-4" />;
      case 'BATTERIE_FAIBLE': return <Battery className="w-4 h-4" />;
      case 'TEMPERATURE_ELEVEE': return <Thermometer className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getAlertLabel = (alertType: string) => {
    const labels: { [key: string]: string } = {
      'PORTE_OUVERTE': 'Porte Ouverte',
      'ALIMENTATION_COUPEE': 'Alimentation Coupée',
      'BATTERIE_FAIBLE': 'Batterie Faible',
      'TEMPERATURE_ELEVEE': 'Température Élevée',
      'PANNE_FEU': 'Panne de Feu',
      'TENSION_ANORMALE': 'Tension Anormale',
      'PANNE_INTERMITTENTE': 'Panne Intermittente',
      'SEQUENCE_BLOQUEE': 'Séquence Bloquée',
      'COMMUNICATION_PERDUE': 'Communication Perdue',
      'SURTENSION_DETECTEE': 'Surtension Détectée',
      'COURT_CIRCUIT': 'Court-Circuit'
    };
    return labels[alertType] || alertType.replace(/_/g, ' ');
  };

  const getUniqueAlertTypes = () => {
    const types = new Set(alerts.map(alert => alert.type));
    return Array.from(types);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('fr-FR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <AlertTriangle className="w-6 h-6 mr-3 text-red-400" />
          <h2 className="text-2xl font-bold text-white">Centre d'Alertes</h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-green-400">
            <Mail className="w-4 h-4 mr-2" />
            <span className="text-sm">Notifications automatiques activées</span>
          </div>
          <div className="text-sm text-gray-400">
            {filteredAlerts.length} alerte{filteredAlerts.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Statistiques des alertes ESP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-400">
                {alerts.filter(a => a.type === 'PORTE_OUVERTE').length}
              </div>
              <div className="text-sm text-gray-400">Portes Ouvertes</div>
            </div>
            <Shield className="w-6 h-6 text-red-400" />
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-400">
                {alerts.filter(a => a.type === 'ALIMENTATION_COUPEE').length}
              </div>
              <div className="text-sm text-gray-400">Alim. Coupées</div>
            </div>
            <Zap className="w-6 h-6 text-red-400" />
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-400">
                {alerts.filter(a => a.type === 'BATTERIE_FAIBLE').length}
              </div>
              <div className="text-sm text-gray-400">Batt. Faibles</div>
            </div>
            <Battery className="w-6 h-6 text-yellow-400" />
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-orange-400">
                {alerts.filter(a => a.type === 'TEMPERATURE_ELEVEE').length}
              </div>
              <div className="text-sm text-gray-400">Temp. Élevées</div>
            </div>
            <Thermometer className="w-6 h-6 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center space-x-4">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">Filtrer par type:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">Toutes les alertes</option>
            {getUniqueAlertTypes().map(type => (
              <option key={type} value={type}>{getAlertLabel(type)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste des alertes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredAlerts.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Aucune alerte trouvée</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`border rounded-lg p-4 transition-all duration-200 hover:scale-[1.02] ${getSeverityColor(alert.type)}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="font-medium">{alert.carrefour_id}</span>
                </div>
                <div className="flex items-center text-xs opacity-75">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatTime(alert.timestamp)}
                </div>
              </div>
              
              <div className="mb-3">
                <div className="font-semibold text-sm mb-1 flex items-center">
                  {getAlertIcon(alert.type)}
                  <span className="ml-2">{getAlertLabel(alert.type)}</span>
                </div>
                <div className="text-xs opacity-75 space-y-1">
                  {alert.poteau && <div>Poteau: {alert.poteau}</div>}
                  {alert.couleur && <div>Couleur: {alert.couleur}</div>}
                  {alert.occurrences && <div>Occurrences: {alert.occurrences}</div>}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                <div className="flex items-center text-xs">
                  {emailsSent.has(alert.id) ? (
                    <div className="flex items-center text-green-400">
                      <Mail className="w-3 h-3 mr-1" />
                      Email envoyé
                    </div>
                  ) : (
                    <div className="flex items-center text-yellow-400">
                      <Mail className="w-3 h-3 mr-1" />
                      En cours d'envoi...
                    </div>
                  )}
                </div>
                <div className={`px-2 py-1 rounded text-xs ${
                  alert.isProgrammed ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {alert.isProgrammed ? 'Programmée' : 'Non programmée'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};