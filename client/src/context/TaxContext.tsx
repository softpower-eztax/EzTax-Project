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
  resetToZero: () => void; // 모든 숫자 필드를 0으로 초기화하는 함수
  isLoading: boolean;
  formErrors?: Record<string, string[]>;
}

// Create the context with initial default values
const TaxContext = createContext<TaxContextState>({
  taxData: {
    taxYear: 2025, // Default to 2025
    status: 'in_progress',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  updateTaxData: () => {},
  saveTaxReturn: async () => {},
  recalculateTaxes: () => {},
  resetTaxReturn: () => {},
  resetToZero: () => {}, // 빈 함수 추가
  isLoading: false,
});

// Provider component that wraps the app
export const TaxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize tax data with test values for demonstration
  const [taxData, setTaxData] = useState<TaxData>({
    taxYear: 2025, // Default to 2025
    status: 'in_progress',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    personalInfo: {
      firstName: 'John',
      middleInitial: 'A',
      lastName: 'Smith',
      ssn: '123-45-6789',
      dateOfBirth: '1980-01-15',
      email: 'john.smith@example.com',
      phone: '123-456-7890',
      address1: '123 Main Street',
      address2: 'Apt 4B',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62704',
      filingStatus: 'married_joint',
      spouseInfo: {
        firstName: 'Jane',
        middleInitial: 'B',
        lastName: 'Smith',
        ssn: '987-65-4321',
        dateOfBirth: '1982-05-20'
      },
      dependents: [
        {
          firstName: 'Tommy',
          lastName: 'Smith',
          ssn: '111-22-3333',
          relationship: 'Son',
          dateOfBirth: '2010-03-12'
        }
      ]
    },
    income: {
      wages: 75000,
      otherEarnedIncome: 0,
      interestIncome: 1200,
      dividends: 3500,
      businessIncome: 15000,
      capitalGains: 5000,
      rentalIncome: 12000,
      retirementIncome: 0,
      unemploymentIncome: 0,
      otherIncome: 1500,
      totalIncome: 113200,
      adjustments: {
        studentLoanInterest: 2500,
        retirementContributions: 6000,
        healthSavingsAccount: 3500,
        otherAdjustments: 1000
      },
      adjustedGrossIncome: 100200,
      additionalIncomeItems: [],
      additionalAdjustmentItems: []
    },
    deductions: {
      useStandardDeduction: false,
      standardDeductionAmount: 27700,
      itemizedDeductions: {
        medicalExpenses: 5000,
        stateLocalIncomeTax: 7500,
        realEstateTaxes: 8000,
        mortgageInterest: 9500,
        charitableCash: 3000,
        charitableNonCash: 2000
      },
      totalDeductions: 35000
    },
    taxCredits: {
      childTaxCredit: 2000,
      childDependentCareCredit: 1000,
      educationCredits: 1500,
      retirementSavingsCredit: 500,
      otherCredits: 200,
      totalCredits: 5200
    },
    additionalTax: {
      selfEmploymentIncome: 15000,
      selfEmploymentTax: 2120,
      estimatedTaxPayments: 5000,
      otherIncome: 1500,
      otherTaxes: 800
    },
    // Initialize with empty calculated results that will be updated
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
            // Apply test data but preserve the ID if it exists
            const testData = { ...taxData, id: data.id, userId: data.userId };
            // Immediately recalculate taxes
            const calculatedResults = calculateTaxes(testData);
            setTaxData({
              ...testData,
              calculatedResults,
              updatedAt: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.error('Error loading tax data:', error);
        // If error loading from server, still initialize with calculated values
        const calculatedResults = calculateTaxes(taxData);
        setTaxData(prev => ({
          ...prev,
          calculatedResults,
          updatedAt: new Date().toISOString()
        }));
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
    
    toast({
      title: "Tax return reset",
      description: "Your tax return has been reset to default values.",
    });
  };

  // 폼 오류 상태 (필요한 경우 여기에 추가)
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

  // 모든 숫자 필드를 0으로 초기화하는 함수
  const resetToZero = () => {
    setTaxData(prevData => {
      const emptyIncome = {
        wages: 0,
        otherEarnedIncome: 0,
        interestIncome: 0,
        dividends: 0,
        businessIncome: 0,
        capitalGains: 0,
        rentalIncome: 0,
        retirementIncome: 0,
        unemploymentIncome: 0,
        otherIncome: 0,
        totalIncome: 0,
        additionalIncomeItems: [],
        adjustments: {
          studentLoanInterest: 0,
          retirementContributions: 0,
          healthSavingsAccount: 0,
          otherAdjustments: 0
        },
        adjustedGrossIncome: 0,
        additionalAdjustmentItems: []
      };

      const emptyDeductions = {
        useStandardDeduction: true,
        standardDeductionAmount: 12950, // Basic standard deduction
        itemizedDeductions: {
          medicalExpenses: 0,
          stateLocalIncomeTax: 0,
          realEstateTaxes: 0,
          mortgageInterest: 0,
          charitableCash: 0,
          charitableNonCash: 0
        },
        totalDeductions: 12950
      };

      const emptyTaxCredits = {
        childTaxCredit: 0,
        childDependentCareCredit: 0,
        educationCredits: 0,
        retirementSavingsCredit: 0,
        otherCredits: 0,
        totalCredits: 0
      };

      const emptyAdditionalTax = {
        selfEmploymentIncome: 0,
        selfEmploymentTax: 0,
        estimatedTaxPayments: 0,
        otherIncome: 0,
        otherTaxes: 0
      };

      const updatedData = {
        ...prevData,
        income: emptyIncome,
        deductions: emptyDeductions,
        taxCredits: emptyTaxCredits,
        additionalTax: emptyAdditionalTax,
        updatedAt: new Date().toISOString()
      };
      
      // 세금 재계산
      const calculatedResults = calculateTaxes(updatedData);
      updatedData.calculatedResults = calculatedResults;
      
      toast({
        title: "모든 값을 0으로 초기화했습니다",
        description: "테스트 데이터를 추가하기 전 모든 숫자 필드가 0으로 설정되었습니다.",
      });
      
      return updatedData;
    });
  };

  return (
    <TaxContext.Provider value={{ 
      taxData, 
      updateTaxData, 
      saveTaxReturn, 
      recalculateTaxes, 
      resetTaxReturn,
      resetToZero,
      isLoading,
      formErrors
    }}>
      {children}
    </TaxContext.Provider>
  );
};

// Custom hook to use the tax context
export const useTaxContext = () => useContext(TaxContext);
