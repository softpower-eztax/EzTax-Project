import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { deductionsSchema, type Deductions } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ProgressTracker from '@/components/ProgressTracker';

import StepNavigation from '@/components/StepNavigation';
import { useTaxContext } from '@/context/TaxContext';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateStandardDeduction } from '@/lib/taxCalculations';
import { useLocation } from 'wouter';

const Deductions: React.FC = () => {
  const { taxData, updateTaxData, resetToZero, saveTaxReturn } = useTaxContext();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isItemizedDisabled, setIsItemizedDisabled] = useState(true);
  
  // Calculate standard deduction based on filing status
  const standardDeductionAmount = calculateStandardDeduction(taxData.personalInfo?.filingStatus || 'single');
  
  // Reset function to clear form values
  const handleReset = () => {
    form.reset({
      useStandardDeduction: true,
      standardDeductionAmount: standardDeductionAmount,
      totalDeductions: standardDeductionAmount,
      itemizedDeductions: {
        medicalExpenses: 0,
        stateLocalIncomeTax: 0,
        realEstateTaxes: 0,
        mortgageInterest: 0,
        charitableCash: 0,
        charitableNonCash: 0
      }
    });
    
    // Update tax data with the reset values
    updateTaxData({
      deductions: {
        useStandardDeduction: true,
        standardDeductionAmount: standardDeductionAmount,
        totalDeductions: standardDeductionAmount,
        itemizedDeductions: {
          medicalExpenses: 0,
          stateLocalIncomeTax: 0,
          realEstateTaxes: 0,
          mortgageInterest: 0,
          charitableCash: 0,
          charitableNonCash: 0
        }
      }
    });
    
    toast({
      title: "값 초기화 완료",
      description: "모든 공제 항목이 초기화되었습니다.",
    });
  };
  
  // 모든 필드 값을 0으로 시작하는 기본값 설정
  const defaultValues: Deductions = {
    useStandardDeduction: true, // 기본적으로 표준공제 선택
    standardDeductionAmount: standardDeductionAmount,
    itemizedDeductions: {
      medicalExpenses: 0,
      stateLocalIncomeTax: 0,
      realEstateTaxes: 0,
      mortgageInterest: 0,
      charitableCash: 0,
      charitableNonCash: 0
    },
    totalDeductions: standardDeductionAmount,
    ...taxData.deductions
  };

  const form = useForm<Deductions>({
    resolver: zodResolver(deductionsSchema),
    defaultValues,
    mode: 'onChange'
  });

  const watchDeductionType = form.watch('useStandardDeduction');
  
  // Track changes to itemized deduction fields separately
  const watchItemizedFields = [
    form.watch('itemizedDeductions.medicalExpenses'),
    form.watch('itemizedDeductions.stateLocalIncomeTax'),
    form.watch('itemizedDeductions.realEstateTaxes'),
    form.watch('itemizedDeductions.mortgageInterest'),
    form.watch('itemizedDeductions.charitableCash'),
    form.watch('itemizedDeductions.charitableNonCash'),
  ];

  // When useStandardDeduction changes, update form field status
  useEffect(() => {
    setIsItemizedDisabled(watchDeductionType);
    
    // Calculate total deductions
    if (watchDeductionType) {
      form.setValue('totalDeductions', standardDeductionAmount);
      
      // 표준 공제 선택 시 항목별 공제 필드의 유효성 검사 오류를 초기화
      form.clearErrors('itemizedDeductions');
      
      // 표준 공제 선택 시에는 항목별 공제 필드 값을 초기화하지 않고 유지
      // 사용자가 다시 항목별 공제로 돌아올 때 이전 값들을 볼 수 있게 함
    } else {
      // 항목별 공제를 선택한 경우, 현재 입력된 항목별 공제 값들의 합계를 계산
      const itemized = form.getValues('itemizedDeductions');
      if (itemized) {
        const total = 
          Number(itemized.medicalExpenses || 0) +
          Number(itemized.stateLocalIncomeTax || 0) +
          Number(itemized.realEstateTaxes || 0) +
          Number(itemized.mortgageInterest || 0) +
          Number(itemized.charitableCash || 0) +
          Number(itemized.charitableNonCash || 0);
        
        form.setValue('totalDeductions', total);
      }
    }
  }, [watchDeductionType, form, standardDeductionAmount]);
  
  // Update total deductions when any itemized deduction field changes
  useEffect(() => {
    if (!watchDeductionType) {
      // 항목별 공제를 선택한 경우에만 합계 다시 계산
      const itemized = form.getValues('itemizedDeductions');
      if (itemized) {
        const total = 
          Number(itemized.medicalExpenses || 0) +
          Number(itemized.stateLocalIncomeTax || 0) +
          Number(itemized.realEstateTaxes || 0) +
          Number(itemized.mortgageInterest || 0) +
          Number(itemized.charitableCash || 0) +
          Number(itemized.charitableNonCash || 0);
        
        form.setValue('totalDeductions', total);
      }
    }
  }, [watchItemizedFields, watchDeductionType, form]);

  // Recalculate total itemized deductions when any value changes
  // Watch itemized fields individually to calculate total
  const watchMedicalExpenses = form.watch('itemizedDeductions.medicalExpenses');
  const watchStateLocalIncomeTax = form.watch('itemizedDeductions.stateLocalIncomeTax');
  const watchRealEstateTaxes = form.watch('itemizedDeductions.realEstateTaxes');
  const watchMortgageInterest = form.watch('itemizedDeductions.mortgageInterest');
  const watchCharitableCash = form.watch('itemizedDeductions.charitableCash');
  const watchCharitableNonCash = form.watch('itemizedDeductions.charitableNonCash');

  useEffect(() => {
    if (!watchDeductionType) {
      const itemized = form.getValues('itemizedDeductions');
      if (itemized) {
        const total = 
          Number(itemized.medicalExpenses || 0) +
          Number(itemized.stateLocalIncomeTax || 0) +
          Number(itemized.realEstateTaxes || 0) +
          Number(itemized.mortgageInterest || 0) +
          Number(itemized.charitableCash || 0) +
          Number(itemized.charitableNonCash || 0);
        
        form.setValue('totalDeductions', total);
      }
    }
  }, [
    watchMedicalExpenses, 
    watchStateLocalIncomeTax, 
    watchRealEstateTaxes, 
    watchMortgageInterest, 
    watchCharitableCash, 
    watchCharitableNonCash, 
    watchDeductionType,
    form
  ]);

  const onSubmit = (data: Deductions) => {
    // 표준 공제를 선택한 경우에도 항목별 공제 값을 유지하기 위해 
    // taxData에서 기존 itemizedDeductions 값을 보존
    if (data.useStandardDeduction && taxData.deductions?.itemizedDeductions) {
      data = {
        ...data,
        itemizedDeductions: taxData.deductions.itemizedDeductions
      };
    }
    
    updateTaxData({ deductions: data });
    return true;
  };

  // Helper function to format currency input
  const formatCurrency = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/[^\d.]/g, '');
    return digits;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-primary-dark mb-2">귀하의 2025년 세금 신고서</h1>
        <p className="text-gray-dark">세금 신고서를 준비하기 위해 모든 섹션을 작성하세요. 입력한 정보는 자동으로 저장됩니다.</p>
      </div>

      <ProgressTracker currentStep={3} />
      
      <div className="md:hidden mb-4 border-b border-gray-medium">
        <button 
          onClick={() => navigate('/personal-info')} 
          className="py-2 px-4 border-b-2 border-transparent text-gray-dark cursor-pointer"
        >
          개인 정보
        </button>
        <button 
          onClick={() => navigate('/income')} 
          className="py-2 px-4 border-b-2 border-transparent text-gray-dark cursor-pointer"
        >
          소득
        </button>
        <button 
          className="py-2 px-4 border-b-2 border-primary text-primary font-semibold cursor-pointer"
        >
          공제 항목
        </button>
        <button 
          onClick={() => navigate('/tax-credits')} 
          className="py-2 px-4 border-b-2 border-transparent text-gray-dark cursor-pointer"
        >
          세액 공제
        </button>
        <button 
          onClick={() => navigate('/additional-tax')} 
          className="py-2 px-4 border-b-2 border-transparent text-gray-dark cursor-pointer"
        >
          추가 세금
        </button>
        <button 
          onClick={() => navigate('/review')} 
          className="py-2 px-4 border-b-2 border-transparent text-gray-dark cursor-pointer"
        >
          검토
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-grow">
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="mb-6">
                <h2 className="text-2xl font-heading font-semibold text-primary-dark">공제 (Deductions)</h2>
              </div>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="mb-8">
                    <h3 className="text-lg font-heading font-semibold mb-4">공제방법선택 (Choose Your Deduction Method)</h3>
                    
                    <FormField
                      control={form.control}
                      name="useStandardDeduction"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              onValueChange={(value) => field.onChange(value === 'standard')}
                              defaultValue={field.value ? 'standard' : 'itemized'}
                              className="flex flex-col sm:flex-row gap-4"
                            >
                              <div className="bg-gray-bg border border-gray-medium rounded-lg p-4 flex-1 hover:border-primary cursor-pointer">
                                <div className="flex items-start">
                                  <RadioGroupItem value="standard" id="standard_deduction" className="mt-1" />
                                  <Label htmlFor="standard_deduction" className="ml-2 cursor-pointer">
                                    <div className="font-semibold mb-1">표준공제 (Standard Deduction)</div>
                                    <p className="text-sm text-gray-dark">
                                      신고 상태에 따라 미리 정해진 공제 금액을 적용합니다.
                                    </p>
                                    <p className="mt-2 text-primary-dark font-semibold">
                                      ${standardDeductionAmount.toLocaleString()}
                                    </p>
                                  </Label>
                                </div>
                              </div>

                              <div className="bg-gray-bg border border-gray-medium rounded-lg p-4 flex-1 hover:border-primary cursor-pointer">
                                <div className="flex items-start">
                                  <RadioGroupItem value="itemized" id="itemized_deduction" className="mt-1" />
                                  <Label htmlFor="itemized_deduction" className="ml-2 cursor-pointer">
                                    <div className="font-semibold mb-1">항목별공제 (Itemized Deductions)</div>
                                    <p className="text-sm text-gray-dark">
                                      청구하려는 각 적격 공제를 개별적으로 나열합니다.
                                    </p>
                                    <p className="mt-2 text-gray-dark italic text-sm">
                                      아래 섹션을 작성하세요
                                    </p>
                                  </Label>
                                </div>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* 항목별 공제 필드들 */}
                  {!watchDeductionType && (
                    <div className="mt-8">
                      <h3 className="text-lg font-heading font-semibold mb-4">항목별 공제 정보 (Itemized Deductions)</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="itemizedDeductions.medicalExpenses"
                          render={({ field }) => (
                            <FormItem className="flex flex-col justify-center h-full">
                              <div className="flex justify-between">
                                <FormLabel>의료비 공제 (Medical Expenses)</FormLabel>
                                <div className="tooltip">
                                  <Info className="h-4 w-4 text-gray-dark" />
                                  <span className="tooltip-text">당해 연도 의료 및 치과 비용</span>
                                </div>
                              </div>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(parseFloat(e.target.value) || 0);
                                  }}
                                  disabled={isItemizedDisabled}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="itemizedDeductions.stateLocalIncomeTax"
                          render={({ field }) => (
                            <FormItem className="flex flex-col justify-center h-full">
                              <div className="flex justify-between">
                                <FormLabel>주/지방세 공제 (State/Local Tax)</FormLabel>
                                <div className="tooltip">
                                  <Info className="h-4 w-4 text-gray-dark" />
                                  <span className="tooltip-text">주 및 지방 소득세 또는 판매세</span>
                                </div>
                              </div>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(parseFloat(e.target.value) || 0);
                                  }}
                                  disabled={isItemizedDisabled}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="itemizedDeductions.realEstateTaxes"
                          render={({ field }) => (
                            <FormItem className="flex flex-col justify-center h-full">
                              <div className="flex justify-between">
                                <FormLabel>부동산세 공제 (Real Estate Taxes)</FormLabel>
                                <div className="tooltip">
                                  <Info className="h-4 w-4 text-gray-dark" />
                                  <span className="tooltip-text">집, 토지 등에 대한 부동산세</span>
                                </div>
                              </div>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(parseFloat(e.target.value) || 0);
                                  }}
                                  disabled={isItemizedDisabled}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="itemizedDeductions.mortgageInterest"
                          render={({ field }) => (
                            <FormItem className="flex flex-col justify-center h-full">
                              <div className="flex justify-between">
                                <FormLabel>주택담보대출 이자 (Mortgage Interest)</FormLabel>
                                <div className="tooltip">
                                  <Info className="h-4 w-4 text-gray-dark" />
                                  <span className="tooltip-text">주택 담보 대출에 대한 이자 비용</span>
                                </div>
                              </div>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(parseFloat(e.target.value) || 0);
                                  }}
                                  disabled={isItemizedDisabled}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="itemizedDeductions.charitableCash"
                          render={({ field }) => (
                            <FormItem className="flex flex-col justify-center h-full">
                              <div className="flex justify-between">
                                <FormLabel>기부금 (현금) (Charitable Donations Cash)</FormLabel>
                                <div className="tooltip">
                                  <Info className="h-4 w-4 text-gray-dark" />
                                  <span className="tooltip-text">현금 또는 수표로 기부한 금액</span>
                                </div>
                              </div>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(parseFloat(e.target.value) || 0);
                                  }}
                                  disabled={isItemizedDisabled}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="itemizedDeductions.charitableNonCash"
                          render={({ field }) => (
                            <FormItem className="flex flex-col justify-center h-full">
                              <div className="flex justify-between">
                                <FormLabel>기부금 (비현금) (Charitable Donations Non-Cash)</FormLabel>
                                <div className="tooltip">
                                  <Info className="h-4 w-4 text-gray-dark" />
                                  <span className="tooltip-text">물품이나 자산 형태로 기부한 가치</span>
                                </div>
                              </div>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(parseFloat(e.target.value) || 0);
                                  }}
                                  disabled={isItemizedDisabled}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="mt-6">
                        <div className="p-4 bg-gray-bg border border-gray-medium rounded-md">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold">항목별 공제 합계 (Itemized Total)</h4>
                              <p className="text-sm text-gray-dark">모든 항목별 공제의 합계</p>
                            </div>
                            <div className="text-xl font-semibold text-primary-dark">
                              ${form.watch("totalDeductions").toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  

                  
                  <div className="flex justify-between mt-8">
                    <Button
                      variant="outline"
                      className="px-6 py-2 border border-primary text-primary font-semibold rounded hover:bg-primary-light hover:text-white transition duration-200"
                      onClick={() => navigate('/income')}
                    >
                      이전 단계
                    </Button>
                    
                    <Button
                      className="px-6 py-2 bg-primary text-white font-semibold rounded hover:bg-primary-dark transition duration-200"
                      onClick={async () => {
                        console.log("Next 버튼 클릭됨");
                        
                        // 표준 공제를 선택한 경우 폼 유효성 검사를 무시하고 진행
                        if (form.watch('useStandardDeduction')) {
                          console.log("표준 공제 선택됨, 자동 저장 및 진행");
                          
                          // 현재 폼 데이터 가져오기
                          let data = form.getValues();
                          
                          // 표준 공제를 선택한 경우에도 항목별 공제 값을 유지하기 위해 
                          // taxData에서 기존 itemizedDeductions 값을 보존
                          if (taxData.deductions?.itemizedDeductions) {
                            data = {
                              ...data,
                              itemizedDeductions: taxData.deductions.itemizedDeductions
                            };
                          }
                          
                          updateTaxData({ deductions: data });
                          navigate('/tax-credits');
                          return;
                        }
                        
                        // 항목별 공제를 선택한 경우 유효성 검사 실행
                        const isValid = await form.trigger();
                        console.log("폼 유효성 검사 결과:", isValid);
                        
                        if (isValid) {
                          console.log("폼이 유효함, 데이터 저장 후 진행");
                          const data = form.getValues();
                          updateTaxData({ deductions: data });
                          navigate('/tax-credits');
                        } else {
                          console.log("폼이 유효하지 않음, 오류 메시지 표시");
                          toast({
                            title: "폼 오류",
                            description: "다음으로 진행하기 전에 폼의 오류를 수정해주세요.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      저장 & 다음 단계
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Deductions;