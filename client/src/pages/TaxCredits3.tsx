import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from '@/hooks/use-toast';
import ProgressTracker from '@/components/ProgressTracker';

import StepNavigation from '@/components/StepNavigation';
import { useTaxContext } from '@/context/TaxContext';
import { Info, RefreshCw, PlusCircle, Trash2 } from 'lucide-react';
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

// Other Credit Item 인터페이스 정의
interface OtherCreditItem {
  type: string;
  amount: number;
  description?: string;
}

// Tax Credits 인터페이스 정의
interface TaxCredits {
  childTaxCredit: number;
  childDependentCareCredit: number;
  educationCredits: number;
  aotcCredit: number;
  llcCredit: number;
  retirementSavingsCredit: number;
  foreignTaxCredit: number;
  earnedIncomeCredit: number;
  otherCredits: number;
  otherCreditItems?: OtherCreditItem[];
  totalCredits: number;
}

// 돌봄 서비스 제공자 정보 인터페이스 정의
interface CareProvider {
  name: string;
  address: string;
  taxId: string; // SSN 또는 EIN
  amount: number; // 해당 제공자에게 지불한 금액
}

// 폼 데이터 인터페이스 정의
interface TaxCreditsFormData extends TaxCredits {
  retirementContributions: RetirementContributions;
  // 추가 필드
  careExpenses: number; // 돌봄 비용
  careProviders: CareProvider[]; // 돌봄 제공자 정보
}



// 기본값 설정
const defaultRetirementContributions: RetirementContributions = {
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

const defaultCareProvider: CareProvider = {
  name: '',
  address: '',
  taxId: '',
  amount: 0
};

// 기본 폼 데이터
const defaultFormData: TaxCreditsFormData = {
  childTaxCredit: 0,
  childDependentCareCredit: 0,
  educationCredits: 0,
  aotcCredit: 0,
  llcCredit: 0,
  retirementSavingsCredit: 0,
  foreignTaxCredit: 0,
  earnedIncomeCredit: 0,
  otherCredits: 0,
  otherCreditItems: [],
  totalCredits: 0,
  retirementContributions: defaultRetirementContributions,
  careExpenses: 0,
  careProviders: [defaultCareProvider]
};

// zod 스키마 정의
const formSchema = z.object({
  childTaxCredit: z.coerce.number().min(0).default(0),
  childDependentCareCredit: z.coerce.number().min(0).default(0),
  educationCredits: z.coerce.number().min(0).default(0),
  aotcCredit: z.coerce.number().min(0).default(0),
  llcCredit: z.coerce.number().min(0).default(0),
  retirementSavingsCredit: z.coerce.number().min(0).default(0),
  foreignTaxCredit: z.coerce.number().min(0).default(0),
  earnedIncomeCredit: z.coerce.number().min(0).default(0),
  otherCredits: z.coerce.number().min(0).default(0),
  otherCreditItems: z.array(
    z.object({
      type: z.string().optional(),
      amount: z.coerce.number().min(0).default(0),
      description: z.string().optional()
    })
  ).optional(),
  totalCredits: z.coerce.number().min(0).default(0),
  retirementContributions: z.object({
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
  }),
  careExpenses: z.coerce.number().min(0).default(0),
  careProviders: z.array(
    z.object({
      name: z.string().optional(),
      address: z.string().optional(),
      taxId: z.string().optional(),
      amount: z.coerce.number().min(0).default(0)
    })
  ).optional()
});

const TaxCredits3Page: React.FC = () => {
  const { taxData, updateTaxData } = useTaxContext();
  const { toast } = useToast();
  
  // 돌봄 비용 입력 필드 표시 여부를 위한 상태
  const [showCareExpenseFields, setShowCareExpenseFields] = useState<boolean>(false);
  
  // 은퇴저축 필드 표시 여부를 위한 상태
  const [showRetirementFields, setShowRetirementFields] = useState<boolean>(false);
  
  // 컴포넌트 내부 상태 관리
  const [pendingChanges, setPendingChanges] = useState<boolean>(false);
  
  // 폼 설정
  const form = useForm<TaxCreditsFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormData
  });
  
  // 기타 세액공제 항목을 위한 필드 배열 설정
  const { fields: otherCreditItemFields, append: appendOtherCreditItem, remove: removeOtherCreditItem } = 
    useFieldArray({
      control: form.control,
      name: "otherCreditItems"
    });
  
  // 돌봄 서비스 제공자 정보를 위한 필드 배열 설정
  const { fields: careProviderFields, append: appendCareProvider, remove: removeCareProvider } = 
    useFieldArray({
      control: form.control,
      name: "careProviders"
    });
  
  // 총 기여금 감시
  const retirementContributionsTotal = form.watch('retirementContributions.totalContributions') || 0;
  
  // 모든 개별 은퇴 기여금을 합산하여 총 기여금 필드 업데이트
  const calculateAllRetirementContributions = () => {
    const values = form.getValues();
    const total = 
      (values.retirementContributions?.traditionalIRA || 0) +
      (values.retirementContributions?.rothIRA || 0) +
      (values.retirementContributions?.plan401k || 0) +
      (values.retirementContributions?.plan403b || 0) +
      (values.retirementContributions?.plan457 || 0) +
      (values.retirementContributions?.simpleIRA || 0) +
      (values.retirementContributions?.sepIRA || 0) +
      (values.retirementContributions?.able || 0) +
      (values.retirementContributions?.tsp || 0) +
      (values.retirementContributions?.otherRetirementPlans || 0);
    
    form.setValue('retirementContributions.totalContributions', total);
    
    // 은퇴저축공제 자동 계산
    setTimeout(() => calculateRetirementCredit(), 100);
  };
  
  // EIC 자동 계산 함수 (컴포넌트용)
  const calculateEarnedIncomeCredit = () => {
    const agi = taxData.income?.adjustedGrossIncome || 0;
    
    // **중요: 투자소득 제한 확인 (2024년 기준 $11,600)**
    const investmentIncome = (taxData.income?.interestIncome || 0) + 
                           (taxData.income?.dividends || 0) + 
                           (taxData.income?.capitalGains || 0);
    
    // 투자소득이 $11,600을 초과하면 EIC 부적격
    if (investmentIncome > 11600) {
      console.log(`투자소득 ${investmentIncome}이 한도 $11,600을 초과하여 EIC 부적격`);
      return 0;
    }
    
    // EIC를 위한 근로소득 계산 (사업소득도 포함)
    const wages = taxData.income?.wages || 0;
    const otherEarnedIncome = taxData.income?.otherEarnedIncome || 0;
    const businessIncome = taxData.income?.businessIncome || 0; // 사업소득도 근로소득에 포함
    
    // 근로소득 = 급여 + 기타근로소득 + 사업소득 (양수인 경우만)
    const earnedIncome = wages + otherEarnedIncome + Math.max(0, businessIncome);
    
    // 근로소득이 0이면 AGI를 근로소득으로 간주 (보수적 접근)
    const effectiveEarnedIncome = earnedIncome > 0 ? earnedIncome : agi;
    
    const filingStatus = taxData.personalInfo?.filingStatus || 'single';
    
    console.log("EIC 소득 계산 상세:", { 
      wages, 
      otherEarnedIncome, 
      businessIncome, 
      earnedIncome, 
      effectiveEarnedIncome, 
      agi 
    });
    // EIC 적격자녀 수 계산 (17세 미만만 해당)
    const qualifyingChildren = taxData.personalInfo?.dependents?.filter(dependent => {
      if (dependent.relationship !== 'child') return false;
      
      // 나이 계산 (2024년 말 기준)
      const birthDate = new Date(dependent.dateOfBirth);
      const taxYearEnd = new Date('2024-12-31');
      let age = taxYearEnd.getFullYear() - birthDate.getFullYear();
      const monthDiff = taxYearEnd.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && taxYearEnd.getDate() < birthDate.getDate())) {
        age--;
      }
      
      console.log(`EIC 적격자녀 확인 - ${dependent.firstName}: ${age}세, 적격 여부: ${age < 17}`);
      
      // 17세 미만만 EIC 적격자녀
      return age < 17;
    })?.length || 0;
    
    console.log("EIC 계산 파라미터:", { agi, earnedIncome: effectiveEarnedIncome, filingStatus, qualifyingChildren });
    
    // EIC 계산 로직 (2024년 기준) - 정확한 IRS 한도표
    const limits = {
      0: { // 자녀 없음
        single: { phaseInLimit: 8180, phaseOutStart: 9910, phaseOutEnd: 17900, maxCredit: 632 },
        married: { phaseInLimit: 8180, phaseOutStart: 15790, phaseOutEnd: 24550, maxCredit: 632 }
      },
      1: { // 자녀 1명
        single: { phaseInLimit: 11750, phaseOutStart: 27830, phaseOutEnd: 47915, maxCredit: 4213 },
        married: { phaseInLimit: 11750, phaseOutStart: 33610, phaseOutEnd: 53865, maxCredit: 4213 }
      },
      2: { // 자녀 2명
        single: { phaseInLimit: 11750, phaseOutStart: 27830, phaseOutEnd: 53057, maxCredit: 6960 },
        married: { phaseInLimit: 11750, phaseOutStart: 33610, phaseOutEnd: 59187, maxCredit: 6960 }
      },
      3: { // 자녀 3명 이상
        single: { phaseInLimit: 11750, phaseOutStart: 27830, phaseOutEnd: 56838, maxCredit: 7830 },
        married: { phaseInLimit: 11750, phaseOutStart: 33610, phaseOutEnd: 62968, maxCredit: 7830 }
      }
    };

    // 자녀 수 정규화 (3명 이상은 3으로 처리)
    const childrenCount = Math.min(qualifyingChildren, 3);
    
    // 파일링 상태 정규화
    const isMarried = filingStatus === 'married_joint';
    const statusKey = isMarried ? 'married' : 'single';
    
    // 해당 자녀 수와 파일링 상태에 맞는 한도 가져오기
    const limit = limits[childrenCount as keyof typeof limits][statusKey as keyof typeof limits[0]];
    
    // 소득이 한도를 초과하면 공제 불가
    if (agi > limit.phaseOutEnd) {
      console.log("소득이 한도 초과, EIC = 0");
      return 0;
    }
    
    // 근로소득이 AGI보다 낮으면 근로소득 기준으로 계산
    const incomeForCalculation = Math.min(effectiveEarnedIncome, agi);
    
    let credit = 0;
    
    // Phase-in 구간 (소득 증가에 따라 공제액 증가)
    if (incomeForCalculation <= limit.phaseInLimit) {
      if (childrenCount === 0) {
        credit = incomeForCalculation * 0.0765; // 7.65% rate for no children
      } else if (childrenCount === 1) {
        credit = incomeForCalculation * 0.34; // 34% rate for 1 child
      } else if (childrenCount === 2) {
        credit = incomeForCalculation * 0.40; // 40% rate for 2 children
      } else {
        credit = incomeForCalculation * 0.45; // 45% rate for 3+ children
      }
    }
    // Plateau 구간 (최대 공제액)
    else if (incomeForCalculation <= limit.phaseOutStart) {
      credit = limit.maxCredit;
    }
    // Phase-out 구간 (소득 증가에 따라 공제액 감소)
    else {
      const phaseOutIncome = agi - limit.phaseOutStart;
      const phaseOutRate = childrenCount === 0 ? 0.0765 : 0.2106; // 7.65% for no children, 21.06% for children
      
      credit = limit.maxCredit - (phaseOutIncome * phaseOutRate);
    }
    
    // 최소값 0, 최대값은 해당 한도의 최대 공제액
    const calculatedEIC = Math.max(0, Math.min(Math.round(credit), limit.maxCredit));
    
    console.log("=== EIC 계산 세부 내역 ===");
    console.log("사용된 한도:", limit);
    console.log("계산용 소득:", incomeForCalculation);
    console.log("소득 구간:", 
      incomeForCalculation <= limit.phaseInLimit ? "Phase-in" :
      incomeForCalculation <= limit.phaseOutStart ? "Plateau" : "Phase-out"
    );
    console.log("계산된 EIC:", calculatedEIC);
    return calculatedEIC;
  };

  // 은퇴저축공제 자동 계산
  const calculateRetirementCredit = () => {
    const values = form.getValues();
    const totalContributions = values.retirementContributions?.totalContributions || 0;
    const filingStatus = taxData.personalInfo?.filingStatus || 'single';
    const agi = taxData.income?.adjustedGrossIncome || 0;
    
    const result = calculateRetirementSavingsCredit(totalContributions, agi, filingStatus);
    form.setValue('retirementSavingsCredit', result);
    console.log("자동 계산된 은퇴저축공제액:", result);
    setPendingChanges(true);
    return result;
  };
  
  // 자녀 세액공제 자동 계산
  const calculateChildTaxCreditAuto = () => {
    const filingStatus = taxData.personalInfo?.filingStatus || 'single';
    const agi = taxData.income?.adjustedGrossIncome || 0;
    const dependents = taxData.personalInfo?.dependents || [];
    
    // 자녀 세액공제 계산
    console.log("자녀 세액공제 계산 - 조정총소득(AGI):", agi, "신고유형:", filingStatus);
    
    if (!dependents || dependents.length === 0) {
      toast({
        title: "계산할 수 없습니다",
        description: "부양가족 정보가 없습니다. 개인정보 페이지에서 부양가족을 먼저 추가해주세요.",
        variant: "destructive"
      });
      return;
    }
    
    const qualifyingChildren = dependents.filter(dependent => 
      dependent.isQualifyingChild && !dependent.isNonresidentAlien
    );
    
    if (qualifyingChildren.length === 0) {
      toast({
        title: "계산할 수 없습니다",
        description: "적격 자녀가 없습니다. 개인정보 페이지에서 '적격 자녀 여부'에 체크한 부양가족을 추가해주세요.",
        variant: "destructive"
      });
      return;
    }
    
    // 적격 자녀에 기반한 세액공제 계산
    const credit = calculateChildTaxCredit(qualifyingChildren, agi, filingStatus);
    form.setValue('childTaxCredit', credit);
    setPendingChanges(true);
    
    // 총 세액공제 업데이트
    setTimeout(() => calculateTotalCredits(), 100);
    
    console.log("계산된 자녀 세액공제액:", credit);
    return credit;
  };
  
  // 기타 부양가족 공제 자동 계산
  const calculateOtherDependentCreditAuto = () => {
    const filingStatus = taxData.personalInfo?.filingStatus || 'single';
    const agi = taxData.income?.adjustedGrossIncome || 0;
    const dependents = taxData.personalInfo?.dependents || [];
    
    if (!dependents || dependents.length === 0) {
      toast({
        title: "계산할 수 없습니다",
        description: "부양가족 정보가 없습니다. 개인정보 페이지에서 부양가족을 먼저 추가해주세요.",
        variant: "destructive"
      });
      return;
    }
    
    // 기타 부양가족 공제 대상 필터링 (나이 기준으로 정확히 판단)
    const otherDependents = dependents.filter(dependent => {
      // calculateCreditForOtherDependents 함수 내부의 isEligibleForCreditForOtherDependents 로직 사용
      // 17세 이상이고 Child Tax Credit 대상이 아닌 부양가족
      const birthDate = new Date(dependent.dateOfBirth);
      const taxYearEnd = new Date('2024-12-31');
      let age = taxYearEnd.getFullYear() - birthDate.getFullYear();
      const monthDiff = taxYearEnd.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && taxYearEnd.getDate() < birthDate.getDate())) {
        age--;
      }
      
      console.log(`기타 부양가족 공제 대상 확인 - ${dependent.firstName}: ${age}세`);
      
      // 17세 이상이면 기타 부양가족 공제 대상
      return age >= 17 && !dependent.isNonresidentAlien;
    });
    
    console.log(`기타 부양가족 공제 대상자 수: ${otherDependents.length}`);
    
    if (otherDependents.length === 0) {
      toast({
        title: "계산할 수 없습니다",
        description: "17세 이상의 부양가족이 없습니다. (기타 부양가족 공제는 17세 이상 부양가족에게만 적용됩니다)",
        variant: "destructive"
      });
      return;
    }
    
    // 적격 자녀가 아닌 부양가족에 기반한 세액공제 계산
    const credit = calculateCreditForOtherDependents(otherDependents, agi, filingStatus);
    form.setValue('otherCredits', credit);
    setPendingChanges(true);
    
    // 총 세액공제 업데이트
    setTimeout(() => calculateTotalCredits(), 100);
    
    return credit;
  };
  
  // 페이지 로드 시 데이터 초기화
  useEffect(() => {
    if (taxData.taxCredits || taxData.retirementContributions) {
      const parsedValues: TaxCreditsFormData = {
        ...defaultFormData,
        ...taxData.taxCredits,
        retirementContributions: {
          ...defaultRetirementContributions,
          ...(taxData.retirementContributions || {})
        },
        careProviders: (taxData.taxCredits as any)?.careProviders || [defaultCareProvider],
        careExpenses: (taxData.taxCredits as any)?.careExpenses || 0
      };
      
      form.reset(parsedValues);
      
      // 돌봄 비용이 있으면 해당 필드 표시
      if (parsedValues.careExpenses > 0 || (parsedValues.careProviders && parsedValues.careProviders.length > 1)) {
        setShowCareExpenseFields(true);
      }
      
      // 페이지 로드 시 은퇴 기여금이 있다면 저축공제액 자동 계산
      if (parsedValues.retirementContributions?.totalContributions > 0) {
        console.log("페이지 로드 시 은퇴저축공제 자동 계산 실행");
        // 은퇴저축 관련 필드 표시
        setShowRetirementFields(true);
        setTimeout(() => calculateRetirementCredit(), 1500);
      }
      
      setPendingChanges(false);
    }
  }, [taxData]);
  
  // 총 세액공제 합계 계산
  const calculateTotalCredits = () => {
    const values = form.getValues();
    
    // 기타 세액공제 항목의 합계 계산
    const otherItemsTotal = values.otherCreditItems?.reduce((total, item) => total + (item.amount || 0), 0) || 0;
    
    // 총 세액공제 합계 계산
    const total = 
      (values.childTaxCredit || 0) +
      (values.childDependentCareCredit || 0) +
      (values.educationCredits || 0) +
      (values.retirementSavingsCredit || 0) +
      (values.foreignTaxCredit || 0) +
      (values.earnedIncomeCredit || 0) +
      (values.otherCredits || 0) +
      otherItemsTotal;
    
    form.setValue('totalCredits', total);
    setPendingChanges(true);
    return total;
  };
  
  // 폼 제출 처리
  const onSubmit = (data: TaxCreditsFormData) => {
    // 총 세액공제 합계 계산
    const totalSum = calculateTotalCredits();
    
    const formattedTaxCredits = {
      ...data,
      totalCredits: totalSum
    };
    
    // TaxContext 업데이트
    updateTaxData({
      taxCredits: {
        childTaxCredit: formattedTaxCredits.childTaxCredit,
        childDependentCareCredit: formattedTaxCredits.childDependentCareCredit,
        educationCredits: formattedTaxCredits.educationCredits,
        aotcCredit: formattedTaxCredits.aotcCredit,
        llcCredit: formattedTaxCredits.llcCredit,
        retirementSavingsCredit: formattedTaxCredits.retirementSavingsCredit,
        foreignTaxCredit: formattedTaxCredits.foreignTaxCredit,
        earnedIncomeCredit: formattedTaxCredits.earnedIncomeCredit,
        otherCredits: formattedTaxCredits.otherCredits,
        otherCreditItems: formattedTaxCredits.otherCreditItems,
        totalCredits: formattedTaxCredits.totalCredits
      },
      retirementContributions: formattedTaxCredits.retirementContributions
    });
    
    // 데이터가 이미 updateTaxData로 저장되었으므로 성공 메시지만 표시
    toast({
      title: "저장 완료",
      description: "세액공제 정보가 저장되었습니다."
    });
    setPendingChanges(false);
  };
  
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <ProgressTracker currentStep={4} />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  
                  {/* 자녀 세액공제 및 기타 부양가족 공제 */}
                  <div className="mb-6 border-b border-gray-light pb-6">
                    <h4 className="font-semibold mb-3">자녀 및 부양가족 관련 세액공제</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="childTaxCredit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>자녀 세액공제 (Child Tax Credit)</FormLabel>
                              <FormControl>
                                <div className="relative flex gap-2">
                                  <div className="flex-grow relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                    <Input 
                                      placeholder="0.00"
                                      className="pl-8"
                                      value={field.value || ''}
                                      onChange={(e) => {
                                        const formatted = formatNumberInput(e.target.value);
                                        field.onChange(formatted ? Number(formatted) : 0);
                                        setPendingChanges(true);
                                      }}
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={calculateChildTaxCreditAuto}
                                    className="flex-shrink-0 whitespace-nowrap"
                                  >
                                    자동계산
                                  </Button>
                                </div>
                              </FormControl>
                              <FormDescription>
                                만 17세 미만의 적격 자녀당 최대 $2,000까지 공제받을 수 있습니다.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="otherCredits"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>기타 부양가족 공제 (Credit for Other Dependents)</FormLabel>
                              <FormControl>
                                <div className="relative flex gap-2">
                                  <div className="flex-grow relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                    <Input 
                                      placeholder="0.00"
                                      className="pl-8"
                                      value={field.value || ''}
                                      onChange={(e) => {
                                        const formatted = formatNumberInput(e.target.value);
                                        field.onChange(formatted ? Number(formatted) : 0);
                                        setPendingChanges(true);
                                      }}
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={calculateOtherDependentCreditAuto}
                                    className="flex-shrink-0 whitespace-nowrap"
                                  >
                                    자동계산
                                  </Button>
                                </div>
                              </FormControl>
                              <FormDescription>
                                자녀 세액공제 대상이 아닌 부양가족당 최대 $500까지 공제받을 수 있습니다.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* 자녀 및 부양가족 돌봄비용 세액공제 */}
                  <div className="mb-6 border-b border-gray-light pb-6">
                    <div className="flex items-center mb-3">
                      <h4 className="font-semibold">자녀 및 부양가족 돌봄비용 세액공제 (Child and Dependent Care Credit)</h4>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-dark ml-2 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-64">
                              직장이나 학업 중에 13세 미만 자녀나 장애가 있는 부양가족을 돌보는 비용에 대한 세액공제입니다.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="space-y-4 mb-4">
                      <FormField
                        control={form.control}
                        name="childDependentCareCredit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>자녀 및 부양가족 돌봄비용 세액공제액</FormLabel>
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
                                    setPendingChanges(true);
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              돌봄 서비스 제공자 정보를 입력하려면 아래 버튼을 클릭하세요.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button
                        type="button"
                        variant="outline"
                        className="flex items-center gap-1"
                        onClick={() => setShowCareExpenseFields(!showCareExpenseFields)}
                      >
                        {showCareExpenseFields ? '돌봄 제공자 정보 숨기기' : '돌봄 제공자 정보 추가하기'}
                      </Button>
                    </div>
                    
                    {/* 돌봄 비용 및 제공자 정보 - 버튼 클릭 시에만 표시 */}
                    {showCareExpenseFields && (
                      <div className="mb-4 p-4 border border-gray-100 rounded-md bg-gray-50">
                        <FormField
                          control={form.control}
                          name="careExpenses"
                          render={({ field }) => (
                            <FormItem className="mb-4">
                              <FormLabel>총 돌봄 비용 (Total Care Expenses)</FormLabel>
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
                                      setPendingChanges(true);
                                    }}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="mb-3">
                          <h5 className="font-medium text-sm mb-2">돌봄 서비스 제공자 정보</h5>
                          <p className="text-sm text-gray-dark mb-2">
                            돌봄 비용에 대한 세액공제를 받으려면 서비스 제공자의 정보가 필요합니다.
                          </p>
                        </div>
                        
                        {careProviderFields.map((field, index) => (
                          <div key={field.id} className="p-4 mb-4 border border-gray-200 rounded-md">
                            <div className="flex justify-between mb-2">
                              <h6 className="font-medium">제공자 #{index + 1}</h6>
                              {index > 0 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeCareProvider(index)}
                                  className="text-red-500 h-8 px-2"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  삭제
                                </Button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                              <FormField
                                control={form.control}
                                name={`careProviders.${index}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>제공자 이름</FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="John Doe"
                                        value={field.value || ''}
                                        onChange={(e) => {
                                          field.onChange(e.target.value);
                                          setPendingChanges(true);
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`careProviders.${index}.taxId`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>세금 ID (SSN 또는 EIN)</FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="XX-XXXXXXX"
                                        value={field.value || ''}
                                        onChange={(e) => {
                                          field.onChange(e.target.value);
                                          setPendingChanges(true);
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={form.control}
                              name={`careProviders.${index}.address`}
                              render={({ field }) => (
                                <FormItem className="mb-2">
                                  <FormLabel>제공자 주소</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="123 Main St, Anytown, CA 12345"
                                      value={field.value || ''}
                                      onChange={(e) => {
                                        field.onChange(e.target.value);
                                        setPendingChanges(true);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`careProviders.${index}.amount`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>지불 금액</FormLabel>
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
                                          setPendingChanges(true);
                                        }}
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        ))}
                        
                        <Button
                          type="button"
                          variant="outline"
                          className="flex items-center gap-1 mt-2"
                          onClick={() => appendCareProvider({ name: '', address: '', taxId: '', amount: 0 })}
                        >
                          <PlusCircle className="h-4 w-4" />
                          다른 제공자 추가
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* 교육 세액공제 */}
                  <div className="mb-6 border-b border-gray-light pb-6">
                    <div className="flex items-center mb-3">
                      <h4 className="font-semibold">교육 세액공제 (Education Credits)</h4>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-dark ml-2 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-64">
                              고등 교육 비용에 대한 세액공제로, 미국 오퍼튜니티 세액공제(AOTC)와 평생 학습 세액공제(LLC)로 구성됩니다.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <FormField
                        control={form.control}
                        name="aotcCredit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>미국 오퍼튜니티 세액공제 (AOTC)</FormLabel>
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
                                    setPendingChanges(true);
                                    
                                    // AOTC와 LLC 합계를 교육 세액공제에 반영
                                    const llcCredit = form.getValues('llcCredit') || 0;
                                    const total = (formatted ? Number(formatted) : 0) + llcCredit;
                                    form.setValue('educationCredits', total);
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              학생당 최대 $2,500까지 공제 가능
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="llcCredit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>평생 학습 세액공제 (LLC)</FormLabel>
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
                                    setPendingChanges(true);
                                    
                                    // AOTC와 LLC 합계를 교육 세액공제에 반영
                                    const aotcCredit = form.getValues('aotcCredit') || 0;
                                    const total = (formatted ? Number(formatted) : 0) + aotcCredit;
                                    form.setValue('educationCredits', total);
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              납세자당 최대 $2,000까지 공제 가능
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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
                    
                    {/* 은퇴저축 여부 체크박스 */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="hasRetirementContributions" 
                          checked={showRetirementFields}
                          onCheckedChange={(checked) => {
                            setShowRetirementFields(checked as boolean);
                            // 체크 해제 시 값 초기화 옵션
                            if (!(checked as boolean)) {
                              form.setValue('retirementContributions.totalContributions', 0);
                              form.setValue('retirementSavingsCredit', 0);
                            }
                          }}
                        />
                        <label 
                          htmlFor="hasRetirementContributions"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          IRA 계좌, 401(K), 또는 ABLE계좌등 은퇴저축계좌(Retirement Savings Account)에 납부하셨습니까?
                        </label>
                      </div>
                    </div>
                    
                    {/* 은퇴 기여금 입력 필드들 - 체크박스 선택 시에만 표시 */}
                    {showRetirementFields && (
                      <div className="mb-4 p-4 border border-gray-100 rounded-md bg-gray-50">
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <FormField
                            control={form.control}
                            name="retirementContributions.plan401k"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>401(k) 계획</FormLabel>
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
                                <FormLabel>403(b) 계획</FormLabel>
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
                                <FormLabel>457 계획</FormLabel>
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
                                  <div className="relative flex gap-2">
                                    <div className="flex-grow relative">
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
                                      size="icon"
                                      onClick={calculateAllRetirementContributions}
                                      className="flex items-center justify-center h-10 w-10 flex-shrink-0"
                                    >
                                      <RefreshCw className="h-4 w-4" />
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
                                <FormLabel>은퇴저축공제액 (Retirement Savings Credit)</FormLabel>
                                <FormControl>
                                  <div className="relative flex gap-2">
                                    <div className="flex-grow relative">
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
                                      className="flex-shrink-0 whitespace-nowrap"
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
                    )}
                  </div>
                  
                  {/* Foreign Tax Credit */}
                  <div className="mb-6 border-b border-gray-light pb-6">
                    <div className="flex items-center mb-3">
                      <h4 className="font-semibold">외국납부세액공제 (Foreign Tax Credit)</h4>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-dark ml-2 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-md p-4">
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-semibold text-blue-700 mb-2">💰 외국납부세액공제</h4>
                                <p className="text-sm">외국에서 소득에 대해 납부한 세금을 미국 연방세에서 공제받을 수 있는 제도입니다.</p>
                              </div>
                              
                              <div>
                                <h4 className="font-semibold text-green-700 mb-2">✅ 대상 항목</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• 외국 소득세 (Foreign income tax)</li>
                                  <li>• 외국 배당금에 대한 원천징수세</li>
                                  <li>• 외국 이자소득에 대한 세금</li>
                                  <li>• 외국 임대소득에 대한 세금</li>
                                </ul>
                              </div>
                              
                              <div>
                                <h4 className="font-semibold text-red-700 mb-2">⚠️ 제한사항</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• 공제액은 해당 외국소득에 대한 미국 연방세를 초과할 수 없음</li>
                                  <li>• Form 1116 또는 Form 1040에서 선택하여 신고</li>
                                  <li>• $300 (부부합산 $600) 이하는 간편 신고 가능</li>
                                </ul>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="foreignTaxCredit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>외국납부세액공제액 (Foreign Tax Credit Amount)</FormLabel>
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
                                    setPendingChanges(true);
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormDescription className="text-sm text-gray-600">
                              외국에서 납부한 소득세액을 입력하세요. $300 초과 시 Form 1116이 필요할 수 있습니다.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* 근로소득공제 (Earned Income Credit) */}
                  <div className="mb-6 border-b border-gray-light pb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="font-semibold">근로소득공제 (Earned Income Credit)</h4>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-dark cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-md">
                            <div className="space-y-2">
                              <p className="font-medium">근로소득공제 (EIC) 안내</p>
                              <div className="text-sm space-y-1">
                                <p><strong>2025년 소득한도:</strong></p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                  <li>• 자녀 없음: $18,591 (미혼) / $25,511 (합산신고)</li>
                                  <li>• 자녀 1명: $45,529 (미혼) / $52,449 (합산신고)</li>
                                  <li>• 자녀 2명: $51,567 (미혼) / $58,487 (합산신고)</li>
                                  <li>• 자녀 3명+: $55,529 (미혼) / $62,449 (합산신고)</li>
                                </ul>
                                <p className="mt-2"><strong>참고:</strong> 투자소득은 $11,600 이하여야 함</p>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="earnedIncomeCredit"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel>근로소득공제액 (Earned Income Credit Amount)</FormLabel>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const calculatedEIC = calculateEarnedIncomeCredit();
                                  field.onChange(calculatedEIC);
                                  setPendingChanges(true);
                                }}
                                className="text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400"
                              >
                                자동 계산
                              </Button>
                            </div>
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
                                    setPendingChanges(true);
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormDescription className="text-sm text-gray-600">
                              {taxData.personalInfo?.filingStatus === 'married_joint' 
                                ? `합산신고 기준 소득한도: ${
                                    (taxData.personalInfo.dependents?.filter(d => d.relationship === 'child')?.length || 0) === 0 ? '$25,511' :
                                    (taxData.personalInfo.dependents?.filter(d => d.relationship === 'child')?.length || 0) === 1 ? '$52,449' :
                                    (taxData.personalInfo.dependents?.filter(d => d.relationship === 'child')?.length || 0) === 2 ? '$58,487' :
                                    '$62,449'
                                  }`
                                : `미혼 기준 소득한도: ${
                                    (taxData.personalInfo?.dependents?.filter(d => d.relationship === 'child')?.length || 0) === 0 ? '$18,591' :
                                    (taxData.personalInfo?.dependents?.filter(d => d.relationship === 'child')?.length || 0) === 1 ? '$45,529' :
                                    (taxData.personalInfo?.dependents?.filter(d => d.relationship === 'child')?.length || 0) === 2 ? '$51,567' :
                                    '$55,529'
                                  }`
                              }
                              <br />
                              <span className="text-xs text-blue-600">현재 AGI: ${(taxData.income?.adjustedGrossIncome || 0).toLocaleString()}</span>
                              <br />
                              <span className="text-xs text-red-600 font-medium">⚠️ 투자소득 한도: $11,600 (초과시 EIC 부적격)</span>
                              <br />
                              <span className="text-xs text-gray-500">
                                현재 투자소득: ${((taxData.income?.interestIncome || 0) + (taxData.income?.dividends || 0) + (taxData.income?.capitalGains || 0)).toLocaleString()}
                              </span>
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* 기타 세액공제 */}
                  <div className="mb-6 border-b border-gray-light pb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">기타 세액공제 (Other Credits)</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendOtherCreditItem({ type: '', amount: 0 })}
                        className="flex items-center gap-1"
                      >
                        <PlusCircle className="h-4 w-4" />
                        세액공제 추가
                      </Button>
                    </div>
                    
                    {otherCreditItemFields.length > 0 ? (
                      <div className="space-y-4">
                        {otherCreditItemFields.map((field, index) => (
                          <div key={field.id} className="p-4 border border-gray-200 rounded-md">
                            <div className="flex justify-between mb-2">
                              <h6 className="font-medium">세액공제 #{index + 1}</h6>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOtherCreditItem(index)}
                                className="text-red-500 h-8 px-2"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                삭제
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                              <FormField
                                control={form.control}
                                name={`otherCreditItems.${index}.type`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>세액공제 유형</FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="예: 해외세액공제, 에너지세액공제 등"
                                        value={field.value || ''}
                                        onChange={(e) => {
                                          field.onChange(e.target.value);
                                          setPendingChanges(true);
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`otherCreditItems.${index}.amount`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>금액</FormLabel>
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
                                            setPendingChanges(true);
                                            // 자동으로 총 세액공제 업데이트
                                            setTimeout(() => calculateTotalCredits(), 100);
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
                              name={`otherCreditItems.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>설명 (선택사항)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="세액공제에 대한 추가 설명..."
                                      value={field.value || ''}
                                      onChange={(e) => {
                                        field.onChange(e.target.value);
                                        setPendingChanges(true);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-dark italic mb-4">
                        아직 추가된 기타 세액공제가 없습니다. "세액공제 추가" 버튼을 클릭하여 추가하세요.
                      </p>
                    )}
                  </div>
                  
                  {/* 총 세액공제 */}
                  <div className="mb-6 bg-gray-50 p-4 rounded-md">
                    <FormField
                      control={form.control}
                      name="totalCredits"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between">
                            <FormLabel className="text-lg font-semibold">총 세액공제 합계 (Total Credits)</FormLabel>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={calculateTotalCredits}
                              className="ml-4"
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              합계 계산
                            </Button>
                          </div>
                          <FormControl>
                            <div className="relative mt-2">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark font-semibold">$</span>
                              <Input 
                                className="pl-8 text-lg font-semibold"
                                value={field.value || ''}
                                onChange={(e) => {
                                  const formatted = formatNumberInput(e.target.value);
                                  field.onChange(formatted ? Number(formatted) : 0);
                                  setPendingChanges(true);
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* 저장 버튼 제거됨 */}
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-6">
              <StepNavigation 
                prevStep="/deductions" 
                nextStep="/additional-tax"
                onNext={() => {
                  // 저장되지 않은 변경사항이 있으면 저장
                  if (pendingChanges) {
                    form.handleSubmit(onSubmit)();
                  }
                  return true;
                }}
              />
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default TaxCredits3Page;