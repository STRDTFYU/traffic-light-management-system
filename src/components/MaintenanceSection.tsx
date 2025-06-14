import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Calendar, User, Mail, AlertTriangle } from 'lucide-react';
import { MaintenanceTask, TrafficAlert } from '../types/traffic';
import { EmailService } from '../services/emailService';

interface MaintenanceSectionProps {
  alerts: TrafficAlert[];
}

export const MaintenanceSection: React.FC<MaintenanceSectionProps> = ({ alerts }) => {
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<string>('');
  const [formData, setFormData] = useState({
    carrefourName: '',
    poteauNumber: 1,
    couleurFeu: 'vert' as 'vert' | 'jaune' | 'rouge',
    dateMaintenance: '',
    chefMaintenanceNom: '',
    chefMaintenanceEmail: ''
  });

  // Charger les tâches de maintenance depuis le localStorage
  useEffect(() => {
    const saved = localStorage.getItem('maintenance_tasks');
    if (saved) {
      setMaintenanceTasks(JSON.parse(saved));
    }
  }, []);

  // Sauvegarder les tâches de maintenance
  const saveTasks = (tasks: MaintenanceTask[]) => {
    setMaintenanceTasks(tasks);
    localStorage.setItem('maintenance_tasks', JSON.stringify(tasks));
  };

  const getUnprogrammedAlerts = () => {
    return alerts.filter(alert => !alert.isProgrammed);
  };

  const getStatusColor = (status: MaintenanceTask['status']) => {
    switch (status) {
      case 'en_attente': return 'bg-green-500/10 border-green-500/20 text-green-400';
      case 'en_cours': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
      case 'termine': return 'bg-red-500/10 border-red-500/20 text-red-400';
    }
  };

  const getStatusLabel = (status: MaintenanceTask['status']) => {
    switch (status) {
      case 'en_attente': return 'En Attente';
      case 'en_cours': return 'En Cours';
      case 'termine': return 'Terminé';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAlert) {
      alert('Veuillez sélectionner une alerte');
      return;
    }

    const newTask: MaintenanceTask = {
      id: `MAINT_${Date.now()}`,
      alertId: selectedAlert,
      ...formData,
      status: 'en_attente',
      dateCreation: new Date().toISOString()
    };

    // Ajouter la tâche
    const updatedTasks = [...maintenanceTasks, newTask];
    saveTasks(updatedTasks);

    // Marquer l'alerte comme programmée
    const alertToUpdate = alerts.find(a => a.id === selectedAlert);
    if (alertToUpdate) {
      alertToUpdate.isProgrammed = true;
    }

    // Envoyer l'email au chef d'équipe
    const details = `Poteau ${formData.poteauNumber}, Feu ${formData.couleurFeu}`;
    await EmailService.sendMaintenanceNotification(
      formData.chefMaintenanceEmail,
      formData.chefMaintenanceNom,
      formData.carrefourName,
      formData.dateMaintenance,
      details
    );

    // Réinitialiser le formulaire
    setFormData({
      carrefourName: '',
      poteauNumber: 1,
      couleurFeu: 'vert',
      dateMaintenance: '',
      chefMaintenanceNom: '',
      chefMaintenanceEmail: ''
    });
    setSelectedAlert('');
    setShowProgramForm(false);
  };

  const updateTaskStatus = (taskId: string, newStatus: MaintenanceTask['status']) => {
    const updatedTasks = maintenanceTasks.map(task =>
      task.id === taskId
        ? { ...task, status: newStatus, dateModification: new Date().toISOString() }
        : task
    );
    saveTasks(updatedTasks);
  };

  const getTasksByStatus = (status: MaintenanceTask['status']) => {
    return maintenanceTasks.filter(task => task.status === status);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Wrench className="w-6 h-6 mr-3 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Gestion de Maintenance</h2>
        </div>
        <button
          onClick={() => setShowProgramForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Programmer
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-400">{getTasksByStatus('en_attente').length}</div>
              <div className="text-sm text-gray-400">En Attente</div>
            </div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-400">{getTasksByStatus('en_cours').length}</div>
              <div className="text-sm text-gray-400">En Cours</div>
            </div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-400">{getTasksByStatus('termine').length}</div>
              <div className="text-sm text-gray-400">Terminé</div>
            </div>
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Liste des tâches de maintenance */}
      <div className="bg-gray-900 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Tâches de Maintenance</h3>
        </div>
        <div className="p-6">
          {maintenanceTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucune tâche de maintenance programmée</p>
            </div>
          ) : (
            <div className="space-y-4">
              {maintenanceTasks.map((task) => (
                <div key={task.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-white">{task.carrefourName}</h4>
                      <div className="text-sm text-gray-400">
                        Poteau {task.poteauNumber} - Feu {task.couleurFeu}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full border text-sm ${getStatusColor(task.status)}`}>
                      {getStatusLabel(task.status)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-400 mb-3">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(task.dateMaintenance).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      {task.chefMaintenanceNom}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-xs text-gray-500">
                      <Mail className="w-3 h-3 mr-1" />
                      {task.chefMaintenanceEmail}
                    </div>
                    <div className="flex space-x-2">
                      {task.status === 'en_attente' && (
                        <button
                          onClick={() => updateTaskStatus(task.id, 'en_cours')}
                          className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded transition-colors"
                        >
                          Démarrer
                        </button>
                      )}
                      {task.status === 'en_cours' && (
                        <button
                          onClick={() => updateTaskStatus(task.id, 'termine')}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                        >
                          Terminer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Formulaire de programmation */}
      {showProgramForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Programmer une Maintenance</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sélectionner une alerte
                </label>
                <select
                  value={selectedAlert}
                  onChange={(e) => setSelectedAlert(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Choisir une alerte...</option>
                  {getUnprogrammedAlerts().map((alert) => (
                    <option key={alert.id} value={alert.id}>
                      {alert.carrefour_id} - {alert.type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom du carrefour
                </label>
                <input
                  type="text"
                  value={formData.carrefourName}
                  onChange={(e) => setFormData({...formData, carrefourName: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Numéro de poteau
                  </label>
                  <select
                    value={formData.poteauNumber}
                    onChange={(e) => setFormData({...formData, poteauNumber: parseInt(e.target.value)})}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={1}>Poteau 1</option>
                    <option value={2}>Poteau 2</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Couleur du feu
                  </label>
                  <select
                    value={formData.couleurFeu}
                    onChange={(e) => setFormData({...formData, couleurFeu: e.target.value as 'vert' | 'jaune' | 'rouge'})}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="vert">Vert</option>
                    <option value="jaune">Jaune</option>
                    <option value="rouge">Rouge</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date de maintenance
                </label>
                <input
                  type="datetime-local"
                  value={formData.dateMaintenance}
                  onChange={(e) => setFormData({...formData, dateMaintenance: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom du chef de maintenance
                </label>
                <input
                  type="text"
                  value={formData.chefMaintenanceNom}
                  onChange={(e) => setFormData({...formData, chefMaintenanceNom: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email du chef de maintenance
                </label>
                <input
                  type="email"
                  value={formData.chefMaintenanceEmail}
                  onChange={(e) => setFormData({...formData, chefMaintenanceEmail: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors duration-200"
                >
                  Programmer
                </button>
                <button
                  type="button"
                  onClick={() => setShowProgramForm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded transition-colors duration-200"
                >
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