import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTaxContext } from "@/context/TaxContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/taxCalculations";
import { AdditionalAdjustmentItem } from "@shared/schema";
import { ArrowLeft, Info as InfoIcon, Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// 조정 항목 타입 정의
const ADJUSTMENT_TYPES = [
  {
    id: "educator_expenses",
    label: "교육자 비용 (Educator expenses)",
    info: "교사, 강사, 상담사 등 교육 분야 종사자가 직무와 관련하여 지출한 비용입니다."
  },
  {
    id: "hsa_deduction",
    label: "HSA 적립금 (Health savings account deduction)",
    info: "건강 저축 계좌(HSA)에 납입한 금액입니다."
  },
  {
    id: "moving_expenses",
    label: "이주 비용 (Moving expenses for armed forces)",
    info: "현역 군인이 영구적인 변경 명령으로 인해 발생한 이사 비용입니다."
  },
  {
    id: "self_employment_tax",
    label: "자영업 세금 공제 (Self-employment tax deduction)",
    info: "자영업자가 납부한 사회보장세 및 메디케어세의 일부 공제 항목입니다."
  },

  {
    id: "self_employed_health_insurance",
    label: "자영업자 건강보험 (Self-employed health insurance)",
    info: "자영업자, 파트너 또는 S 법인 주주가 지불한 건강보험료입니다."
  },
  {
    id: "early_withdrawal_penalty",
    label: "조기 인출 위약금 (Early withdrawal penalty on savings)",
    info: "정기 예금을 만기 전에 인출하여 발생한 위약금입니다."
  },
  {
    id: "alimony_paid",
    label: "지불된 위자료 (Alimony paid)",
    info: "2019년 이전에 체결된 이혼 또는 별거 합의에 따라 지급한 위자료입니다."
  },
  {
    id: "ira_deduction",
    label: "Traditional IRA 납입금",
    info: "전통적인 개인 은퇴 계좌에 납입한 금액에 대한 공제입니다."
  },
  {
    id: "other_adjustments",
    label: "기타 조정 (Other adjustments)",
    info: "위 항목에 해당하지 않는, 총소득에서 공제 가능한 기타 조정 항목입니다."
  }
];

export default function AdditionalAdjustmentsSimplePage() {
  const [, navigate] = useLocation();
  const { taxData, updateTaxData } = useTaxContext();
  const { toast } = useToast();
  
  // 저장된 항목 목록
  const [itemsList, setItemsList] = useState<AdditionalAdjustmentItem[]>([]);
  
  // 새 항목 입력을 위한 상태
  const [type, setType] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  // 컴포넌트 마운트 시 기존 데이터 로드
  useEffect(() => {
    console.log("컴포넌트 마운트: 기존 조정 항목 로드", taxData.income?.additionalAdjustmentItems);
    if (taxData.income?.additionalAdjustmentItems && taxData.income.additionalAdjustmentItems.length > 0) {
      setItemsList(taxData.income.additionalAdjustmentItems);
    }
  }, [taxData.income?.additionalAdjustmentItems]);
  
  // 항목 추가 핸들러
  const handleAddItem = () => {
    // 입력 검증
    if (!type) {
      toast({
        title: "항목 선택 필요",
        description: "추가할 조정 항목을 선택해주세요.",
        variant: "destructive"
      });
      return;
    }
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: "금액 입력 오류",
        description: "금액은 0보다 큰 숫자여야 합니다.",
        variant: "destructive"
      });
      return;
    }
    
    // 항목 유형 라벨 찾기
    const typeLabel = ADJUSTMENT_TYPES.find(t => t.id === type)?.label || type;
    
    // 새 항목 생성
    const newItem: AdditionalAdjustmentItem = {
      type: typeLabel,
      amount: numAmount,
      description: description || undefined
    };
    
    // 목록에 추가
    const updatedList = [...itemsList, newItem];
    setItemsList(updatedList);
    
    // 입력 필드 초기화
    setType('');
    setAmount('');
    setDescription('');
    
    // 추가된 항목 정보를 소득 데이터에 저장
    saveItems(updatedList);
    
    toast({
      title: "항목 추가됨",
      description: "조정 항목이 목록에 추가되었습니다."
    });
  };
  
  // 항목 삭제 핸들러
  const handleRemoveItem = (index: number) => {
    const updatedList = [...itemsList];
    updatedList.splice(index, 1);
    setItemsList(updatedList);
    
    // 변경된 목록 저장
    saveItems(updatedList);
  };
  
  // 총액 계산
  const calculateTotal = (items: AdditionalAdjustmentItem[]) => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };
  
  // 항목 목록 저장
  const saveItems = (items: AdditionalAdjustmentItem[]) => {
    try {
      // 총액 계산
      const totalAmount = calculateTotal(items);
      
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
      
      // 추가 조정 항목 업데이트
      updatedIncome.additionalAdjustmentItems = items;
      
      // 기타 조정 필드에 총액 설정
      updatedIncome.adjustments.otherAdjustments = totalAmount;
      
      // 총소득 계산 (이미 소득 필드에서 계산되어 있을 수 있음)
      if (!updatedIncome.totalIncome) {
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
      }
      
      // 조정 총소득(AGI) 재계산
      const adjustments = updatedIncome.adjustments;
      const totalAdjustments = 
        (adjustments.studentLoanInterest || 0) + 
        (adjustments.retirementContributions || 0) + 
        (adjustments.healthSavingsAccount || 0) + 
        (adjustments.otherAdjustments || 0);
      
      updatedIncome.adjustedGrossIncome = updatedIncome.totalIncome - totalAdjustments;
      
      // 컨텍스트 업데이트
      updateTaxData({ income: updatedIncome });
      console.log("소득 데이터 업데이트 (조정 항목):", updatedIncome);
      console.log("저장된 조정 항목 목록:", items);
      
      // 추가된 부분: 디버깅을 위해 특정 시간 후 taxData 출력
      setTimeout(() => {
        console.log("조정 항목 저장 후 taxData 확인:", taxData.income?.additionalAdjustmentItems);
      }, 500);
    } catch (error) {
      console.error("조정 항목 데이터 업데이트 중 오류:", error);
    }
  };
  
  // 저장 및 돌아가기 핸들러
  const handleSaveAndReturn = () => {
    // 이미 saveItems 함수에서 데이터를 저장하므로 바로 돌아가기
    navigate('/income');
    
    toast({
      title: "저장 완료",
      description: "조정 항목이 저장되었습니다."
    });
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
          <CardTitle className="text-xl font-heading text-primary-dark">
            기타 조정 항목 (Additional Adjustment Items)
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="mb-8">
            <p className="text-sm text-gray-dark mb-4">
              소득 조정에 반영할 추가 항목을 입력하세요. 입력 후 항목 추가 버튼을 클릭하세요.
            </p>
            
            <div className="bg-gray-50 p-5 rounded-lg border mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">조정 항목</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full p-2 border rounded mt-1"
                  >
                    <option value="">선택하세요</option>
                    {ADJUSTMENT_TYPES.map((type) => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">금액</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">설명 (선택사항)</label>
                  <Input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="추가 정보를 입력하세요 (선택사항)"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <Button 
                  onClick={handleAddItem}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  항목 추가
                </Button>
              </div>
            </div>
            
            {itemsList.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">추가된 조정 항목</h3>
                <div className="space-y-3 border rounded-lg divide-y overflow-hidden">
                  {itemsList.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-white">
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
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex justify-between items-center p-4 bg-gray-50 font-bold">
                    <span>총계 (Total)</span>
                    <span>{formatCurrency(calculateTotal(itemsList))}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-8 flex justify-end">
              <Button 
                onClick={handleSaveAndReturn}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                저장 및 돌아가기
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-4 p-4 border rounded bg-blue-50">
        <h3 className="text-lg font-semibold mb-2">조정 항목 정보</h3>
        <div className="space-y-2">
          {ADJUSTMENT_TYPES.map((type) => (
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