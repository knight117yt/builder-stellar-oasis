import React, { createContext, useContext, useEffect, useState } from "react";

export interface PriceAlert {
  id: string;
  symbol: string;
  type: "above" | "below";
  targetPrice: number;
  currentPrice: number;
  isActive: boolean;
  isTriggered: boolean;
  createdAt: Date;
  triggeredAt?: Date;
  message?: string;
}

export interface LogicAlert {
  id: string;
  name: string;
  symbol: string;
  condition: string;
  description: string;
  isActive: boolean;
  isTriggered: boolean;
  createdAt: Date;
  triggeredAt?: Date;
  params: Record<string, any>;
}

export type AlertType = "price" | "logic" | "pattern";

interface AlertContextType {
  priceAlerts: PriceAlert[];
  logicAlerts: LogicAlert[];
  addPriceAlert: (
    alert: Omit<PriceAlert, "id" | "createdAt" | "isTriggered">,
  ) => void;
  addLogicAlert: (
    alert: Omit<LogicAlert, "id" | "createdAt" | "isTriggered">,
  ) => void;
  toggleAlert: (id: string, type: "price" | "logic") => void;
  removeAlert: (id: string, type: "price" | "logic") => void;
  checkAlerts: (marketData: Record<string, number>) => void;
  triggeredAlerts: (PriceAlert | LogicAlert)[];
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertProviderProps {
  children: React.ReactNode;
}

export function AlertProvider({ children }: AlertProviderProps) {
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(() => {
    const stored = localStorage.getItem("priceAlerts");
    return stored ? JSON.parse(stored) : [];
  });

  const [logicAlerts, setLogicAlerts] = useState<LogicAlert[]>(() => {
    const stored = localStorage.getItem("logicAlerts");
    return stored ? JSON.parse(stored) : [];
  });

  const [triggeredAlerts, setTriggeredAlerts] = useState<
    (PriceAlert | LogicAlert)[]
  >([]);

  // Persist alerts to localStorage
  useEffect(() => {
    localStorage.setItem("priceAlerts", JSON.stringify(priceAlerts));
  }, [priceAlerts]);

  useEffect(() => {
    localStorage.setItem("logicAlerts", JSON.stringify(logicAlerts));
  }, [logicAlerts]);

  const addPriceAlert = (
    alertData: Omit<PriceAlert, "id" | "createdAt" | "isTriggered">,
  ) => {
    const newAlert: PriceAlert = {
      ...alertData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      isTriggered: false,
    };
    setPriceAlerts((prev) => [...prev, newAlert]);
  };

  const addLogicAlert = (
    alertData: Omit<LogicAlert, "id" | "createdAt" | "isTriggered">,
  ) => {
    const newAlert: LogicAlert = {
      ...alertData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      isTriggered: false,
    };
    setLogicAlerts((prev) => [...prev, newAlert]);
  };

  const toggleAlert = (id: string, type: "price" | "logic") => {
    if (type === "price") {
      setPriceAlerts((prev) =>
        prev.map((alert) =>
          alert.id === id ? { ...alert, isActive: !alert.isActive } : alert,
        ),
      );
    } else {
      setLogicAlerts((prev) =>
        prev.map((alert) =>
          alert.id === id ? { ...alert, isActive: !alert.isActive } : alert,
        ),
      );
    }
  };

  const removeAlert = (id: string, type: "price" | "logic") => {
    if (type === "price") {
      setPriceAlerts((prev) => prev.filter((alert) => alert.id !== id));
    } else {
      setLogicAlerts((prev) => prev.filter((alert) => alert.id !== id));
    }
  };

  const checkAlerts = (marketData: Record<string, number>) => {
    const triggered: (PriceAlert | LogicAlert)[] = [];

    // Check price alerts
    setPriceAlerts((prev) =>
      prev.map((alert) => {
        if (!alert.isActive || alert.isTriggered) return alert;

        const currentPrice = marketData[alert.symbol];
        if (!currentPrice) return alert;

        const shouldTrigger =
          (alert.type === "above" && currentPrice >= alert.targetPrice) ||
          (alert.type === "below" && currentPrice <= alert.targetPrice);

        if (shouldTrigger) {
          const triggeredAlert = {
            ...alert,
            isTriggered: true,
            triggeredAt: new Date(),
            currentPrice,
          };
          triggered.push(triggeredAlert);
          return triggeredAlert;
        }

        return { ...alert, currentPrice };
      }),
    );

    // Check logic alerts (simplified for demo)
    setLogicAlerts((prev) =>
      prev.map((alert) => {
        if (!alert.isActive || alert.isTriggered) return alert;

        // Simple logic evaluation (in real app, this would be more sophisticated)
        let shouldTrigger = false;

        if (alert.condition === "rsi_oversold") {
          // Mock RSI check
          shouldTrigger = Math.random() > 0.95; // 5% chance of triggering
        } else if (alert.condition === "volume_spike") {
          // Mock volume spike check
          shouldTrigger = Math.random() > 0.98; // 2% chance of triggering
        }

        if (shouldTrigger) {
          const triggeredAlert = {
            ...alert,
            isTriggered: true,
            triggeredAt: new Date(),
          };
          triggered.push(triggeredAlert);
          return triggeredAlert;
        }

        return alert;
      }),
    );

    if (triggered.length > 0) {
      setTriggeredAlerts((prev) => [...prev, ...triggered]);

      // Show browser notification if permission granted
      if (Notification.permission === "granted") {
        triggered.forEach((alert) => {
          new Notification("Trading Alert", {
            body: `Alert triggered: ${alert.name || "Price Alert"}`,
            icon: "/favicon.ico",
          });
        });
      }
    }
  };

  return (
    <AlertContext.Provider
      value={{
        priceAlerts,
        logicAlerts,
        addPriceAlert,
        addLogicAlert,
        toggleAlert,
        removeAlert,
        checkAlerts,
        triggeredAlerts,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error("useAlerts must be used within an AlertProvider");
  }
  return context;
}
