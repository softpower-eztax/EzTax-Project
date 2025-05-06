import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { AdditionalIncomeItem, Income } from '@shared/schema';
import { useTaxContext } from '@/context/TaxContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info as InfoIcon, ArrowLeft, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/taxCalculations';

// 소득 유형 상수 정의
const INCOME_TYPES = [
  { id: 'gambling_winnings', label: '도박 소득 (Gambling winnings)', info: '카지노, 로또, 및 기타 도박 활동에서 발생한 소득' },
  { id: 'debt_cancellation', label: '부채 탕감 (Cancellation of debt)', info: '대출기관에 의해 탕감된 부채는 일반적으로 소득으로 간주됩니다' },
  { id: 'foreign_income', label: '해외 근로소득 제외액 (Form 2555) (Foreign earned income exclusion)', info: '해외에서 근무하며 얻은 소득에 대한 특별 처리' },
  { id: 'archer_msa', label: 'Archer 의료 저축 계좌 인출액 및 장기요양보험 지급금 (Form 8853)', info: '의료 저축 계좌에서 인출된 금액' },
  { id: 'hsa_distributions', label: 'HSA 계좌 인출액 (Form 8889) (Health Savings Accounts)', info: '건강 저축 계좌에서 인출된 자금' },
  { id: 'alaska_fund', label: '알래스카 영구 기금 배당금 (Alaska Permanent Fund dividends)', info: '알래스카 주민이 받는 배당금' },
  { id: 'jury_duty', label: '배심원 수당 (Jury duty pay)', info: '배심원으로 봉사하면서 받은 보상' },
  { id: 'prizes', label: '상금 및 수상금 (Prizes and awards)', info: '경쟁, 게임 또는 대회에서 받은 상금' },
  { id: 'hobby_income', label: '취미활동 소득 (Activity not engaged in for profit income)', info: '영리 목적이 아닌 활동에서 발생한 소득' },
  { id: 'stock_options', label: '스톡옵션 소득 (Stock options)', info: '회사 스톡옵션 행사로 인한 소득' },
  { id: 'incarceration_income', label: '수감 중 벌어들인 임금 (Wages earned while incarcerated)', info: '교도소에서 근무하면서 받은 임금' },
  { id: 'digital_assets', label: '다른 곳에 보고되지 않은 일반 소득으로 수령한 디지털 자산', info: '암호화폐나 NFT와 같은 디지털 자산 형태로 받은 소득' }
];

export default function AdditionalIncomeFixedPage() {
  const [, navigate] = useLocation();
  const { taxData, updateTaxData } = useTaxContext();
  const { toast } = useToast();
  
  // 상태 정의
  const [itemsList, setItemsList] = useState<AdditionalIncomeItem[]>(
    taxData.income?.additionalIncomeItems || []
  );
  
  // 새 항목 입력 필드용 상태
  const [itemType, setItemType] = useState<string>('');
  const [itemAmount, setItemAmount] = useState<string>('');
  const [itemDescription, setItemDescription] = useState<string>('');

  // 항목 추가 핸들러
  const handleAddItem = () => {
    // 유효성 검사
    if (!itemType) {
      toast({
        title: "항목 선택 필요",
        description: "추가할 소득 항목을 선택해주세요.",
        variant: "destructive"
      });
      return;
    }
    
    const amount = parseFloat(itemAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "금액 입력 오류",
        description: "금액은 0보다 큰 숫자여야 합니다.",
        variant: "destructive"
      });
      return;
    }
    
    // 항목 라벨 찾기
    const selectedTypeLabel = INCOME_TYPES.find(type => type.id === itemType)?.label || itemType;
    
    // 새 항목 생성
    const newItem: AdditionalIncomeItem = {
      type: selectedTypeLabel,
      amount: amount,
      description: itemDescription || undefined
    };
    
    // 항목 목록에 추가
    const updatedItems = [...itemsList, newItem];
    setItemsList(updatedItems);
    
    // 입력 필드 초기화
    setItemType('');
    setItemAmount('');
    setItemDescription('');
    
    toast({
      title: "항목 추가됨",
      description: "소득 항목이 목록에 추가되었습니다."
    });
  };
  
  // 항목 삭제 핸들러
  const handleRemoveItem = (index: number) => {
    const updatedItems = [...itemsList];
    updatedItems.splice(index, 1);
    setItemsList(updatedItems);
  };
  
  // 총액 계산
  const calculateTotal = () => {
    return itemsList.reduce((sum, item) => sum + item.amount, 0);
  };
  
  // 저장 및 돌아가기 핸들러
  const handleSaveAndReturn = () => {
    try {
      // 총액 계산
      const totalAmount = calculateTotal();
      
      // 기존 소득 데이터 복제
      const updatedIncome = { 
        ...(taxData.income || {
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
          additionalIncomeItems: [],
          totalIncome: 0,
          adjustments: {
            studentLoanInterest: 0,
            retirementContributions: 0, 
            healthSavingsAccount: 0,
            otherAdjustments: 0
          },
          adjustedGrossIncome: 0
        })
      };
      
      // 추가 소득 항목 업데이트
      updatedIncome.additionalIncomeItems = itemsList;
      
      // 기타소득 필드에 총액 설정
      updatedIncome.otherIncome = totalAmount;
      
      // 총소득 재계산
      updatedIncome.totalIncome = 
        updatedIncome.wages + 
        updatedIncome.otherEarnedIncome + 
        updatedIncome.interestIncome + 
        updatedIncome.dividends + 
        updatedIncome.businessIncome + 
        updatedIncome.capitalGains + 
        updatedIncome.rentalIncome + 
        updatedIncome.retirementIncome + 
        updatedIncome.unemploymentIncome + 
        updatedIncome.otherIncome;
      
      // 조정 총소득(AGI) 재계산
      const adjustments = updatedIncome.adjustments;
      const totalAdjustments = 
        (adjustments.studentLoanInterest || 0) + 
        (adjustments.retirementContributions || 0) + 
        (adjustments.healthSavingsAccount || 0) + 
        (adjustments.otherAdjustments || 0);
      
      updatedIncome.adjustedGrossIncome = updatedIncome.totalIncome - totalAdjustments;
      
      // 컨텍스트 업데이트 - 데이터 저장
      updateTaxData({ income: updatedIncome });
      
      // 소득 페이지로 이동
      navigate('/income');
      
      toast({
        title: "저장 완료",
        description: "기타소득 항목이 저장되었습니다."
      });
    } catch (error) {
      console.error('Error saving additional income:', error);
      toast({
        title: "저장 오류",
        description: "기타소득 항목을 저장하는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };
  
  // 항목 목록이 변경될 때마다 자동 저장
  useEffect(() => {
    if (itemsList.length > 0) {
      const saveTimer = setTimeout(() => {
        // 기존 데이터와 합치기
        const updatedIncome = { 
          ...(taxData.income || {
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
            adjustments: {
              studentLoanInterest: 0,
              retirementContributions: 0,
              healthSavingsAccount: 0,
              otherAdjustments: 0
            },
            adjustedGrossIncome: 0
          })
        };
        
        // 항목 목록 및 합계 업데이트
        updatedIncome.additionalIncomeItems = itemsList;
        updatedIncome.otherIncome = calculateTotal();
        
        // 총액 재계산
        const totalIncome = 
          updatedIncome.wages + 
          updatedIncome.otherEarnedIncome + 
          updatedIncome.interestIncome + 
          updatedIncome.dividends + 
          updatedIncome.businessIncome + 
          updatedIncome.capitalGains + 
          updatedIncome.rentalIncome + 
          updatedIncome.retirementIncome + 
          updatedIncome.unemploymentIncome + 
          updatedIncome.otherIncome;
        
        updatedIncome.totalIncome = totalIncome;
        
        // 조정 총소득 재계산
        const adjustments = updatedIncome.adjustments;
        const totalAdjustments = 
          (adjustments.studentLoanInterest || 0) + 
          (adjustments.retirementContributions || 0) + 
          (adjustments.healthSavingsAccount || 0) + 
          (adjustments.otherAdjustments || 0);
        
        updatedIncome.adjustedGrossIncome = totalIncome - totalAdjustments;
        
        // 데이터 저장
        updateTaxData({ income: updatedIncome });
        console.log("기타소득 항목 자동 저장됨", itemsList);
      }, 500);
      
      return () => clearTimeout(saveTimer);
    }
  }, [itemsList, updateTaxData, taxData.income]);
  
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <Button 
        variant="ghost" 
        className="mb-4 flex items-center" 
        onClick={() => navigate('/income')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        소득정보로 돌아가기
      </Button>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl font-heading text-primary-dark">
            기타 소득 항목 (Additional Income Items)
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="mb-8">
            <p className="text-sm text-gray-dark mb-4">
              주 소득 외에 추가로 신고해야 하는 소득 항목을 입력하세요. 해당하는 항목이 있으면 선택하여 금액을 입력하세요.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="text-sm font-medium">항목 (Item)</label>
                <select 
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                  className="w-full p-2 border rounded mt-1"
                >
                  <option value="">선택하세요</option>
                  {INCOME_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium">금액 (Amount)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemAmount}
                  onChange={(e) => setItemAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="text-sm font-medium">설명 (Description) - 선택사항</label>
                <Input
                  type="text"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="추가 정보를 입력하세요 (선택사항)"
                  className="mt-1"
                />
              </div>
            </div>
            
            <Button 
              type="button"
              onClick={handleAddItem}
              className="w-full md:w-auto"
            >
              <Plus className="h-4 w-4 mr-1" />
              항목 추가
            </Button>
          </div>
          
          {itemsList.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">추가된 소득 항목</h3>
              <div className="space-y-3">
                {itemsList.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded bg-gray-50">
                    <div>
                      <p className="font-medium">{item.type}</p>
                      {item.description && (
                        <p className="text-sm text-gray-600">{item.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        {formatCurrency(item.amount)}
                      </span>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleRemoveItem(index)}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-between items-center p-3 border-t pt-3 font-bold">
                  <span>총계 (Total)</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-8 flex justify-end">
            <Button onClick={handleSaveAndReturn}>
              저장 및 돌아가기
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-4 p-4 border rounded bg-blue-50">
        <h3 className="text-lg font-semibold mb-2">소득 항목 정보</h3>
        <div className="space-y-2">
          {INCOME_TYPES.map((type) => (
            <div key={type.id} className="flex gap-2">
              <InfoIcon className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{type.label}</p>
                <p className="text-sm text-gray-600">{type.info}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}