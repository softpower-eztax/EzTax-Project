import React, { createContext, useContext, useState, useEffect } from 'react';
import { TaxData } from '../types/tax';
import { calculateTaxes } from '../lib/taxCalculations';

interface TaxContextType {
  taxData: TaxData;
  isLoading: boolean;
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

  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        setIsLoading(true);
        
        const userResponse = await fetch('/api/user', {
          credentials: 'include',
          cache: 'no-cache'
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
        
        if (currentUserId !== currentUser.id) {
          console.log(`사용자 변경/로그인: ${currentUser.id}`);
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
    if (currentUserId && finalData.id) {
      try {
        await fetch(`/api/tax-return/${finalData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(finalData),
        });
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
      updateTaxData,
      saveTaxData
    }}>
      {children}
    </TaxContext.Provider>
  );
};