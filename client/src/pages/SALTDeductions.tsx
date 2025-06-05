import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import ProgressTracker from '@/components/ProgressTracker';
import StepNavigation from '@/components/StepNavigation';
import { useTaxContext } from '@/context/TaxContext';
import { Info, Calculator, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatNumberInput } from '@/lib/taxCalculations';

// SALT 공제 인터페이스 정의
interface SALTDeductions {
  taxType: 'income' | 'sales'; // 소득세 또는 판매세 선택
  stateLocalIncomeTax: number;
  stateLocalSalesTax: number;
  realEstateTax: number;
  personalPropertyTax: number;
  totalSALT: number;
}

// 폼 스키마 정의
const saltSchema = z.object({
  taxType: z.enum(['income', 'sales']).default('income'),
  stateLocalIncomeTax: z.coerce.number().min(0).default(0),
  stateLocalSalesTax: z.coerce.number().min(0).default(0),
  realEstateTax: z.coerce.number().min(0).default(0),
  personalPropertyTax: z.coerce.number().min(0).default(0),
  totalSALT: z.coerce.number().min(0).max(10000).default(0),
});

type SALTFormData = z.infer<typeof saltSchema>;

export default function SALTDeductions() {
  const { taxData, updateTaxData, saveTaxReturn } = useTaxContext();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // 기본값 설정
  const defaultValues: SALTFormData = {
    taxType: 'income',
    stateLocalIncomeTax: 0,
    stateLocalSalesTax: 0,
    realEstateTax: 0,
    personalPropertyTax: 0,
    totalSALT: 0,
  };

  const form = useForm<SALTFormData>({
    resolver: zodResolver(saltSchema),
    defaultValues,
  });

  // 기존 데이터 로드
  useEffect(() => {
    if (taxData.deductions?.itemizedDeductions) {
      const saltAmount = taxData.deductions.itemizedDeductions.stateLocalIncomeTax || 0;
      const realEstateAmount = taxData.deductions.itemizedDeductions.realEstateTaxes || 0;
      
      form.reset({
        taxType: 'income',
        stateLocalIncomeTax: saltAmount,
        stateLocalSalesTax: 0,
        realEstateTax: realEstateAmount,
        personalPropertyTax: 0,
        totalSALT: Math.min(saltAmount + realEstateAmount, 10000),
      });
    }
  }, [taxData.deductions, form]);

  // SALT 총합 자동 계산
  const calculateTotalSALT = () => {
    const values = form.getValues();
    const selectedTaxAmount = values.taxType === 'income' 
      ? values.stateLocalIncomeTax 
      : values.stateLocalSalesTax;
    
    const total = selectedTaxAmount + values.realEstateTax + values.personalPropertyTax;
    const limitedTotal = Math.min(total, 10000);
    
    form.setValue('totalSALT', limitedTotal);
    
    if (total > 10000) {
      toast({
        title: "SALT 한도 초과",
        description: `SALT 공제는 연간 최대 $10,000까지만 가능합니다. 입력하신 금액: $${total.toLocaleString()}`,
        variant: "destructive"
      });
    }
    
    return limitedTotal;
  };

  // 세금 유형 변경 시 자동 계산
  const handleTaxTypeChange = (value: 'income' | 'sales') => {
    form.setValue('taxType', value);
    setTimeout(() => calculateTotalSALT(), 100);
  };

  // 폼 제출
  const onSubmit = async (data: SALTFormData) => {
    setIsLoading(true);
    
    try {
      const total = calculateTotalSALT();
      
      // Tax Credits 페이지의 SALT 필드 업데이트
      const updatedTaxCredits = {
        ...taxData.taxCredits,
        // SALT는 Tax Credits가 아니라 Deductions이므로 여기서는 업데이트하지 않음
      };

      // Deductions의 SALT 필드 업데이트 (기존 방식 유지)
      const updatedDeductions = {
        ...taxData.deductions,
        itemizedDeductions: {
          ...taxData.deductions?.itemizedDeductions,
          stateLocalIncomeTax: total, // 통합된 SALT 총액을 기존 필드에 저장
          realEstateTaxes: 0, // 별도 관리하므로 0으로 설정
        }
      };

      updateTaxData({ 
        deductions: updatedDeductions,
        saltDetails: data // 상세 SALT 데이터를 별도 필드에 저장
      });
      
      await saveTaxReturn();
      
      toast({
        title: "저장 완료",
        description: "SALT 공제 정보가 성공적으로 저장되었습니다.",
      });

    } catch (error) {
      toast({
        title: "저장 실패",
        description: "SALT 공제 정보 저장 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const watchTaxType = form.watch('taxType');

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-primary-dark mb-2">
          SALT 공제 상세 입력 (State and Local Tax Deductions)
        </h1>
        <p className="text-gray-dark">
          주 및 지방세 공제를 정확하게 입력하세요. 연간 최대 $10,000까지 공제 가능합니다.
        </p>
      </div>

      <ProgressTracker currentStep={3} />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            SALT 공제 항목별 입력
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* 세금 유형 선택 */}
              <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg">
                <FormField
                  control={form.control}
                  name="taxType"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2 mb-3">
                        <FormLabel className="text-lg font-semibold">세금 유형 선택</FormLabel>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-blue-600 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md p-4">
                              <p className="text-sm">
                                소득세와 판매세 중 하나만 선택할 수 있습니다. 
                                일반적으로 소득세가 높은 주에서는 소득세를, 
                                소득세가 없는 주에서는 판매세를 선택하는 것이 유리합니다.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={handleTaxTypeChange}
                          className="flex gap-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="income" id="income" />
                            <label htmlFor="income" className="font-medium">
                              주/지방 소득세 (State/Local Income Tax)
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sales" id="sales" />
                            <label htmlFor="sales" className="font-medium">
                              주/지방 판매세 (State/Local Sales Tax)
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 세금 입력 필드들 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 주/지방 소득세 */}
                <FormField
                  control={form.control}
                  name="stateLocalIncomeTax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={watchTaxType !== 'income' ? 'text-gray-400' : ''}>
                        주/지방 소득세 (State/Local Income Tax)
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="pl-8"
                            placeholder="0.00"
                            disabled={watchTaxType !== 'income'}
                            value={field.value || ''}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              field.onChange(value);
                              setTimeout(() => calculateTotalSALT(), 100);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        {watchTaxType === 'income' ? '선택된 세금 유형입니다' : '현재 비활성화됨'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 주/지방 판매세 */}
                <FormField
                  control={form.control}
                  name="stateLocalSalesTax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={watchTaxType !== 'sales' ? 'text-gray-400' : ''}>
                        주/지방 판매세 (State/Local Sales Tax)
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="pl-8"
                            placeholder="0.00"
                            disabled={watchTaxType !== 'sales'}
                            value={field.value || ''}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              field.onChange(value);
                              setTimeout(() => calculateTotalSALT(), 100);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        {watchTaxType === 'sales' ? '선택된 세금 유형입니다' : '현재 비활성화됨'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 부동산세 */}
                <FormField
                  control={form.control}
                  name="realEstateTax"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>부동산세 (Real Estate Tax)</FormLabel>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-gray-dark cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-sm">주택, 토지 등 부동산에 대한 재산세</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="pl-8"
                            placeholder="0.00"
                            value={field.value || ''}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              field.onChange(value);
                              setTimeout(() => calculateTotalSALT(), 100);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 개인재산세 */}
                <FormField
                  control={form.control}
                  name="personalPropertyTax"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>개인재산세 (Personal Property Tax)</FormLabel>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-gray-dark cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-sm">자동차, 보트 등 개인재산에 대한 세금</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="pl-8"
                            placeholder="0.00"
                            value={field.value || ''}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              field.onChange(value);
                              setTimeout(() => calculateTotalSALT(), 100);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* SALT 총합 */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                <FormField
                  control={form.control}
                  name="totalSALT"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel className="text-lg font-semibold">
                          SALT 공제 총액 (Total SALT Deduction)
                        </FormLabel>
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
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark font-semibold">$</span>
                          <Input
                            className="pl-8 text-lg font-semibold"
                            value={field.value || ''}
                            readOnly
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-sm text-gray-600">
                        최대 $10,000까지 공제 가능합니다. 
                        {field.value >= 10000 && (
                          <span className="text-red-600 font-medium"> 한도에 도달했습니다.</span>
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 저장 버튼 */}
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-primary-dark hover:bg-primary text-white px-8"
                >
                  {isLoading ? "저장 중..." : "SALT 공제 저장"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <StepNavigation 
        prevStep="/deductions" 
        nextStep="/tax-credits"
        onNext={async () => {
          const isValid = await form.trigger();
          if (isValid) {
            await form.handleSubmit(onSubmit)();
          }
          return isValid;
        }}
      />
    </div>
  );
}