import React from 'react';
import { TrafficLightMeasure } from '../types/traffic';

interface TrafficLightProps {
  measures: TrafficLightMeasure[];
  poteauNumber: 1 | 2;
  isDarkMode?: boolean;
}

export const TrafficLight: React.FC<TrafficLightProps> = ({ measures, poteauNumber, isDarkMode = true }) => {
  const poteauMeasures = measures.filter(m => m.poteau === poteauNumber);
  
  const getLightColor = (color: string, isActive: boolean) => {
    if (!isActive) return isDarkMode ? 'bg-gray-600' : 'bg-gray-300';
    
    switch (color) {
      case 'rouge': return 'bg-red-500 shadow-red-500/50';
      case 'jaune': return 'bg-yellow-500 shadow-yellow-500/50';
      case 'vert': return 'bg-green-500 shadow-green-500/50';
      default: return isDarkMode ? 'bg-gray-600' : 'bg-gray-300';
    }
  };

  const getActiveLights = () => {
    const activeLights = { rouge: false, jaune: false, vert: false };
    poteauMeasures.forEach(measure => {
      if (measure.etat) {
        activeLights[measure.Feu] = true;
      }
    });
    return activeLights;
  };

  const activeLights = getActiveLights();
  const hasIssues = poteauMeasures.some(m => !m.etat || m.pannes_consecutives > 0);

  const containerClasses = isDarkMode 
    ? 'bg-gray-800 border-gray-600' 
    : 'bg-gray-50 border-gray-300';

  const textClasses = isDarkMode ? 'text-gray-300' : 'text-gray-700';
  const subtextClasses = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const borderClasses = isDarkMode ? 'border-gray-700' : 'border-gray-300';

  return (
    <div className={`relative rounded-lg p-4 border-2 transition-all duration-300 ${containerClasses} ${
      hasIssues ? 'border-red-500' : ''
    }`}>
      <div className="text-center mb-3">
        <span className={`text-sm font-medium ${textClasses}`}>Poteau {poteauNumber}</span>
        {hasIssues && (
          <div className="text-xs text-red-400 mt-1">⚠ Défaillance détectée</div>
        )}
      </div>
      
      <div className="flex flex-col items-center space-y-3">
        <div className={`w-8 h-8 rounded-full border-2 transition-all duration-500 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-400'
        } ${getLightColor('rouge', activeLights.rouge)} ${activeLights.rouge ? 'shadow-lg' : ''}`} />
        
        <div className={`w-8 h-8 rounded-full border-2 transition-all duration-500 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-400'
        } ${getLightColor('jaune', activeLights.jaune)} ${activeLights.jaune ? 'shadow-lg' : ''}`} />
        
        <div className={`w-8 h-8 rounded-full border-2 transition-all duration-500 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-400'
        } ${getLightColor('vert', activeLights.vert)} ${activeLights.vert ? 'shadow-lg' : ''}`} />
      </div>

      <div className={`mt-3 text-xs space-y-1 ${subtextClasses}`}>
        {poteauMeasures.map((measure, idx) => (
          <div key={idx} className="flex justify-between">
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
              measure.etat ? getLightColor(measure.Feu, true).split(' ')[0] : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')
            }`} />
            <span>{measure.tension}V</span>
            <span>{measure.intensite}A</span>
          </div>
        ))}
      </div>
    </div>
  );
};