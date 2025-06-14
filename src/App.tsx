import { useState, useEffect } from 'react';
import { TrafficCone as Traffic, Moon, Sun, Zap } from 'lucide-react';
import { useTrafficData } from './hooks/useTrafficData';
import { Navigation } from './components/Navigation';
import { CarrefourCard } from './components/CarrefourCard';
import { AlertPanel } from './components/AlertPanel';
import { StatsPanel } from './components/StatsPanel';
import { AlertsSection } from './components/AlertsSection';
import { MaintenanceSection } from './components/MaintenanceSection';
import { ConfigurationSection } from './components/ConfigurationSection';
import { GraphicsSection } from './components/GraphicsSection';
import { ReportsSection } from './components/ReportsSection';
import { CarrefourManagement } from './components/CarrefourManagement';
import configService from './services/configService';

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(configService.isDemoMode());
  const [isProductionMode, setIsProductionMode] = useState(configService.isProduction());

  // Surveiller les changements de mode
  useEffect(() => {
    const checkModeChanges = () => {
      const currentDemoMode = configService.isDemoMode();
      const currentProductionMode = configService.isProduction();
      
      if (currentDemoMode !== isDemoMode) {
        setIsDemoMode(currentDemoMode);
      }
      
      if (currentProductionMode !== isProductionMode) {
        setIsProductionMode(currentProductionMode);
      }
    };

    const interval = setInterval(checkModeChanges, 1000);
    return () => clearInterval(interval);
  }, [isDemoMode, isProductionMode]);

  const { carrefours, alerts, error, addCarrefour } = useTrafficData(isProductionMode);

  // Afficher les erreurs de communication avec l'API
  useEffect(() => {
    if (error && isProductionMode && !isDemoMode) {
      console.error('Erreur de communication avec l\'API en production:', error);
    }
  }, [error, isDemoMode, isProductionMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleDemoMode = () => {
    if (isProductionMode) {
      console.warn('Le mode démo n\'est pas disponible en production');
      alert('Le mode démo n\'est pas disponible en production');
      return;
    }
    
    const newDemoMode = !isDemoMode;
    configService.setDemoMode(newDemoMode);
    setIsDemoMode(newDemoMode);
    
    // Recharger la page pour appliquer les changements
    window.location.reload();
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'alerts':
        return <AlertsSection alerts={alerts} />;
      case 'maintenance':
        return <MaintenanceSection alerts={alerts} />;
      case 'configuration':
        return <ConfigurationSection carrefours={carrefours.map(c => ({ id: c.id, name: c.name }))} />;
      case 'graphics':
        return <GraphicsSection carrefours={carrefours} alerts={alerts} />;
      case 'reports':
        return <ReportsSection carrefours={carrefours} alerts={alerts} />;
      case 'management':
        return (
          <CarrefourManagement 
            carrefours={carrefours} 
            onAddCarrefour={isDemoMode ? addCarrefour : undefined} 
          />
        );
      default:
        return (
          <>
            {/* Error Display */}
            {error && isProductionMode && !isDemoMode && (
              <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-lg">
                <div className="flex items-center text-red-400">
                  <Traffic className="w-5 h-5 mr-2" />
                  <span className="font-medium">Erreur de connexion API</span>
                </div>
                <p className="text-red-300 text-sm mt-1">{error}</p>
                <p className="text-red-300 text-xs mt-2">
                  Vérifiez que le serveur API est démarré sur {configService.getApiUrl()}
                </p>
              </div>
            )}

            {/* Statistics Dashboard */}
            <section className="mb-8">
              <StatsPanel carrefours={carrefours} />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content - Carrefours */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className={`text-xl font-semibold flex items-center ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    <Traffic className="w-5 h-5 mr-2 text-blue-400" />
                    Carrefours ({carrefours.length})
                  </h2>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {isProductionMode ? 'Mode Production' : 'Mode Développement'} - 
                    {isDemoMode ? ' Données de Démo' : ' Données Réelles'} - 
                    Mise à jour automatique toutes les 5 secondes
                  </div>
                </div>
                
                {carrefours.length === 0 ? (
                  <div className="text-center py-12">
                    <Traffic className="w-16 h-16 mx-auto mb-4 text-gray-500 opacity-50" />
                    <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {isProductionMode && !isDemoMode && error 
                        ? 'Impossible de charger les données de production'
                        : 'Aucun carrefour disponible'
                      }
                    </p>
                    {isProductionMode && !isDemoMode && error && (
                      <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        Vérifiez la connexion au serveur API
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {carrefours.map((carrefour) => (
                      <CarrefourCard key={carrefour.id} carrefour={carrefour} isDarkMode={isDarkMode} />
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar - Alerts */}
              <div className="space-y-6">
                <AlertPanel 
                  alerts={alerts.map(alert => ({
                    timestamp: alert.timestamp,
                    carrefour_id: alert.carrefour_id,
                    alertes: [alert]
                  }))} 
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>
          </>
        );
    }
  };

  const themeClasses = isDarkMode 
    ? 'bg-gray-950 text-white' 
    : 'bg-gray-50 text-gray-900';

  const headerClasses = isDarkMode 
    ? 'bg-gray-900 border-gray-800' 
    : 'bg-white border-gray-200 shadow-sm';

  const footerClasses = isDarkMode 
    ? 'bg-gray-900 border-gray-800 text-gray-500' 
    : 'bg-white border-gray-200 text-gray-600';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses}`}>
      {/* Header */}
      <header className={`border-b px-6 py-4 transition-colors duration-300 ${headerClasses}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Traffic className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Supervision des Feux Tricolores
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Monitoring en temps réel des carrefours urbains
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Demo Mode Toggle - Seulement en développement */}
            {!isProductionMode && (
              <button
                onClick={toggleDemoMode}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
                  isDemoMode
                    ? 'bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20'
                    : 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {isDemoMode ? 'Mode Démo' : 'Mode Réel'}
                </span>
              </button>
            )}

            {/* Production Mode Indicator */}
            {isProductionMode && (
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">Production</span>
              </div>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg border transition-all duration-200 ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-yellow-400 hover:bg-gray-700'
                  : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="flex items-center space-x-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm">
                {isProductionMode && !isDemoMode && error ? 'Système Hors Ligne' : 'Système Actif'}
              </span>
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {new Date().toLocaleString('fr-FR')}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <Navigation 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
        isDarkMode={isDarkMode}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className={`border-t px-6 py-4 mt-12 transition-colors duration-300 ${footerClasses}`}>
        <div className="max-w-7xl mx-auto text-center text-sm">
          <p>© 2024 Système de Supervision des Feux Tricolores - Version 2.0</p>
          <p className="mt-1">
            Mode: {isProductionMode ? 'Production' : 'Développement'} | 
            Données: {isDemoMode ? 'Démonstration' : 'Réelles'} | 
            API: {configService.getApiUrl()}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;