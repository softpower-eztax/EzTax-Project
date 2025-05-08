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
import { Info, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateChildTaxCredit, calculateRetirementSavingsCredit, calculateChildDependentCareCredit, formatNumberInput } from '@/lib/taxCalculations';

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
  
  // 최초 로드 시 폼 초기값 설정
  useEffect(() => {
    console.log("TaxCredits3 - 최초 로드 시 taxData:", taxData);
    
    // 1. 로컬 스토리지에서 먼저 확인 (가장 최신 상태)
    const storedValues = localStorage.getItem('taxCredits');
    if (storedValues) {
      try {
        const parsedValues = JSON.parse(storedValues);
        console.log("TaxCredits3 - 로컬스토리지에서 복원:", parsedValues);
        setSavedValues(parsedValues);
        form.reset(parsedValues);
        return; // 로컬스토리지에서 값 찾았으면 여기서 종료
      } catch (e) {
        console.error("로컬스토리지 데이터 파싱 실패:", e);
      }
    }
    
    // 2. 컨텍스트에서 값 확인
    if (taxData.taxCredits) {
      const contextValues = {
        childTaxCredit: taxData.taxCredits.childTaxCredit || 0,
        childDependentCareCredit: taxData.taxCredits.childDependentCareCredit || 0,
        educationCredits: taxData.taxCredits.educationCredits || 0,
        retirementSavingsCredit: taxData.taxCredits.retirementSavingsCredit || 0,
        otherCredits: taxData.taxCredits.otherCredits || 0,
        totalCredits: taxData.taxCredits.totalCredits || 0
      };
      
      console.log("TaxCredits3 - 컨텍스트에서 초기값 설정:", contextValues);
      setSavedValues(contextValues);
      form.reset(contextValues);
    } else {
      // 3. 기본값 설정
      const defaultValues = {
        childTaxCredit: 0,
        childDependentCareCredit: 0,
        educationCredits: 0,
        retirementSavingsCredit: 0,
        otherCredits: 0,
        totalCredits: 0
      };
      
      console.log("TaxCredits3 - 기본값 설정:", defaultValues);
      setSavedValues(defaultValues);
      form.reset(defaultValues);
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
      
      console.log("저장 전 현재 값:", currentValues);
      console.log("저장 대상 업데이트 값:", updatedValues);
      
      // 중요! 클라이언트 측 로컬 state를 먼저 업데이트하여 UI 일관성 유지
      setSavedValues(updatedValues);
      
      // UI에 즉시 변경사항 반영 (사용자가 변경한 값이 사라지지 않도록)
      form.reset(updatedValues);
      
      // 브라우저 스토리지에 저장 (세션 간에도 유지됨)
      localStorage.setItem('taxCredits', JSON.stringify(updatedValues));
      
      // 컨텍스트 업데이트
      updateTaxData({ taxCredits: updatedValues });
      
      // 서버 저장
      await saveTaxReturn();
      
      // 현재 state 유지 확인
      console.log("저장 후 form.getValues():", form.getValues());
      console.log("저장 후 savedValues:", savedValues);
      console.log("저장 후 taxData.taxCredits:", taxData.taxCredits);
      
      // 서버 저장 후 3초 후에 로컬 상태와 값을 확인 (비동기 문제 대비)
      setTimeout(() => {
        const afterSaveValues = form.getValues();
        console.log("3초 후 form.getValues():", afterSaveValues);
        
        // 만약 저장 후 값이 초기화되었으면 다시 설정
        if (JSON.stringify(afterSaveValues) !== JSON.stringify(updatedValues)) {
          console.log("값이 초기화됨 감지! 폼 값 복원 중...");
          form.reset(updatedValues);
          
          // 컨텍스트도 업데이트 (서버에서 잘못된 값을 받았을 경우)
          updateTaxData({ taxCredits: updatedValues });
        }
      }, 3000);
      
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
    
    console.log("값 초기화 실행:", resetValues);
    
    // 폼 초기화
    form.reset(resetValues);
    
    // 로컬 상태 초기화
    setSavedValues(resetValues);
    
    // 로컬 스토리지에서도 초기화된 값 저장
    localStorage.setItem('taxCredits', JSON.stringify(resetValues));
    
    // 컨텍스트 업데이트
    updateTaxData({ taxCredits: resetValues });
    
    // 서버에도 저장
    saveTaxReturn().then(() => {
      console.log("초기화된 값 서버에 저장 완료");
    }).catch(error => {
      console.error("초기화된 값 서버 저장 실패:", error);
    });
    
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
    
    console.log("다음 단계로 이동 - 현재 값:", currentValues);
    console.log("다음 단계로 이동 - 업데이트 값:", updatedValues);
    
    // 로컬 상태 업데이트 (form 값 보존을 위해)
    setSavedValues(updatedValues);
    
    // 컨텍스트 업데이트
    updateTaxData({ taxCredits: updatedValues });
    
    // 브라우저에 현재 상태 저장 (페이지 간 이동 시 데이터 보존을 위해)
    localStorage.setItem('taxCredits', JSON.stringify(updatedValues));
    
    return true;
  };
  
  // Using formatNumberInput from taxCalculations.ts
  
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
                    
                    {hasDependents && (
                      <div className="bg-blue-50 p-3 rounded-md mb-3 border border-blue-200">
                        <p className="text-sm flex items-center">
                          <span className="font-medium">자동 계산된 자녀세액공제액 (Auto-calculated Child Tax Credit):</span>
                          <span className="ml-2 font-bold">${calculateChildTaxCredit(
                            taxData.personalInfo?.dependents || [],
                            taxData.income?.adjustedGrossIncome || 0,
                            taxData.personalInfo?.filingStatus || 'single'
                          ).toFixed(2)}</span>
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="ghost" 
                            className="ml-2 h-6 px-2 text-xs"
                            onClick={() => {
                              const calculatedAmount = calculateChildTaxCredit(
                                taxData.personalInfo?.dependents || [],
                                taxData.income?.adjustedGrossIncome || 0,
                                taxData.personalInfo?.filingStatus || 'single'
                              );
                              form.setValue('childTaxCredit', calculatedAmount);
                            }}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            적용 (Apply)
                          </Button>
                        </p>
                        <p className="text-xs mt-1 text-gray-600">
                          부양가족 정보와 조정된 총소득을 기준으로 계산되었습니다. 위의 버튼을 클릭하여 자동 계산된 값을 적용할 수 있습니다.
                          (Calculated based on your dependent information and adjusted gross income. Click the button above to apply the calculated value.)
                        </p>
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
                              자녀세액공제액을 수동으로 입력하거나 자동 계산된 값을 사용하세요.
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
                    
                    {/* Automatic calculation for Child and Dependent Care Credit */}
                    {hasDependents && (
                      <div className="bg-blue-50 p-3 rounded-md mb-3 border border-blue-200">
                        <p className="text-sm flex items-center">
                          <span className="font-medium">자동 계산된 자녀및부양가족돌봄공제액 (Auto-calculated Child and Dependent Care Credit):</span>
                          {(() => {
                            // Count qualifying dependents under 13
                            const qualifyingDependents = (taxData.personalInfo?.dependents || []).filter(dependent => {
                              const birthDate = new Date(dependent.dateOfBirth);
                              const taxYearEnd = new Date('2025-12-31');
                              const age = taxYearEnd.getFullYear() - birthDate.getFullYear();
                              return age < 13;
                            });
                            
                            // For prototype, we're assuming average care expenses of $2,000 per qualifying dependent
                            const estimatedCareExpenses = qualifyingDependents.length * 2000;
                            
                            // Calculate the credit
                            const calculatedCredit = calculateChildDependentCareCredit(
                              estimatedCareExpenses,
                              taxData.income?.adjustedGrossIncome || 0,
                              qualifyingDependents.length
                            );
                            
                            return (
                              <>
                                <span className="ml-2 font-bold">${calculatedCredit.toFixed(2)}</span>
                                <Button 
                                  type="button" 
                                  size="sm" 
                                  variant="ghost" 
                                  className="ml-2 h-6 px-2 text-xs"
                                  onClick={() => {
                                    form.setValue('childDependentCareCredit', calculatedCredit);
                                  }}
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  적용 (Apply)
                                </Button>
                              </>
                            );
                          })()}
                        </p>
                        <p className="text-xs mt-1 text-gray-600">
                          13세 미만의 부양가족 수와 소득을 기준으로 계산됩니다. 위의 버튼을 클릭하여 자동 계산된 값을 적용할 수 있습니다.
                          (Calculated based on the number of dependents under 13 and your income. Click the button above to apply the calculated value.)
                        </p>
                        <p className="text-xs mt-1 text-gray-600">
                          적격 부양가족 수: {(taxData.personalInfo?.dependents || []).filter(dependent => {
                            const birthDate = new Date(dependent.dateOfBirth);
                            const taxYearEnd = new Date('2025-12-31');
                            const age = taxYearEnd.getFullYear() - birthDate.getFullYear();
                            return age < 13;
                          }).length} | 예상 보육 비용: $
                          {(taxData.personalInfo?.dependents || []).filter(dependent => {
                            const birthDate = new Date(dependent.dateOfBirth);
                            const taxYearEnd = new Date('2025-12-31');
                            const age = taxYearEnd.getFullYear() - birthDate.getFullYear();
                            return age < 13;
                          }).length * 2000} | 세액공제율: 
                          {(() => {
                            const agi = taxData.income?.adjustedGrossIncome || 0;
                            let creditRate = 0.35; // Base rate
                            
                            if (agi > 15000) {
                              const excessAGIIncrements = Math.floor((agi - 15000) / 2000);
                              creditRate = Math.max(0.20, 0.35 - (excessAGIIncrements * 0.01));
                            }
                            
                            return ` ${Math.round(creditRate * 100)}%`;
                          })()}
                        </p>
                      </div>
                    )}
                    
                    {!hasDependents && (
                      <div className="bg-gray-bg p-3 rounded-md mb-3 text-sm">
                        <p>이 공제를 계산하려면 개인정보 섹션에 부양가족을 추가해야 합니다.</p>
                        <p className="text-xs mt-1">(To calculate this credit, you need to add dependents in the Personal Information section.)</p>
                      </div>
                    )}
                    
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
                            <FormDescription>
                              보육 비용에 대한 세액공제입니다. 일반적으로 소득에 따라 비용의 20%-35%가 공제됩니다.
                              (Credit for care expenses. Generally, 20%-35% of expenses based on income.)
                            </FormDescription>
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
                    
                    {/* Automatic calculation for Retirement Savings Credit */}
                    <div className="bg-blue-50 p-3 rounded-md mb-3 border border-blue-200">
                      <p className="text-sm flex items-center">
                        <span className="font-medium">자동 계산된 은퇴저축공제액 (Auto-calculated Retirement Savings Credit):</span>
                        <span className="ml-2 font-bold">${calculateRetirementSavingsCredit(
                          taxData.income?.adjustments?.retirementContributions || 0,
                          taxData.income?.adjustedGrossIncome || 0,
                          taxData.personalInfo?.filingStatus || 'single',
                          taxData.personalInfo?.filingStatus === 'married_joint' || taxData.personalInfo?.filingStatus === 'qualifying_widow'
                        ).toFixed(2)}</span>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="ghost" 
                          className="ml-2 h-6 px-2 text-xs"
                          onClick={() => {
                            const calculatedAmount = calculateRetirementSavingsCredit(
                              taxData.income?.adjustments?.retirementContributions || 0,
                              taxData.income?.adjustedGrossIncome || 0,
                              taxData.personalInfo?.filingStatus || 'single',
                              taxData.personalInfo?.filingStatus === 'married_joint' || taxData.personalInfo?.filingStatus === 'qualifying_widow'
                            );
                            form.setValue('retirementSavingsCredit', calculatedAmount);
                          }}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          적용 (Apply)
                        </Button>
                      </p>
                      <p className="text-xs mt-1 text-gray-600">
                        소득과 은퇴 계좌 기여금을 기준으로 계산됩니다. 위의 버튼을 클릭하여 자동 계산된 값을 적용할 수 있습니다.
                        (Calculated based on your income and retirement contributions. Click the button above to apply the calculated value.)
                      </p>
                      <p className="text-xs mt-1 text-gray-600">
                        적격 기여금: ${taxData.income?.adjustments?.retirementContributions || 0} | 소득 기준 세액공제율: 
                        {(() => {
                          const agi = taxData.income?.adjustedGrossIncome || 0;
                          const filingStatus = taxData.personalInfo?.filingStatus || 'single';
                          const thresholds = {
                            single: [21750, 23750, 36500],
                            head_of_household: [32625, 35625, 54750],
                            married_joint: [43500, 47500, 73000],
                            married_separate: [21750, 23750, 36500],
                            qualifying_widow: [43500, 47500, 73000]
                          };
                          
                          if (agi <= thresholds[filingStatus][0]) return " 50%";
                          if (agi <= thresholds[filingStatus][1]) return " 20%";
                          if (agi <= thresholds[filingStatus][2]) return " 10%";
                          return " 0%";
                        })()}
                      </p>
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
                            <FormDescription>
                              소득 수준에 따라 최대 50%의 세액공제를 받을 수 있습니다.
                              (You may qualify for up to 50% credit rate depending on your income level.)
                            </FormDescription>
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