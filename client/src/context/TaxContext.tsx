import React, { createContext, useContext, useState, useEffect } from 'react';
import { TaxData } from '../types/tax';
import { calculateTaxes } from '../lib/taxCalculations';

interface TaxContextType {
  taxData: TaxData;
  isLoading: boolean;
  isDataReady: boolean;
  updateTaxData: (data: Partial<TaxData>) => Promise<void>;
  saveTaxData: () => Promise<void>;
}

const TaxContext = createContext<TaxContextType | undefined>(undefined);

export const useTaxContext = () => {
  const context = useContext(TaxContext);
  if (!context) {
    throw new Error('useTaxContext must be used within a TaxProvider');
  }
  return context;
};

export const TaxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  const [isLoading, setIsLoading] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // 완전한 데이터 초기화 함수 (보안 중요)
  const clearAllData = () => {
    console.log("모든 사용자 데이터 완전 삭제 중...");
    
    // TaxContext 데이터 완전 초기화
    setTaxData({
      taxYear: 2025,
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      personalInfo: undefined,
      income: undefined,
      deductions: undefined,
      taxCredits: undefined,
      additionalTax: undefined,
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
    
    // 모든 로컬 저장소 데이터 삭제
    localStorage.removeItem('personalInfo');
    localStorage.removeItem('tempPersonalInfo');
    localStorage.removeItem('tempFilingStatus');
    localStorage.removeItem('taxData');
    
    setCurrentUserId(null);
    console.log("데이터 삭제 완료 - 보안 확보됨");
  };

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        setIsLoading(true);
        
        const userResponse = await fetch('/api/user', {
          credentials: 'include',
          cache: 'no-cache'
        });
        
        if (!userResponse.ok) {
          console.log(`사용자 인증 실패 (status: ${userResponse.status}) - 현재 사용자 ID: ${currentUserId}`);
          // 이미 로그인된 사용자가 있다면 데이터를 즉시 삭제하지 않고 잠시 대기
          if (currentUserId !== null) {
            console.log("기존 로그인 사용자 존재 - 데이터 보존하며 재시도 대기");
            setIsLoading(false);
            return;
          }
          console.log("새 사용자 또는 완전 로그아웃 - 데이터 초기화");
          clearAllData();
          setIsDataReady(true);
          return;
        }
        
        const currentUser = await userResponse.json();
        
        // 사용자 ID 비교 및 데이터 처리
        const isUserChange = currentUserId !== null && currentUserId !== currentUser.id;
        const isFirstLogin = currentUserId === null;
        
        if (currentUserId !== currentUser.id) {
          console.log(`사용자 로그인: ${currentUser.id} (이전: ${currentUserId})`);
          
          if (isUserChange) {
            console.log("다른 사용자로 변경 - 기존 데이터 삭제");
            clearAllData();
          } else if (isFirstLogin) {
            console.log("첫 로그인 - 서버에서 데이터 로드 준비");
          }
          
          setCurrentUserId(currentUser.id);
        }
        
        const taxResponse = await fetch('/api/tax-return', {
          credentials: 'include',
          cache: 'no-cache'
        });
        
        if (taxResponse.ok) {
          const serverTaxData = await taxResponse.json();
          console.log(`사용자 ${currentUser.username}의 세금 데이터 로드:`, serverTaxData);
          
          if (serverTaxData?.userId === currentUser.id) {
            const calculatedResults = calculateTaxes(serverTaxData);
            
            // 서버 데이터 구조 유지하며 병합
            const restoredData = {
              id: serverTaxData.id,
              userId: serverTaxData.userId,
              taxYear: serverTaxData.taxYear || 2025,
              status: serverTaxData.status || 'in_progress',
              createdAt: serverTaxData.createdAt,
              updatedAt: new Date().toISOString(),
              personalInfo: serverTaxData.personalInfo,
              income: serverTaxData.income,
              deductions: serverTaxData.deductions,
              taxCredits: serverTaxData.taxCredits,
              retirementContributions: serverTaxData.retirementContributions,
              additionalTax: serverTaxData.additionalTax,
              calculatedResults
            };
            
            console.log(`데이터 복원 완료:`, restoredData);
            setTaxData(restoredData);
            setIsDataReady(true);
          } else {
            console.error("데이터 사용자 ID 불일치");
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
        } else {
          console.log(`사용자의 세금 데이터 없음 - 새로 시작`);
          // 새 사용자 또는 데이터가 없는 경우 기본 구조만 설정
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
          setIsDataReady(true);
        }
      } catch (error) {
        console.error('데이터 로드 오류:', error);
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

    checkAuthAndLoadData();
  }, []); // 의존성 배열을 비워서 무한 루프 방지

  const updateTaxData = async (data: Partial<TaxData>) => {
    // 데이터 깊은 병합
    const updatedData = {
      id: taxData.id,
      userId: taxData.userId || currentUserId,
      taxYear: taxData.taxYear || 2025,
      status: taxData.status || 'in_progress',
      createdAt: taxData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      personalInfo: data.personalInfo ? { ...taxData.personalInfo, ...data.personalInfo } : taxData.personalInfo,
      income: data.income ? { ...taxData.income, ...data.income } : taxData.income,
      deductions: data.deductions ? { ...taxData.deductions, ...data.deductions } : taxData.deductions,
      taxCredits: data.taxCredits ? { ...taxData.taxCredits, ...data.taxCredits } : taxData.taxCredits,
      retirementContributions: data.retirementContributions ? { ...taxData.retirementContributions, ...data.retirementContributions } : taxData.retirementContributions,
      additionalTax: data.additionalTax ? { ...taxData.additionalTax, ...data.additionalTax } : taxData.additionalTax,
    };
    
    const calculatedResults = calculateTaxes(updatedData);
    
    const finalData = {
      ...updatedData,
      calculatedResults
    };
    
    setTaxData(finalData);
    
    // Auto-save to server if user is authenticated
    if (currentUserId) {
      try {
        if (finalData.id) {
          // Update existing tax return
          console.log(`기존 세금 신고서 업데이트 중 (ID: ${finalData.id})`);
          await fetch(`/api/tax-return/${finalData.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(finalData),
          });
        } else {
          // Create new tax return for user
          console.log(`새 사용자를 위한 세금 신고서 생성 중 (사용자 ID: ${currentUserId})`);
          const response = await fetch('/api/tax-return', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(finalData),
          });
          
          if (response.ok) {
            const newTaxReturn = await response.json();
            console.log(`새 세금 신고서 생성됨 (ID: ${newTaxReturn.id})`);
            // Update the local data with the new ID
            setTaxData(prev => ({ ...prev, id: newTaxReturn.id }));
          }
        }
      } catch (error) {
        console.error('자동 저장 실패:', error);
      }
    }
  };

  const saveTaxData = async () => {
    try {
      if (taxData.id) {
        // Update existing tax return
        const response = await fetch(`/api/tax-return/${taxData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(taxData),
        });

        if (!response.ok) {
          throw new Error('세금 데이터 업데이트 실패');
        }
      } else {
        // Create new tax return
        const response = await fetch('/api/tax-return', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(taxData),
        });

        if (!response.ok) {
          throw new Error('세금 데이터 생성 실패');
        }

        const newTaxReturn = await response.json();
        setTaxData(prev => ({ ...prev, id: newTaxReturn.id }));
      }

      console.log('세금 데이터 저장 완료');
    } catch (error) {
      console.error('세금 데이터 저장 오류:', error);
      throw error;
    }
  };

  return (
    <TaxContext.Provider value={{
      taxData,
      isLoading,
      isDataReady,
      updateTaxData,
      saveTaxData
    }}>
      {children}
    </TaxContext.Provider>
  );
};