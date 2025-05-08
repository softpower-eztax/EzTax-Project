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
import { calculateChildTaxCredit, calculateRetirementSavingsCredit, calculateChildDependentCareCredit, calculateCreditForOtherDependents, formatNumberInput } from '@/lib/taxCalculations';

// Retirement Contributions 인터페이스 정의
interface RetirementContributions {
  traditionalIRA: number;
  rothIRA: number;
  plan401k: number;
  plan403b: number;
  plan457: number;
  simpleIRA: number;
  sepIRA: number;
  able: number;
  tsp: number;
  otherRetirementPlans: number;
  totalContributions: number;
}

// Tax Credits 인터페이스 정의
interface TaxCredits {
  childTaxCredit: number;
  childDependentCareCredit: number;
  educationCredits: number;
  aotcCredit: number;
  llcCredit: number;
  retirementSavingsCredit: number;
  retirementContributions: RetirementContributions;
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
    aotcCredit: taxData.taxCredits?.aotcCredit || 0,
    llcCredit: taxData.taxCredits?.llcCredit || 0,
    retirementSavingsCredit: taxData.taxCredits?.retirementSavingsCredit || 0,
    retirementContributions: taxData.taxCredits?.retirementContributions || {
      traditionalIRA: 0,
      rothIRA: 0,
      plan401k: 0,
      plan403b: 0,
      plan457: 0,
      simpleIRA: 0,
      sepIRA: 0,
      able: 0,
      tsp: 0,
      otherRetirementPlans: 0,
      totalContributions: 0
    },
    otherCredits: taxData.taxCredits?.otherCredits || 0,
    totalCredits: taxData.taxCredits?.totalCredits || 0
  });
  
  // 부양가족이 있는지 확인
  const hasDependents = (taxData.personalInfo?.dependents && taxData.personalInfo.dependents.length > 0) || false;
  
  // 폼 스키마 정의
  const retirementContributionsSchema = z.object({
    traditionalIRA: z.coerce.number().min(0).default(0),
    rothIRA: z.coerce.number().min(0).default(0),
    plan401k: z.coerce.number().min(0).default(0),
    plan403b: z.coerce.number().min(0).default(0),
    plan457: z.coerce.number().min(0).default(0),
    simpleIRA: z.coerce.number().min(0).default(0),
    sepIRA: z.coerce.number().min(0).default(0),
    able: z.coerce.number().min(0).default(0),
    tsp: z.coerce.number().min(0).default(0),
    otherRetirementPlans: z.coerce.number().min(0).default(0),
    totalContributions: z.coerce.number().min(0).default(0)
  });
  
  const taxCreditsSchema = z.object({
    childTaxCredit: z.coerce.number().min(0).default(0),
    childDependentCareCredit: z.coerce.number().min(0).default(0),
    educationCredits: z.coerce.number().min(0).default(0),
    aotcCredit: z.coerce.number().min(0).default(0),
    llcCredit: z.coerce.number().min(0).default(0),
    retirementSavingsCredit: z.coerce.number().min(0).default(0),
    retirementContributions: retirementContributionsSchema.default({
      traditionalIRA: 0,
      rothIRA: 0,
      plan401k: 0,
      plan403b: 0,
      plan457: 0,
      simpleIRA: 0,
      sepIRA: 0,
      able: 0,
      tsp: 0,
      otherRetirementPlans: 0,
      totalContributions: 0
    }),
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
  const aotcCredit = form.watch('aotcCredit') || 0;
  const llcCredit = form.watch('llcCredit') || 0;
  // AOTC와 LLC는 합산하여 educationCredits 필드를 업데이트
  const educationCreditsSum = Number(aotcCredit) + Number(llcCredit);
  // 새로 계산된 educationCredits 값으로 필드 업데이트
  useEffect(() => {
    form.setValue('educationCredits', educationCreditsSum);
  }, [educationCreditsSum, form]);
  
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
  
  // 은퇴 저축 공제액 계산 함수
  const calculateRetirementCredit = () => {
    const totalContributions = form.getValues('retirementContributions.totalContributions') || 0;
    const agi = taxData.income?.adjustedGrossIncome || 0;
    const filingStatus = taxData.personalInfo?.filingStatus || 'single';
    
    let creditRate = 0;
    
    // 소득 구간에 따른 공제율 결정
    if (filingStatus === 'married_joint') {
      if (agi <= 41000) creditRate = 0.5;
      else if (agi <= 44000) creditRate = 0.2;
      else if (agi <= 68000) creditRate = 0.1;
    } else if (filingStatus === 'head_of_household') {
      if (agi <= 30750) creditRate = 0.5;
      else if (agi <= 33000) creditRate = 0.2;
      else if (agi <= 51000) creditRate = 0.1;
    } else { // single, married_separate, qualifying_widow
      if (agi <= 20500) creditRate = 0.5;
      else if (agi <= 22000) creditRate = 0.2;
      else if (agi <= 34000) creditRate = 0.1;
    }
    
    // 최대 적격 금액 제한 (개인당 $2,000)
    const eligibleContribution = Math.min(totalContributions, filingStatus === 'married_joint' ? 4000 : 2000);
    
    // 공제액 계산
    const creditAmount = eligibleContribution * creditRate;
    
    // 최대 공제액 제한 (부부 공동 신고의 경우 $2,000, 그 외 $1,000)
    const maxCredit = filingStatus === 'married_joint' ? 2000 : 1000;
    const finalCredit = Math.min(creditAmount, maxCredit);
    
    // 폼에 계산된 공제액 설정
    form.setValue('retirementSavingsCredit', finalCredit);
  };
  
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
        aotcCredit: taxData.taxCredits.aotcCredit || 0,
        llcCredit: taxData.taxCredits.llcCredit || 0,
        retirementSavingsCredit: taxData.taxCredits.retirementSavingsCredit || 0,
        retirementContributions: taxData.taxCredits.retirementContributions || {
          traditionalIRA: 0,
          rothIRA: 0,
          plan401k: 0,
          plan403b: 0,
          plan457: 0,
          simpleIRA: 0,
          sepIRA: 0,
          able: 0,
          tsp: 0,
          otherRetirementPlans: 0,
          totalContributions: 0
        },
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
        aotcCredit: 0,
        llcCredit: 0,
        retirementSavingsCredit: 0,
        retirementContributions: {
          traditionalIRA: 0,
          rothIRA: 0,
          plan401k: 0,
          plan403b: 0,
          plan457: 0,
          simpleIRA: 0,
          sepIRA: 0,
          able: 0,
          tsp: 0,
          otherRetirementPlans: 0,
          totalContributions: 0
        },
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
      aotcCredit: 0,
      llcCredit: 0,
      retirementSavingsCredit: 0,
      retirementContributions: {
        traditionalIRA: 0,
        rothIRA: 0,
        plan401k: 0,
        plan403b: 0,
        plan457: 0,
        simpleIRA: 0,
        sepIRA: 0,
        able: 0,
        tsp: 0,
        otherRetirementPlans: 0,
        totalContributions: 0
      },
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
                                    const formatted = formatNumberInput(e.target.value);
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
                        <p>개인정보 섹션에 부양가족을 추가하지 않았습니다. 
                        자격을 갖춘 부양가족이 있다면, 뒤로 돌아가 추가해주세요.</p>
                        <p className="text-xs mt-1">(You have not added any dependents in the Personal Information section. 
                        If you have qualifying dependents, please go back and add them.)</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="childDependentCareCredit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>자녀및부양가족돌봄공제액 (Child and Dependent Care Credit Amount)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                <Input 
                                  placeholder="0.00"
                                  className="pl-8"
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    const formatted = formatNumberInput(e.target.value);
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
                  
                  {/* Credit for Other Dependents */}
                  <div className="mb-6 border-b border-gray-light pb-6">
                    <div className="flex items-center mb-3">
                      <h4 className="font-semibold">기타 부양가족 세액공제 (Credit for Other Dependents)</h4>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-dark ml-2 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-64">
                              자녀세액공제 대상이 아닌 부양가족 각각에 대해 최대 $500까지의 세액공제를 받을 수 있습니다.
                              (You may be eligible for a Credit for Other Dependents of up to $500 for each qualifying dependent who doesn't qualify for the Child Tax Credit.)
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    {!hasDependents && (
                      <div className="bg-gray-bg p-3 rounded-md mb-3 text-sm">
                        <p>개인정보 섹션에 부양가족을 추가하지 않았습니다. 
                        부양가족이 있다면, 뒤로 돌아가 추가해주세요.</p>
                        <p className="text-xs mt-1">(You have not added any dependents in the Personal Information section. 
                        If you have dependents, please go back and add them.)</p>
                      </div>
                    )}
                    
                    {hasDependents && (
                      <div className="bg-blue-50 p-3 rounded-md mb-3 border border-blue-200">
                        <p className="text-sm flex items-center">
                          <span className="font-medium">자동 계산된 기타 부양가족 세액공제액 (Auto-calculated Credit for Other Dependents):</span>
                          <span className="ml-2 font-bold">${calculateCreditForOtherDependents(
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
                              const calculatedAmount = calculateCreditForOtherDependents(
                                taxData.personalInfo?.dependents || [],
                                taxData.income?.adjustedGrossIncome || 0,
                                taxData.personalInfo?.filingStatus || 'single'
                              );
                              form.setValue('otherCredits', calculatedAmount);
                            }}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            적용 (Apply)
                          </Button>
                        </p>
                        <p className="text-xs mt-1 text-gray-600">
                          17세 이상 부양가족 또는 자녀세액공제 대상이 아닌 부양가족 수와 소득을 기준으로 계산됩니다.
                          (Calculated based on dependents who are 17 or older, or who don't qualify for the Child Tax Credit, and your income.)
                        </p>
                        <p className="text-xs mt-1 text-gray-600">
                          적격 부양가족 수: {(taxData.personalInfo?.dependents || []).filter(dependent => {
                            // Check if NOT eligible for Child Tax Credit (so eligible for COD)
                            const birthDate = new Date(dependent.dateOfBirth);
                            const taxYearEnd = new Date('2025-12-31');
                            const age = taxYearEnd.getFullYear() - birthDate.getFullYear();
                            return age >= 17 || !dependent.isQualifyingChild;
                          }).length} | 부양가족당 공제액: $500 | 소득 수준: $
                          {(taxData.income?.adjustedGrossIncome || 0).toLocaleString()}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="otherCredits"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>기타 부양가족 세액공제액 (Credit for Other Dependents Amount)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                <Input 
                                  placeholder="0.00"
                                  className="pl-8"
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    const formatted = formatNumberInput(e.target.value);
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
                      <h4 className="font-semibold">교육비공제 (Education Credits)</h4>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-dark ml-2 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-64">
                              적격 학생의 교육 비용에 대한 공제입니다. 미국학력장려세액공제(American Opportunity Credit)와 평생교육세액공제(Lifetime Learning Credit)가 포함됩니다.
                              (Credits for education expenses for eligible students. Includes the American Opportunity Credit and Lifetime Learning Credit.)
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {/* AOTC 설명 부분 */}
                    <div className="mb-4 bg-gray-50 p-3 rounded-md text-sm border border-gray-200">
                      <p className="font-medium mb-1">미국학력장려세액공제 (AOTC, American Opportunity Tax Credit)</p>
                      <p className="text-xs text-gray-600">
                        학부 과정의 처음 4년간 적격 학생당 최대 $2,500까지 공제 가능합니다. 
                        적격 교육비와 교재비가 포함됩니다. 최대 $1,000까지 환급 가능합니다.
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        (Provides up to $2,500 per eligible student for the first 4 years of undergraduate education.
                        Includes tuition, fees, and course materials. Up to $1,000 is refundable.)
                      </p>
                    </div>

                    {/* LLC 설명 부분 */}
                    <div className="mb-4 bg-gray-50 p-3 rounded-md text-sm border border-gray-200">
                      <p className="font-medium mb-1">평생교육세액공제 (LLC, Lifetime Learning Credit)</p>
                      <p className="text-xs text-gray-600">
                        적격 교육비의 20%까지, 신고서당 최대 $2,000까지 공제 가능합니다. 학위 과정 뿐 아니라
                        직업 기술 향상을 위한 교육도 포함됩니다. 환급 불가능합니다.
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        (Provides up to 20% of qualifying expenses, maximum $2,000 per return.
                        Available for undergraduate, graduate, and professional degree courses, as well as courses to improve job skills.
                        Non-refundable.)
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="aotcCredit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>미국학력장려세액공제액 (AOTC Amount)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                  <Input 
                                    placeholder="0.00"
                                    className="pl-8"
                                    value={field.value || ''}
                                    onChange={(e) => {
                                      const formatted = formatNumberInput(e.target.value);
                                      const value = formatted ? Number(formatted) : 0;
                                      field.onChange(value);
                                      
                                      // Update total education credits
                                      const llcValue = form.getValues('llcCredit') || 0;
                                      form.setValue('educationCredits', value + llcValue);
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
                          name="llcCredit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>평생교육세액공제액 (LLC Amount)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                  <Input 
                                    placeholder="0.00"
                                    className="pl-8"
                                    value={field.value || ''}
                                    onChange={(e) => {
                                      const formatted = formatNumberInput(e.target.value);
                                      const value = formatted ? Number(formatted) : 0;
                                      field.onChange(value);
                                      
                                      // Update total education credits
                                      const aotcValue = form.getValues('aotcCredit') || 0;
                                      form.setValue('educationCredits', aotcValue + value);
                                    }}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="educationCredits"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>총 교육비공제액 (Total Education Credit Amount)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                <Input 
                                  placeholder="0.00"
                                  className="pl-8 bg-gray-50"
                                  value={field.value || ''}
                                  disabled
                                />
                              </div>
                            </FormControl>
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
                              적격 은퇴 계좌에 대한 기여금에 대해 소득에 따라 최대 50%까지 공제 받을 수 있습니다.
                              (You may be eligible for a credit of up to 50% of your contributions to eligible retirement accounts, depending on your income.)
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    {/* Retirement Account Contributions Form */}
                    <div className="bg-gray-50 p-4 rounded-md mb-4">
                      <h5 className="font-medium mb-3">은퇴 계좌 납입금 (Retirement Account Contributions)</h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="retirementContributions.traditionalIRA"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>전통적 IRA (Traditional IRA)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                  <Input 
                                    placeholder="0.00"
                                    className="pl-8"
                                    value={field.value || ''}
                                    onChange={(e) => {
                                      const formatted = formatNumberInput(e.target.value);
                                      const value = formatted ? Number(formatted) : 0;
                                      field.onChange(value);
                                      
                                      // Update total contributions
                                      const currentContributions = form.getValues('retirementContributions');
                                      const total = Object.entries(currentContributions)
                                        .filter(([key]) => key !== 'totalContributions')
                                        .reduce((sum, [_, val]) => sum + (Number(val) || 0), 0);
                                      
                                      form.setValue('retirementContributions.totalContributions', total);
                                      calculateRetirementCredit();
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
                          name="retirementContributions.rothIRA"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>로스 IRA (Roth IRA)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                  <Input 
                                    placeholder="0.00"
                                    className="pl-8"
                                    value={field.value || ''}
                                    onChange={(e) => {
                                      const formatted = formatNumberInput(e.target.value);
                                      const value = formatted ? Number(formatted) : 0;
                                      field.onChange(value);
                                      
                                      // Update total contributions
                                      const currentContributions = form.getValues('retirementContributions');
                                      const total = Object.entries(currentContributions)
                                        .filter(([key]) => key !== 'totalContributions')
                                        .reduce((sum, [_, val]) => sum + (Number(val) || 0), 0);
                                      
                                      form.setValue('retirementContributions.totalContributions', total);
                                      calculateRetirementCredit();
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
                          name="retirementContributions.plan401k"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>401(k) 플랜</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                  <Input 
                                    placeholder="0.00"
                                    className="pl-8"
                                    value={field.value || ''}
                                    onChange={(e) => {
                                      const formatted = formatNumberInput(e.target.value);
                                      const value = formatted ? Number(formatted) : 0;
                                      field.onChange(value);
                                      
                                      // Update total contributions
                                      const currentContributions = form.getValues('retirementContributions');
                                      const total = Object.entries(currentContributions)
                                        .filter(([key]) => key !== 'totalContributions')
                                        .reduce((sum, [_, val]) => sum + (Number(val) || 0), 0);
                                      
                                      form.setValue('retirementContributions.totalContributions', total);
                                      calculateRetirementCredit();
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
                          name="retirementContributions.plan403b"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>403(b) 플랜</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                  <Input 
                                    placeholder="0.00"
                                    className="pl-8"
                                    value={field.value || ''}
                                    onChange={(e) => {
                                      const formatted = formatNumberInput(e.target.value);
                                      const value = formatted ? Number(formatted) : 0;
                                      field.onChange(value);
                                      
                                      // Update total contributions
                                      const currentContributions = form.getValues('retirementContributions');
                                      const total = Object.entries(currentContributions)
                                        .filter(([key]) => key !== 'totalContributions')
                                        .reduce((sum, [_, val]) => sum + (Number(val) || 0), 0);
                                      
                                      form.setValue('retirementContributions.totalContributions', total);
                                      calculateRetirementCredit();
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
                          name="retirementContributions.plan457"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>457 플랜</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                  <Input 
                                    placeholder="0.00"
                                    className="pl-8"
                                    value={field.value || ''}
                                    onChange={(e) => {
                                      const formatted = formatNumberInput(e.target.value);
                                      const value = formatted ? Number(formatted) : 0;
                                      field.onChange(value);
                                      
                                      // Update total contributions
                                      const currentContributions = form.getValues('retirementContributions');
                                      const total = Object.entries(currentContributions)
                                        .filter(([key]) => key !== 'totalContributions')
                                        .reduce((sum, [_, val]) => sum + (Number(val) || 0), 0);
                                      
                                      form.setValue('retirementContributions.totalContributions', total);
                                      calculateRetirementCredit();
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
                          name="retirementContributions.simpleIRA"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SIMPLE IRA</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                  <Input 
                                    placeholder="0.00"
                                    className="pl-8"
                                    value={field.value || ''}
                                    onChange={(e) => {
                                      const formatted = formatNumberInput(e.target.value);
                                      const value = formatted ? Number(formatted) : 0;
                                      field.onChange(value);
                                      
                                      // Update total contributions
                                      const currentContributions = form.getValues('retirementContributions');
                                      const total = Object.entries(currentContributions)
                                        .filter(([key]) => key !== 'totalContributions')
                                        .reduce((sum, [_, val]) => sum + (Number(val) || 0), 0);
                                      
                                      form.setValue('retirementContributions.totalContributions', total);
                                      calculateRetirementCredit();
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
                          name="retirementContributions.sepIRA"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SEP IRA</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                  <Input 
                                    placeholder="0.00"
                                    className="pl-8"
                                    value={field.value || ''}
                                    onChange={(e) => {
                                      const formatted = formatNumberInput(e.target.value);
                                      const value = formatted ? Number(formatted) : 0;
                                      field.onChange(value);
                                      
                                      // Update total contributions
                                      const currentContributions = form.getValues('retirementContributions');
                                      const total = Object.entries(currentContributions)
                                        .filter(([key]) => key !== 'totalContributions')
                                        .reduce((sum, [_, val]) => sum + (Number(val) || 0), 0);
                                      
                                      form.setValue('retirementContributions.totalContributions', total);
                                      calculateRetirementCredit();
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
                          name="retirementContributions.able"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ABLE 계좌 (ABLE Account)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                  <Input 
                                    placeholder="0.00"
                                    className="pl-8"
                                    value={field.value || ''}
                                    onChange={(e) => {
                                      const formatted = formatNumberInput(e.target.value);
                                      const value = formatted ? Number(formatted) : 0;
                                      field.onChange(value);
                                      
                                      // Update total contributions
                                      const currentContributions = form.getValues('retirementContributions');
                                      const total = Object.entries(currentContributions)
                                        .filter(([key]) => key !== 'totalContributions')
                                        .reduce((sum, [_, val]) => sum + (Number(val) || 0), 0);
                                      
                                      form.setValue('retirementContributions.totalContributions', total);
                                      calculateRetirementCredit();
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
                          name="retirementContributions.tsp"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>TSP (Thrift Savings Plan)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                  <Input 
                                    placeholder="0.00"
                                    className="pl-8"
                                    value={field.value || ''}
                                    onChange={(e) => {
                                      const formatted = formatNumberInput(e.target.value);
                                      const value = formatted ? Number(formatted) : 0;
                                      field.onChange(value);
                                      
                                      // Update total contributions
                                      const currentContributions = form.getValues('retirementContributions');
                                      const total = Object.entries(currentContributions)
                                        .filter(([key]) => key !== 'totalContributions')
                                        .reduce((sum, [_, val]) => sum + (Number(val) || 0), 0);
                                      
                                      form.setValue('retirementContributions.totalContributions', total);
                                      calculateRetirementCredit();
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
                          name="retirementContributions.otherRetirementPlans"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>기타 은퇴 계좌 (Other Retirement Plans)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                  <Input 
                                    placeholder="0.00"
                                    className="pl-8"
                                    value={field.value || ''}
                                    onChange={(e) => {
                                      const formatted = formatNumberInput(e.target.value);
                                      const value = formatted ? Number(formatted) : 0;
                                      field.onChange(value);
                                      
                                      // Update total contributions
                                      const currentContributions = form.getValues('retirementContributions');
                                      const total = Object.entries(currentContributions)
                                        .filter(([key]) => key !== 'totalContributions')
                                        .reduce((sum, [_, val]) => sum + (Number(val) || 0), 0);
                                      
                                      form.setValue('retirementContributions.totalContributions', total);
                                      calculateRetirementCredit();
                                    }}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="mt-4">
                        <FormField
                          control={form.control}
                          name="retirementContributions.totalContributions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>총 은퇴 계좌 납입금 (Total Retirement Contributions)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                  <Input 
                                    placeholder="0.00"
                                    className="pl-8 bg-gray-100"
                                    value={field.value || ''}
                                    disabled
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Automatic calculation for Retirement Savings Credit */}
                    <div className="bg-blue-50 p-3 rounded-md mb-3 border border-blue-200">
                      <p className="text-sm flex items-center">
                        <span className="font-medium">자동 계산된 은퇴저축공제액 (Auto-calculated Retirement Savings Credit):</span>
                        {(() => {
                          // Get total contributions from the form
                          const totalContributions = form.getValues('retirementContributions.totalContributions') || 0;
                          const agi = taxData.income?.adjustedGrossIncome || 0;
                          const filingStatus = taxData.personalInfo?.filingStatus || 'single';
                          
                          let creditRate = 0;
                          
                          if (filingStatus === 'married_joint') {
                            if (agi <= 41000) creditRate = 0.5;
                            else if (agi <= 44000) creditRate = 0.2;
                            else if (agi <= 68000) creditRate = 0.1;
                          } else if (filingStatus === 'head_of_household') {
                            if (agi <= 30750) creditRate = 0.5;
                            else if (agi <= 33000) creditRate = 0.2;
                            else if (agi <= 51000) creditRate = 0.1;
                          } else { // single, married_separate, qualifying_widow
                            if (agi <= 20500) creditRate = 0.5;
                            else if (agi <= 22000) creditRate = 0.2;
                            else if (agi <= 34000) creditRate = 0.1;
                          }
                          
                          // 최대 적격 금액 제한 (개인당 $2,000)
                          const eligibleContribution = Math.min(totalContributions, filingStatus === 'married_joint' ? 4000 : 2000);
                          
                          // 공제액 계산
                          const creditAmount = eligibleContribution * creditRate;
                          
                          // 최대 공제액 제한 (부부 공동 신고의 경우 $2,000, 그 외 $1,000)
                          const maxCredit = filingStatus === 'married_joint' ? 2000 : 1000;
                          const calculatedCredit = Math.min(creditAmount, maxCredit);
                          
                          return (
                            <>
                              <span className="ml-2 font-bold">${calculatedCredit.toFixed(2)}</span>
                              <Button 
                                type="button" 
                                size="sm" 
                                variant="ghost" 
                                className="ml-2 h-6 px-2 text-xs"
                                onClick={() => {
                                  form.setValue('retirementSavingsCredit', calculatedCredit);
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
                        은퇴 저축 기여금과 소득을 기준으로 계산됩니다. 위의 버튼을 클릭하여 자동 계산된 값을 적용할 수 있습니다.
                        (Calculated based on your retirement contributions and income. Click the button above to apply the calculated value.)
                      </p>
                      <p className="text-xs mt-1 text-gray-600">
                        총 은퇴 저축 기여금: ${form.getValues('retirementContributions.totalContributions') || 0} | 조정된 총소득: ${taxData.income?.adjustedGrossIncome || 0} | 공제율:  
                        {(() => {
                          const agi = taxData.income?.adjustedGrossIncome || 0;
                          const filingStatus = taxData.personalInfo?.filingStatus || 'single';
                          
                          let creditRate = 0;
                          
                          if (filingStatus === 'married_joint') {
                            if (agi <= 41000) creditRate = 0.5;
                            else if (agi <= 44000) creditRate = 0.2;
                            else if (agi <= 68000) creditRate = 0.1;
                          } else if (filingStatus === 'head_of_household') {
                            if (agi <= 30750) creditRate = 0.5;
                            else if (agi <= 33000) creditRate = 0.2;
                            else if (agi <= 51000) creditRate = 0.1;
                          } else { // single, married_separate, qualifying_widow
                            if (agi <= 20500) creditRate = 0.5;
                            else if (agi <= 22000) creditRate = 0.2;
                            else if (agi <= 34000) creditRate = 0.1;
                          }
                          
                          return ` ${Math.round(creditRate * 100)}%`;
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
                                    const formatted = formatNumberInput(e.target.value);
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
                  
                  {/* Total Credits */}
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <h4 className="font-semibold">총 세액공제 (Total Credits)</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="totalCredits"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>총 세액공제액 (Total Credit Amount)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                <Input 
                                  placeholder="0.00"
                                  className="pl-8 bg-gray-50"
                                  value={field.value || ''}
                                  disabled
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              자동으로 계산된 총 세액공제액입니다.
                              (This is your automatically calculated total tax credits.)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-8">
                    <Button 
                      type="button" 
                      variant="destructive" 
                      onClick={handleReset}
                    >
                      값 초기화 (Reset Values)
                    </Button>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={handleSave}
                    >
                      진행 상황 저장 (Save Progress)
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        <div className="w-full md:w-80">
          <div className="sticky top-6">
            <TaxSummary recalculate={() => form.trigger()} />
            <StepNavigation 
              prevStep="/deductions" 
              nextStep="/additional-tax"
              onNext={handleNext}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxCredits3Page;