"use client";

import { createContext, useContext, useState, ReactNode } from "react";

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

  const notify = (message: string, type: NotificationType = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const notification = { id, message, type };

    setNotifications((prev) => [...prev, notification]);

    window.setTimeout(() => {
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    }, 3500);
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`min-w-[240px] rounded-2xl border px-4 py-3 shadow-lg text-sm font-medium transition duration-200 ${
              notification.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : notification.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-900"
                : "bg-sky-50 border-sky-200 text-sky-900"
            }`}
          >
            {notification.message}
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
