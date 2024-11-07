import React, { createContext, useState } from 'react';

export const SavingContext = createContext();

export const SavingProvider = ({ children }) => {
  const [isSaving, setIsSaving] = useState(false);

  return (
    <SavingContext.Provider value={{ isSaving, setIsSaving }}>
      {children}
    </SavingContext.Provider>
  );
};