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

// 추가 소득 항목 관련 상수 정의
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
  { id: 'olympic_medals', label: '올림픽 및 패럴림픽 메달과 미국올림픽위원회(USOC) 상금', info: '올림픽 참가 및 수상으로 받은 상금' },
  { id: 'able_account', label: 'ABLE 계좌로부터의 과세 대상 분배금', info: '장애인 저축 계좌에서 인출된 과세 대상 금액' },
  { id: 'scholarship', label: 'Form W-2에 보고되지 않은 장학금 및 연구비 보조금', info: '수업료 외 생활비로 사용된 장학금은 과세 대상일 수 있음' },
  { id: 'nonqualified_plan', label: '비자격 이연 보상 계획 또는 비정부 457 플랜으로부터의 연금 또는 연금소득', info: '특정 이연 보상 계획에서 발생한 연금 소득' },
  { id: 'incarceration_income', label: '수감 중 벌어들인 임금 (Wages earned while incarcerated)', info: '교도소에서 근무하면서 받은 임금' },
  { id: 'digital_assets', label: '다른 곳에 보고되지 않은 일반 소득으로 수령한 디지털 자산', info: '암호화폐나 NFT와 같은 디지털 자산 형태로 받은 소득' }
];

export default function AdditionalIncomePage() {
  const [, navigate] = useLocation();
  const { taxData, updateTaxData } = useTaxContext();
  const { toast } = useToast();
  const [addedItems, setAddedItems] = useState<AdditionalIncomeItem[]>(
    taxData.income?.additionalIncomeItems || []
  );
  const [selectedType, setSelectedType] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>('');

  const addIncomeItem = () => {
    if (!selectedType || amount <= 0) {
      toast({
        title: "입력 오류",
        description: "항목과 금액을 정확히 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    // 선택된 항목의 라벨 찾기
    const selectedTypeLabel = INCOME_TYPES.find(type => type.id === selectedType)?.label || selectedType;

    // 새 항목 생성
    const newItem: AdditionalIncomeItem = {
      type: selectedTypeLabel,
      amount: amount,
      description: description || undefined,
    };

    console.log("새 항목 추가:", newItem);
    
    // 기존 항목에 추가
    const updatedItems = [...addedItems, newItem];
    
    // 상태 업데이트
    setAddedItems(updatedItems);
    
    console.log("업데이트된 항목 목록:", updatedItems);

    // 폼 초기화
    setSelectedType('');
    setAmount(0);
    setDescription('');

    toast({
      title: "항목 추가 성공",
      description: "소득 항목이 추가되었습니다.",
    });
  };

  const removeItem = (index: number) => {
    const updatedItems = [...addedItems];
    updatedItems.splice(index, 1);
    setAddedItems(updatedItems);
  };
  
  // 항목이 변경될 때마다 자동으로 데이터 저장
  useEffect(() => {
    if (addedItems) {
      try {
        // 추가 소득 항목의 총액 계산
        const totalAmount = addedItems.reduce((sum, item) => sum + item.amount, 0);
        
        // 기존 소득 데이터 가져오기 - 기존 값 보존
        const currentIncome = taxData.income || {};
        
        // 기타 소득에 추가하고 총소득 업데이트
        const updatedIncome = {
          ...currentIncome,
          additionalIncomeItems: addedItems,
          otherIncome: totalAmount
        };
        
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
        
        // 조정총소득(AGI) 재계산
        updatedIncome.adjustedGrossIncome = 
          updatedIncome.totalIncome - 
          (updatedIncome.adjustments.studentLoanInterest + 
           updatedIncome.adjustments.retirementContributions + 
           updatedIncome.adjustments.healthSavingsAccount + 
           updatedIncome.adjustments.otherAdjustments);
        
        // 컨텍스트 자동 업데이트 (타이머로 작업 디바운싱)
        const saveTimer = setTimeout(() => {
          updateTaxData({ income: updatedIncome });
          console.log("기타소득 항목 자동 저장됨", addedItems);
        }, 500);
        
        return () => clearTimeout(saveTimer);
      } catch (error) {
        console.error('Error auto-saving income items:', error);
      }
    }
  }, [addedItems, updateTaxData, taxData.income]);

  const saveAndReturn = () => {
    try {
      // 추가 소득 항목의 총액 계산
      const totalAmount = addedItems.reduce((sum, item) => sum + item.amount, 0);

      // 기존 소득 데이터 가져오기 - 자동 초기화하지 않음
      const currentIncome = taxData.income;

      // 기존 데이터가 없으면 저장하지 않음
      if (!currentIncome) {
        toast({
          title: "알림",
          description: "먼저 기본 소득 정보를 입력해주세요.",
          variant: "destructive",
        });
        return;
      }

      // 기타 소득에 추가하고 총소득 업데이트
      const updatedIncome = {
        ...currentIncome,
        additionalIncomeItems: addedItems,
        otherIncome: totalAmount
      };

      // 총소득 재계산 - 모든 값이 존재하는지 확인
      updatedIncome.totalIncome = 
        (updatedIncome.wages || 0) + 
        (updatedIncome.otherEarnedIncome || 0) + 
        (updatedIncome.interestIncome || 0) + 
        (updatedIncome.dividends || 0) + 
        (updatedIncome.businessIncome || 0) + 
        (updatedIncome.capitalGains || 0) + 
        (updatedIncome.rentalIncome || 0) + 
        (updatedIncome.retirementIncome || 0) + 
        (updatedIncome.unemploymentIncome || 0) + 
        (updatedIncome.otherIncome || 0);

      // 조정총소득(AGI) 재계산
      if (updatedIncome.adjustments) {
        updatedIncome.adjustedGrossIncome = 
          updatedIncome.totalIncome - 
          ((updatedIncome.adjustments.studentLoanInterest || 0) + 
           (updatedIncome.adjustments.retirementContributions || 0) + 
           (updatedIncome.adjustments.healthSavingsAccount || 0) + 
           (updatedIncome.adjustments.otherAdjustments || 0));
      } else {
        updatedIncome.adjustedGrossIncome = updatedIncome.totalIncome;
      }

      // 컨텍스트 업데이트
      updateTaxData({ income: updatedIncome });

      // 메인 소득 페이지로 돌아가기
      navigate('/income');

      toast({
        title: "저장 성공",
        description: "추가 소득 항목이 저장되었습니다.",
      });
    } catch (error) {
      console.error('Error saving additional income items:', error);
      toast({
        title: "저장 오류",
        description: "추가 소득 항목을 저장하는 중에 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

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
          <CardTitle className="text-xl font-heading text-primary-dark">기타 소득 항목 (Additional Income Items)</CardTitle>
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
                  value={selectedType}
                  onChange={(e) => {
                    console.log("선택된 항목:", e.target.value);
                    setSelectedType(e.target.value);
                  }}
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
                  value={amount}
                  onChange={(e) => {
                    console.log("금액 변경:", e.target.value);
                    const numValue = parseFloat(e.target.value) || 0;
                    console.log("파싱된 금액:", numValue);
                    setAmount(numValue);
                  }}
                  className="mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium">설명 (Description) - 선택사항</label>
                <Input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="추가 정보를 입력하세요 (선택사항)"
                  className="mt-1"
                />
              </div>
            </div>

            <Button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                console.log("항목 추가 버튼 클릭");
                console.log("현재 선택:", selectedType, amount, description);
                addIncomeItem();
              }} 
              className="w-full md:w-auto"
            >
              <Plus className="h-4 w-4 mr-1" />
              항목 추가
            </Button>
          </div>

          {addedItems.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">추가된 소득 항목</h3>
              <div className="space-y-3">
                {addedItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded bg-gray-50">
                    <div>
                      <p className="font-medium">{item.type}</p>
                      {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        {formatCurrency(item.amount)}
                      </span>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => removeItem(index)}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between items-center p-3 border-t pt-3 font-bold">
                  <span>총계 (Total)</span>
                  <span>
                    {formatCurrency(
                      addedItems.reduce((sum, item) => sum + item.amount, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <Button onClick={saveAndReturn}>
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