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

  // Initialisation du mode démo
  useEffect(() => {
    const savedDemoMode = localStorage.getItem('demo_mode');
    if (savedDemoMode !== null) {
      setIsDemoMode(savedDemoMode === 'true');
    }
  }, []);

  const { carrefours, alerts, error, addCarrefour } = useTrafficData(configService.isProduction());

  // Afficher les erreurs de communication avec l'API
  useEffect(() => {
    if (error && !isDemoMode) {
      console.error('Erreur de communication avec l\'API:', error);
    }
  }, [error, isDemoMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleDemoMode = () => {
    if (configService.isProduction()) {
      console.warn('Le mode démo n\'est pas disponible en production');
      return;
    }
    const newDemoMode = !isDemoMode;
    localStorage.setItem('demo_mode', String(newDemoMode));
    setIsDemoMode(newDemoMode);
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
                    {isDemoMode ? 'Mode Démo - ' : 'Mode Production - '}
                    Mise à jour automatique toutes les 5 secondes
                  </div>
                </div>
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {carrefours.map((carrefour) => (
                    <CarrefourCard key={carrefour.id} carrefour={carrefour} isDarkMode={isDarkMode} />
                  ))}
                </div>
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
            {/* Demo Mode Toggle */}
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
                {isDemoMode ? 'Mode Démo' : 'Mode Prod'}
              </span>
            </button>

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
              <span className="text-sm">Système Actif</span>
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
        </div>
      </footer>
    </div>
  );
}

export default App;