import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Income, incomeSchema, AdditionalIncomeItem, AdditionalAdjustmentItem } from '@shared/schema';
import { useTaxContext } from '@/context/TaxContext';
import ProgressTracker from '@/components/ProgressTracker';
import StepNavigation from '@/components/StepNavigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Info as InfoIcon, Upload, Loader2, Plus, BarChart2, FileText, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

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
    adjustedGrossIncome: taxData.income?.adjustedGrossIncome || 0
  };

  const form = useForm<Income>({
    resolver: zodResolver(incomeSchema),
    defaultValues,
  });
  
  // 총소득과 조정 총소득을 계산하는 함수
  // 심플하게 합계만 리턴하는 함수로 변경
  const calculateTotals = () => {
    // 특별한 계산이 필요한 경우만 이 함수 호출
    // useEffect에서 값이 변경될 때마다 이미 계산하고 있음
    console.log("Manual calculation called");
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
  
  // 추가 소득 항목이 변경될 때마다 표시되도록 상태 관리
  const [additionalIncomeItems, setAdditionalIncomeItems] = useState<AdditionalIncomeItem[]>([]);
  const [additionalAdjustmentItems, setAdditionalAdjustmentItems] = useState<AdditionalAdjustmentItem[]>([]);
  
  // taxData가 변경될 때마다 추가 소득 항목과 조정 항목을 업데이트
  useEffect(() => {
    if (taxData.income?.additionalIncomeItems) {
      setAdditionalIncomeItems(taxData.income.additionalIncomeItems);
    }
    if (taxData.income?.additionalAdjustmentItems) {
      setAdditionalAdjustmentItems(taxData.income.additionalAdjustmentItems);
    }
    
    // 디버깅
    console.log('taxData updated:', {
      additionalIncomeItems: taxData.income?.additionalIncomeItems || [],
      additionalAdjustmentItems: taxData.income?.additionalAdjustmentItems || []
    });
  }, [taxData.income]);
  
  // 테스트용 함수 - 더미 데이터 추가
  const addDummyData = () => {
    // 더미 소득 항목 추가
    const dummyIncomeItems: AdditionalIncomeItem[] = [
      { type: '도박 소득 (Gambling winnings)', amount: 1200, description: '복권 당첨금' },
      { type: '배심원 수당 (Jury duty pay)', amount: 480, description: '지방법원 배심원 참여' }
    ];
    
    // 더미 조정 항목 추가
    const dummyAdjustmentItems: AdditionalAdjustmentItem[] = [
      { type: '교육자 비용 (Educator expenses)', amount: 250, description: '교육 자료 구입' },
      { type: '학자금대출 이자 (Student loan interest)', amount: 1500, description: '연간 지불 이자' }
    ];
    
    // 상태 업데이트
    setAdditionalIncomeItems(dummyIncomeItems);
    setAdditionalAdjustmentItems(dummyAdjustmentItems);
    
    // 폼 데이터 업데이트
    const currentIncome = form.getValues();
    currentIncome.additionalIncomeItems = dummyIncomeItems;
    currentIncome.additionalAdjustmentItems = dummyAdjustmentItems;
    
    // otherIncome 필드 업데이트 (기타소득 합계)
    const totalOtherIncome = dummyIncomeItems.reduce((sum, item) => sum + item.amount, 0);
    form.setValue('otherIncome', totalOtherIncome);
    
    // otherAdjustments 필드 업데이트 (기타조정 합계)
    const totalOtherAdjustments = dummyAdjustmentItems.reduce((sum, item) => sum + item.amount, 0);
    form.setValue('adjustments.otherAdjustments', totalOtherAdjustments);
    
    // 총소득 재계산
    calculateTotals();
    
    // 콘텍스트 업데이트
    updateTaxData({ income: currentIncome });
    
    toast({
      title: "테스트 데이터 추가됨",
      description: "기타소득 및 기타조정 테스트 데이터가 추가되었습니다."
    });
  };
  
  // 지정된 필드 값이 변경될 때마다 자동 계산 및 저장
  useEffect(() => {
    // 근로소득 계산
    const earnedIncomeTotal = 
      Number(form.watch('wages') || 0) +
      Number(form.watch('otherEarnedIncome') || 0);
      
    // 비근로소득 계산
    const unearnedIncomeTotal =
      Number(form.watch('interestIncome') || 0) +
      Number(form.watch('dividends') || 0) +
      Number(form.watch('businessIncome') || 0) +
      Number(form.watch('capitalGains') || 0) +
      Number(form.watch('rentalIncome') || 0) +
      Number(form.watch('retirementIncome') || 0) +
      Number(form.watch('unemploymentIncome') || 0);
    
    // 기타소득 계산 (사용자 직접 입력값)
    const userOtherIncome = Number(form.watch('otherIncome') || 0);
    
    // 추가 소득 항목 계산 (AdditionalIncome 페이지에서 추가된 항목들)
    let additionalItemsTotal = 0;
    if (additionalIncomeItems.length > 0) {
      additionalIncomeItems.forEach(item => {
        console.log("계산에 포함된 추가 소득 항목:", item.type, Number(item.amount || 0));
        additionalItemsTotal += Number(item.amount || 0);
      });
    }
    
    // 기타소득은 사용자 직접 입력값만 사용 - additionalIncomeItems는 내역 표시용
    const totalOtherIncome = userOtherIncome;
    
    // 최종 총소득 계산 (근로소득 + 비근로소득 + 기타소득)
    const totalIncome = earnedIncomeTotal + unearnedIncomeTotal + totalOtherIncome;
    
    console.log("계산 세부사항:", {
      근로소득합계: earnedIncomeTotal,
      비근로소득합계: unearnedIncomeTotal,
      사용자기타소득: userOtherIncome,
      추가소득항목합계: additionalItemsTotal,
      총기타소득: totalOtherIncome,
      최종총소득: totalIncome
    });
    
    // 조정 항목 계산
    const studentLoanInterest = Number(form.watch('adjustments.studentLoanInterest') || 0);
    const retirementContributions = Number(form.watch('adjustments.retirementContributions') || 0);
    const healthSavingsAccount = Number(form.watch('adjustments.healthSavingsAccount') || 0);
    
    // 추가 조정 항목 계산
    let additionalAdjustmentsTotal = 0;
    if (additionalAdjustmentItems.length > 0) {
      additionalAdjustmentItems.forEach(item => {
        console.log("계산에 포함된 조정 항목:", item.type, Number(item.amount || 0));
        additionalAdjustmentsTotal += Number(item.amount || 0);
      });
    }
    
    // 조정 항목 합계 계산
    const totalAdjustments = studentLoanInterest + 
                           retirementContributions + 
                           healthSavingsAccount + 
                           additionalAdjustmentsTotal;
    
    // 조정 총소득(AGI) 계산
    const adjustedGrossIncome = totalIncome - totalAdjustments;
    
    console.log("조정 계산 세부사항:", {
      학자금대출이자: studentLoanInterest,
      은퇴기여금: retirementContributions,
      의료저축계좌: healthSavingsAccount,
      추가조정항목합계: additionalAdjustmentsTotal,
      총조정금액: totalAdjustments,
      조정총소득: adjustedGrossIncome
    });
    
    // 폼 필드에 계산된 값 설정
    form.setValue('totalIncome', totalIncome);
    form.setValue('adjustments.otherAdjustments', additionalAdjustmentsTotal);
    form.setValue('adjustedGrossIncome', adjustedGrossIncome);
    
    // 폼 데이터를 컨텍스트에 자동 저장
    // 이렇게 하면 다른 페이지로 이동했다가 돌아와도 데이터가 유지됨
    const currentFormData = form.getValues();
    
    // additionalIncomeItems와 additionalAdjustmentItems 추가
    currentFormData.additionalIncomeItems = additionalIncomeItems;
    currentFormData.additionalAdjustmentItems = additionalAdjustmentItems;
    
    // 입력값 저장 - 약간의 디바운싱을 위해 타이머 사용
    const saveTimer = setTimeout(() => {
      updateTaxData({ income: currentFormData });
      console.log('자동 저장됨', currentFormData);
    }, 500);
    
    return () => clearTimeout(saveTimer);
  }, [
    form.watch('wages'),
    form.watch('otherEarnedIncome'),
    form.watch('interestIncome'),
    form.watch('dividends'),
    form.watch('businessIncome'),
    form.watch('capitalGains'),
    form.watch('rentalIncome'),
    form.watch('retirementIncome'),
    form.watch('unemploymentIncome'),
    form.watch('otherIncome'),
    form.watch('adjustments.studentLoanInterest'),
    form.watch('adjustments.retirementContributions'),
    form.watch('adjustments.healthSavingsAccount'),
    form.watch('adjustments.otherAdjustments'),
    additionalIncomeItems,
    additionalAdjustmentItems,
    updateTaxData
  ]);
  
  // 소득 요약 데이터 계산 함수
  const getIncomeSummary = () => {
    const earnedIncomeTotal = 
      Number(form.watch('wages') || 0) +
      Number(form.watch('otherEarnedIncome') || 0);
      
    const unearnedIncomeTotal =
      Number(form.watch('interestIncome') || 0) +
      Number(form.watch('dividends') || 0) +
      Number(form.watch('businessIncome') || 0) +
      Number(form.watch('capitalGains') || 0) +
      Number(form.watch('rentalIncome') || 0) +
      Number(form.watch('retirementIncome') || 0) +
      Number(form.watch('unemploymentIncome') || 0);
    
    const userOtherIncome = Number(form.watch('otherIncome') || 0);
    
    let additionalItemsTotal = 0;
    if (additionalIncomeItems.length > 0) {
      additionalItemsTotal = additionalIncomeItems.reduce((sum, item) => 
        sum + Number(item.amount || 0), 0);
    }
    
    // 기타소득은 사용자 직접 입력값만 사용 - additionalIncomeItems는 내역 표시용
    const totalOtherIncome = userOtherIncome;
    const totalIncome = earnedIncomeTotal + unearnedIncomeTotal + totalOtherIncome;
    
    const studentLoanInterest = Number(form.watch('adjustments.studentLoanInterest') || 0);
    const retirementContributions = Number(form.watch('adjustments.retirementContributions') || 0);
    const healthSavingsAccount = Number(form.watch('adjustments.healthSavingsAccount') || 0);
    
    let additionalAdjustmentsTotal = 0;
    if (additionalAdjustmentItems.length > 0) {
      additionalAdjustmentsTotal = additionalAdjustmentItems.reduce((sum, item) => 
        sum + Number(item.amount || 0), 0);
    }
    
    const totalAdjustments = studentLoanInterest + retirementContributions + 
                           healthSavingsAccount + additionalAdjustmentsTotal;
    
    const adjustedGrossIncome = totalIncome - totalAdjustments;
    
    return {
      earnedIncomeTotal,
      unearnedIncomeTotal,
      userOtherIncome,
      additionalItemsTotal,
      totalOtherIncome,
      totalIncome,
      studentLoanInterest,
      retirementContributions,
      healthSavingsAccount,
      additionalAdjustmentsTotal,
      totalAdjustments,
      adjustedGrossIncome
    };
  };
  
  // 숫자를 원화 포맷으로 표시하는 함수
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { 
      style: 'currency', 
      currency: 'KRW',
      maximumFractionDigits: 0 
    }).format(amount);
  };

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
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-heading text-primary-dark">소득정보 (Income Information)</CardTitle>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline" 
                      onClick={addDummyData}
                    >
                      테스트 데이터 추가
                    </Button>
                  </div>
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
                  
                  <div className="mt-6 mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/additional-income')}
                        className="text-sm flex items-center"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        기타소득
                      </Button>
                    </div>
                    
                    {additionalIncomeItems.length > 0 && (
                      <div className="bg-gray-50 p-3 rounded-md border mb-4">
                        <h4 className="text-sm font-semibold mb-2">기타소득 항목 요약</h4>
                        <div className="space-y-1 text-sm">
                          {additionalIncomeItems.map((item, index) => (
                            <div key={index} className="flex justify-between">
                              <span>{item.type}</span>
                              <span>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.amount)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between font-medium border-t pt-1 mt-2">
                            <span>총 기타소득:</span>
                            <span>
                              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                                additionalIncomeItems.reduce((sum, item) => sum + item.amount, 0)
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
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
                      
                      <div className="flex items-center md:col-span-2 mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/additional-adjustments')}
                          className="flex items-center"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          기타조정
                        </Button>
                      </div>
                      
                      {additionalAdjustmentItems.length > 0 && (
                        <div className="bg-gray-50 p-3 rounded-md border mb-4 md:col-span-2 mt-3">
                          <h4 className="text-sm font-semibold mb-2">기타조정 항목 요약</h4>
                          <div className="space-y-1 text-sm">
                            {additionalAdjustmentItems.map((item, index) => (
                              <div key={index} className="flex justify-between">
                                <span>{item.type}</span>
                                <span>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.amount)}</span>
                              </div>
                            ))}
                            <div className="flex justify-between font-medium border-t pt-1 mt-2">
                              <span>총 기타조정:</span>
                              <span>
                                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                                  additionalAdjustmentItems.reduce((sum, item) => sum + item.amount, 0)
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <FormField
                        control={form.control}
                        name="adjustments.otherAdjustments"
                        render={({ field }) => (
                          <FormItem className="hidden">
                            <FormControl>
                              <Input
                                type="hidden"
                                {...field}
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
                      <span>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(form.watch('totalIncome') || 0)}</span>
                    </div>
                    <div className="income-total-row">
                      <span>조정항목총액 (Total Adjustments)</span>
                      <span>
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(
                          parseFloat((form.watch('adjustments')?.studentLoanInterest || 0).toString()) +
                          parseFloat((form.watch('adjustments')?.retirementContributions || 0).toString()) +
                          parseFloat((form.watch('adjustments')?.healthSavingsAccount || 0).toString()) +
                          parseFloat((form.watch('adjustments')?.otherAdjustments || 0).toString())
                        )}
                      </span>
                    </div>
                    <div className="income-total-row highlight">
                      <span>조정총소득 (Adjusted Gross Income)</span>
                      <span>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(form.watch('adjustedGrossIncome') || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* 소득 요약 다이얼로그 버튼 */}
              <div className="mt-6 mb-6">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      type="button" 
                      variant="outline"
                      className="w-full flex items-center gap-2 py-6"
                    >
                      <BarChart2 className="h-5 w-5" />
                      <span className="text-lg">소득 요약 (Income Summary)</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-heading text-primary-dark">소득요약 (Income Summary)</DialogTitle>
                    </DialogHeader>
                    
                    {/* 간소화된 소득 요약 */}
                    <div className="p-4 space-y-4 border rounded-lg">
                      <div className="grid grid-cols-2 gap-y-4 text-lg">
                        <div className="font-medium">총소득 (Total Income)</div>
                        <div className="text-right font-semibold">{formatCurrency(getIncomeSummary().totalIncome)}</div>
                        
                        <div className="font-medium">조정항목총액 (Total Adjustments)</div>
                        <div className="text-right font-semibold">{formatCurrency(getIncomeSummary().totalAdjustments)}</div>
                        
                        <div className="font-medium border-t pt-4">조정총소득 (Adjusted Gross Income)</div>
                        <div className="text-right font-bold text-primary border-t pt-4">{formatCurrency(getIncomeSummary().adjustedGrossIncome)}</div>
                      </div>
                    </div>
                    
                    <DialogFooter className="mt-4">
                      <DialogClose asChild>
                        <Button type="button">확인</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
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