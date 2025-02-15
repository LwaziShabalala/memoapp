"use client";

import React, { createContext, useContext, useState } from 'react';

type LoadingContextType = {
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
};

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <LoadingContext.Provider value={{ isProcessing, setIsProcessing }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
