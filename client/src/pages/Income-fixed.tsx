import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Income, incomeSchema } from '@shared/schema';
import { useTaxContext } from '@/context/TaxContext';
import ProgressTracker from '@/components/ProgressTracker';
import StepNavigation from '@/components/StepNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Info as InfoIcon, Upload, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function IncomePage() {
  const [, navigate] = useLocation();
  const { taxData, updateTaxData } = useTaxContext();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  
  const defaultValues: Income = {
    wages: taxData.income?.wages || 0,
    otherEarnedIncome: taxData.income?.otherEarnedIncome || 0,
    interestIncome: taxData.income?.interestIncome || 0,
    dividends: taxData.income?.dividends || 0,
    businessIncome: taxData.income?.businessIncome || 0,
    capitalGains: taxData.income?.capitalGains || 0,
    rentalIncome: taxData.income?.rentalIncome || 0,
    retirementIncome: taxData.income?.retirementIncome || 0,
    unemploymentIncome: taxData.income?.unemploymentIncome || 0,
    otherIncome: taxData.income?.otherIncome || 0,
    additionalIncomeItems: taxData.income?.additionalIncomeItems || [],
    totalIncome: taxData.income?.totalIncome || 0,
    adjustments: {
      studentLoanInterest: taxData.income?.adjustments?.studentLoanInterest || 0,
      retirementContributions: taxData.income?.adjustments?.retirementContributions || 0,
      healthSavingsAccount: taxData.income?.adjustments?.healthSavingsAccount || 0,
      otherAdjustments: taxData.income?.adjustments?.otherAdjustments || 0,
    },
    adjustedGrossIncome: taxData.income?.adjustedGrossIncome || 0,
  };

  const form = useForm<Income>({
    resolver: zodResolver(incomeSchema),
    defaultValues,
  });
  
  const calculateTotals = () => {
    // 총소득 계산
    const wages = form.getValues('wages') || 0;
    const otherEarnedIncome = form.getValues('otherEarnedIncome') || 0;
    const interestIncome = form.getValues('interestIncome') || 0;
    const dividends = form.getValues('dividends') || 0;
    const businessIncome = form.getValues('businessIncome') || 0;
    const capitalGains = form.getValues('capitalGains') || 0;
    const rentalIncome = form.getValues('rentalIncome') || 0;
    const retirementIncome = form.getValues('retirementIncome') || 0;
    const unemploymentIncome = form.getValues('unemploymentIncome') || 0;
    const otherIncome = form.getValues('otherIncome') || 0;
    
    // 추가 소득 항목이 있으면 포함
    const additionalItemsTotal = form.getValues('additionalIncomeItems')?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
    
    const totalIncome = wages + otherEarnedIncome + interestIncome + dividends + businessIncome + capitalGains + 
                      rentalIncome + retirementIncome + unemploymentIncome + otherIncome + additionalItemsTotal;
    
    form.setValue('totalIncome', totalIncome);
    
    // 소득 조정 항목 계산
    const studentLoanInterest = form.getValues('adjustments.studentLoanInterest') || 0;
    const retirementContributions = form.getValues('adjustments.retirementContributions') || 0;
    const healthSavingsAccount = form.getValues('adjustments.healthSavingsAccount') || 0;
    const otherAdjustments = form.getValues('adjustments.otherAdjustments') || 0;
    
    const totalAdjustments = studentLoanInterest + retirementContributions + healthSavingsAccount + otherAdjustments;
    
    // 조정 총소득(AGI) 계산
    const adjustedGrossIncome = totalIncome - totalAdjustments;
    form.setValue('adjustedGrossIncome', adjustedGrossIncome);
  };
  
  const onSubmit = async (data: Income) => {
    try {
      // 최종 계산 한번더 수행
      calculateTotals();
      data.totalIncome = form.getValues('totalIncome');
      data.adjustedGrossIncome = form.getValues('adjustedGrossIncome');
      
      // 콘텍스트 업데이트
      updateTaxData({ income: data });
      
      // 다음 페이지로 이동
      navigate('/deductions');
    } catch (error) {
      console.error('Error submitting income data:', error);
      toast({
        title: "저장 오류",
        description: "소득 정보를 저장하는 중에 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };
  
  // 값이 변경될 때마다 총소득과 AGI 재계산
  useEffect(() => {
    const subscription = form.watch(() => {
      calculateTotals();
    });
    return () => subscription.unsubscribe();
  }, []);
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <ProgressTracker currentStep={2} />
      </div>
      
      <div className="md:flex gap-8">
        <div className="flex-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-xl font-heading text-primary-dark">소득정보 (Income Information)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">근로소득 (Earned Income)</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="wages"
                        render={({ field }) => (
                          <FormItem className="flex flex-col justify-center h-full">
                            <div className="flex justify-between">
                              <FormLabel>급여 (Wages, Salaries)</FormLabel>
                              <div className="tooltip">
                                <InfoIcon className="h-4 w-4 text-gray-dark" />
                                <span className="tooltip-text">Include income from all W-2 forms</span>
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
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="border rounded-md p-3 bg-gray-50/50">
                        <p className="text-sm text-gray-700 mb-2">W-2입력(없으면 직접 입력)</p>
                        <div className="flex flex-col items-start gap-2">
                          <div className="w-full flex items-center gap-3">
                            <div className="flex items-center">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <label className="cursor-pointer mr-2">
                                      <div className="flex items-center gap-1 rounded-md border bg-white px-3 py-1 text-xs shadow-sm">
                                        {isUploading ? (
                                          <>
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            <span>처리 중...</span>
                                          </>
                                        ) : (
                                          <>
                                            <Upload className="h-3 w-3" />
                                            <span>업로드</span>
                                          </>
                                        )}
                                      </div>
                                      <input 
                                        type="file" 
                                        accept=".pdf,.jpg,.jpeg,.png" 
                                        className="hidden" 
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            setIsUploading(true);
                                            
                                            // 실제 환경에서는 파일을 서버에 업로드하고 데이터를 추출하는 API를 호출합니다.
                                            // 지금은 시뮬레이션을 위해 타이머를 사용하여 2초 후에 임의의 데이터를 설정합니다.
                                            setTimeout(() => {
                                              // W2에서 추출한 급여 데이터 (시뮬레이션)
                                              const extractedWages = 82500;
                                              
                                              // 폼 값 업데이트
                                              form.setValue('wages', extractedWages);
                                              
                                              // 총소득 재계산
                                              calculateTotals();
                                              
                                              // 업로드 상태 초기화
                                              setIsUploading(false);
                                              
                                              // 알림 표시
                                              toast({
                                                title: "W-2 데이터 추출 완료",
                                                description: "급여 정보가 자동으로 입력되었습니다.",
                                              });
                                            }, 2000);
                                          }
                                        }}
                                      />
                                    </label>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>W-2에서 급여 정보를 자동으로 추출합니다</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="otherEarnedIncome"
                        render={({ field }) => (
                          <FormItem className="flex flex-col justify-center h-full">
                            <div className="flex justify-between">
                              <FormLabel>기타근로소득 (Other Earned Income)</FormLabel>
                              <div className="tooltip">
                                <InfoIcon className="h-4 w-4 text-gray-dark" />
                                <span className="tooltip-text">Other earned income not reported on W-2</span>
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
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">비근로소득 (Unearned Income)</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="interestIncome"
                        render={({ field }) => (
                          <FormItem className="flex flex-col justify-center h-full">
                            <div className="flex justify-between">
                              <FormLabel>이자소득 (Interest Income)</FormLabel>
                              <div className="tooltip">
                                <InfoIcon className="h-4 w-4 text-gray-dark" />
                                <span className="tooltip-text">Include interest from bank accounts, CDs, etc.</span>
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
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="dividends"
                        render={({ field }) => (
                          <FormItem className="flex flex-col justify-center h-full">
                            <div className="flex justify-between">
                              <FormLabel>배당소득 (Dividends)</FormLabel>
                              <div className="tooltip">
                                <InfoIcon className="h-4 w-4 text-gray-dark" />
                                <span className="tooltip-text">Include dividends from stocks and mutual funds</span>
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
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="rentalIncome"
                        render={({ field }) => (
                          <FormItem className="flex flex-col justify-center h-full">
                            <div className="flex justify-between">
                              <FormLabel>임대소득 (Rental Income)</FormLabel>
                              <div className="tooltip">
                                <InfoIcon className="h-4 w-4 text-gray-dark" />
                                <span className="tooltip-text">Income from renting property after expenses</span>
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
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-6 mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/additional-income')}
                      className="text-sm flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      소득조정 추가 입력
                    </Button>
                  </div>
                    
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">소득조정 (Adjustments to Income)</h3>
                    <p className="text-sm text-gray-dark mb-4">
                      소득에서 차감되는 항목을 입력하세요. 이 금액은 과세 대상 소득을 줄입니다.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="adjustments.studentLoanInterest"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between">
                              <FormLabel>학자금대출이자 (Student Loan Interest)</FormLabel>
                              <div className="tooltip">
                                <InfoIcon className="h-4 w-4 text-gray-dark" />
                                <span className="tooltip-text">Maximum deduction is $2,500</span>
                              </div>
                            </div>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="2500"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(parseFloat(e.target.value) || 0);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="adjustments.retirementContributions"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between">
                              <FormLabel>은퇴계좌기여금 (Retirement Contributions)</FormLabel>
                              <div className="tooltip">
                                <InfoIcon className="h-4 w-4 text-gray-dark" />
                                <span className="tooltip-text">IRA, 401k, etc. contributions</span>
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
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="adjustments.healthSavingsAccount"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between">
                              <FormLabel>건강저축계좌 (HSA Contributions)</FormLabel>
                              <div className="tooltip">
                                <InfoIcon className="h-4 w-4 text-gray-dark" />
                                <span className="tooltip-text">Health Savings Account contributions</span>
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
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="adjustments.otherAdjustments"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between">
                              <FormLabel>기타조정항목 (Other Adjustments)</FormLabel>
                              <div className="tooltip">
                                <InfoIcon className="h-4 w-4 text-gray-dark" />
                                <span className="tooltip-text">Moving expenses, self-employment tax, etc.</span>
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
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-heading text-primary-dark">소득요약 (Income Summary)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="income-total-box">
                    <div className="income-total-row">
                      <span>총소득 (Total Income)</span>
                      <span>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(form.getValues('totalIncome'))}</span>
                    </div>
                    <div className="income-total-row">
                      <span>조정항목총액 (Total Adjustments)</span>
                      <span>
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(
                          (form.getValues('adjustments.studentLoanInterest') || 0) +
                          (form.getValues('adjustments.retirementContributions') || 0) +
                          (form.getValues('adjustments.healthSavingsAccount') || 0) +
                          (form.getValues('adjustments.otherAdjustments') || 0)
                        )}
                      </span>
                    </div>
                    <div className="income-total-row highlight">
                      <span>조정총소득 (Adjusted Gross Income)</span>
                      <span>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(form.getValues('adjustedGrossIncome'))}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <StepNavigation 
                prevStep="/personal-info" 
                nextStep="/deductions"
                onNext={() => {
                  if (form.formState.errors && Object.keys(form.formState.errors).length > 0) {
                    toast({
                      title: "입력 오류",
                      description: "모든 필드를 올바르게 입력해주세요.",
                      variant: "destructive",
                    });
                    return false;
                  }
                  return true;
                }}
              />
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}