import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Filter, BarChart3, FileSpreadsheet, FileImage } from 'lucide-react';
import { CarrefourStatus, TrafficAlert, MaintenanceTask, ReportFilters, ReportData } from '../types/traffic';
import { ReportService } from '../services/reportService';

interface ReportsSectionProps {
  carrefours: CarrefourStatus[];
  alerts: TrafficAlert[];
}

export const ReportsSection: React.FC<ReportsSectionProps> = ({ carrefours, alerts }) => {
  const [filters, setFilters] = useState<ReportFilters>({
    dateDebut: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 jours avant
    dateFin: new Date().toISOString().split('T')[0],
    carrefourIds: [],
    typeAlertes: [],
    statusCarrefours: [],
    includeESPStatus: true,
    includeMaintenance: true,
    includeStatistiques: true
  });

  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<ReportData | null>(null);

  // Charger les tâches de maintenance
  useEffect(() => {
    const saved = localStorage.getItem('maintenance_tasks');
    if (saved) {
      setMaintenanceTasks(JSON.parse(saved));
    }
  }, []);

  const handleFilterChange = (key: keyof ReportFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const generateReportData = (): ReportData => {
    // Filtrer les carrefours
    let filteredCarrefours = carrefours;
    if (filters.carrefourIds.length > 0) {
      filteredCarrefours = carrefours.filter(c => filters.carrefourIds.includes(c.id));
    }
    if (filters.statusCarrefours.length > 0) {
      filteredCarrefours = filteredCarrefours.filter(c => filters.statusCarrefours.includes(c.status));
    }

    // Filtrer les alertes
    let filteredAlerts = alerts;
    if (filters.typeAlertes.length > 0) {
      filteredAlerts = alerts.filter(a => filters.typeAlertes.includes(a.type));
    }

    // Filtrer par date
    const dateDebut = new Date(filters.dateDebut);
    const dateFin = new Date(filters.dateFin);
    dateFin.setHours(23, 59, 59, 999); // Fin de journée

    filteredAlerts = filteredAlerts.filter(a => {
      const alertDate = new Date(a.timestamp);
      return alertDate >= dateDebut && alertDate <= dateFin;
    });

    // Filtrer les tâches de maintenance
    let filteredMaintenance = maintenanceTasks;
    if (filters.carrefourIds.length > 0) {
      filteredMaintenance = maintenanceTasks.filter(t => 
        filters.carrefourIds.some(id => t.carrefourName.includes(id))
      );
    }

    return {
      carrefours: filteredCarrefours,
      alerts: filteredAlerts,
      maintenanceTasks: filteredMaintenance,
      dateGeneration: new Date().toISOString(),
      periode: {
        debut: filters.dateDebut,
        fin: filters.dateFin
      }
    };
  };

  const generatePreview = () => {
    const data = generateReportData();
    setPreviewData(data);
  };

  const handleGenerateReport = async (format: 'pdf' | 'word' | 'csv') => {
    setIsGenerating(true);
    
    try {
      const data = generateReportData();
      
      switch (format) {
        case 'pdf':
          await ReportService.generatePDFReport(data, filters);
          break;
        case 'word':
          await ReportService.generateWordReport(data, filters);
          break;
        case 'csv':
          ReportService.generateCSVReport(data, filters);
          break;
      }
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      alert('Erreur lors de la génération du rapport');
    } finally {
      setIsGenerating(false);
    }
  };

  const getUniqueAlertTypes = () => {
    const types = new Set(alerts.map(alert => alert.type));
    return Array.from(types);
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

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'active': 'Actif',
      'warning': 'Attention',
      'error': 'Erreur',
      'offline': 'Hors ligne'
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FileText className="w-6 h-6 mr-3 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Génération de Rapports</h2>
        </div>
        <div className="text-sm text-gray-400">
          Exportation en PDF, Word et CSV
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-gray-900 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center">
            <Filter className="w-5 h-5 mr-2 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Filtres de Rapport</h3>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Période */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date de début
              </label>
              <input
                type="date"
                value={filters.dateDebut}
                onChange={(e) => handleFilterChange('dateDebut', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date de fin
              </label>
              <input
                type="date"
                value={filters.dateFin}
                onChange={(e) => handleFilterChange('dateFin', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Sélection des carrefours */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Carrefours (laisser vide pour tous)
            </label>
            <select
              multiple
              value={filters.carrefourIds}
              onChange={(e) => handleFilterChange('carrefourIds', Array.from(e.target.selectedOptions, option => option.value))}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 h-32"
            >
              {carrefours.map(carrefour => (
                <option key={carrefour.id} value={carrefour.id}>
                  {carrefour.name} ({carrefour.location})
                </option>
              ))}
            </select>
          </div>

          {/* Types d'alertes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Types d'alertes (laisser vide pour tous)
            </label>
            <select
              multiple
              value={filters.typeAlertes}
              onChange={(e) => handleFilterChange('typeAlertes', Array.from(e.target.selectedOptions, option => option.value))}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 h-32"
            >
              {getUniqueAlertTypes().map(type => (
                <option key={type} value={type}>
                  {getAlertLabel(type)}
                </option>
              ))}
            </select>
          </div>

          {/* Statuts des carrefours */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Statuts des carrefours (laisser vide pour tous)
            </label>
            <select
              multiple
              value={filters.statusCarrefours}
              onChange={(e) => handleFilterChange('statusCarrefours', Array.from(e.target.selectedOptions, option => option.value))}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="active">Actif</option>
              <option value="warning">Attention</option>
              <option value="error">Erreur</option>
              <option value="offline">Hors ligne</option>
            </select>
          </div>

          {/* Options d'inclusion */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-300">Sections à inclure</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.includeStatistiques}
                  onChange={(e) => handleFilterChange('includeStatistiques', e.target.checked)}
                  className="mr-2 rounded bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-300">Statistiques générales</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.includeESPStatus}
                  onChange={(e) => handleFilterChange('includeESPStatus', e.target.checked)}
                  className="mr-2 rounded bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-300">État des ESP (porte, alimentation)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.includeMaintenance}
                  onChange={(e) => handleFilterChange('includeMaintenance', e.target.checked)}
                  className="mr-2 rounded bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-300">Tâches de maintenance</span>
              </label>
            </div>
          </div>

          {/* Bouton de prévisualisation */}
          <div className="flex justify-center">
            <button
              onClick={generatePreview}
              className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Prévisualiser les données
            </button>
          </div>
        </div>
      </div>

      {/* Prévisualisation */}
      {previewData && (
        <div className="bg-gray-900 rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Aperçu du Rapport</h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-400">{previewData.carrefours.length}</div>
                <div className="text-sm text-gray-400">Carrefours</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-400">{previewData.alerts.length}</div>
                <div className="text-sm text-gray-400">Alertes</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-400">{previewData.maintenanceTasks.length}</div>
                <div className="text-sm text-gray-400">Maintenances</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">
                  {previewData.carrefours.filter(c => c.status === 'active').length}
                </div>
                <div className="text-sm text-gray-400">Actifs</div>
              </div>
            </div>

            {/* Détails par carrefour */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300">Carrefours inclus:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {previewData.carrefours.map(c => (
                  <div key={c.id} className="bg-gray-800 rounded px-3 py-2 text-sm">
                    <div className="text-white font-medium">{c.name}</div>
                    <div className="text-gray-400">{getStatusLabel(c.status)} - {c.alerts?.length || 0} alertes</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Boutons de génération */}
      <div className="bg-gray-900 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Générer le Rapport</h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleGenerateReport('pdf')}
              disabled={isGenerating}
              className="flex items-center justify-center px-6 py-4 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-lg transition-colors duration-200"
            >
              <FileImage className="w-5 h-5 mr-2" />
              {isGenerating ? 'Génération...' : 'Télécharger PDF'}
            </button>
            
            <button
              onClick={() => handleGenerateReport('word')}
              disabled={isGenerating}
              className="flex items-center justify-center px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors duration-200"
            >
              <FileText className="w-5 h-5 mr-2" />
              {isGenerating ? 'Génération...' : 'Télécharger Word'}
            </button>
            
            <button
              onClick={() => handleGenerateReport('csv')}
              disabled={isGenerating}
              className="flex items-center justify-center px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg transition-colors duration-200"
            >
              <FileSpreadsheet className="w-5 h-5 mr-2" />
              {isGenerating ? 'Génération...' : 'Télécharger CSV'}
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-400 text-center">
            Les rapports incluront toutes les données filtrées selon vos critères
          </div>
        </div>
      </div>
    </div>
  );
};