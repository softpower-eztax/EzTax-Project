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

  // 사용자 인증 상태를 추적하기 위한 상태
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // 인증 상태 및 사용자 변경 감지
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        setIsLoading(true);
        
        // 모든 캐시 데이터 정리
        localStorage.clear();
        sessionStorage.clear();
        
        const userResponse = await fetch('/api/user', {
          credentials: 'include',
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (!userResponse.ok) {
          console.log("사용자 인증되지 않음 - 빈 데이터로 초기화");
          setCurrentUserId(null);
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
          return;
        }
        
        const currentUser = await userResponse.json();
        
        // 사용자가 변경되었는지 확인
        if (currentUserId !== null && currentUserId !== currentUser.id) {
          console.log(`사용자 변경 감지: ${currentUserId} -> ${currentUser.id}`);
          // 완전한 초기화
          localStorage.clear();
          sessionStorage.clear();
          setCurrentUserId(currentUser.id);
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
          // 페이지 새로고침으로 완전 초기화
          window.location.reload();
          return;
        }
        
        setCurrentUserId(currentUser.id);
        console.log(`현재 인증된 사용자: ${currentUser.username} (ID: ${currentUser.id})`);
        
        const response = await fetch('/api/tax-return', {
          credentials: 'include',
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.userId === currentUser.id) {
            console.log(`사용자 ${currentUser.username}의 세금 데이터 로드 (검증됨)`);
            
            let serverData = { ...data };
            
            // 의존성 데이터 마이그레이션
            if (serverData.personalInfo?.dependents) {
              serverData.personalInfo = {
                ...serverData.personalInfo,
                dependents: serverData.personalInfo.dependents.map((dependent: any) => {
                  if (dependent.isQualifyingChild === undefined) {
                    return { ...dependent, isQualifyingChild: true };
                  }
                  return dependent;
                })
              };
            }
            
            // 배우자 정보 마이그레이션
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
            
            const calculatedResults = calculateTaxes(serverData);
            setTaxData({
              ...serverData,
              calculatedResults,
              updatedAt: new Date().toISOString()
            });
          } else {
            console.error(`보안 오류: 데이터 사용자 ID (${data?.userId})가 현재 사용자 ID (${currentUser.id})와 불일치`);
            // 강제 페이지 새로고침으로 완전 초기화
            window.location.reload();
          }
        } else {
          console.log(`사용자 ${currentUser.username}의 세금 데이터 없음 - 새로 시작`);
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
        }
      } catch (error) {
        console.error('세금 데이터 로드 오류:', error);
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
      } finally {
        setIsLoading(false);
      }
    };

    // 초기 데이터 로드만 수행 (정기적 폴링 제거)
    checkAuthAndLoadData();
  }, [currentUserId]);

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
      
      // Prepare data for server - ensure required fields are present
      const dataToSave = {
        ...taxData,
        // Don't set userId here - let server handle it from authentication
        taxYear: taxData.taxYear || new Date().getFullYear(),
        status: taxData.status || 'in_progress',
        createdAt: taxData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const response = await apiRequest({
        url,
        method,
        body: dataToSave
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

  // 진행상황 저장 함수 - 개인정보는 보존하고 현재 상태만 저장
  const resetToZero = async () => {
    try {
      setIsLoading(true);
      
      // 현재 상태를 그대로 서버에 저장 (개인정보 포함)
      await saveTaxReturn();
      
      toast({
        title: "진행상황 저장됨",
        description: "현재 입력한 정보가 성공적으로 저장되었습니다.",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: "저장 실패",
        description: "저장 중 오류가 발생했습니다.",
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
