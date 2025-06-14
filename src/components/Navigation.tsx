import React from 'react';
import { Home, AlertTriangle, Settings, Wrench, BarChart3, Plus, FileText } from 'lucide-react';

interface NavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isDarkMode: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ activeSection, onSectionChange, isDarkMode }) => {
  const navItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: Home },
    { id: 'alerts', label: 'Alertes', icon: AlertTriangle },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'graphics', label: 'Graphiques', icon: BarChart3 },
    { id: 'reports', label: 'Rapports', icon: FileText },
    { id: 'management', label: 'Gestion Carrefours', icon: Plus },
    { id: 'configuration', label: 'Configuration', icon: Settings }
  ];

  const navClasses = isDarkMode 
    ? 'bg-gray-900 border-gray-700' 
    : 'bg-white border-gray-200 shadow-sm';

  return (
    <nav className={`border-b transition-colors duration-300 ${navClasses}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex space-x-8">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`flex items-center px-4 py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  isActive
                    ? 'border-blue-500 text-blue-400'
                    : isDarkMode
                    ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};