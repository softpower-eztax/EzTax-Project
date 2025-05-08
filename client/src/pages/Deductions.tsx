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
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-heading font-semibold text-primary-dark">공제 (Deductions)</h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleReset}
                  className="text-destructive border-destructive hover:bg-destructive hover:text-white"
                >
                  <span className="mr-2">값 초기화</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>
                </Button>
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

                  <div id="itemized-deductions-section" className={isItemizedDisabled ? 'opacity-50' : ''}>
                    <h3 className="text-lg font-heading font-semibold mb-4">항목별공제 (Itemized Deductions)</h3>

                    {/* Medical Expenses */}
                    <div className="mb-6 border-b border-gray-light pb-6">
                      <div className="flex items-center mb-3">
                        <h4 className="font-semibold">의료비 (Medical Expenses)</h4>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-gray-dark ml-2 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-64">
                                의료비는 조정총소득(AGI)의 7.5%를 초과하는 부분에 대해 공제될 수 있습니다.
                                (Medical expenses are deductible to the extent they exceed 7.5% of your adjusted gross income.)
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="itemizedDeductions.medicalExpenses"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>의료비및치과비용 (Medical and Dental Expenses)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                  <Input 
                                    {...field} 
                                    placeholder="0.00"
                                    disabled={isItemizedDisabled}
                                    className="pl-8"
                                    value={field.value || ''}
                                    onChange={(e) => {
                                      const formatted = formatCurrency(e.target.value);
                                      field.onChange(Number(formatted));
                                    }}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* State and Local Taxes */}
                    <div className="mb-6 border-b border-gray-light pb-6">
                      <div className="flex items-center mb-3">
                        <h4 className="font-semibold">주세및지방세 (State and Local Taxes)</h4>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-gray-dark ml-2 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-64">
                                주세 및 지방세에 대한 공제는 $10,000로 제한됩니다 (부부별도신고의 경우 $5,000).
                                (Deduction for state and local taxes is limited to $10,000 ($5,000 if married filing separately).)
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="itemizedDeductions.stateLocalIncomeTax"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>주및지방소득세 (State and Local Income Taxes)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                  <Input 
                                    {...field} 
                                    placeholder="0.00"
                                    disabled={isItemizedDisabled}
                                    className="pl-8"
                                    value={field.value || ''}
                                    onChange={(e) => {
                                      const formatted = formatCurrency(e.target.value);
                                      field.onChange(Number(formatted));
                                    }}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="itemizedDeductions.realEstateTaxes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>부동산세 (Real Estate Taxes)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                  <Input 
                                    {...field} 
                                    placeholder="0.00"
                                    disabled={isItemizedDisabled}
                                    className="pl-8"
                                    value={field.value || ''}
                                    onChange={(e) => {
                                      const formatted = formatCurrency(e.target.value);
                                      field.onChange(Number(formatted));
                                    }}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Interest Paid */}
                    <div className="mb-6 border-b border-gray-light pb-6">
                      <div className="flex items-center mb-3">
                        <h4 className="font-semibold">지급이자 (Interest Paid)</h4>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-gray-dark ml-2 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-64">
                                주택담보대출 이자는 최대 $750,000까지의 대출에 대해 공제 가능합니다.
                                (Mortgage interest on up to $750,000 of mortgage debt is deductible.)
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="itemizedDeductions.mortgageInterest"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>주택담보대출이자 (Mortgage Interest)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                  <Input 
                                    {...field} 
                                    placeholder="0.00"
                                    disabled={isItemizedDisabled}
                                    className="pl-8"
                                    value={field.value || ''}
                                    onChange={(e) => {
                                      const formatted = formatCurrency(e.target.value);
                                      field.onChange(Number(formatted));
                                    }}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Charitable Contributions */}
                    <div className="mb-6">
                      <div className="flex items-center mb-3">
                        <h4 className="font-semibold">자선기부 (Charitable Contributions)</h4>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-gray-dark ml-2 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-64">
                                적격 기관에 대한 현금 기부는 일반적으로 조정총소득의 최대 60%까지 공제 가능합니다.
                                (Cash contributions to qualified organizations are generally deductible up to 60% of your adjusted gross income.)
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="itemizedDeductions.charitableCash"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>현금기부 (Cash Contributions)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                  <Input 
                                    {...field} 
                                    placeholder="0.00"
                                    disabled={isItemizedDisabled}
                                    className="pl-8"
                                    value={field.value || ''}
                                    onChange={(e) => {
                                      const formatted = formatCurrency(e.target.value);
                                      field.onChange(Number(formatted));
                                    }}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="itemizedDeductions.charitableNonCash"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>비현금기부 (Non-Cash Contributions)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                  <Input 
                                    {...field} 
                                    placeholder="0.00"
                                    disabled={isItemizedDisabled}
                                    className="pl-8"
                                    value={field.value || ''}
                                    onChange={(e) => {
                                      const formatted = formatCurrency(e.target.value);
                                      field.onChange(Number(formatted));
                                    }}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 mt-8 mb-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 hover:text-rose-900"
                      onClick={() => {
                        // Reset all form fields to 0
                        form.reset({
                          useStandardDeduction: true,
                          standardDeductionAmount: standardDeductionAmount,
                          itemizedDeductions: {
                            medicalExpenses: 0,
                            stateLocalIncomeTax: 0,
                            realEstateTaxes: 0,
                            mortgageInterest: 0,
                            charitableCash: 0,
                            charitableNonCash: 0
                          },
                          totalDeductions: standardDeductionAmount
                        });
                        
                        // Update tax context
                        const resetData = form.getValues();
                        updateTaxData({ deductions: resetData });
                        
                        toast({
                          title: "값 초기화 완료",
                          description: "모든 공제 항목 값이 초기화되었습니다.",
                        });
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5"><path d="M3 2v6h6"></path><path d="M3 13a9 9 0 1 0 3-7.7L3 8"></path></svg>
                      <span className="text-lg">값 초기화</span>
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 hover:text-blue-900"
                      onClick={async () => {
                        try {
                          // 현재 폼 데이터 저장
                          // 항목별 공제 값을 유지하기 위해 현재 폼 데이터 전체를 가져옴
                          let currentData = form.getValues();
                          
                          // 표준 공제를 선택한 경우에도 항목별 공제 값을 유지하기 위해 
                          // taxData에서 기존 itemizedDeductions 값을 보존
                          if (currentData.useStandardDeduction && taxData.deductions?.itemizedDeductions) {
                            currentData = {
                              ...currentData,
                              itemizedDeductions: taxData.deductions.itemizedDeductions
                            };
                          }
                          
                          // 업데이트된 데이터 저장
                          updateTaxData({ deductions: currentData });
                          
                          // 세금 신고서 저장
                          await saveTaxReturn();
                          
                          toast({
                            title: "저장 완료",
                            description: "세금 신고서가 저장되었습니다.",
                          });
                        } catch (error) {
                          console.error("저장 오류:", error);
                          toast({
                            title: "저장 오류",
                            description: "세금 신고서 저장 중 오류가 발생했습니다.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                      <span className="text-lg">진행 상황 저장</span>
                    </Button>
                  </div>
                </form>
              </Form>
              
              <StepNavigation
                prevStep="/income"
                nextStep="/tax-credits"
                submitText="세금공제 (Tax Credits)"
                onNext={() => {
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
                    return true;
                  }
                  
                  // 항목별 공제를 선택한 경우 유효성 검사 실행
                  return form.trigger().then(isValid => {
                    console.log("폼 유효성 검사 결과:", isValid);
                    
                    if (isValid) {
                      console.log("폼이 유효함, 데이터 저장 후 진행");
                      const data = form.getValues();
                      updateTaxData({ deductions: data });
                      return true;
                    } else {
                      console.log("폼이 유효하지 않음, 오류 메시지 표시");
                      toast({
                        title: "폼 오류",
                        description: "다음으로 진행하기 전에 폼의 오류를 수정해주세요.",
                        variant: "destructive",
                      });
                      return false;
                    }
                  });
                }}
              />
            </CardContent>
          </Card>
        </div>
        
      </div>
    </div>
  );
};

export default Deductions;
