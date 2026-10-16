import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

interface NotificationContextType {
  showNotification: (type: NotificationType, message: string) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = (type: NotificationType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, type, message }]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const showSuccess = (msg: string) => showNotification('success', msg);
  const showError = (msg: string) => showNotification('error', msg);
  const showInfo = (msg: string) => showNotification('info', msg);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification, showSuccess, showError, showInfo }}>
      {children}
      {/* Toast container */}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none"
        aria-live="polite"
      >
        {notifications.map((n) => {
          let bgStyle = 'bg-white border-brand text-slate-800';
          let IconComponent = Info;
          let iconColor = 'text-teal-700';

          if (n.type === 'success') {
            bgStyle = 'bg-emerald-50 border-emerald-200 text-emerald-950';
            IconComponent = CheckCircle2;
            iconColor = 'text-emerald-700';
          } else if (n.type === 'error') {
            bgStyle = 'bg-rose-50 border-rose-200 text-rose-950';
            IconComponent = AlertCircle;
            iconColor = 'text-rose-700';
          }

          return (
            <div
              key={n.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-sm transition-all ${bgStyle}`}
            >
              <IconComponent className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 text-sm font-medium leading-relaxed">{n.message}</div>
              <button
                type="button"
                onClick={() => removeNotification(n.id)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 rounded"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
