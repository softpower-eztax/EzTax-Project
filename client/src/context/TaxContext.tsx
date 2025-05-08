import React, { createContext, useContext, useState, useEffect } from 'react';
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
      isDisabled: false,
      isNonresidentAlien: false,
      spouseInfo: {
        firstName: 'Jane',
        middleInitial: 'B',
        lastName: 'Smith',
        ssn: '987-65-4321',
        dateOfBirth: '1982-05-20',
        isDisabled: false,
        isNonresidentAlien: false
      },
      dependents: [
        {
          firstName: 'Tommy',
          lastName: 'Smith',
          ssn: '111-22-3333',
          relationship: 'Son',
          dateOfBirth: '2010-03-12',
          isDisabled: false,
          isNonresidentAlien: false,
          isQualifyingChild: true
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
        otherAdjustments: 4500 // HSA 값 3500을 otherAdjustments에 추가
      },
      adjustedGrossIncome: 100200,
      additionalIncomeItems: [],
      additionalAdjustmentItems: []
    },
    deductions: {
      useStandardDeduction: true,
      standardDeductionAmount: 12950, // 기본 표준공제액, filingStatus에 따라 계산됨
      itemizedDeductions: {
        medicalExpenses: 0,
        stateLocalIncomeTax: 0,
        realEstateTaxes: 0,
        mortgageInterest: 0,
        charitableCash: 0,
        charitableNonCash: 0
      },
      totalDeductions: 12950
    },
    taxCredits: {
      childTaxCredit: 2000,
      childDependentCareCredit: 1000,
      educationCredits: 1500,
      aotcCredit: 1000,
      llcCredit: 500,
      retirementSavingsCredit: 500,
      retirementContributions: {
        traditionalIRA: 0,
        rothIRA: 0,
        plan401k: 0,
        plan403b: 0,
        plan457: 0,
        simpleIRA: 0,
        sepIRA: 0,
        able: 0,
        tsp: 0,
        otherRetirementPlans: 0,
        totalContributions: 0
      },
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
            
            // 데이터 마이그레이션 및 수정
            console.log("마이그레이션: 데이터 수정");
            
            // 1. HSA 필드 제거
            if (data.income?.adjustments?.healthSavingsAccount) {
              if (data.income && data.income.adjustments) {
                const hsaValue = data.income.adjustments.healthSavingsAccount || 0;
                const currentOtherAdjustments = data.income.adjustments.otherAdjustments || 0;
                
                // otherAdjustments에 HSA 값을 추가
                testData.income = {
                  ...data.income,
                  adjustments: {
                    studentLoanInterest: data.income.adjustments.studentLoanInterest || 0,
                    retirementContributions: data.income.adjustments.retirementContributions || 0,
                    otherAdjustments: currentOtherAdjustments + hsaValue
                  }
                };
              }
            } else if (data.income) {
              testData.income = data.income;
            }
            
            // 2. 부양가족 isQualifyingChild 필드 확인
            if (data.personalInfo?.dependents) {
              // 기존 부양가족 데이터에 isQualifyingChild 프로퍼티가 없으면 기본값 설정
              testData.personalInfo = {
                ...data.personalInfo,
                dependents: data.personalInfo.dependents.map(dependent => {
                  if (dependent.isQualifyingChild === undefined) {
                    return {
                      ...dependent,
                      isQualifyingChild: true  // 기본값은 true로 설정
                    };
                  }
                  return dependent;
                })
              };
            }
            
            // 3. SpouseInfo에 필수 필드 없으면 추가
            if (data.personalInfo?.spouseInfo) {
              const spouseInfo = data.personalInfo.spouseInfo;
              if (spouseInfo.isDisabled === undefined || spouseInfo.isNonresidentAlien === undefined) {
                testData.personalInfo = {
                  ...testData.personalInfo,
                  spouseInfo: {
                    ...spouseInfo,
                    isDisabled: spouseInfo.isDisabled !== undefined ? spouseInfo.isDisabled : false,
                    isNonresidentAlien: spouseInfo.isNonresidentAlien !== undefined ? spouseInfo.isNonresidentAlien : false
                  }
                };
              }
            }
            
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

  // Update tax data and recalculate taxes - without auto-saving to server
  const updateTaxData = (data: Partial<TaxData>) => {
    setTaxData(prevData => {
      // 중첩된 객체들의 깊은 병합을 위한 새로운 데이터 객체 생성
      const newData = { ...data };
      
      // 세금 공제 정보 깊은 병합
      if (prevData.taxCredits && newData.taxCredits) {
        newData.taxCredits = {
          ...prevData.taxCredits,
          ...newData.taxCredits
        };
      }
      
      // 공제 정보 깊은 병합
      if (prevData.deductions && newData.deductions) {
        newData.deductions = {
          ...prevData.deductions,
          ...newData.deductions
        };
        
        // 항목별 공제 데이터 병합 (있는 경우)
        if (prevData.deductions.itemizedDeductions && 
            newData.deductions.itemizedDeductions) {
          newData.deductions.itemizedDeductions = {
            ...prevData.deductions.itemizedDeductions,
            ...newData.deductions.itemizedDeductions
          };
        }
      }
      
      // 수입 정보 깊은 병합
      if (prevData.income && newData.income) {
        newData.income = {
          ...prevData.income,
          ...newData.income
        };
        
        // 조정 항목 병합 (있는 경우)
        if (prevData.income.adjustments && newData.income.adjustments) {
          newData.income.adjustments = {
            ...prevData.income.adjustments,
            ...newData.income.adjustments
          };
        }
      }
      
      // 추가 세금 정보 깊은 병합
      if (prevData.additionalTax && newData.additionalTax) {
        newData.additionalTax = {
          ...prevData.additionalTax,
          ...newData.additionalTax
        };
      }
      
      // 최종 데이터 병합
      const updatedData = {
        ...prevData,
        ...newData,
        updatedAt: new Date().toISOString()
      };
      
      // Recalculate tax results whenever data changes
      const calculatedResults = calculateTaxes(updatedData);
      updatedData.calculatedResults = calculatedResults;
      
      // 로컬 상태 업데이트 로깅
      console.log("로컬 상태 업데이트:", newData);
      console.log("업데이트 된 세금 데이터:", updatedData);
      
      return updatedData;
    });
  };

  // Save tax return to the server
  const saveTaxReturn = async () => {
    try {
      setIsLoading(true);
      console.log("서버 저장 시작 - 현재 taxData:", taxData);
      
      const method = taxData.id ? 'PUT' : 'POST';
      const url = taxData.id ? `/api/tax-return/${taxData.id}` : '/api/tax-return';
      
      const response = await apiRequest(method, url, {
        ...taxData,
        updatedAt: new Date().toISOString()
      });
      
      if (response.ok) {
        // 서버에서 받은 데이터 그대로 상태 업데이트하는 대신 ID만 업데이트
        // 이렇게 하면 서버 응답이 클라이언트의 현재 상태를 덮어쓰지 않음
        const serverResponse = await response.json();
        console.log("서버 응답:", serverResponse);
        
        // ID는 업데이트하되 다른 데이터는 현재 상태 유지
        if (!taxData.id && serverResponse.id) {
          setTaxData(prevData => ({
            ...prevData,
            id: serverResponse.id
          }));
        }
        
        console.log("서버 저장 완료 - 현재 상태 유지됨");
        return serverResponse;
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
        aotcCredit: 0,
        llcCredit: 0,
        retirementSavingsCredit: 0,
        retirementContributions: {
          traditionalIRA: 0,
          rothIRA: 0,
          plan401k: 0,
          plan403b: 0,
          plan457: 0,
          simpleIRA: 0,
          sepIRA: 0,
          able: 0,
          tsp: 0,
          otherRetirementPlans: 0,
          totalContributions: 0
        },
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
