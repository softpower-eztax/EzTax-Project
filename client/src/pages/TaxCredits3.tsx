import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ProgressTracker from '@/components/ProgressTracker';
import TaxSummary from '@/components/TaxSummary';
import StepNavigation from '@/components/StepNavigation';
import { useTaxContext } from '@/context/TaxContext';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Tax Credits 인터페이스 정의
interface TaxCredits {
  childTaxCredit: number;
  childDependentCareCredit: number;
  educationCredits: number;
  retirementSavingsCredit: number;
  otherCredits: number;
  totalCredits: number;
}

const TaxCredits3Page: React.FC = () => {
  const { taxData, updateTaxData, saveTaxReturn } = useTaxContext();
  const { toast } = useToast();
  
  // 컴포넌트 내부 상태 관리
  const [savedValues, setSavedValues] = useState<TaxCredits>({
    childTaxCredit: taxData.taxCredits?.childTaxCredit || 0,
    childDependentCareCredit: taxData.taxCredits?.childDependentCareCredit || 0,
    educationCredits: taxData.taxCredits?.educationCredits || 0,
    retirementSavingsCredit: taxData.taxCredits?.retirementSavingsCredit || 0,
    otherCredits: taxData.taxCredits?.otherCredits || 0,
    totalCredits: taxData.taxCredits?.totalCredits || 0
  });
  
  // 부양가족이 있는지 확인
  const hasDependents = (taxData.personalInfo?.dependents && taxData.personalInfo.dependents.length > 0) || false;
  
  // 폼 스키마 정의
  const taxCreditsSchema = z.object({
    childTaxCredit: z.coerce.number().min(0).default(0),
    childDependentCareCredit: z.coerce.number().min(0).default(0),
    educationCredits: z.coerce.number().min(0).default(0),
    retirementSavingsCredit: z.coerce.number().min(0).default(0),
    otherCredits: z.coerce.number().min(0).default(0),
    totalCredits: z.coerce.number().min(0).default(0)
  });
  
  // useForm 설정
  const form = useForm<TaxCredits>({
    resolver: zodResolver(taxCreditsSchema),
    defaultValues: savedValues,
    mode: 'onChange'
  });
  
  // 총 공제액 계산을 위한 개별 필드 감시
  const childTaxCredit = form.watch('childTaxCredit') || 0;
  const childDependentCareCredit = form.watch('childDependentCareCredit') || 0;
  const educationCredits = form.watch('educationCredits') || 0;
  const retirementSavingsCredit = form.watch('retirementSavingsCredit') || 0;
  const otherCredits = form.watch('otherCredits') || 0;
  
  // 총 세액 공제 계산
  const calculatedTotal = 
    Number(childTaxCredit) + 
    Number(childDependentCareCredit) + 
    Number(educationCredits) + 
    Number(retirementSavingsCredit) + 
    Number(otherCredits);
  
  // 총 공제 금액 업데이트
  useEffect(() => {
    form.setValue('totalCredits', calculatedTotal);
  }, [calculatedTotal, form]);
  
  // 서버에서 데이터가 변경되면 폼을 업데이트하지만
  // 사용자가 편집 중인 필드에 대해서는 덮어쓰지 않음 (최초 로드시에만 실행)
  useEffect(() => {
    if (taxData.taxCredits) {
      const newValues = {
        childTaxCredit: taxData.taxCredits.childTaxCredit || 0,
        childDependentCareCredit: taxData.taxCredits.childDependentCareCredit || 0,
        educationCredits: taxData.taxCredits.educationCredits || 0,
        retirementSavingsCredit: taxData.taxCredits.retirementSavingsCredit || 0,
        otherCredits: taxData.taxCredits.otherCredits || 0,
        totalCredits: taxData.taxCredits.totalCredits || 0
      };
      // 최초에만 값 설정
      if (JSON.stringify(savedValues) === JSON.stringify({
        childTaxCredit: 0,
        childDependentCareCredit: 0,
        educationCredits: 0,
        retirementSavingsCredit: 0,
        otherCredits: 0,
        totalCredits: 0
      })) {
        setSavedValues(newValues);
        form.reset(newValues);
      }
    }
  }, []);
  
  // 진행 상황 저장 처리
  const handleSave = async () => {
    try {
      // 현재 폼 데이터 가져오기
      const currentValues = form.getValues();
      
      // 계산된 총액으로 업데이트
      const updatedValues = {
        ...currentValues,
        totalCredits: calculatedTotal
      };
      
      // 로컬 상태 업데이트
      setSavedValues(updatedValues);
      
      // 컨텍스트 업데이트
      updateTaxData({ taxCredits: updatedValues });
      
      // 서버 저장
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
  };
  
  // 값 초기화 처리
  const handleReset = () => {
    const resetValues = {
      childTaxCredit: 0,
      childDependentCareCredit: 0,
      educationCredits: 0,
      retirementSavingsCredit: 0,
      otherCredits: 0,
      totalCredits: 0
    };
    
    // 폼 초기화
    form.reset(resetValues);
    
    // 로컬 상태 초기화
    setSavedValues(resetValues);
    
    // 컨텍스트 업데이트
    updateTaxData({ taxCredits: resetValues });
    
    toast({
      title: "값 초기화 완료",
      description: "모든 세금공제 항목이 초기화되었습니다.",
    });
  };
  
  // 다음 단계로 진행
  const handleNext = () => {
    // 현재 폼 데이터로 세금 컨텍스트 업데이트
    const currentValues = form.getValues();
    const updatedValues = {
      ...currentValues,
      totalCredits: calculatedTotal
    };
    
    updateTaxData({ taxCredits: updatedValues });
    return true;
  };
  
  // 통화 입력 포맷 도우미 함수
  const formatCurrency = (value: string): string => {
    // 숫자와 소수점만 허용
    return value.replace(/[^\d.]/g, '');
  };
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-primary-dark mb-2">귀하의 2025년 세금 신고서 (Your 2025 Tax Return)</h1>
        <p className="text-gray-dark">세금 신고서를 준비하기 위해 모든 섹션을 작성하세요. (Complete all sections to prepare your tax return.)</p>
      </div>

      <ProgressTracker currentStep={4} />

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-grow">
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-heading font-semibold text-primary-dark mb-6">세금공제 (Tax Credits)</h2>
              
              <Form {...form}>
                <form onSubmit={(e) => e.preventDefault()}>
                  {/* Child Tax Credit */}
                  <div className="mb-6 border-b border-gray-light pb-6">
                    <div className="flex items-center mb-3">
                      <h4 className="font-semibold">자녀세액공제 (Child Tax Credit)</h4>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-dark ml-2 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-64">
                              17세 미만의 적격 부양가족 각각에 대해 최대 $2,000까지의 자녀세액공제를 받을 수 있습니다.
                              (You may be eligible for a Child Tax Credit of up to $2,000 for each qualifying dependent under age 17.)
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    {!hasDependents && (
                      <div className="bg-gray-bg p-3 rounded-md mb-3 text-sm">
                        <p>개인정보 섹션에 부양가족을 추가하지 않았습니다. 
                        자격을 갖춘 자녀가 있다면, 뒤로 돌아가 추가해주세요.</p>
                        <p className="text-xs mt-1">(You have not added any dependents in the Personal Information section. 
                        If you have qualifying children, please go back and add them.)</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="childTaxCredit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>자녀세액공제액 (Child Tax Credit Amount)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                <Input 
                                  placeholder="0.00"
                                  className="pl-8"
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    const formatted = formatCurrency(e.target.value);
                                    field.onChange(formatted ? Number(formatted) : 0);
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              귀하의 예상 자녀세액공제액을 입력하세요.
                              (Enter your estimated child tax credit amount.)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Child and Dependent Care Credit */}
                  <div className="mb-6 border-b border-gray-light pb-6">
                    <div className="flex items-center mb-3">
                      <h4 className="font-semibold">자녀및부양가족돌봄공제 (Child and Dependent Care Credit)</h4>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-dark ml-2 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-64">
                              이 공제는 13세 미만의 적격 자녀 또는 장애가 있는 배우자나 부양가족을 돌보는 데 지출한 비용에 대한 것입니다.
                              (This credit is for expenses paid for the care of your qualifying children under age 13, or for a disabled spouse or dependent.)
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="childDependentCareCredit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>돌봄공제액 (Care Credit Amount)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                <Input 
                                  placeholder="0.00"
                                  className="pl-8"
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    const formatted = formatCurrency(e.target.value);
                                    field.onChange(formatted ? Number(formatted) : 0);
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

                  {/* Education Credits */}
                  <div className="mb-6 border-b border-gray-light pb-6">
                    <div className="flex items-center mb-3">
                      <h4 className="font-semibold">교육공제 (Education Credits)</h4>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-dark ml-2 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-64">
                              미국 기회 세액공제와 평생 학습 세액공제는 교육 비용을 상쇄하는 데 도움이 됩니다.
                              (The American Opportunity Credit and Lifetime Learning Credit help offset the costs of education.)
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="educationCredits"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>교육공제액 (Education Credits Amount)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                <Input 
                                  placeholder="0.00"
                                  className="pl-8"
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    const formatted = formatCurrency(e.target.value);
                                    field.onChange(formatted ? Number(formatted) : 0);
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              미국 기회 세액공제와 평생 학습 세액공제의 총액입니다.
                              (Total of American Opportunity and Lifetime Learning credits.)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Retirement Savings Credit */}
                  <div className="mb-6 border-b border-gray-light pb-6">
                    <div className="flex items-center mb-3">
                      <h4 className="font-semibold">은퇴저축공제 (Retirement Savings Credit)</h4>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-dark ml-2 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-64">
                              이 공제는 401(k)와 IRA와 같은 은퇴 계좌에 대한 적격 기여금에 대한 것입니다.
                              (This credit is for eligible contributions to retirement accounts like 401(k)s and IRAs.)
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="retirementSavingsCredit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>은퇴저축공제액 (Retirement Savings Credit Amount)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                <Input 
                                  placeholder="0.00"
                                  className="pl-8"
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    const formatted = formatCurrency(e.target.value);
                                    field.onChange(formatted ? Number(formatted) : 0);
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

                  {/* Other Credits */}
                  <div className="mb-6 border-b border-gray-light pb-6">
                    <h4 className="font-semibold mb-3">기타공제 (Other Credits)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="otherCredits"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>기타 세금공제 (Other Tax Credits)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                <Input 
                                  placeholder="0.00"
                                  className="pl-8"
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    const formatted = formatCurrency(e.target.value);
                                    field.onChange(formatted ? Number(formatted) : 0);
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              위에 나열되지 않은 다른 세금공제의 총액을 입력하세요.
                              (Enter the total of any other tax credits not listed above.)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Total Credits */}
                  <div className="mb-6 bg-gray-bg p-4 rounded-md">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold">총공제액 (Total Credits)</h4>
                      <p className="font-bold text-primary-dark text-xl">
                        ${calculatedTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Buttons */}
                  <div className="flex flex-wrap gap-4 mt-8 mb-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 hover:text-rose-900"
                      onClick={handleReset}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5"><path d="M3 2v6h6"></path><path d="M3 13a9 9 0 1 0 3-7.7L3 8"></path></svg>
                      <span className="text-lg">값 초기화</span>
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 hover:text-blue-900"
                      onClick={handleSave}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                      <span className="text-lg">진행 상황 저장</span>
                    </Button>
                  </div>
                </form>
              </Form>
              
              <StepNavigation
                prevStep="/deductions"
                nextStep="/additional-tax"
                submitText="추가세금 (Additional Tax)"
                onNext={handleNext}
              />
            </CardContent>
          </Card>
        </div>
        
        <TaxSummary />
      </div>
    </div>
  );
};

export default TaxCredits3Page;