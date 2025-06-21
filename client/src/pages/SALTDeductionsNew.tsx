import { useState, useEffect } from "react";
import { useTaxContext } from "@/context/TaxContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, RefreshCw, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function SALTDeductionsNew() {
  const { taxData, updateTaxData, saveTaxReturn } = useTaxContext();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // State for all SALT inputs - initialize with proper defaults
  const [taxType, setTaxType] = useState<'income' | 'sales'>('income');
  const [stateLocalIncomeTax, setStateLocalIncomeTax] = useState(0);
  const [stateLocalSalesTax, setStateLocalSalesTax] = useState(0);
  const [realEstateTax, setRealEstateTax] = useState(0);
  const [personalPropertyTax, setPersonalPropertyTax] = useState(0);
  const [totalSALT, setTotalSALT] = useState(0);

  // Remove problematic useEffect that was causing input resets

  const calculateTotalSALT = () => {
    const selectedTaxAmount = taxType === 'income' ? stateLocalIncomeTax : stateLocalSalesTax;
    const total = selectedTaxAmount + realEstateTax + personalPropertyTax;
    const limitedTotal = Math.min(total, 10000);
    
    console.log('SALT 계산 디버그:', {
      taxType,
      selectedTaxAmount,
      realEstate: realEstateTax,
      personalProperty: personalPropertyTax,
      total,
      limitedTotal
    });
    
    // 사용자 입력값은 변경하지 않고, 총합만 한도에 맞춰 조정
    setTotalSALT(limitedTotal);
    
    if (total > 10000) {
      toast({
        title: "SALT 한도 적용",
        description: `입력하신 총 금액 $${total.toLocaleString()}이 $10,000 한도를 초과합니다. 실제 공제액은 $10,000로 제한됩니다.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "계산 완료",
        description: `SALT 공제 총액: $${total.toLocaleString()}`,
        variant: "default",
      });
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const selectedTaxAmount = taxType === 'income' ? stateLocalIncomeTax : stateLocalSalesTax;
      
      // Calculate total SALT for storage
      const totalSaltAmount = selectedTaxAmount + realEstateTax + personalPropertyTax;
      const limitedSaltAmount = Math.min(totalSaltAmount, 10000);
      
      const updatedDeductions = {
        ...taxData.deductions,
        useStandardDeduction: false,
        standardDeductionAmount: 0,
        totalDeductions: limitedSaltAmount,
        itemizedDeductions: {
          ...taxData.deductions?.itemizedDeductions,
          stateLocalIncomeTax: limitedSaltAmount, // Store total SALT amount here
          realEstateTaxes: realEstateTax,
          medicalExpenses: taxData.deductions?.itemizedDeductions?.medicalExpenses || 0,
          mortgageInterest: taxData.deductions?.itemizedDeductions?.mortgageInterest || 0,
          charitableCash: taxData.deductions?.itemizedDeductions?.charitableCash || 0,
          charitableNonCash: taxData.deductions?.itemizedDeductions?.charitableNonCash || 0
        }
      };

      await updateTaxData({ deductions: updatedDeductions });
      await saveTaxReturn();
      
      toast({
        title: "저장 완료",
        description: "SALT 공제 정보가 성공적으로 저장되었습니다.",
      });
    } catch (error) {
      console.error('저장 오류:', error);
      toast({
        title: "저장 실패",
        description: "데이터 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/deductions">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              공제 페이지로 돌아가기
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Info className="h-6 w-6 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">SALT 공제 항목별 입력</h1>
        </div>
        <p className="text-gray-600">
          주 및 지방세 공제(SALT)의 세부 항목을 입력하세요. 최대 $10,000까지 공제 가능합니다.
        </p>
      </div>

      <div className="space-y-8">
        {/* 세금 유형 선택 */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold">세금 유형 선택</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-gray-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>주/지방 소득세 또는 판매세 중 하나만 선택할 수 있습니다.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <RadioGroup value={taxType} onValueChange={(value: 'income' | 'sales') => setTaxType(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="income" id="income" />
              <Label htmlFor="income">주/지방 소득세 (State/Local Income Tax)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sales" id="sales" />
              <Label htmlFor="sales">주/지방 판매세 (State/Local Sales Tax)</Label>
            </div>
          </RadioGroup>
        </div>

        {/* 세금 입력 필드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 주/지방 소득세 */}
          <div className={`space-y-2 ${taxType !== 'income' ? 'opacity-50' : ''}`}>
            <Label className="text-base font-medium">주/지방 소득세 (State/Local Income Tax)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark font-semibold">$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="pl-8"
                value={stateLocalIncomeTax}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === '' || !isNaN(Number(inputValue))) {
                    const numValue = inputValue === '' ? 0 : Number(inputValue);
                    console.log('주/지방 소득세 입력 변경:', inputValue, '->', numValue);
                    setStateLocalIncomeTax(numValue);
                    setTimeout(() => calculateTotalSALT(), 50);
                  }
                }}
                disabled={taxType !== 'income'}
                placeholder="0"
              />
            </div>
          </div>

          {/* 주/지방 판매세 */}
          <div className={`space-y-2 ${taxType !== 'sales' ? 'opacity-50' : ''}`}>
            <Label className="text-base font-medium">주/지방 판매세 (State/Local Sales Tax)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark font-semibold">$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="pl-8"
                value={stateLocalSalesTax}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === '' || !isNaN(Number(inputValue))) {
                    const numValue = inputValue === '' ? 0 : Number(inputValue);
                    console.log('주/지방 판매세 입력 변경:', inputValue, '->', numValue);
                    setStateLocalSalesTax(numValue);
                    setTimeout(() => calculateTotalSALT(), 50);
                  }
                }}
                disabled={taxType !== 'sales'}
                placeholder="0"
              />
            </div>
          </div>

          {/* 부동산세 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-base font-medium">부동산세 (Real Estate Tax)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>주택, 토지 등 부동산에 대해 납부한 세금</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark font-semibold">$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="pl-8"
                value={realEstateTax}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === '' || !isNaN(Number(inputValue))) {
                    const numValue = inputValue === '' ? 0 : Number(inputValue);
                    console.log('부동산세 입력 변경:', inputValue, '->', numValue);
                    setRealEstateTax(numValue);
                    setTimeout(() => calculateTotalSALT(), 50);
                  }
                }}
                placeholder="0"
              />
            </div>
          </div>

          {/* 개인재산세 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-base font-medium">개인재산세 (Personal Property Tax)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>자동차, 보트 등 개인 재산에 대해 납부한 세금</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark font-semibold">$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="pl-8"
                value={personalPropertyTax}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === '' || !isNaN(Number(inputValue))) {
                    const numValue = inputValue === '' ? 0 : Number(inputValue);
                    console.log('개인재산세 입력 변경:', inputValue, '->', numValue);
                    setPersonalPropertyTax(numValue);
                    setTimeout(() => calculateTotalSALT(), 50);
                  }
                }}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* SALT 총액 표시 */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                SALT 공제 총액 (Total SALT Deduction)
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={calculateTotalSALT}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                계산
              </Button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark font-semibold">$</span>
              <div className="pl-8 pr-4 py-3 text-xl font-bold bg-white border-2 border-blue-300 rounded-md min-h-[50px] flex items-center">
                {totalSALT.toLocaleString()}
              </div>
            </div>
            <p className="text-sm text-gray-600">
              최대 $10,000까지 공제 가능합니다. 
              {totalSALT >= 10000 && (
                <span className="text-red-600 font-semibold"> 한도에 도달했습니다.</span>
              )}
            </p>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end gap-4">
          <Link href="/deductions">
            <Button variant="outline">
              취소
            </Button>
          </Link>
          <Button 
            onClick={handleSave}
            disabled={isLoading}
            className="bg-primary-dark hover:bg-primary text-white px-8"
          >
            {isLoading ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>
    </div>
  );
}