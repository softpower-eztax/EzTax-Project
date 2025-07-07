import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { deductionsSchema, type Deductions, type OtherDeductionItem } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Info, Plus, X, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ProgressTracker from '@/components/ProgressTracker';

import StepNavigation from '@/components/StepNavigation';
import { useTaxContext } from '@/context/TaxContext';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateStandardDeduction } from '@/lib/taxCalculations';
import { useLocation } from 'wouter';
import { formatNumber, formatCurrency, formatInputNumber } from '@/utils/formatNumber';

const Deductions: React.FC = () => {
  const { taxData, updateTaxData } = useTaxContext();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isItemizedDisabled, setIsItemizedDisabled] = useState(true);
  
  // Initialize medical input from existing data - 간단히 0으로 시작
  const getInitialMedicalInput = () => {
    return 0;
  };
  
  const [totalMedicalInput, setTotalMedicalInput] = useState(0);
  
  // Calculate standard deduction based on filing status
  const standardDeductionAmount = calculateStandardDeduction(taxData.personalInfo?.filingStatus || 'single');
  
  // Calculate medical expense deduction
  const agi = taxData.income?.adjustedGrossIncome || 0;
  const threshold = formatInputNumber(agi * 0.075); // AGI의 7.5%
  const deductibleMedicalAmount = formatInputNumber(Math.max(0, totalMedicalInput - threshold));
  
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
        personalPropertyTax: 0,
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
          personalPropertyTax: 0,
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
  
  // 동적으로 기본값 생성
  const getDefaultValues = (): Deductions => {
    if (taxData.deductions) {
      console.log('기존 데이터로 폼 초기화:', taxData.deductions);
      return {
        useStandardDeduction: taxData.deductions.useStandardDeduction ?? true,
        standardDeductionAmount: taxData.deductions.standardDeductionAmount ?? standardDeductionAmount,
        itemizedDeductions: {
          medicalExpenses: taxData.deductions.itemizedDeductions?.medicalExpenses ?? 0,
          stateLocalIncomeTax: taxData.deductions.itemizedDeductions?.stateLocalIncomeTax ?? 0,
          realEstateTaxes: taxData.deductions.itemizedDeductions?.realEstateTaxes ?? 0,
          personalPropertyTax: taxData.deductions.itemizedDeductions?.personalPropertyTax ?? 0,
          mortgageInterest: taxData.deductions.itemizedDeductions?.mortgageInterest ?? 0,
          charitableCash: taxData.deductions.itemizedDeductions?.charitableCash ?? 0,
          charitableNonCash: taxData.deductions.itemizedDeductions?.charitableNonCash ?? 0
        },
        otherDeductionItems: taxData.deductions.otherDeductionItems || [],
        totalDeductions: taxData.deductions.totalDeductions ?? standardDeductionAmount
      };
    }
    
    // 기본값 (새로운 세션)
    return {
      useStandardDeduction: true,
      standardDeductionAmount: standardDeductionAmount,
      itemizedDeductions: {
        medicalExpenses: 0,
        stateLocalIncomeTax: 0,
        realEstateTaxes: 0,
        personalPropertyTax: 0,
        mortgageInterest: 0,
        charitableCash: 0,
        charitableNonCash: 0
      },
      otherDeductionItems: [],
      totalDeductions: standardDeductionAmount
    };
  };

  const [formKey, setFormKey] = useState(0);
  
  const form = useForm<Deductions>({
    resolver: zodResolver(deductionsSchema),
    defaultValues: getDefaultValues(),
    mode: 'onChange'
  });
  
  // 기타 공제 항목을 위한 필드 배열 설정
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "otherDeductionItems"
  });

  const watchDeductionType = form.watch('useStandardDeduction');
  
  // Track changes to itemized deduction fields separately
  const watchItemizedFields = [
    form.watch('itemizedDeductions.medicalExpenses'),
    form.watch('itemizedDeductions.stateLocalIncomeTax'),
    form.watch('itemizedDeductions.realEstateTaxes'),
    form.watch('itemizedDeductions.personalPropertyTax'),
    form.watch('itemizedDeductions.mortgageInterest'),
    form.watch('itemizedDeductions.charitableCash'),
    form.watch('itemizedDeductions.charitableNonCash'),
  ];

  // Calculate total SALT amount for display
  const totalSALTAmount = React.useMemo(() => {
    const itemized = form.getValues('itemizedDeductions');
    if (!itemized) return 0;
    return Math.min(
      Number(itemized.stateLocalIncomeTax || 0) + 
      Number(itemized.realEstateTaxes || 0) + 
      Number(itemized.personalPropertyTax || 0),
      10000
    );
  }, [watchItemizedFields]);
  
  // Watch changes to otherDeductionItems
  const watchOtherDeductionItems = form.watch('otherDeductionItems');

  // Auto-update medical expense deduction field when calculation changes
  // 자동 업데이트는 비활성화하고 수동 적용만 사용
  // useEffect(() => {
  //   if (form && form.setValue && deductibleMedicalAmount > 0) {
  //     console.log('의료비 공제 필드 자동 업데이트:', deductibleMedicalAmount);
  //     form.setValue("itemizedDeductions.medicalExpenses", deductibleMedicalAmount, { 
  //       shouldValidate: true,
  //       shouldDirty: true,
  //       shouldTouch: true 
  //     });
  //     // 즉시 폼 상태를 업데이트하여 UI에 반영
  //     form.trigger("itemizedDeductions.medicalExpenses");
  //   }
  // }, [deductibleMedicalAmount, form]);
  
  // Update medical input when taxData changes (restore saved data)
  useEffect(() => {
    const existingMedicalExpenses = taxData.deductions?.itemizedDeductions?.medicalExpenses || 0;
    if (existingMedicalExpenses > 0 && totalMedicalInput === 0) {
      // Reverse calculate original input from saved deduction amount
      const agi = taxData.income?.adjustedGrossIncome || 0;
      const threshold = agi * 0.075;
      const originalInput = existingMedicalExpenses + threshold;
      console.log('의료비 입력 복원:', originalInput, '(기존 공제액:', existingMedicalExpenses, ')');
      setTotalMedicalInput(originalInput);
    }
  }, [taxData.deductions?.itemizedDeductions?.medicalExpenses, taxData.income?.adjustedGrossIncome, totalMedicalInput]);

  // Update form values when taxData changes (for SALT data synchronization)
  useEffect(() => {
    // localStorage에서 추가 데이터 확인 (로그아웃 상태에서 사용)
    const tryLoadFromLocalStorage = () => {
      try {
        const localData = localStorage.getItem('currentTaxFormData');
        if (localData) {
          const parsed = JSON.parse(localData);
          if (parsed.deductions?.itemizedDeductions) {
            console.log('localStorage에서 SALT 데이터 로드:', parsed.deductions.itemizedDeductions);
            return parsed.deductions.itemizedDeductions;
          }
        }
      } catch (e) {
        console.error('localStorage 읽기 오류:', e);
      }
      return null;
    };

    const localStorageData = tryLoadFromLocalStorage();
    const serverData = taxData.deductions?.itemizedDeductions;
    
    // 서버 데이터와 localStorage 데이터 중 더 완전한 것 사용
    let sourceData = serverData;
    if (localStorageData) {
      // localStorage에 SALT 데이터가 있고 서버 데이터보다 완전하면 사용
      const localHasSalt = (localStorageData.stateLocalIncomeTax || 0) + (localStorageData.realEstateTaxes || 0) + (localStorageData.personalPropertyTax || 0) > 0;
      const serverHasSalt = serverData ? (serverData.stateLocalIncomeTax || 0) + (serverData.realEstateTaxes || 0) + (serverData.personalPropertyTax || 0) > 0 : false;
      
      if (localHasSalt && !serverHasSalt) {
        console.log('localStorage의 SALT 데이터가 더 완전함, 이를 사용');
        sourceData = localStorageData;
      }
    }

    if (sourceData) {
      console.log('SALT 데이터 변경 감지, form 업데이트:', sourceData);
      
      // Get current form medical expenses to avoid overwriting
      const currentMedicalExpenses = form.getValues("itemizedDeductions.medicalExpenses") || 0;
      const savedMedicalExpenses = sourceData.medicalExpenses || 0;
      
      // Use the higher value between current form value and saved value
      const preservedMedicalExpenses = Math.max(currentMedicalExpenses, savedMedicalExpenses);
      
      console.log('의료비 값 보존:', {
        current: currentMedicalExpenses,
        saved: savedMedicalExpenses,
        preserved: preservedMedicalExpenses
      });
      
      console.log('SALT 데이터 동기화:', {
        stateLocalIncomeTax: sourceData.stateLocalIncomeTax,
        realEstateTaxes: sourceData.realEstateTaxes,
        personalPropertyTax: sourceData.personalPropertyTax
      });
      
      // Update all form values including preserved medical expenses
      form.setValue('itemizedDeductions.medicalExpenses', preservedMedicalExpenses);
      form.setValue('itemizedDeductions.stateLocalIncomeTax', sourceData.stateLocalIncomeTax || 0);
      form.setValue('itemizedDeductions.realEstateTaxes', sourceData.realEstateTaxes || 0);
      form.setValue('itemizedDeductions.personalPropertyTax', sourceData.personalPropertyTax || 0);
      form.setValue('itemizedDeductions.mortgageInterest', sourceData.mortgageInterest || 0);
      form.setValue('itemizedDeductions.charitableCash', sourceData.charitableCash || 0);
      form.setValue('itemizedDeductions.charitableNonCash', sourceData.charitableNonCash || 0);
      
      // Calculate total deductions
      const totalItemized = preservedMedicalExpenses + 
                           (sourceData.stateLocalIncomeTax || 0) + 
                           (sourceData.realEstateTaxes || 0) + 
                           (sourceData.personalPropertyTax || 0) + 
                           (sourceData.mortgageInterest || 0) + 
                           (sourceData.charitableCash || 0) + 
                           (sourceData.charitableNonCash || 0);
      
      form.setValue('totalDeductions', totalItemized);
      
      // Force form re-render
      form.trigger();
      
      // Update useStandardDeduction if we have itemized deductions
      if (totalItemized > standardDeductionAmount) {
        form.setValue('useStandardDeduction', false);
      }
    }
  }, [
    taxData.deductions?.itemizedDeductions?.stateLocalIncomeTax, 
    taxData.deductions?.itemizedDeductions?.realEstateTaxes, 
    taxData.deductions?.itemizedDeductions?.personalPropertyTax,
    taxData.deductions?.itemizedDeductions?.medicalExpenses,
    taxData.deductions?.itemizedDeductions?.mortgageInterest,
    taxData.deductions?.itemizedDeductions?.charitableCash,
    taxData.deductions?.itemizedDeductions?.charitableNonCash,
    taxData.deductions?.totalDeductions,
    // 전체 taxData도 의존성에 추가하여 페이지 이동 시 강제 업데이트
    taxData.id
  ]);



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
      const otherItems = form.getValues('otherDeductionItems') || [];
      
      // 기타 공제 항목의 총합 계산
      const otherItemsTotal = otherItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      
      if (itemized) {
        // 항목별 공제와 기타 공제 항목의 합계 (SALT 한도 적용)
        const total = calculateItemizedTotal(itemized, otherItemsTotal);
        
        form.setValue('totalDeductions', total);
      }
    }
  }, [watchDeductionType, form, standardDeductionAmount]);
  
  // Update total deductions when any itemized deduction field changes
  useEffect(() => {
    if (!watchDeductionType) {
      // 항목별 공제를 선택한 경우에만 합계 다시 계산
      const itemized = form.getValues('itemizedDeductions');
      const otherItems = form.getValues('otherDeductionItems') || [];
      
      // 기타 공제 항목의 총합 계산
      const otherItemsTotal = otherItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      
      if (itemized) {
        // 항목별 공제와 기타 공제 항목의 합계 (SALT 한도 적용)
        const total = calculateItemizedTotal(itemized, otherItemsTotal);
        
        form.setValue('totalDeductions', total);
      }
    }
  }, [watchItemizedFields, watchOtherDeductionItems, watchDeductionType, form]);

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
      const otherItems = form.getValues('otherDeductionItems') || [];
      
      // 기타 공제 항목의 총합 계산
      const otherItemsTotal = otherItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      
      if (itemized) {
        // 항목별 공제와 기타 공제 항목의 합계 (SALT 한도 적용)
        const total = calculateItemizedTotal(itemized, otherItemsTotal);
        
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
    watchOtherDeductionItems,
    watchDeductionType,
    form
  ]);

  // Track if this is the initial load to avoid unnecessary form resets
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  useEffect(() => {
    // Only reset form on initial load or when coming back from other pages
    // Don't reset when user is actively editing in this page
    if (taxData.deductions && isInitialLoad) {
      console.log('Deductions 페이지 초기 로드 - form 설정:', taxData.deductions);
      
      const deductions = taxData.deductions;
      
      const newFormValues: Deductions = {
        useStandardDeduction: deductions.useStandardDeduction ?? true,
        standardDeductionAmount: deductions.standardDeductionAmount ?? standardDeductionAmount,
        itemizedDeductions: {
          medicalExpenses: deductions.itemizedDeductions?.medicalExpenses ?? 0,
          stateLocalIncomeTax: deductions.itemizedDeductions?.stateLocalIncomeTax ?? 0,
          realEstateTaxes: deductions.itemizedDeductions?.realEstateTaxes ?? 0,
          personalPropertyTax: deductions.itemizedDeductions?.personalPropertyTax ?? 0,
          mortgageInterest: deductions.itemizedDeductions?.mortgageInterest ?? 0,
          charitableCash: deductions.itemizedDeductions?.charitableCash ?? 0,
          charitableNonCash: deductions.itemizedDeductions?.charitableNonCash ?? 0
        },
        otherDeductionItems: deductions.otherDeductionItems || [],
        totalDeductions: deductions.totalDeductions ?? standardDeductionAmount
      };
      
      console.log('초기 폼 값 설정:', newFormValues);
      form.reset(newFormValues);
      setIsInitialLoad(false);
    }
  }, [taxData.deductions, isInitialLoad, standardDeductionAmount]); // Only run on initial load

  const onSubmit = async (data: Deductions) => {
    console.log('Deductions onSubmit 호출됨, 입력 데이터:', data);
    
    // 표준 공제를 선택한 경우에도 항목별 공제 값을 유지하기 위해 
    // taxData에서 기존 itemizedDeductions 값을 보존
    if (data.useStandardDeduction && taxData.deductions?.itemizedDeductions) {
      data = {
        ...data,
        itemizedDeductions: taxData.deductions.itemizedDeductions
      };
    }
    
    console.log('updateTaxData 호출 전 최종 데이터:', data);
    
    try {
      await updateTaxData({ deductions: data });
      console.log('updateTaxData 호출 완료');
      
      toast({
        title: "저장 완료",
        description: "공제 정보가 성공적으로 저장되었습니다.",
      });
    } catch (error) {
      console.error('저장 오류:', error);
      toast({
        title: "저장 실패",
        description: "데이터 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
    
    return true;
  };

  // Helper function to format currency input
  const formatCurrency = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/[^\d.]/g, '');
    return digits;
  };

  // Helper function to calculate itemized deductions with SALT limit
  const calculateItemizedTotal = (itemized: any, otherItemsTotal: number = 0) => {
    if (!itemized) return 0;
    
    // SALT 공제 한도 적용 (주/지방세 + 부동산세 + 개인재산세 최대 $10,000)
    const saltTotal = Math.min(
      Number(itemized.stateLocalIncomeTax || 0) + 
      Number(itemized.realEstateTaxes || 0) + 
      Number(itemized.personalPropertyTax || 0),
      10000
    );
    
    const itemizedTotal = 
      Number(itemized.medicalExpenses || 0) +
      saltTotal + // SALT 한도 적용된 값 사용
      Number(itemized.mortgageInterest || 0) +
      Number(itemized.charitableCash || 0) +
      Number(itemized.charitableNonCash || 0);
    
    return itemizedTotal + otherItemsTotal;
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
              
              <Form {...form} key={formKey}>
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
                      
                      {/* 의료비 공제 계산기 섹션 */}
                      <div className="col-span-full mb-6">
                        <div className="border rounded-md p-4 bg-blue-50/50">
                          <div className="flex items-center gap-2 mb-3">
                            <h4 className="text-base font-medium text-blue-700">
                              의료비 공제 계산기 (Medical Expense Calculator)
                            </h4>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-blue-600 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-md p-4">
                                  <div>
                                    <h5 className="font-semibold mb-2">의료비 공제 계산법</h5>
                                    <p className="text-sm mb-2">총 의료비에서 AGI의 7.5%를 뺀 금액이 실제 공제 가능한 의료비입니다.</p>
                                    <p className="text-sm font-semibold">계산식: 총 의료비 - (AGI × 7.5%)</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          
                          {(() => {
                            return (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* 총 의료비 입력 섹션 */}
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                      총 의료비 입력 (Total Medical Expenses)
                                    </label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={totalMedicalInput || ''}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '') {
                                          setTotalMedicalInput(0);
                                        } else {
                                          // 직접 숫자 변환하여 정밀도 문제 방지
                                          const numValue = parseFloat(value);
                                          if (!isNaN(numValue)) {
                                            // Math.round를 사용하여 정확한 소수점 2자리 유지
                                            setTotalMedicalInput(Math.round(numValue * 100) / 100);
                                          }
                                        }
                                      }}
                                      disabled={isItemizedDisabled}
                                      placeholder="실제 지출한 총 의료비를 입력하세요"
                                      className="w-full"
                                    />
                                  </div>
                                  
                                  <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                                    <div className="space-y-1">
                                      <div className="flex justify-between">
                                        <span>현재 AGI:</span>
                                        <span className="font-semibold">${formatNumber(agi)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>공제 한계선 (7.5%):</span>
                                        <span className="font-semibold text-red-600">${formatNumber(threshold)}</span>
                                      </div>
                                      <div className="flex justify-between border-t pt-1">
                                        <span>입력한 총 의료비:</span>
                                        <span className="font-semibold">${formatNumber(totalMedicalInput)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* 계산 결과 표시 */}
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                      계산 결과 (Calculation Result)
                                    </label>
                                    <div className="p-3 bg-white rounded border">
                                      <div className="text-center">
                                        <div className="text-sm text-gray-600 mb-1">실제 공제 가능 금액</div>
                                        <div className="text-xl font-bold text-green-600">
                                          ${formatNumber(deductibleMedicalAmount)}
                                        </div>
                                      </div>
                                      
                                      {totalMedicalInput > 0 && (
                                        <div className="mt-3 text-center">
                                          {deductibleMedicalAmount > 0 ? (
                                            <p className="text-green-700 font-medium text-sm">
                                              ✅ 공제 가능합니다!
                                            </p>
                                          ) : (
                                            <div>
                                              <p className="text-orange-700 font-medium text-sm mb-1">
                                                ⚠️ 공제 대상이 아닙니다
                                              </p>
                                              <p className="text-xs text-gray-600">
                                                ${formatNumber(threshold + 1)} 이상 필요
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded mb-3">
                                    💡 아래 버튼을 클릭하여 의료비 공제 필드에 적용하세요
                                  </div>
                                  
                                  {/* 수동 적용 버튼 */}
                                  {deductibleMedicalAmount > 0 && (
                                    <Button
                                      type="button"
                                      onClick={async () => {
                                        console.log('수동으로 의료비 공제 필드에 적용:', deductibleMedicalAmount);
                                        
                                        // 직접 세금 컨텍스트를 업데이트
                                        const currentDeductions = taxData.deductions || {
                                          useStandardDeduction: false,
                                          standardDeductionAmount: 27700,
                                          itemizedDeductions: {
                                            medicalExpenses: 0,
                                            stateLocalIncomeTax: 0,
                                            realEstateTaxes: 0,
                                            personalPropertyTax: 0
                                          },
                                          otherDeductionItems: [],
                                          totalDeductions: 0
                                        };
                                        
                                        // deductibleMedicalAmount를 직접 사용 (formatInputNumber 중복 호출 방지)
                                        const preciseMedicalAmount = Math.round(deductibleMedicalAmount * 100) / 100;
                                        const updatedDeductions = {
                                          ...currentDeductions,
                                          itemizedDeductions: {
                                            ...currentDeductions.itemizedDeductions,
                                            medicalExpenses: preciseMedicalAmount
                                          }
                                        };
                                        
                                        console.log('업데이트할 공제 데이터:', updatedDeductions);
                                        
                                        // 세금 컨텍스트 업데이트
                                        await updateTaxData({ deductions: updatedDeductions });
                                        
                                        // 폼도 업데이트 (정확한 값으로)
                                        form.setValue("itemizedDeductions.medicalExpenses", preciseMedicalAmount);
                                        
                                        toast({
                                          title: "적용 완료",
                                          description: `의료비 공제 $${formatNumber(deductibleMedicalAmount)}이 적용되었습니다.`,
                                        });
                                      }}
                                      className="w-full bg-blue-600 hover:bg-blue-700"
                                    >
                                      공제 필드에 적용하기
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="itemizedDeductions.medicalExpenses"
                          render={({ field }) => (
                            <FormItem className="flex flex-col justify-center h-full">
                              <div className="flex justify-between">
                                <FormLabel>의료비 공제 (Medical Expenses Deduction)</FormLabel>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="h-4 w-4 text-gray-dark cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-md p-4">
                                      <div className="space-y-3">
                                        <div>
                                          <h4 className="font-semibold text-green-700 mb-2">✅ 공제 가능한 의료비 (Qualified Medical Expenses)</h4>
                                          <ul className="text-sm space-y-1">
                                            <li>• 의사, 치과의사, 안과 의사의 진료비</li>
                                            <li>• 병원비, 수술비, 진단비</li>
                                            <li>• 처방약(Prescription drugs) 및 인슐린</li>
                                            <li>• 안경, 콘택트렌즈, 보청기, 의족 등 보조기구</li>
                                            <li>• 심리치료, 정신과 치료, 상담 치료비</li>
                                            <li>• 물리치료 및 재활 치료</li>
                                            <li>• 장거리 의료 목적의 교통비 ($0.21/mile in 2024)</li>
                                            <li>• 입원 중 식대(병원에서 직접 제공되는 경우)</li>
                                            <li>• 장기 요양시설 비용(치료 목적의 부분)</li>
                                            <li>• 장애인을 위한 주택 개조 비용</li>
                                          </ul>
                                        </div>
                                        
                                        <div>
                                          <h4 className="font-semibold text-red-700 mb-2">❌ 공제 불가능한 항목</h4>
                                          <ul className="text-sm space-y-1">
                                            <li>• 비처방약 (타이레놀, 멀티비타민 등)</li>
                                            <li>• 미용 목적의 성형수술</li>
                                            <li>• 건강 보조식품, 운동기구, 헬스장 비용</li>
                                            <li>• 일반적인 건강 보험료</li>
                                          </ul>
                                        </div>
                                        
                                        <div>
                                          <h4 className="font-semibold text-blue-700 mb-2">💡 중요한 조건</h4>
                                          <ul className="text-sm space-y-1">
                                            <li>• Schedule A (Itemized Deduction) 사용 시에만 공제 가능</li>
                                            <li>• AGI의 7.5%를 초과한 금액만 공제 가능</li>
                                            <li>• 예: AGI $50,000 → $3,750 초과분만 공제</li>
                                          </ul>
                                        </div>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  {...field}
                                  value={formatInputNumber(field.value || 0)}
                                  readOnly={true}
                                  className="bg-gray-50"
                                  placeholder="자동 계산됨"
                                />
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-gray-600">
                                위 계산기에서 자동으로 계산된 공제 가능 금액입니다
                              </p>
                            </FormItem>
                          )}
                        />
                        
                        {/* 진행상황저장 버튼 - 의료비 계산 후 */}
                        <div className="flex justify-center my-6">
                          <Button
                            type="button"
                            onClick={async () => {
                              try {
                                // 현재 폼 데이터를 먼저 세금 컨텍스트에 업데이트
                                const currentFormData = form.getValues();
                                console.log('진행상황저장 - 현재 폼 데이터:', currentFormData);
                                
                                // 폼 데이터를 세금 컨텍스트에 업데이트
                                await updateTaxData({ deductions: currentFormData });
                                
                                toast({
                                  title: "저장 완료",
                                  description: "의료비 공제 정보가 성공적으로 저장되었습니다.",
                                });
                              } catch (error) {
                                console.error('저장 오류:', error);
                                toast({
                                  title: "저장 실패",
                                  description: "저장 중 오류가 발생했습니다. 다시 시도해주세요.",
                                  variant: "destructive",
                                });
                              }
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            진행상황저장
                          </Button>
                        </div>
                        
                        <div className="flex flex-col justify-center h-full">
                          <div className="flex justify-between">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">주소득세 + 판매세 + 부동산세 (SALT)</label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-gray-dark cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-md p-4">
                                  <div className="space-y-3">
                                    <div>
                                      <h4 className="font-semibold text-blue-700 mb-2">💰 SALT 공제 항목</h4>
                                      <ul className="text-sm space-y-1">
                                        <li>• 주 소득세 (State Income Tax)</li>
                                        <li>• 지방 소득세 (Local Income Tax)</li>
                                        <li>• 판매세 (Sales Tax)</li>
                                        <li>• 부동산세 (Real Estate Taxes)</li>
                                        <li>• 개인 재산세 (Personal Property Tax)</li>
                                      </ul>
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-semibold text-red-700 mb-2">⚠️ 중요한 제한사항</h4>
                                      <ul className="text-sm space-y-1">
                                        <li>• 연간 최대 $10,000 공제 한도</li>
                                        <li>• 부부 별도 신고 시 각각 $5,000 한도</li>
                                        <li>• 소득세와 판매세 중 하나만 선택 가능</li>
                                      </ul>
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-semibold text-green-700 mb-2">💡 팁</h4>
                                      <p className="text-sm">일반적으로 소득세가 높은 주에서는 소득세를, 소득세가 없는 주에서는 판매세를 선택하는 것이 유리합니다.</p>
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="10000"
                                  value={totalSALTAmount === 0 ? '' : totalSALTAmount}
                                  disabled={isItemizedDisabled}
                                  readOnly={true}
                                  className="bg-gray-50"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/salt-deductions')}
                                disabled={isItemizedDisabled}
                                className="whitespace-nowrap"
                              >
                                상세 입력
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600">
                            최대 $10,000까지 공제 가능 • 상세 입력 버튼으로 각 항목별 입력 하세요
                          </p>
                        </div>
                        
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
                      
                      {/* 기타 공제 항목 섹션 */}
                      <div className="mt-8">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-heading font-semibold">기타 공제 (Other Deductions)</h3>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => append({ type: '', amount: 0 })}
                            disabled={isItemizedDisabled}
                          >
                            <Plus className="h-4 w-4" /> 항목 추가
                          </Button>
                        </div>
                        
                        {fields.length === 0 && (
                          <div className="text-center p-4 border border-dashed border-gray-medium rounded-md bg-gray-bg">
                            <p className="text-gray-dark">항목별 공제에 추가하려는 다른 공제 항목이 있으시면 추가하세요.</p>
                          </div>
                        )}
                        
                        {fields.map((field, index) => (
                          <div key={field.id} className="mb-4 p-4 border border-gray-medium rounded-md bg-gray-bg">
                            <div className="flex justify-between mb-2">
                              <h4 className="font-semibold">기타 공제 항목 #{index + 1}</h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                className="h-8 w-8 p-0 text-gray-dark"
                                disabled={isItemizedDisabled}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`otherDeductionItems.${index}.type`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>공제 유형 (Deduction Type)</FormLabel>
                                    <FormControl>
                                      <Input {...field} disabled={isItemizedDisabled} placeholder="예: 교육비, 이사비용 등" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`otherDeductionItems.${index}.amount`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>금액 (Amount)</FormLabel>
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
                            
                            <FormField
                              control={form.control}
                              name={`otherDeductionItems.${index}.description`}
                              render={({ field }) => (
                                <FormItem className="mt-2">
                                  <FormLabel>설명 (Description)</FormLabel>
                                  <FormControl>
                                    <Input {...field} disabled={isItemizedDisabled} placeholder="추가 설명 (선택사항)" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        ))}
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
                  

                  
                  {/* 진행상황저장 버튼 */}
                  <div className="mt-6 flex justify-center">
                    <Button
                      type="submit"
                      className="px-8 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition duration-200"
                      onClick={() => console.log('진행상황저장 버튼 클릭됨')}
                    >
                      진행상황저장
                    </Button>
                  </div>
                  
                  <div className="flex justify-between mt-8">
                    <Button
                      type="button"
                      variant="outline"
                      className="px-6 py-2 border border-primary text-primary font-semibold rounded hover:bg-primary-light hover:text-white transition duration-200"
                      onClick={() => navigate('/income')}
                    >
                      이전 단계
                    </Button>
                    
                    <Button
                      type="button"
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
                          console.log("Next 버튼에서 가져온 form 데이터:", data);
                          console.log("특히 의료비 공제:", data.itemizedDeductions?.medicalExpenses);
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