import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useTaxContext } from '@/context/TaxContext';
import { formatCurrency } from '@/lib/taxCalculations';

interface TaxSummaryProps {
  recalculate?: () => void;
}

const TaxSummary: React.FC<TaxSummaryProps> = ({ recalculate }) => {
  const { taxData, recalculateTaxes } = useTaxContext();
  
  const handleRecalculate = () => {
    if (recalculate) {
      recalculate();
    } else {
      recalculateTaxes();
    }
  };

  // Map filing status enum to readable text
  const filingStatusMap: Record<string, string> = {
    single: "Single",
    married_joint: "Married Filing Jointly",
    married_separate: "Married Filing Separately",
    head_of_household: "Head of Household",
    qualifying_widow: "Qualifying Widow(er)"
  };

  // 테스트용 하드코딩된 데이터 만약 API에서 데이터가 불러와지지 않을 경우를 대비
  const results = taxData.calculatedResults || {
    totalIncome: 129700,
    adjustments: 14060,
    adjustedGrossIncome: 115640,
    deductions: 35000,
    taxableIncome: 80640,
    federalTax: 9082.8,
    credits: 5200,
    taxDue: 6802.8,
    payments: 24455,
    refundAmount: 17652.2,
    amountOwed: 0
  };

  return (
    <div className="md:w-72">
      <Card className="sticky top-6">
        <CardContent className="p-4">
          <h3 className="text-lg font-heading font-semibold text-primary-dark mb-3">세금 요약</h3>
          
          <div className="mb-4 border-b border-gray-light pb-4">
            <p className="text-sm text-gray-dark mb-1">신고 상태</p>
            <p className="font-semibold">
              {taxData.personalInfo?.filingStatus ? 
                filingStatusMap[taxData.personalInfo.filingStatus] : 
                "Married Filing Jointly"}
            </p>
          </div>
          
          <div className="mb-4 border-b border-gray-light pb-4">
            <div className="flex justify-between mb-2">
              <p className="text-sm">수입</p>
              <p className="font-semibold">{formatCurrency(results.totalIncome)}</p>
            </div>
            <div className="flex justify-between mb-2">
              <p className="text-sm">수입조정</p>
              <p className="font-semibold text-destructive">- {formatCurrency(results.adjustments)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-sm">AGM</p>
              <p className="font-semibold">{formatCurrency(results.adjustedGrossIncome)}</p>
            </div>
          </div>
          
          <div className="mb-4 border-b border-gray-light pb-4">
            <div className="flex justify-between mb-2">
              <p className="text-sm">
                {taxData.deductions?.useStandardDeduction ? '표준공제' : '공제액'}
              </p>
              <p className="font-semibold text-destructive">- {formatCurrency(results.deductions)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-sm">과세소득</p>
              <p className="font-semibold">{formatCurrency(results.taxableIncome)}</p>
            </div>
          </div>
          
          <div className="mb-4 border-b border-gray-light pb-4">
            <div className="flex justify-between mb-2">
              <p className="text-sm">세액</p>
              <p className="font-semibold">{formatCurrency(results.federalTax)}</p>
            </div>
            <div className="flex justify-between mb-2">
              <p className="text-sm">Credits</p>
              <p className="font-semibold text-destructive">- {formatCurrency(results.credits)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-sm">예상세액</p>
              <p className="font-semibold">{formatCurrency(results.taxDue)}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <p className="text-sm">선납세금등</p>
              <p className="font-semibold text-destructive">- {formatCurrency(results.payments)}</p>
            </div>
            {results.refundAmount > 0 ? (
              <div className="flex justify-between items-center bg-gray-bg p-2 rounded">
                <p className="font-semibold">환급액</p>
                <p className="font-bold text-success text-xl">{formatCurrency(results.refundAmount)}</p>
              </div>
            ) : (
              <div className="flex justify-between items-center bg-gray-bg p-2 rounded">
                <p className="font-semibold">납부 예정액</p>
                <p className="font-bold text-destructive text-xl">{formatCurrency(results.amountOwed)}</p>
              </div>
            )}
          </div>
          
          <p className="text-xs text-gray-dark italic mt-4">
            지금까지 제공된 정보를 기반으로 한 예상치입니다. 최종 계산은 다를 수 있습니다.
          </p>
          
          <Button
            variant="outline"
            className="w-full mt-4 text-sm border border-primary text-primary font-semibold rounded hover:bg-primary-light hover:text-white transition duration-200"
            onClick={handleRecalculate}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            다시 계산하기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaxSummary;
