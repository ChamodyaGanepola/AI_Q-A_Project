"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";

export type NotificationType = "success" | "error" | "info";

export interface NotificationItem {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextValue {
  notify: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback((message: string, type: NotificationType = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setNotifications((prev) => [...prev.slice(-4), { id, message, type }]);

    window.setTimeout(() => {
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    }, 3500);
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div
        className="fixed right-4 top-4 z-50 flex flex-col gap-2 max-w-[min(100vw-2rem,22rem)]"
        aria-live="polite"
        aria-relevant="additions"
      >
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`toast-enter flex items-start justify-between gap-3 min-w-[240px] rounded-xl border px-4 py-3 shadow-lg text-sm font-medium ${
              notification.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : notification.type === "error"
                  ? "bg-rose-50 border-rose-200 text-rose-900"
                  : "bg-teal-50 border-teal-200 text-teal-950"
            }`}
            role="status"
          >
            <span className="leading-snug">{notification.message}</span>
            <button
              type="button"
              onClick={() => dismiss(notification.id)}
              className="shrink-0 text-current/60 hover:text-current text-xs font-semibold px-1"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}
