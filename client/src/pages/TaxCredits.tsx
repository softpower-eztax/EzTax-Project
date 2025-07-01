import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ProgressTracker from '@/components/ProgressTracker';
import StepNavigation from '@/components/StepNavigation';
import { useTaxContext } from '@/context/TaxContext';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const TaxCreditsPage: React.FC = () => {
  const { taxData, updateTaxData, saveTaxReturn } = useTaxContext();
  const { toast } = useToast();
  
  // Check if user has dependents
  const hasDependents = taxData.personalInfo?.dependents?.length > 0 || false;
  
  // Define TaxCredits interface
  interface TaxCredits {
    childTaxCredit: number;
    childDependentCareCredit: number;
    educationCredits: number;
    retirementSavingsCredit: number;
    earnedIncomeCredit: number;
    otherCredits: number;
    totalCredits: number;
  }
  
  const defaultValues: TaxCredits = {
    childTaxCredit: 0,
    childDependentCareCredit: 0,
    educationCredits: 0,
    retirementSavingsCredit: 0,
    earnedIncomeCredit: 0,
    otherCredits: 0,
    totalCredits: 0,
    ...(taxData.taxCredits || {})
  };

  // 로컬 스키마 정의 (모든 필드를 선택사항으로 만들고 기본값 0으로 설정)
  const localTaxCreditsSchema = z.object({
    childTaxCredit: z.number().default(0),
    childDependentCareCredit: z.number().default(0),
    educationCredits: z.number().default(0),
    retirementSavingsCredit: z.number().default(0),
    earnedIncomeCredit: z.number().default(0),
    otherCredits: z.number().default(0),
    totalCredits: z.number().default(0)
  });

  const form = useForm<TaxCredits>({
    resolver: zodResolver(localTaxCreditsSchema),
    defaultValues,
    mode: 'onBlur'
  });
  
  // Make sure the form is always valid since all fields default to 0
  React.useEffect(() => {
    form.trigger();
  }, [form]);

  // 값이 변경될 때마다 총액 계산
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      if (!value) return;
      
      const total = 
        Number(value.childTaxCredit || 0) +
        Number(value.childDependentCareCredit || 0) +
        Number(value.educationCredits || 0) +
        Number(value.retirementSavingsCredit || 0) +
        Number(value.earnedIncomeCredit || 0) +
        Number(value.otherCredits || 0);
        
      form.setValue('totalCredits', total);
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  // Helper function to calculate EIC eligibility and get income limits
  const getEICLimits = () => {
    const filingStatus = taxData.personalInfo?.filingStatus || 'single';
    const qualifyingChildren = taxData.personalInfo?.dependents?.filter(dep => dep.isQualifyingChild)?.length || 0;
    
    // Determine if married filing jointly
    const isMarriedJoint = filingStatus === 'married_joint';
    
    // Define income limits based on filing status and qualifying children
    const limits = {
      single: {
        0: 18591,
        1: 49084,
        2: 55768,
        3: 59899
      },
      marriedJoint: {
        0: 25511,
        1: 56004,
        2: 62688,
        3: 66819
      }
    };
    
    const childrenCount = Math.min(qualifyingChildren, 3);
    const applicableLimits = isMarriedJoint ? limits.marriedJoint : limits.single;
    
    return {
      incomeLimit: applicableLimits[childrenCount as keyof typeof applicableLimits],
      qualifyingChildren: childrenCount,
      isEligible: true // We'll let user determine eligibility based on their income
    };
  };

  const eicInfo = getEICLimits();

  const onSubmit = (data: TaxCredits) => {
    updateTaxData({ taxCredits: data });
    return true;
  };

  // Helper function to format currency input
  const formatCurrency = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/[^\d.]/g, '');
    return digits;
  };
  
  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-primary-dark mb-2">귀하의 2025년 세금 신고서 (Your 2025 Tax Return)</h1>
        <p className="text-gray-dark">세금 신고서를 준비하기 위해 모든 섹션을 작성하세요. 입력한 정보는 자동으로 저장됩니다. (Complete all sections to prepare your tax return. Your information is saved automatically.)</p>
      </div>

      <ProgressTracker currentStep={4} />

      <div className="flex flex-col">
        <div className="w-full">
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-heading font-semibold text-primary-dark mb-6">세금공제 (Tax Credits)</h2>
              
              <Form {...form}>
                <form onSubmit={(e) => { e.preventDefault(); }}>
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
                    
                    <div className="grid grid-cols-1 gap-4">
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
                                  {...field} 
                                  placeholder="0.00"
                                  className="pl-8"
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    const formatted = formatCurrency(e.target.value);
                                    field.onChange(Number(formatted));
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
                    
                    <div className="grid grid-cols-1 gap-4">
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
                                  {...field} 
                                  placeholder="0.00"
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
                    
                    <div className="grid grid-cols-1 gap-4">
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
                                  {...field} 
                                  placeholder="0.00"
                                  className="pl-8"
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    const formatted = formatCurrency(e.target.value);
                                    field.onChange(Number(formatted));
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
                    
                    <div className="grid grid-cols-1 gap-4">
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
                                  {...field} 
                                  placeholder="0.00"
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

                  {/* Earned Income Credit */}
                  <div className="mb-6 border-b border-gray-light pb-6">
                    <div className="flex items-center mb-3">
                      <h4 className="font-semibold">근로소득공제 (Earned Income Credit)</h4>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-dark ml-2 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-64">
                              근로소득세액공제(EIC)는 중저소득 근로자 가족을 위한 환급 가능한 세액공제입니다.
                              (The Earned Income Credit is a refundable tax credit for low to moderate income working families.)
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 text-sm">
                      <h5 className="font-medium text-blue-900 mb-2">2025년 소득 한도액 (2025 Income Limits)</h5>
                      <div className="text-blue-800">
                        <p className="mb-1">
                          <strong>적격 자녀 수: {eicInfo.qualifyingChildren}명</strong>
                        </p>
                        <p className="mb-1">
                          <strong>최대 소득 한도:</strong> ${eicInfo.incomeLimit.toLocaleString()}
                        </p>
                        <p className="text-xs mt-2">
                          근로소득과 조정총소득(AGI) 모두 위 한도액 미만이어야 합니다.
                          (Both earned income and AGI must be less than the limit above.)
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="earnedIncomeCredit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>근로소득공제액 (Earned Income Credit Amount)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                <Input 
                                  {...field} 
                                  placeholder="0.00"
                                  className="pl-8"
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    const formatted = formatCurrency(e.target.value);
                                    field.onChange(Number(formatted));
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              IRS Publication 596을 참조하여 정확한 공제액을 계산하거나 세무 소프트웨어를 사용하세요.
                              (Refer to IRS Publication 596 for exact credit calculation or use tax software.)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Other Credits */}
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <h4 className="font-semibold">기타공제 (Other Credits)</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
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
                                  {...field} 
                                  placeholder="0.00"
                                  className="pl-8"
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    const formatted = formatCurrency(e.target.value);
                                    field.onChange(Number(formatted));
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
                        ${form.getValues('totalCredits').toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 mt-8 mb-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 hover:text-rose-900 w-[calc(50%-0.5rem)]"
                      onClick={() => {
                        // Reset all form fields to 0
                        form.reset({
                          childTaxCredit: 0,
                          childDependentCareCredit: 0,
                          educationCredits: 0,
                          retirementSavingsCredit: 0,
                          earnedIncomeCredit: 0,
                          otherCredits: 0,
                          totalCredits: 0
                        });
                        
                        // Update tax context
                        const resetData = form.getValues();
                        updateTaxData({ taxCredits: resetData });
                        
                        toast({
                          title: "값 초기화 완료",
                          description: "모든 세금공제 항목 값이 초기화되었습니다.",
                        });
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5"><path d="M3 2v6h6"></path><path d="M3 13a9 9 0 1 0 3-7.7L3 8"></path></svg>
                      <span className="text-lg">값 초기화</span>
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 hover:text-blue-900 w-[calc(50%-0.5rem)]"
                      onClick={async () => {
                        try {
                          // 현재 폼 데이터 저장
                          const currentData = form.getValues();
                          updateTaxData({ taxCredits: currentData });
                          
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
                prevStep="/deductions"
                nextStep="/additional-tax"
                submitText="추가세금 (Additional Tax)"
                onNext={() => {
                  // Just save and continue, since all fields have valid defaults
                  onSubmit(form.getValues());
                  return true;
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TaxCreditsPage;