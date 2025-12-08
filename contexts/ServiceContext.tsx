
import React, { createContext, useContext, useMemo } from 'react';
import type { IAIEngine, IStorageEngine, ISharingEngine } from '../core/interfaces';
import { GeminiAIEngine } from '../engines/GeminiAIEngine';
import { DexieStorageEngine } from '../engines/DexieStorageEngine';
import { UniversalShareEngine } from '../engines/UniversalShareEngine';

interface ServiceContextType {
  ai: IAIEngine;
  storage: IStorageEngine;
  share: ISharingEngine;
}

const ServiceContext = createContext<ServiceContextType | null>(null);

export const ServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Instantiate engines (Singleton scope for the app lifetime)
  const services = useMemo(() => ({
    ai: new GeminiAIEngine(),
    storage: new DexieStorageEngine(),
    share: new UniversalShareEngine(),
  }), []);

  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  );
};

export const useServices = () => {
  const ctx = useContext(ServiceContext);
  if (!ctx) throw new Error("useServices must be used within ServiceProvider");
  return ctx;
};
