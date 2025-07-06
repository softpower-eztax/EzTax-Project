import React, { createContext, useContext, useState, useEffect } from 'react';
import { TaxData } from '../types/tax';
import { calculateTaxes } from '../lib/taxCalculations';

interface TaxContextType {
  taxData: TaxData;
  isLoading: boolean;
  updateTaxData: (data: Partial<TaxData>) => void;
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
          console.log(`사용자 ${currentUser.username}의 세금 데이터 로드`);
          
          if (serverTaxData?.userId === currentUser.id) {
            const calculatedResults = calculateTaxes(serverTaxData);
            setTaxData({
              ...serverTaxData,
              calculatedResults,
              updatedAt: new Date().toISOString()
            });
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

  const updateTaxData = (data: Partial<TaxData>) => {
    setTaxData(prevData => {
      const updatedData = {
        ...prevData,
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      const calculatedResults = calculateTaxes(updatedData);
      
      return {
        ...updatedData,
        calculatedResults
      };
    });
  };

  const saveTaxData = async () => {
    try {
      const response = await fetch('/api/tax-return', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(taxData),
      });

      if (!response.ok) {
        throw new Error('세금 데이터 저장 실패');
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