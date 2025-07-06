import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTaxContext } from '@/context/TaxContext';
import { useToast } from '@/hooks/use-toast';
import { Info, RefreshCw, ArrowLeft } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";

export default function SALTDeductionsNew() {
  const { taxData, updateTaxData } = useTaxContext();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  
  // State for all SALT inputs - initialize with proper defaults
  const [taxType, setTaxType] = useState<'income' | 'sales'>('income');
  const [stateLocalIncomeTax, setStateLocalIncomeTax] = useState(0);
  const [stateLocalSalesTax, setStateLocalSalesTax] = useState(0);
  const [realEstateTax, setRealEstateTax] = useState(0);
  const [personalPropertyTax, setPersonalPropertyTax] = useState(0);
  
  // Load existing data on component mount
  useEffect(() => {
    if (taxData.deductions?.itemizedDeductions) {
      const itemized = taxData.deductions.itemizedDeductions;
      setStateLocalIncomeTax(itemized.stateLocalIncomeTax || 0);
      setRealEstateTax(itemized.realEstateTaxes || 0);
      setPersonalPropertyTax(itemized.personalPropertyTax || 0);
      console.log('기존 SALT 데이터 로드:', itemized);
    }
  }, [taxData.deductions]);

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      const selectedTaxAmount = taxType === 'income' ? stateLocalIncomeTax : stateLocalSalesTax;
      
      // Get medical expenses from existing data or localStorage
      let medicalExpenses = 0;
      if (taxData.deductions?.itemizedDeductions?.medicalExpenses) {
        medicalExpenses = taxData.deductions.itemizedDeductions.medicalExpenses;
      } else {
        const localData = localStorage.getItem('currentTaxFormData');
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            medicalExpenses = parsed.deductions?.itemizedDeductions?.medicalExpenses || 0;
          } catch (e) {
            console.error('localStorage 파싱 오류:', e);
          }
        }
      }
      
      // 기존 공제 데이터 구조 유지하면서 업데이트
      const currentDeductions = taxData.deductions || {
        useStandardDeduction: false,
        standardDeductionAmount: 0,
        itemizedDeductions: {
          medicalExpenses: 0,
          stateLocalIncomeTax: 0,
          realEstateTaxes: 0,
          personalPropertyTax: 0,
          mortgageInterest: 0,
          charitableCash: 0,
          charitableNonCash: 0
        },
        otherDeductionItems: [],
        totalDeductions: 0
      };
      
      // 의료비는 기존 값 보존, SALT 데이터만 업데이트
      const updatedItemizedDeductions = {
        ...currentDeductions.itemizedDeductions,
        medicalExpenses: medicalExpenses,
        stateLocalIncomeTax: selectedTaxAmount,
        realEstateTaxes: realEstateTax,
        personalPropertyTax: personalPropertyTax
      };
      
      // Total itemized deductions calculation
      const totalItemized = Object.values(updatedItemizedDeductions).reduce((sum: number, val: number) => sum + (val || 0), 0);
      
      const updatedDeductions = {
        ...currentDeductions,
        itemizedDeductions: updatedItemizedDeductions,
        totalDeductions: currentDeductions.useStandardDeduction 
          ? currentDeductions.standardDeductionAmount
          : totalItemized
      };
      
      console.log('SALT 저장 데이터:', {
        selectedType: taxType,
        selectedAmount: selectedTaxAmount,
        realEstateTax: realEstateTax,
        personalPropertyTax: personalPropertyTax,
        medicalPreserved: medicalExpenses
      });

      // 세금 컨텍스트 업데이트
      await updateTaxData({ deductions: updatedDeductions });
      
      toast({
        title: "저장 완료",
        description: "SALT 공제 정보가 성공적으로 저장되었습니다.",
      });
      
      // Navigate back to deductions page
      navigate('/deductions');
      
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

  const calculateTotalSALT = () => {
    const selectedTaxAmount = taxType === 'income' ? stateLocalIncomeTax : stateLocalSalesTax;
    return selectedTaxAmount + realEstateTax + personalPropertyTax;
  };

  const limitedSALT = Math.min(calculateTotalSALT(), 10000);

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
          <h1 className="text-2xl font-bold text-gray-900">SALT 공제 (State and Local Tax)</h1>
        </div>
        <p className="text-gray-600 ml-14">
          주 및 지방세 공제는 연간 최대 $10,000까지 가능합니다.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Input Forms */}
        <div className="space-y-6">
          {/* Tax Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>1. 공제할 세금 종류 선택</CardTitle>
              <CardDescription>
                주 소득세 또는 주 판매세 중 하나만 선택 가능합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={taxType} 
                onValueChange={(value) => setTaxType(value as 'income' | 'sales')}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="income" />
                  <Label htmlFor="income" className="font-medium">
                    주 및 지방 소득세 (State and Local Income Tax)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sales" id="sales" />
                  <Label htmlFor="sales" className="font-medium">
                    주 및 지방 판매세 (State and Local Sales Tax)
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Tax Amount Input */}
          <Card>
            <CardHeader>
              <CardTitle>
                2. {taxType === 'income' ? '주 및 지방 소득세' : '주 및 지방 판매세'} 금액
              </CardTitle>
              <CardDescription>
                {taxType === 'income' 
                  ? 'W-2나 1099에서 원천징수된 주 소득세 및 지방 소득세 총액을 입력하세요.'
                  : 'IRS 판매세 계산표나 실제 지불한 판매세 총액을 입력하세요.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor={`${taxType}-tax`}>
                  {taxType === 'income' ? '소득세' : '판매세'} 금액
                </Label>
                <Input
                  id={`${taxType}-tax`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={taxType === 'income' ? stateLocalIncomeTax : stateLocalSalesTax}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    if (taxType === 'income') {
                      setStateLocalIncomeTax(value);
                    } else {
                      setStateLocalSalesTax(value);
                    }
                  }}
                  placeholder="달러 금액"
                  className="text-lg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Real Estate Tax */}
          <Card>
            <CardHeader>
              <CardTitle>3. 부동산세 (Real Estate Tax)</CardTitle>
              <CardDescription>
                주거용 부동산에 대해 지불한 부동산세 총액을 입력하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="real-estate-tax">부동산세 금액</Label>
                <Input
                  id="real-estate-tax"
                  type="number"
                  min="0"
                  step="0.01"
                  value={realEstateTax}
                  onChange={(e) => setRealEstateTax(parseFloat(e.target.value) || 0)}
                  placeholder="달러 금액"
                  className="text-lg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Personal Property Tax */}
          <Card>
            <CardHeader>
              <CardTitle>4. 개인재산세 (Personal Property Tax)</CardTitle>
              <CardDescription>
                자동차, 보트 등 개인재산에 대해 지불한 세금을 입력하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="personal-property-tax">개인재산세 금액</Label>
                <Input
                  id="personal-property-tax"
                  type="number"
                  min="0"
                  step="0.01"
                  value={personalPropertyTax}
                  onChange={(e) => setPersonalPropertyTax(parseFloat(e.target.value) || 0)}
                  placeholder="달러 금액"
                  className="text-lg"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Summary and Actions */}
        <div className="space-y-6">
          {/* SALT Summary */}
          <Card>
            <CardHeader>
              <CardTitle>SALT 공제 요약</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>{taxType === 'income' ? '주 및 지방 소득세:' : '주 및 지방 판매세:'}</span>
                  <span className="font-medium">
                    ${(taxType === 'income' ? stateLocalIncomeTax : stateLocalSalesTax).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>부동산세:</span>
                  <span className="font-medium">${realEstateTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>개인재산세:</span>
                  <span className="font-medium">${personalPropertyTax.toLocaleString()}</span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span>SALT 총액:</span>
                  <span className="font-medium">${calculateTotalSALT().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                  <span>공제 가능 금액:</span>
                  <span className={limitedSALT < calculateTotalSALT() ? 'text-red-600' : 'text-green-600'}>
                    ${limitedSALT.toLocaleString()}
                  </span>
                </div>
                {limitedSALT < calculateTotalSALT() && (
                  <p className="text-sm text-red-600">
                    * SALT 공제는 연간 최대 $10,000로 제한됩니다.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleSave}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                'SALT 공제 저장'
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/deductions')}
              className="w-full"
            >
              취소
            </Button>
          </div>

          {/* Information Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">💡 도움말</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700 space-y-2">
              <p className="text-sm">
                • SALT 공제는 항목별 공제를 선택한 경우에만 적용됩니다.
              </p>
              <p className="text-sm">
                • 주 소득세와 판매세는 동시에 공제할 수 없습니다.
              </p>
              <p className="text-sm">
                • 부동산세는 실제 소유한 부동산에 대해서만 공제 가능합니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}