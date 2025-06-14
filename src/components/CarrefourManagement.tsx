import React, { useState } from 'react';
import { Plus, MapPin, Save, X } from 'lucide-react';
import { CarrefourStatus } from '../types/traffic';

interface CarrefourManagementProps {
  carrefours: CarrefourStatus[];
  onAddCarrefour?: (carrefour: Omit<CarrefourStatus, 'status' | 'lastUpdate' | 'measures' | 'alerts'>) => void;
}

export const CarrefourManagement: React.FC<CarrefourManagementProps> = ({ carrefours, onAddCarrefour }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    location: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.id || !formData.name || !formData.location) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    // Vérifier si l'ID existe déjà
    if (carrefours.some(c => c.id === formData.id)) {
      alert('Un carrefour avec cet ID existe déjà');
      return;
    }

    onAddCarrefour?.(formData);
    
    // Réinitialiser le formulaire
    setFormData({ id: '', name: '', location: '' });
    setShowAddForm(false);
  };

  const handleCancel = () => {
    setFormData({ id: '', name: '', location: '' });
    setShowAddForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/10';
      case 'warning': return 'text-yellow-400 bg-yellow-500/10';
      case 'error': return 'text-red-400 bg-red-500/10';
      case 'offline': return 'text-gray-400 bg-gray-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'warning': return 'Attention';
      case 'error': return 'Erreur';
      case 'offline': return 'Hors ligne';
      default: return 'Inconnu';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Plus className="w-6 h-6 mr-3 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Gestion des Carrefours</h2>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un Carrefour
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl font-bold text-white">{carrefours.length}</div>
          <div className="text-sm text-gray-400">Total Carrefours</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl font-bold text-green-400">
            {carrefours.filter(c => c.status === 'active').length}
          </div>
          <div className="text-sm text-gray-400">Actifs</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl font-bold text-yellow-400">
            {carrefours.filter(c => c.status === 'warning').length}
          </div>
          <div className="text-sm text-gray-400">Attention</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl font-bold text-red-400">
            {carrefours.filter(c => c.status === 'error' || c.status === 'offline').length}
          </div>
          <div className="text-sm text-gray-400">Problèmes</div>
        </div>
      </div>

      {/* Liste des carrefours */}
      <div className="bg-gray-900 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Liste des Carrefours</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {carrefours.map((carrefour) => (
              <div key={carrefour.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-white">{carrefour.name}</h4>
                    <div className="flex items-center text-sm text-gray-400 mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {carrefour.location}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${getStatusColor(carrefour.status)}`}>
                    {getStatusLabel(carrefour.status)}
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 mb-3">
                  ID: {carrefour.id}
                </div>

                <div className="text-xs text-gray-400">
                  Dernière mise à jour: {new Date(carrefour.lastUpdate).toLocaleString('fr-FR')}
                </div>

                {carrefour.alerts && carrefour.alerts.length > 0 && (
                  <div className="mt-2 text-xs text-red-400">
                    {carrefour.alerts.length} alerte{carrefour.alerts.length > 1 ? 's' : ''} active{carrefour.alerts.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Ajouter un Nouveau Carrefour</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ID du Carrefour
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({...formData, id: e.target.value})}
                  placeholder="ex: CARREFOUR_007"
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom du Carrefour
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="ex: Place de la Bastille"
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Localisation
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="ex: Centre-ville"
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors duration-200"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Ajouter
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded transition-colors duration-200"
                >
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};