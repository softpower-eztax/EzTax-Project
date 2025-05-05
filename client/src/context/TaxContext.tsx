import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  PersonalInformation,
  Income,
  Deductions,
  TaxCredits,
  AdditionalTax,
  CalculatedResults,
  TaxReturn,
  FilingStatus
} from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { calculateTaxes } from '@/lib/taxCalculations';

// Define the structure of our tax data
interface TaxData {
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
  isLoading: boolean;
}

// Create the context with initial default values
const TaxContext = createContext<TaxContextState>({
  taxData: {
    taxYear: new Date().getFullYear() - 1, // Default to previous year
    status: 'in_progress',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  updateTaxData: () => {},
  saveTaxReturn: async () => {},
  recalculateTaxes: () => {},
  resetTaxReturn: () => {},
  isLoading: false,
});

// Provider component that wraps the app
export const TaxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize tax data with default values
  const [taxData, setTaxData] = useState<TaxData>({
    taxYear: new Date().getFullYear() - 1, // Default to previous year
    status: 'in_progress',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Initialize an empty structure for calculated results
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

  // Load tax data on initial render
  useEffect(() => {
    const loadTaxData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/tax-return');
        
        if (response.ok) {
          const data = await response.json();
          if (data) {
            setTaxData(data);
          }
        }
      } catch (error) {
        console.error('Error loading tax data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTaxData();
  }, []);

  // Update tax data and recalculate taxes
  const updateTaxData = (data: Partial<TaxData>) => {
    setTaxData(prevData => {
      const updatedData = {
        ...prevData,
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      // Recalculate tax results whenever data changes
      const calculatedResults = calculateTaxes(updatedData);
      updatedData.calculatedResults = calculatedResults;
      
      return updatedData;
    });
  };

  // Save tax return to the server
  const saveTaxReturn = async () => {
    try {
      setIsLoading(true);
      
      const method = taxData.id ? 'PUT' : 'POST';
      const url = taxData.id ? `/api/tax-return/${taxData.id}` : '/api/tax-return';
      
      const response = await apiRequest(method, url, {
        ...taxData,
        updatedAt: new Date().toISOString()
      });
      
      if (response.ok) {
        const updatedTaxReturn = await response.json();
        setTaxData(updatedTaxReturn);
      }
    } catch (error) {
      console.error('Error saving tax return:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to recalculate taxes
  const recalculateTaxes = () => {
    setTaxData(prevData => {
      const calculatedResults = calculateTaxes(prevData);
      return {
        ...prevData,
        calculatedResults,
        updatedAt: new Date().toISOString()
      };
    });
  };

  // Reset tax return to default values
  const resetTaxReturn = () => {
    setTaxData({
      taxYear: new Date().getFullYear() - 1,
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
    
    toast({
      title: "Tax return reset",
      description: "Your tax return has been reset to default values.",
    });
  };

  return (
    <TaxContext.Provider value={{ 
      taxData, 
      updateTaxData, 
      saveTaxReturn, 
      recalculateTaxes, 
      resetTaxReturn,
      isLoading 
    }}>
      {children}
    </TaxContext.Provider>
  );
};

// Custom hook to use the tax context
export const useTaxContext = () => useContext(TaxContext);
