import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTaxContext } from "@/context/TaxContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/taxCalculations";
import { AdditionalIncomeItem } from "@shared/schema";
import { ArrowLeft, Info as InfoIcon, Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// 소득 항목 타입 정의
const INCOME_TYPES = [
  {
    id: "gambling_winnings",
    label: "도박 소득 (Gambling winnings)",
    info: "카지노, 로또, 온라인 게임 등에서 얻은 소득을 포함합니다."
  },
  {
    id: "alimony",
    label: "위자료 (Alimony)",
    info: "이혼 합의에 따라 받은 정기적인 위자료 지급금입니다."
  },
  {
    id: "jury_duty",
    label: "배심원 수당 (Jury duty pay)",
    info: "배심원으로 참여하여 받은 보수입니다."
  },
  {
    id: "prizes_awards",
    label: "상금 및 경품 (Prizes and awards)",
    info: "대회, 경연, 이벤트 등에서 받은 상금이나 경품입니다."
  },
  {
    id: "hobby_income",
    label: "취미 활동 소득 (Hobby income)",
    info: "사업이 아닌 취미 활동을 통해 얻은 수입입니다."
  },
  {
    id: "royalties",
    label: "저작권 사용료 (Royalties)",
    info: "책, 음악, 특허 등의 지적재산권에서 발생한 수입입니다."
  },
  {
    id: "virtual_currency",
    label: "가상화폐 소득 (Virtual currency income)",
    info: "비트코인 등 가상화폐 거래로 인한 소득입니다."
  },
  {
    id: "other_income",
    label: "기타 소득 (Other income)",
    info: "위 항목에 해당하지 않는 기타 소득입니다."
  }
];

export default function AdditionalIncomeSimplePage() {
  const [, navigate] = useLocation();
  const { taxData, updateTaxData } = useTaxContext();
  const { toast } = useToast();
  
  // 저장된 항목 목록
  const [itemsList, setItemsList] = useState<AdditionalIncomeItem[]>([]);
  
  // 새 항목 입력을 위한 상태
  const [type, setType] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  // 컴포넌트 마운트 시 기존 데이터 로드
  useEffect(() => {
    console.log("컴포넌트 마운트: 기존 데이터 로드", taxData.income?.additionalIncomeItems);
    if (taxData.income?.additionalIncomeItems && taxData.income.additionalIncomeItems.length > 0) {
      setItemsList(taxData.income.additionalIncomeItems);
    }
  }, [taxData.income?.additionalIncomeItems]);
  
  // 항목 추가 핸들러
  const handleAddItem = () => {
    // 입력 검증
    if (!type) {
      toast({
        title: "항목 선택 필요",
        description: "추가할 소득 항목을 선택해주세요.",
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
    const typeLabel = INCOME_TYPES.find(t => t.id === type)?.label || type;
    
    // 새 항목 생성
    const newItem: AdditionalIncomeItem = {
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
      description: "소득 항목이 목록에 추가되었습니다."
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
  const calculateTotal = (items: AdditionalIncomeItem[]) => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };
  
  // 항목 목록 저장
  const saveItems = (items: AdditionalIncomeItem[]) => {
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
      
      // 추가 소득 항목 업데이트
      updatedIncome.additionalIncomeItems = items;
      
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
      
      // 컨텍스트 업데이트
      updateTaxData({ income: updatedIncome });
      console.log("소득 데이터 업데이트:", updatedIncome);
    } catch (error) {
      console.error("소득 데이터 업데이트 중 오류:", error);
    }
  };
  
  // 저장 및 돌아가기 핸들러
  const handleSaveAndReturn = () => {
    // 이미 saveItems 함수에서 데이터를 저장하므로 바로 돌아가기
    navigate('/income');
    
    toast({
      title: "저장 완료",
      description: "기타소득 항목이 저장되었습니다."
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
            기타 소득 항목 (Additional Income Items)
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="mb-8">
            <p className="text-sm text-gray-dark mb-4">
              주 소득 외에 추가로 신고해야 하는 소득 항목을 입력하세요. 입력 후 항목 추가 버튼을 클릭하세요.
            </p>
            
            <div className="bg-gray-50 p-5 rounded-lg border mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">소득 항목</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full p-2 border rounded mt-1"
                  >
                    <option value="">선택하세요</option>
                    {INCOME_TYPES.map((type) => (
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
                <h3 className="text-lg font-semibold mb-4">추가된 소득 항목</h3>
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