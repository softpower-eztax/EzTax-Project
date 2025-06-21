import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useTaxContext } from '@/context/TaxContext';
import ProgressTracker from '@/components/ProgressTracker';
import StepNavigation from '@/components/StepNavigation';
import { formatCurrency } from '@/lib/taxCalculations';
import { getStateTaxRule } from '@shared/stateTaxRules';
import { StateSpecificDeductionInput } from '@shared/schema';
import { Info, DollarSign, FileText } from 'lucide-react';

interface StateDeductionForm {
  stateWithholding: number;
  stateSpecificDeductions: StateSpecificDeductionInput[];
  appliedStateCredits: StateSpecificDeductionInput[];
}

export default function StateTaxDetailed() {
  const { taxData, updateTaxData } = useTaxContext();
  const [calculatingTax, setCalculatingTax] = useState(false);
  
  const userState = taxData.personalInfo?.state;
  const stateRule = userState ? getStateTaxRule(userState) : null;
  
  const form = useForm<StateDeductionForm>({
    defaultValues: {
      stateWithholding: taxData.stateIncomeTax?.stateWithholding || 0,
      stateSpecificDeductions: taxData.stateIncomeTax?.stateSpecificDeductions || [],
      appliedStateCredits: taxData.stateIncomeTax?.appliedStateCredits || []
    }
  });

  // Initialize deductions and credits based on state rules
  useEffect(() => {
    if (stateRule && stateRule.stateSpecificDeductions) {
      const existingDeductions = form.getValues('stateSpecificDeductions');
      const newDeductions = stateRule.stateSpecificDeductions.map(deduction => {
        const existing = existingDeductions.find(d => d.id === deduction.id);
        return existing || { id: deduction.id, amount: 0, qualified: false };
      });
      form.setValue('stateSpecificDeductions', newDeductions);
    }

    if (stateRule && stateRule.stateCredits) {
      const existingCredits = form.getValues('appliedStateCredits');
      const newCredits = stateRule.stateCredits.map(credit => {
        const existing = existingCredits.find(c => c.id === credit.id);
        return existing || { id: credit.id, amount: 0, qualified: false };
      });
      form.setValue('appliedStateCredits', newCredits);
    }
  }, [stateRule, form]);

  const onSubmit = async (data: StateDeductionForm) => {
    setCalculatingTax(true);
    
    try {
      // Update state tax information with detailed deductions and credits
      const updatedStateIncomeTax = {
        ...taxData.stateIncomeTax,
        stateWithholding: data.stateWithholding,
        stateSpecificDeductions: data.stateSpecificDeductions,
        appliedStateCredits: data.appliedStateCredits
      };

      await updateTaxData({
        stateIncomeTax: updatedStateIncomeTax
      });
    } catch (error) {
      console.error('State tax calculation error:', error);
    } finally {
      setCalculatingTax(false);
    }
  };

  if (!userState || !stateRule) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            주 정보가 설정되지 않았습니다. 개인정보 페이지에서 거주 주를 선택해주세요.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!stateRule.hasIncomeTax) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ProgressTracker currentStep="state-tax" />
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {stateRule.stateName} 주 소득세
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {stateRule.stateName}은 주 소득세가 없습니다. 다음 단계로 진행하세요.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <StepNavigation
          prevStep="/additional-tax"
          nextStep="/review"
          submitText="검토 페이지로 (Go to Review)"
          onNext={() => true}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ProgressTracker currentStep="state-tax" />
      
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {stateRule.stateName} 주 소득세 세부 계산
          </CardTitle>
          <p className="text-gray-600">
            {stateRule.stateName}주의 세부 공제 항목과 크레딧을 확인하고 입력하세요.
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* State Withholding */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">주 원천징수세액</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stateWithholding">
                    {stateRule.stateName} 주 원천징수액 ($)
                  </Label>
                  <Input
                    id="stateWithholding"
                    type="number"
                    step="0.01"
                    {...form.register('stateWithholding', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* State-Specific Deductions */}
            {stateRule.stateSpecificDeductions && stateRule.stateSpecificDeductions.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {stateRule.stateName}주 특별 공제 항목
                </h3>
                
                {stateRule.stateSpecificDeductions.map((deduction, index) => (
                  <Card key={deduction.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{deduction.nameKorean}</h4>
                          <p className="text-sm text-gray-600">{deduction.descriptionKorean}</p>
                          {deduction.maxAmount && (
                            <Badge variant="outline" className="mt-1">
                              최대 {formatCurrency(deduction.maxAmount)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {deduction.requirementsKorean && (
                        <div className="text-xs text-gray-500">
                          <strong>자격 요건:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {deduction.requirementsKorean.map((req, i) => (
                              <li key={i}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`deduction-${deduction.id}-qualified`}
                            checked={form.watch(`stateSpecificDeductions.${index}.qualified`)}
                            onCheckedChange={(checked) => 
                              form.setValue(`stateSpecificDeductions.${index}.qualified`, !!checked)
                            }
                          />
                          <Label htmlFor={`deduction-${deduction.id}-qualified`}>
                            자격 요건 충족
                          </Label>
                        </div>
                        
                        <div>
                          <Label htmlFor={`deduction-${deduction.id}-amount`}>
                            공제 금액 ($)
                          </Label>
                          <Input
                            id={`deduction-${deduction.id}-amount`}
                            type="number"
                            step="0.01"
                            {...form.register(`stateSpecificDeductions.${index}.amount`, { valueAsNumber: true })}
                            disabled={!form.watch(`stateSpecificDeductions.${index}.qualified`)}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <Separator />

            {/* State Credits */}
            {stateRule.stateCredits && stateRule.stateCredits.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {stateRule.stateName}주 세액 크레딧
                </h3>
                
                {stateRule.stateCredits.map((credit, index) => (
                  <Card key={credit.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{credit.nameKorean}</h4>
                          <p className="text-sm text-gray-600">{credit.descriptionKorean}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">
                              최대 {formatCurrency(credit.maxAmount)}
                            </Badge>
                            {credit.incomeLimit && (
                              <Badge variant="secondary">
                                소득 한도: {formatCurrency(credit.incomeLimit)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`credit-${credit.id}-qualified`}
                            checked={form.watch(`appliedStateCredits.${index}.qualified`)}
                            onCheckedChange={(checked) => 
                              form.setValue(`appliedStateCredits.${index}.qualified`, !!checked)
                            }
                          />
                          <Label htmlFor={`credit-${credit.id}-qualified`}>
                            크레딧 자격 있음
                          </Label>
                        </div>
                        
                        <div>
                          <Label htmlFor={`credit-${credit.id}-amount`}>
                            크레딧 금액 ($)
                          </Label>
                          <Input
                            id={`credit-${credit.id}-amount`}
                            type="number"
                            step="0.01"
                            {...form.register(`appliedStateCredits.${index}.amount`, { valueAsNumber: true })}
                            disabled={!form.watch(`appliedStateCredits.${index}.qualified`)}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>중요:</strong> 실제 신고 시에는 {stateRule.stateName}주의 최신 세법 규정을 확인하시고, 
                전문 세무사의 상담을 받으시기 바랍니다. 이 계산기는 일반적인 추정치만 제공합니다.
              </AlertDescription>
            </Alert>

            <div className="flex gap-4">
              <Button 
                type="submit" 
                disabled={calculatingTax}
                className="flex-1"
              >
                {calculatingTax ? '계산 중...' : '주세 계산하기'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <StepNavigation
        prevStep="/additional-tax"
        nextStep="/review"
        submitText="검토 페이지로 (Go to Review)"
        onNext={() => {
          form.handleSubmit(onSubmit)();
          return true;
        }}
      />
    </div>
  );
}