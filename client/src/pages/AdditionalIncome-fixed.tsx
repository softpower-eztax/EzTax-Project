import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useTaxContext } from "@/context/TaxContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/taxCalculations";
import { AdditionalIncomeItem } from "@shared/schema";
import { ArrowLeft, Info as InfoIcon, Plus, X, Save } from "lucide-react";
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

export default function AdditionalIncomeFixedPage() {
  const [, navigate] = useLocation();
  const { taxData, updateTaxData } = useTaxContext();
  const { toast } = useToast();
  
  // 상태 정의 - 초기화 시에는 빈 배열로 설정하고, useEffect에서 데이터 로딩
  const [itemsList, setItemsList] = useState<AdditionalIncomeItem[]>([]);
  
  // 여러 개의 입력 필드를 관리하기 위한 상태
  const [inputFields, setInputFields] = useState<{
    id: number;
    type: string;
    amount: string;
    description: string;
  }[]>([
    { id: 1, type: '', amount: '', description: '' } // 초기 입력 필드 하나
  ]);
  
  // 컴포넌트 마운트 시 기존 데이터 로드
  useEffect(() => {
    console.log("컴포넌트 마운트: 기존 데이터 로드", taxData.income?.additionalIncomeItems);
    if (taxData.income?.additionalIncomeItems && taxData.income.additionalIncomeItems.length > 0) {
      setItemsList(taxData.income.additionalIncomeItems);
    }
  }, []);
  
  console.log("현재 아이템 목록:", itemsList);

  // 새 입력 필드 추가 핸들러
  const addInputField = () => {
    const newId = inputFields.length > 0 
      ? Math.max(...inputFields.map(field => field.id)) + 1 
      : 1;
    
    setInputFields([
      ...inputFields,
      { id: newId, type: '', amount: '', description: '' }
    ]);
    
    toast({
      title: "입력 필드 추가됨",
      description: "새로운 항목을 입력할 수 있습니다."
    });
  };
  
  // 입력 필드 값 업데이트 핸들러
  const handleInputChange = (id: number, field: string, value: string) => {
    const updatedFields = inputFields.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    setInputFields(updatedFields);
  };
  
  // 입력 필드 삭제 핸들러
  const removeInputField = (id: number) => {
    if (inputFields.length === 1) {
      toast({
        title: "삭제 불가",
        description: "최소 하나의 입력 필드는 있어야 합니다.",
        variant: "destructive"
      });
      return;
    }
    
    setInputFields(inputFields.filter(field => field.id !== id));
  };
  
  // 항목 저장 핸들러
  const saveItems = () => {
    console.log("항목 저장 함수 호출됨");
    
    // 유효한 항목들만 필터링
    const validItems = inputFields.filter(field => 
      field.type && parseFloat(field.amount) > 0
    );
    
    if (validItems.length === 0) {
      toast({
        title: "저장 불가",
        description: "유효한 항목이 없습니다. 최소한 하나의 항목과 금액을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }
    
    // 유효한 항목들을 AdditionalIncomeItem 형식으로 변환
    const newItems: AdditionalIncomeItem[] = validItems.map(field => {
      const amount = parseFloat(field.amount);
      const typeLabel = INCOME_TYPES.find(type => type.id === field.type)?.label || field.type;
      
      return {
        type: typeLabel,
        amount,
        description: field.description || undefined
      };
    });
    
    // 항목 목록에 추가
    const updatedItems = [...itemsList, ...newItems];
    setItemsList(updatedItems);
    
    // 입력 필드 초기화 - 하나의 빈 필드만 남김
    setInputFields([{ id: 1, type: '', amount: '', description: '' }]);
    
    toast({
      title: "항목 저장 성공",
      description: `${newItems.length}개의 소득 항목이 저장되었습니다.`
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
  
  // 항목 목록이 변경될 때마다 즉시 저장 (디바운스 제거)
  useEffect(() => {
    console.log("아이템 목록 변경 감지:", itemsList);
  
    try {
      // 기존 데이터와 합치기
      const baseIncome = taxData.income || {
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
        adjustedGrossIncome: 0,
        additionalIncomeItems: []
      };
      
      // 소득 데이터 복제 (깊은 복사)
      const updatedIncome = JSON.parse(JSON.stringify(baseIncome));
      
      // 항목 목록 및 합계 업데이트
      updatedIncome.additionalIncomeItems = [...itemsList];
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
      
      // 실시간 데이터 저장
      updateTaxData({ income: updatedIncome });
      console.log("소득 데이터 업데이트:", updatedIncome);
    } catch (error) {
      console.error("소득 데이터 업데이트 중 오류:", error);
    }
  }, [itemsList]);
  
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
              주 소득 외에 추가로 신고해야 하는 소득 항목을 입력하세요. 항목 추가 버튼을 클릭하여 새로운 입력 필드를 추가할 수 있습니다.
            </p>
            
            <div className="space-y-6 mb-6">
              {inputFields.map((field) => (
                <div key={field.id} className="p-4 border rounded-md bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">소득 항목 #{field.id}</h4>
                    {inputFields.length > 1 && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => removeInputField(field.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        필드 삭제
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">항목 (Item)</label>
                      <select 
                        value={field.type}
                        onChange={(e) => handleInputChange(field.id, 'type', e.target.value)}
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
                        value={field.amount}
                        onChange={(e) => handleInputChange(field.id, 'amount', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium">설명 (Description) - 선택사항</label>
                      <Input
                        type="text"
                        value={field.description}
                        onChange={(e) => handleInputChange(field.id, 'description', e.target.value)}
                        placeholder="추가 정보를 입력하세요 (선택사항)"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col md:flex-row gap-3">
              <Button 
                type="button"
                onClick={addInputField}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                항목 추가
              </Button>
              
              <Button
                type="button" 
                onClick={saveItems}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="h-4 w-4 mr-1" />
                항목 저장
              </Button>
            </div>
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