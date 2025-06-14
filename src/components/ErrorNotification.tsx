import { AlertTriangle } from 'lucide-react';

interface ErrorNotificationProps {
  message: string;
  isDarkMode: boolean;
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({ message, isDarkMode }) => {
  if (!message) return null;

  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg flex items-center space-x-2 ${
      isDarkMode ? 'bg-red-900/90 text-white' : 'bg-red-100 text-red-900'
    }`}>
      <AlertTriangle className="w-5 h-5" />
      <span>{message}</span>
    </div>
  );
};
