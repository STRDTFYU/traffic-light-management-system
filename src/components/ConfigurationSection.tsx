import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, Zap } from 'lucide-react';
import { ESPConfiguration } from '../types/traffic';
import { ConfigService } from '../services/configService';

interface ConfigurationSectionProps {
  carrefours: Array<{ id: string; name: string }>;
}

export const ConfigurationSection: React.FC<ConfigurationSectionProps> = ({ carrefours }) => {
  const [config, setConfig] = useState<ESPConfiguration>(ConfigService.getConfiguration());
  const [selectedCarrefour, setSelectedCarrefour] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('');

  useEffect(() => {
    const saved = localStorage.getItem('last_config_save');
    if (saved) {
      setLastSaved(saved);
    }
  }, []);

  const handleConfigChange = (key: keyof ESPConfiguration, value: number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Sauvegarder la configuration localement
      ConfigService.saveConfiguration(config);
      
      // Envoyer la configuration aux ESP sélectionnés
      if (selectedCarrefour === 'all') {
        // Envoyer à tous les carrefours
        for (const carrefour of carrefours) {
          await ConfigService.sendConfigurationToESP(carrefour.id, config);
        }
      } else {
        // Envoyer à un carrefour spécifique
        await ConfigService.sendConfigurationToESP(selectedCarrefour, config);
      }
      
      const now = new Date().toLocaleString('fr-FR');
      setLastSaved(now);
      localStorage.setItem('last_config_save', now);
      
      alert('Configuration sauvegardée et envoyée avec succès !');
    } catch (error) {
      alert('Erreur lors de la sauvegarde de la configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    const defaultConfig: ESPConfiguration = {
      UMAX: 13.5,
      UWAX: 10.5,
      IMAX: 1.8,
      Ucc: 9.0,
      Icc: 2.0,
      SEUIL_PANNE_INTERMITTENTE: 5
    };
    setConfig(defaultConfig);
  };

  const configFields = [
    {
      key: 'UMAX' as keyof ESPConfiguration,
      label: 'Seuil de surtension (UMAX)',
      unit: 'V',
      description: 'Tension maximale autorisée avant déclenchement d\'alerte'
    },
    {
      key: 'UWAX' as keyof ESPConfiguration,
      label: 'Seuil minimal de tension (UWAX)',
      unit: 'V',
      description: 'Tension minimale de fonctionnement'
    },
    {
      key: 'IMAX' as keyof ESPConfiguration,
      label: 'Seuil de surintensité (IMAX)',
      unit: 'A',
      description: 'Intensité maximale autorisée'
    },
    {
      key: 'Ucc' as keyof ESPConfiguration,
      label: 'Seuil tension court-circuit (Ucc)',
      unit: 'V',
      description: 'Tension de détection de court-circuit'
    },
    {
      key: 'Icc' as keyof ESPConfiguration,
      label: 'Seuil courant court-circuit (Icc)',
      unit: 'A',
      description: 'Courant de détection de court-circuit'
    },
    {
      key: 'SEUIL_PANNE_INTERMITTENTE' as keyof ESPConfiguration,
      label: 'Seuil panne intermittente',
      unit: 'occurrences',
      description: 'Nombre d\'occurrences avant alerte de panne intermittente'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Settings className="w-6 h-6 mr-3 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Configuration ESP</h2>
        </div>
        <div className="text-sm text-gray-400">
          {lastSaved && `Dernière sauvegarde: ${lastSaved}`}
        </div>
      </div>

      {/* Sélection du carrefour */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Cible de Configuration</h3>
        <div className="flex items-center space-x-4">
          <label className="text-sm text-gray-400">Appliquer à:</label>
          <select
            value={selectedCarrefour}
            onChange={(e) => setSelectedCarrefour(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">Tous les carrefours</option>
            {carrefours.map(carrefour => (
              <option key={carrefour.id} value={carrefour.id}>
                {carrefour.name} ({carrefour.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Configuration des seuils */}
      <div className="bg-gray-900 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Paramètres de Seuil</h3>
            <button
              onClick={resetToDefaults}
              className="flex items-center px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Valeurs par défaut
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {configFields.map(field => (
              <div key={field.key} className="space-y-2">
                <label className="block text-sm font-medium text-white">
                  {field.label}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="0.1"
                    value={config[field.key]}
                    onChange={(e) => handleConfigChange(field.key, parseFloat(e.target.value))}
                    className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-sm text-gray-400 w-12">{field.unit}</span>
                </div>
                <p className="text-xs text-gray-500">{field.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Aperçu de la configuration JSON */}
      <div className="bg-gray-900 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-400" />
            Aperçu Configuration JSON
          </h3>
        </div>
        <div className="p-6">
          <pre className="bg-gray-800 rounded p-4 text-sm text-gray-300 overflow-x-auto">
            {JSON.stringify(config, null, 2)}
          </pre>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors duration-200"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder et Envoyer
            </>
          )}
        </button>
      </div>
    </div>
  );
};