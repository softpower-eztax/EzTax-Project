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
  otherCredits: number;
  totalCredits: number;
}

// Extended TaxCredits interface for the form
interface TaxCreditsFormData extends TaxCredits {
  retirementContributions: RetirementContributions;
}

const TaxCredits3Page: React.FC = () => {
  const { taxData, updateTaxData, saveTaxReturn } = useTaxContext();
  const { toast } = useToast();
  
  // 컴포넌트 내부 상태 관리
  const [savedValues, setSavedValues] = useState<TaxCreditsFormData>({
    childTaxCredit: taxData.taxCredits?.childTaxCredit || 0,
    childDependentCareCredit: taxData.taxCredits?.childDependentCareCredit || 0,
    educationCredits: taxData.taxCredits?.educationCredits || 0,
    aotcCredit: taxData.taxCredits?.aotcCredit || 0,
    llcCredit: taxData.taxCredits?.llcCredit || 0,
    retirementSavingsCredit: taxData.taxCredits?.retirementSavingsCredit || 0,
    retirementContributions: taxData.retirementContributions || {
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
    otherCredits: z.coerce.number().min(0).default(0),
    totalCredits: z.coerce.number().min(0).default(0)
  });
  
  // Create full schema for form validation
  const taxCreditsFormSchema = z.object({
    ...taxCreditsSchema.shape,
    retirementContributions: retirementContributionsSchema
  });

  // useForm 설정
  const form = useForm<TaxCreditsFormData>({
    resolver: zodResolver(taxCreditsFormSchema),
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
    // 은퇴 기여금 총액 계산
    const values = form.getValues();
    const totalContributions = values.retirementContributions?.totalContributions || 0;
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
        retirementContributions: taxData.retirementContributions || {
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
      
      // 컨텍스트 업데이트 - 세금 공제 및 은퇴 기여금 분리 저장
      const { retirementContributions, ...otherTaxCredits } = updatedValues;
      updateTaxData({ 
        taxCredits: otherTaxCredits,
        retirementContributions: retirementContributions
      });
      
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
    // 세금 공제 항목 초기화
    const resetTaxCredits = {
      childTaxCredit: 0,
      childDependentCareCredit: 0,
      educationCredits: 0,
      aotcCredit: 0,
      llcCredit: 0,
      retirementSavingsCredit: 0,
      otherCredits: 0,
      totalCredits: 0
    };
    
    // 은퇴 기여금 초기화
    const resetRetirementContributions = {
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
    };
    
    // 합친 resetValues는 폼과 로컬 스토리지를 위한 용도로만 사용
    const resetValues = {
      ...resetTaxCredits,
      retirementContributions: resetRetirementContributions
    };
    
    console.log("값 초기화 실행:", resetValues);
    
    // 폼 초기화
    form.reset(resetValues);
    
    // 로컬 상태 초기화
    setSavedValues(resetValues);
    
    // 로컬 스토리지에서도 초기화된 값 저장
    localStorage.setItem('taxCredits', JSON.stringify(resetValues));
    
    // 컨텍스트 업데이트 - 세금 공제와 은퇴 기여금 분리
    updateTaxData({ 
      taxCredits: resetTaxCredits,
      retirementContributions: resetRetirementContributions
    });
    
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
    
    // 은퇴 기여금 분리
    const retirementContributions = currentValues.retirementContributions || {};
    
    // 세금 공제 정보만 포함
    const taxCreditsValues = {
      childTaxCredit: currentValues.childTaxCredit || 0,
      childDependentCareCredit: currentValues.childDependentCareCredit || 0,
      educationCredits: currentValues.educationCredits || 0,
      aotcCredit: currentValues.aotcCredit || 0,
      llcCredit: currentValues.llcCredit || 0,
      retirementSavingsCredit: currentValues.retirementSavingsCredit || 0,
      otherCredits: currentValues.otherCredits || 0,
      totalCredits: calculatedTotal
    };
    
    // 폼 데이터 로그
    console.log("다음 단계로 이동 - 현재 값:", currentValues);
    console.log("다음 단계로 이동 - 세금 공제 값:", taxCreditsValues);
    console.log("다음 단계로 이동 - 은퇴 기여금:", retirementContributions);
    
    // 로컬 상태와 로컬 스토리지에 저장할 통합 데이터
    const combinedValues = {
      ...taxCreditsValues,
      retirementContributions
    };
    
    // 로컬 상태 업데이트 (form 값 보존을 위해)
    setSavedValues(combinedValues);
    
    // 컨텍스트 업데이트 - 분리된 데이터로 업데이트
    updateTaxData({ 
      taxCredits: taxCreditsValues,
      retirementContributions
    });
    
    // 브라우저에 현재 상태 저장 (페이지 간 이동 시 데이터 보존을 위해)
    localStorage.setItem('taxCredits', JSON.stringify(combinedValues));
    
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
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-heading font-semibold text-primary-dark">세금공제 (Tax Credits)</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                  onClick={handleReset}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  값 초기화
                </Button>
              </div>
              
              <Form {...form}>
                <form onSubmit={(e) => e.preventDefault()}>
                  {/* 부양가족 관련 세액공제 */}
                  <div className="mb-6 border-b border-gray-light pb-6">
                    <div className="flex items-center mb-3">
                      <h4 className="font-semibold">부양가족 관련 세액공제 (Dependent-Related Credits)</h4>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-dark ml-2 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-64">
                              자녀 및 부양가족과 관련된 다양한 세액공제를 신청할 수 있습니다. (Various tax credits related to your children and dependents.)
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    {!hasDependents && (
                      <div className="p-4 bg-gray-50 rounded-md mb-4 text-gray-600">
                        <p>부양가족 정보가 없습니다. 부양가족 정보를 입력하면 관련 세액공제를 받을 수 있습니다.</p>
                        <p>(No dependents information found. Adding dependents may qualify you for tax credits.)</p>
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
                              <div className="flex items-center gap-2">
                                <div className="relative flex-grow">
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
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  className="whitespace-nowrap"
                                  onClick={() => {
                                    // 자녀 세액 공제 자동 계산
                                    const dependents = taxData.personalInfo?.dependents || [];
                                    const filingStatus = taxData.personalInfo?.filingStatus || 'single';
                                    const adjustedGrossIncome = taxData.income?.adjustedGrossIncome || 0;
                                    const creditAmount = calculateChildTaxCredit(dependents, adjustedGrossIncome, filingStatus);
                                    
                                    // 계산된 값 설정
                                    field.onChange(creditAmount);
                                    console.log('자동 계산된 자녀 세액 공제액:', creditAmount);
                                  }}
                                >
                                  자동계산
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="childDependentCareCredit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>기타 부양가족 공제 (Credit for Other Dependents, ODC)</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <div className="relative flex-grow">
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
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  className="whitespace-nowrap"
                                  onClick={() => {
                                    // 부양가족 정보
                                    const dependents = taxData.personalInfo?.dependents || [];
                                    
                                    // 조정된 총소득
                                    const adjustedGrossIncome = taxData.income?.adjustedGrossIncome || 0;
                                    
                                    // 신고 상태
                                    const filingStatus = taxData.personalInfo?.filingStatus || 'single';
                                    
                                    // 자동 계산 - 기타 부양가족 공제
                                    const creditAmount = calculateCreditForOtherDependents(
                                      dependents,
                                      adjustedGrossIncome,
                                      filingStatus
                                    );
                                    
                                    // 계산된 값 설정
                                    field.onChange(creditAmount);
                                    console.log('자동 계산된 기타 부양가족 공제액:', creditAmount);
                                  }}
                                >
                                  자동계산
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                            <FormDescription className="text-xs mt-1">
                              17세 이상 부양가족에 대해 최대 $500의 세액공제를 받을 수 있습니다.
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>
                    

                  </div>
                  
                  {/* 교육 관련 세액공제 */}
                  <div className="mb-6 border-b border-gray-light pb-6">
                    <div className="flex items-center mb-3">
                      <h4 className="font-semibold">교육 관련 세액공제 (Education Credits)</h4>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-dark ml-2 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-64">
                              교육비에 대한 세액공제로 미국 세금 제도에서는 두 가지 주요 교육 세액공제인 미국 기회 세액공제(AOTC)와 평생 학습 세액공제(LLC)를 제공합니다.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="aotcCredit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>미국기회세액공제 (American Opportunity Tax Credit, AOTC)</FormLabel>
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
                      
                      <FormField
                        control={form.control}
                        name="llcCredit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>평생학습공제 (Lifetime Learning Credit, LLC)</FormLabel>
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
                    
                    <FormField
                      control={form.control}
                      name="educationCredits"
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel>교육 세액공제 총합 (Total Education Credits)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                              <Input 
                                placeholder="0.00"
                                className="pl-8"
                                disabled 
                                value={field.value || ''}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* 은퇴 저축 세액공제 */}
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
                              은퇴 계좌에 저축한 금액에 대한 세액공제입니다. 소득 수준에 따라 적격 은퇴 저축액의 10%, 20%, 50%까지 공제받을 수 있습니다.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    {/* 은퇴 기여금 입력 필드들 */}
                    <div className="mb-4">
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
                                      field.onChange(formatted ? Number(formatted) : 0);
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                                    field.onChange(formatted ? Number(formatted) : 0);
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                                    field.onChange(formatted ? Number(formatted) : 0);
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                                    field.onChange(formatted ? Number(formatted) : 0);
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
                            <FormLabel>ABLE 계좌</FormLabel>
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <FormField
                        control={form.control}
                        name="retirementContributions.tsp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Thrift Savings Plan (TSP)</FormLabel>
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
                      
                      <FormField
                        control={form.control}
                        name="retirementContributions.otherRetirementPlans"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>기타 은퇴 계획 (Other Retirement Plans)</FormLabel>
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <FormField
                        control={form.control}
                        name="retirementContributions.totalContributions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>총 기여금 (Total Contributions)</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <div className="relative flex-grow">
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
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    // 모든 은퇴 기여금 필드 합산
                                    const values = form.getValues().retirementContributions;
                                    const total = 
                                      (values.traditionalIRA || 0) +
                                      (values.rothIRA || 0) +
                                      (values.plan401k || 0) +
                                      (values.plan403b || 0) +
                                      (values.plan457 || 0) +
                                      (values.simpleIRA || 0) +
                                      (values.sepIRA || 0) +
                                      (values.able || 0) +
                                      (values.tsp || 0) +
                                      (values.otherRetirementPlans || 0);
                                    
                                    // 총액 업데이트
                                    form.setValue('retirementContributions.totalContributions', total);
                                  }}
                                >
                                  합계계산
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="retirementSavingsCredit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>저축공제액 (Retirement Savings Credit)</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <div className="relative flex-grow">
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
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  onClick={calculateRetirementCredit}
                                >
                                  자동계산
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* 기타 세액공제 */}
                  <div className="mb-6 border-b border-gray-light pb-6">
                    <div className="mb-3">
                      <h4 className="font-semibold">기타 세액공제 (Other Credits)</h4>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="otherCredits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>기타 세액공제 합계 (Total Other Credits)</FormLabel>
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
                  
                  {/* 총 세액공제 */}
                  <div>
                    <FormField
                      control={form.control}
                      name="totalCredits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold">총 세액공제 (Total Tax Credits)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                              <Input 
                                placeholder="0.00"
                                className="pl-8 text-lg font-bold"
                                disabled
                                value={field.value || ''}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          <StepNavigation
            prevStep="/deductions"
            nextStep="/additional-tax"
            onNext={handleNext}
          />
        </div>
      </div>
    </div>
  );
};

export default TaxCredits3Page;