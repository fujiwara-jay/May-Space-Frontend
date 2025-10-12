import React, { createContext, useContext, useState } from 'react';

const UnitsContext = createContext();

export const useUnits = () => {
  const context = useContext(UnitsContext);
  if (!context) {
    throw new Error('useUnits must be used within a UnitsProvider');
  }
  return context;
};

export const UnitsProvider = ({ children }) => {
  const [postedUnits, setPostedUnits] = useState([]);

  const addUnit = (unit) => {
    setPostedUnits(prev => [...prev, unit]);
  };

  const updateUnit = (index, updatedUnit) => {
    setPostedUnits(prev => {
      const newUnits = [...prev];
      newUnits[index] = updatedUnit;
      return newUnits;
    });
  };

  const deleteUnit = (index) => {
    setPostedUnits(prev => prev.filter((_, i) => i !== index));
  };

  const value = {
    postedUnits,
    addUnit,
    updateUnit,
    deleteUnit
  };

  return (
    <UnitsContext.Provider value={value}>
      {children}
    </UnitsContext.Provider>
  );
};