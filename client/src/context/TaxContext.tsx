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
  
  // 기본 세금 데이터로 초기화
  const [taxData, setTaxData] = useState<TaxData>({
    taxYear: 2025, // Default to 2025
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

  // Load tax data on initial render
  useEffect(() => {
    const loadTaxData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/tax-return');
        
        if (response.ok) {
          const data = await response.json();
          if (data) {
            // 서버에서 가져온 데이터 사용
            let serverData = { ...data };
            
            // 데이터 마이그레이션 및 수정
            console.log("마이그레이션: 데이터 수정");
            
            // Data migration completed - HSA field already handled in server data
            
            // 2. 부양가족 isQualifyingChild 필드 확인
            if (serverData.personalInfo?.dependents) {
              // 기존 부양가족 데이터에 isQualifyingChild 프로퍼티가 없으면 기본값 설정
              serverData.personalInfo = {
                ...serverData.personalInfo,
                dependents: serverData.personalInfo.dependents.map((dependent: any) => {
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
            if (serverData.personalInfo?.spouseInfo) {
              const spouseInfo = serverData.personalInfo.spouseInfo;
              if (spouseInfo.isDisabled === undefined || spouseInfo.isNonresidentAlien === undefined) {
                serverData.personalInfo = {
                  ...serverData.personalInfo,
                  spouseInfo: {
                    ...spouseInfo,
                    isDisabled: spouseInfo.isDisabled !== undefined ? spouseInfo.isDisabled : false,
                    isNonresidentAlien: spouseInfo.isNonresidentAlien !== undefined ? spouseInfo.isNonresidentAlien : false
                  }
                };
              }
            }
            
            // Immediately recalculate taxes
            const calculatedResults = calculateTaxes(serverData);
            setTaxData({
              ...serverData,
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

    loadTaxData()
      .then(() => {
        // 컴포넌트 마운트 시 데이터 초기화 - 즉시 데이터 지우기
        // 로컬 스토리지 데이터 초기화
        localStorage.removeItem('personalInfo');
        localStorage.removeItem('income');
        localStorage.removeItem('deductions');
        localStorage.removeItem('taxCredits');
        localStorage.removeItem('additionalTax');
        
        // 빈 데이터로 초기화 및 서버 저장
        resetToZero();
      });
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
      
      // 은퇴 기여금 정보 깊은 병합
      if (prevData.retirementContributions && newData.retirementContributions) {
        newData.retirementContributions = {
          ...prevData.retirementContributions,
          ...newData.retirementContributions
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
  const resetToZero = async () => {
    // 먼저 로컬 스토리지 초기화
    localStorage.removeItem('personalInfo');
    localStorage.removeItem('income');
    localStorage.removeItem('deductions');
    localStorage.removeItem('taxCredits');
    localStorage.removeItem('additionalTax');
    
    // 데이터 초기화
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
      standardDeductionAmount: 0, // 초기값 0으로 설정
      itemizedDeductions: {
        medicalExpenses: 0,
        stateLocalIncomeTax: 0,
        realEstateTaxes: 0,
        mortgageInterest: 0,
        charitableCash: 0,
        charitableNonCash: 0
      },
      totalDeductions: 0
    };

    const emptyTaxCredits = {
      childTaxCredit: 0,
      childDependentCareCredit: 0,
      educationCredits: 0,
      aotcCredit: 0,
      llcCredit: 0,
      retirementSavingsCredit: 0,
      otherCredits: 0,
      totalCredits: 0
    };
    
    const emptyRetirementContributions = {
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
    };

    const emptyAdditionalTax = {
      selfEmploymentIncome: 0,
      selfEmploymentTax: 0,
      estimatedTaxPayments: 0,
      otherIncome: 0,
      otherTaxes: 0
    };
    
    // 빈 개인정보
    const emptyPersonalInfo = {
      firstName: "",
      lastName: "",
      ssn: "",
      dateOfBirth: "",
      email: "",
      phone: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      zipCode: "",
      filingStatus: "single" as const,
      isDisabled: false,
      isNonresidentAlien: false,
      dependents: []
    };

    try {
      setIsLoading(true);
      
      // 먼저 상태 업데이트
      setTaxData(prevData => {
        const updatedData = {
          ...prevData,
          personalInfo: emptyPersonalInfo,
          income: emptyIncome,
          deductions: emptyDeductions,
          taxCredits: emptyTaxCredits,
          retirementContributions: emptyRetirementContributions,
          additionalTax: emptyAdditionalTax,
          updatedAt: new Date().toISOString()
        };
        
        // 세금 재계산
        const calculatedResults = calculateTaxes(updatedData);
        updatedData.calculatedResults = calculatedResults;
        
        return updatedData;
      });
      
      // 서버에 저장
      await saveTaxReturn();
      
      toast({
        title: "모든 정보를 초기화했습니다",
        description: "모든 개인정보와 숫자 필드가 초기화되고 서버에 저장되었습니다.",
      });
    } catch (error) {
      console.error("데이터 초기화 실패:", error);
      toast({
        title: "초기화 실패",
        description: "데이터 초기화 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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
