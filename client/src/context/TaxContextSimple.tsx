import React, { createContext, useContext, useState } from 'react';
import {
  PersonalInformation,
  Income,
  Deductions,
  TaxCredits,
  AdditionalTax,
  CalculatedResults,
  TaxReturn,
  FilingStatus,
  RetirementContributions
} from '@shared/schema';

// Define the structure of our tax data
export interface TaxData {
  id?: number;
  userId?: number;
  taxYear: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  personalInfo?: PersonalInformation;
  income?: Income;
  deductions?: Deductions;
  taxCredits?: TaxCredits;
  retirementContributions?: RetirementContributions;
  additionalTax?: AdditionalTax;
  calculatedResults?: CalculatedResults;
}

// Create a type for our context state
interface TaxContextState {
  taxData: TaxData;
  updateTaxData: (data: Partial<TaxData>) => void;
  saveTaxReturn: () => Promise<void>;
  recalculateTaxes: () => void;
  resetTaxReturn: () => void;
  resetToZero: () => void;
  isLoading: boolean;
  formErrors?: Record<string, string[]>;
}

// Create the context with initial default values
const TaxContext = createContext<TaxContextState>({
  taxData: {
    taxYear: 2025,
    status: 'in_progress',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  updateTaxData: () => {},
  saveTaxReturn: async () => {},
  recalculateTaxes: () => {},
  resetTaxReturn: () => {},
  resetToZero: () => {},
  isLoading: false,
});

// Provider component that wraps the app
export const TaxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const [taxData, setTaxData] = useState<TaxData>({
    taxYear: 2025,
    status: 'in_progress',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    calculatedResults: {
      totalIncome: 0,
      adjustments: 0,
      adjustedGrossIncome: 0,
      deductions: 0,
      taxableIncome: 0,
      federalTax: 0,
      credits: 0,
      taxDue: 0,
      payments: 0,
      refundAmount: 0,
      amountOwed: 0
    }
  });

  const updateTaxData = (data: Partial<TaxData>) => {
    setTaxData(prev => ({ ...prev, ...data }));
  };

  const saveTaxReturn = async () => {
    // Simplified save function
  };

  const recalculateTaxes = () => {
    // Simplified recalculation
  };

  const resetTaxReturn = () => {
    // Simplified reset
  };

  const resetToZero = () => {
    // Simplified reset to zero
  };

  return (
    <TaxContext.Provider
      value={{
        taxData,
        updateTaxData,
        saveTaxReturn,
        recalculateTaxes,
        resetTaxReturn,
        resetToZero,
        isLoading,
      }}
    >
      {children}
    </TaxContext.Provider>
  );
};

export const useTaxContext = () => {
  const context = useContext(TaxContext);
  if (context === undefined) {
    throw new Error('useTaxContext must be used within a TaxProvider');
  }
  return context;
};