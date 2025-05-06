import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { AdditionalIncomeItem, Income } from '@shared/schema';
import { useTaxContext } from '@/context/TaxContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import ProgressTracker from '@/components/ProgressTracker';
import StepNavigation from '@/components/StepNavigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { InfoIcon, Plus, X, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/taxCalculations';

const AdditionalIncomePage: React.FC = () => {
  const [, navigate] = useLocation();
  const { taxData, updateTaxData, saveTaxReturn } = useTaxContext();
  const { toast } = useToast();
  
  // Local state for the new income item
  const [incomeType, setIncomeType] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeDescription, setIncomeDescription] = useState("");
  
  // Local state for the list of additional income items
  const [additionalIncomeItems, setAdditionalIncomeItems] = useState<AdditionalIncomeItem[]>([]);
  
  // Load existing data
  useEffect(() => {
    if (taxData.income?.additionalIncomeItems) {
      setAdditionalIncomeItems(taxData.income.additionalIncomeItems);
    }
  }, [taxData.income?.additionalIncomeItems]);
  
  // Additional income types from requirements
  const additionalIncomeTypes = [
    "도박 소득 (Gambling winnings)",
    "부채 탕감 (Cancellation of debt)",
    "해외 근로소득 제외액 (Form 2555) (Foreign earned income exclusion (Form 2555))",
    "Archer 의료 저축 계좌 인출액 및 장기요양보험 지급금 (Form 8853) (Distributions from Archer MSAs and long-term care insurance contracts (Form 8853))",
    "HSA 계좌 인출액 (Form 8889) (Health Savings Accounts /HSA (Form 8889))",
    "알래스카 영구 기금 배당금 (Alaska Permanent Fund dividends)",
    "배심원 수당 (Jury duty pay)",
    "상금 및 수상금 (Prizes and awards)",
    "취미활동 소득 (Activity not engaged in for profit income)",
    "스톡옵션 소득 (Stock options)",
    "올림픽 및 패럴림픽 메달과 미국올림픽위원회(USOC) 상금 (Olympic and Paralympic medals and USOC prize money)",
    "ABLE 계좌로부터의 과세 대상 분배금 (Taxable distributions from an ABLE account)",
    "Form W-2에 보고되지 않은 장학금 및 연구비 보조금 (Scholarship and fellowship grants not reported on Form W-2)",
    "비자격 이연 보상 계획 또는 비정부 457 플랜으로부터의 연금 또는 연금소득 (Pension or annuity from a nonqualified deferred compensation plan or a nongovernmental section 457 plan)",
    "수감 중 벌어들인 임금 (Wages earned while incarcerated)",
    "다른 곳에 보고되지 않은 일반 소득으로 수령한 디지털 자산 (Digital assets received as ordinary income not reported elsewhere)"
  ];
  
  // Handle adding an additional income item
  const handleAddIncome = () => {
    if (!incomeType || !incomeAmount) {
      toast({
        title: "입력 오류",
        description: "소득 유형과 금액을 모두A 입력해주세요.",
        variant: "destructive"
      });
      return;
    }
    
    const amount = parseFloat(incomeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "금액 오류",
        description: "유효한 금액을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }
    
    const newItem: AdditionalIncomeItem = {
      type: incomeType,
      amount,
      description: incomeDescription || undefined
    };
    
    const updatedItems = [...additionalIncomeItems, newItem];
    setAdditionalIncomeItems(updatedItems);
    
    // Reset form
    setIncomeType("");
    setIncomeAmount("");
    setIncomeDescription("");
    
    toast({
      title: "추가 소득 추가됨",
      description: `${incomeType}: ${formatCurrency(amount)} 추가되었습니다.`
    });
  };
  
  // Handle removing an additional income item
  const handleRemoveIncome = (index: number) => {
    const updatedItems = additionalIncomeItems.filter((_, i) => i !== index);
    setAdditionalIncomeItems(updatedItems);
    
    toast({
      title: "추가 소득 제거됨",
      description: "선택한 추가 소득 항목이 제거되었습니다."
    });
  };
  
  // Calculate total additional income
  const totalAdditionalIncome = additionalIncomeItems.reduce(
    (sum, item) => sum + Number(item.amount), 0
  );
  
  // Handle saving and navigating
  const handleSave = async () => {
    try {
      // Get current income data
      const currentIncome = taxData.income || {};
      
      // Update with new additional income items
      const updatedIncome = {
        ...currentIncome,
        additionalIncomeItems: additionalIncomeItems
      };
      
      // Update tax data
      await updateTaxData({ income: updatedIncome });
      await saveTaxReturn();
      
      toast({
        title: "저장 완료",
        description: "추가 소득 정보가 성공적으로 저장되었습니다."
      });
      
      // Navigate back to income page
      navigate('/income');
    } catch (error) {
      toast({
        title: "저장 오류",
        description: "추가 소득 정보 저장 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };
  
  // Handle cancel and return to income page
  const handleCancel = () => {
    navigate('/income');
  };
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-primary-dark mb-2">추가 소득 항목 입력</h1>
        <p className="text-gray-dark">소득 신고를 위한 추가 소득 항목을 입력하세요.</p>
      </div>
      
      <ProgressTracker currentStep={2} />
      
      <div className="my-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-heading text-primary-dark">새 추가 소득 항목 입력</CardTitle>
            <CardDescription>
              아래 항목을 입력하여 추가 소득을 등록하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="income-type" className="text-sm font-medium">
                  소득 유형 (Income Type)
                </label>
                <Select 
                  value={incomeType} 
                  onValueChange={setIncomeType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="소득 유형을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {additionalIncomeTypes.map((type, index) => (
                      <SelectItem key={index} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="income-amount" className="text-sm font-medium">
                  금액 (Amount)
                </label>
                <Input
                  id="income-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="income-description" className="text-sm font-medium">
                  설명 (Description - Optional)
                </label>
                <Input
                  id="income-description"
                  value={incomeDescription}
                  onChange={(e) => setIncomeDescription(e.target.value)}
                  placeholder="추가 설명 (선택사항)"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="button" 
                onClick={handleAddIncome}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                항목 추가
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-heading text-primary-dark">
              추가 소득 항목 목록
            </CardTitle>
          </CardHeader>
          <CardContent>
            {additionalIncomeItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>소득 유형</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>설명</TableHead>
                    <TableHead className="w-[80px]">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {additionalIncomeItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>{formatCurrency(item.amount)}</TableCell>
                      <TableCell>{item.description || '-'}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveIncome(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                추가된 소득 항목이 없습니다. 위 양식을 사용하여 항목을 추가하세요.
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <div className="font-semibold text-lg">
              총 추가 소득: {formatCurrency(totalAdditionalIncome)}
            </div>
          </CardFooter>
        </Card>
      </div>
      
      <StepNavigation
        prevStep="/income"
        nextStep="/income"
        onNext={() => {
          handleSave();
          return true;
        }}
        onPrev={handleCancel}
        submitText="완료 및 저장"
      />
    </div>
  );
};

export default AdditionalIncomePage;