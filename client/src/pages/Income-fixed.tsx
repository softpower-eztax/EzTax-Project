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
import { Info as InfoIcon, Upload, Loader2, Plus, BarChart2, FileText, Calculator, Save } from 'lucide-react';
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
  const [, setLocation] = useLocation();
  const { taxData, updateTaxData, resetToZero, saveTaxReturn } = useTaxContext();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  
  // W-2 업로드 처리 함수
  const handleW2Upload = (file: File) => {
    if (!file) return;
    
    // 지원하는 파일 형식 확인
    const fileType = file.type;
    const isImage = fileType.startsWith('image/');
    const isPdf = fileType === 'application/pdf';
    
    if (!isImage && !isPdf) {
      toast({
        title: "지원하지 않는 파일 형식",
        description: "JPG, PNG 또는 PDF 파일만 업로드할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    // 파일 이름 기반 자동 인식 (시뮬레이션)
    let extractedWages = 0;
    
    if (file.name.toLowerCase().includes('sample') || file.name.toLowerCase().includes('example')) {
      extractedWages = 82500;
    } else {
      // 파일 확장자에 따른 금액 시뮬레이션
      if (isImage) {
        extractedWages = 79800; // 이미지 파일 시뮬레이션
      } else if (isPdf) {
        extractedWages = 84200; // PDF 파일 시뮬레이션
      } else {
        extractedWages = 75000; // 기본값
      }
    }
    
    // 시뮬레이션 처리 (실제 구현에서는 OCR이나 API 처리)
    setTimeout(() => {
      console.log("W-2 파일 처리:", file.name, "추출된 급여:", extractedWages);
      
      // 폼 값 업데이트
      form.setValue('wages', extractedWages);
      
      // 상태 업데이트를 위해 TaxContext에도 업데이트
      const currentIncome = form.getValues();
      currentIncome.wages = extractedWages;
      
      // 총소득 계산
      const earnedIncomeTotal = Number(extractedWages || 0) + Number(currentIncome.otherEarnedIncome || 0);
      const unearnedIncomeTotal = 
        Number(currentIncome.interestIncome || 0) + 
        Number(currentIncome.dividends || 0) + 
        Number(currentIncome.rentalIncome || 0) + 
        Number(currentIncome.capitalGains || 0);
      
      const totalIncome = earnedIncomeTotal + unearnedIncomeTotal;
      currentIncome.totalIncome = totalIncome;
      
      // TaxContext 업데이트
      updateTaxData({ income: currentIncome });
      
      // 업로드 상태 초기화
      setIsUploading(false);
      
      // 추출 완료 알림 표시
      toast({
        title: "W-2 데이터 추출 완료",
        description: `${file.name} 파일에서 급여 정보(₩${extractedWages.toLocaleString()})가 자동으로 입력되었습니다.`,
      });
    }, 1500);
  };
  
  // QBI에서 businessIncome 가져오기
  const qbiBusinessIncome = taxData.income?.qbi?.totalQBI || 0;
  const effectiveBusinessIncome = qbiBusinessIncome > 0 ? qbiBusinessIncome : (taxData.income?.businessIncome || 0);
  
  console.log('폼 초기화 - QBI 데이터 확인:', {
    qbiData: taxData.income?.qbi,
    qbiTotalQBI: qbiBusinessIncome,
    savedBusinessIncome: taxData.income?.businessIncome,
    effectiveBusinessIncome
  });

  const defaultValues: Income = {
    wages: taxData.income?.wages || 0,
    otherEarnedIncome: taxData.income?.otherEarnedIncome || 0,
    interestIncome: taxData.income?.interestIncome || 0,
    dividends: taxData.income?.dividends || 0,
    businessIncome: effectiveBusinessIncome, // QBI에서 가져온 값 사용
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
      otherAdjustments: taxData.income?.adjustments?.otherAdjustments || 0,
    },
    adjustedGrossIncome: taxData.income?.adjustedGrossIncome || 0
  };

  const form = useForm<Income>({
    resolver: zodResolver(incomeSchema),
    defaultValues,
  });

  // taxData 변경 감지하여 QBI 데이터 적용
  useEffect(() => {
    // taxData가 로드되고 QBI 데이터가 있을 때만 실행
    if (taxData.id && taxData.income?.qbi?.totalQBI) {
      const qbiTotalIncome = taxData.income.qbi.totalQBI;
      const currentBusinessIncome = form.getValues('businessIncome');
      
      console.log('taxData 로드 완료 - QBI 데이터 적용:', {
        taxDataId: taxData.id,
        qbiTotalIncome,
        currentBusinessIncome
      });
      
      // QBI 값과 현재 값이 다를 때만 업데이트
      if (Math.abs(currentBusinessIncome - qbiTotalIncome) > 0.01) {
        console.log('QBI → businessIncome 자동 업데이트:', qbiTotalIncome);
        
        form.setValue('businessIncome', qbiTotalIncome, { 
          shouldValidate: true, 
          shouldDirty: true,
          shouldTouch: true
        });
        
        // 총소득 재계산
        setTimeout(() => {
          calculateTotals();
        }, 50);
      }
    }
  }, [taxData.id, taxData.income?.qbi?.totalQBI]); // taxData.id와 QBI 데이터 변경 감지
  
  // 총소득과 조정 총소득을 계산하는 함수
  // 심플하게 합계만 리턴하는 함수로 변경
  const calculateTotals = () => {
    // 특별한 계산이 필요한 경우만 이 함수 호출
    // useEffect에서 값이 변경될 때마다 이미 계산하고 있음
    console.log("Manual calculation called");
  };
  
  const onSubmit = async (data: Income) => {
    try {
      // 자본 이득 처리가 제대로 됐는지 확인
      if (data.capitalGains > 0 && data.totalIncome === 0) {
        // 총소득 계산이 되지 않았다면 수동으로 다시 계산
        console.log("자동 계산 수행: 자본 이득이 있지만 총소득이 계산되지 않음", data);
        
        // 총소득 수동 계산
        const totalIncome = 
          Number(data.wages || 0) +
          Number(data.otherEarnedIncome || 0) +
          Number(data.interestIncome || 0) +
          Number(data.dividends || 0) +
          Number(data.businessIncome || 0) +
          Number(data.capitalGains || 0) +
          Number(data.rentalIncome || 0) +
          Number(data.retirementIncome || 0) +
          Number(data.unemploymentIncome || 0) +
          Number(data.otherIncome || 0);
          
        // 폼에 총소득 설정
        form.setValue('totalIncome', totalIncome);
        data.totalIncome = totalIncome;
        
        console.log("자본 이득 금액:", data.capitalGains);
        console.log("총소득 재계산됨:", totalIncome);
      } else {
        // 기존 계산 방식 유지
        calculateTotals();
        data.totalIncome = form.getValues('totalIncome');
      }
      
      data.adjustedGrossIncome = form.getValues('adjustedGrossIncome');
      
      // 콘텍스트 업데이트
      updateTaxData({ income: data });
      
      // 다음 페이지로 이동
      setLocation('/deductions');
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
  
  // QBI 데이터에서 businessIncome 자동 업데이트
  useEffect(() => {
    const qbiData = taxData.income?.qbi;
    const qbiTotalIncome = qbiData?.totalQBI;
    
    console.log('QBI 자동 로드 체크 (useEffect):', { qbiData, qbiTotalIncome });
    
    if (qbiTotalIncome && qbiTotalIncome > 0) {
      console.log('QBI에서 businessIncome 자동 로드 시작:', qbiTotalIncome);
      
      // 현재 폼 값 확인
      const currentBusinessIncome = form.getValues('businessIncome');
      console.log('현재 businessIncome 값:', currentBusinessIncome);
      
      // QBI 값과 다르면 업데이트 (허용 오차 고려)
      if (Math.abs(currentBusinessIncome - qbiTotalIncome) > 0.01) {
        console.log('businessIncome 강제 업데이트:', { from: currentBusinessIncome, to: qbiTotalIncome });
        
        // 폼 필드 강제 업데이트
        form.setValue('businessIncome', qbiTotalIncome, { 
          shouldValidate: true, 
          shouldDirty: true,
          shouldTouch: true
        });
        
        // 강제 리렌더링을 위한 setTimeout
        setTimeout(() => {
          form.trigger('businessIncome');
          calculateTotals();
        }, 50);
      }
    }
  }, [taxData.income?.qbi?.totalQBI, taxData.id]); // taxData.id 추가로 데이터 변경 감지

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
  
  // 테스트용 함수 - 난수를 사용한 테스트 데이터 추가
  const addDummyData = () => {
    // 범위 내 난수 생성 함수
    const getRandomAmount = (min: number, max: number): number => {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    
    // 소수점 2자리까지의 난수 생성 (세금 계산용)
    const getRandomDecimal = (min: number, max: number): number => {
      return Math.round((Math.random() * (max - min) + min) * 100) / 100;
    };
    
    // 무작위 금액으로 더미 소득 항목 추가
    const dummyIncomeItems: AdditionalIncomeItem[] = [
      { 
        type: '도박 소득 (Gambling winnings)', 
        amount: getRandomAmount(500, 3000), 
        description: '복권 당첨금' 
      },
      { 
        type: '배심원 수당 (Jury duty pay)', 
        amount: getRandomAmount(200, 900), 
        description: '지방법원 배심원 참여' 
      }
    ];
    
    // 무작위 금액으로 더미 조정 항목 추가
    const dummyAdjustmentItems: AdditionalAdjustmentItem[] = [
      { 
        type: '교육자 비용 (Educator expenses)', 
        amount: getRandomAmount(100, 400), 
        description: '교육 자료 구입' 
      },
      { 
        type: '학자금대출 이자 (Student loan interest)', 
        amount: getRandomAmount(500, 2500), 
        description: '연간 지불 이자' 
      }
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
      
    // QBI 사업소득 확인
    const qbiBusinessIncome = taxData.income?.qbi?.totalQBI || 0;
    const currentBusinessIncome = Number(form.watch('businessIncome') || 0);
    const effectiveBusinessIncome = qbiBusinessIncome > 0 ? qbiBusinessIncome : currentBusinessIncome;
    
    // 비근로소득 계산 (사업소득 포함)
    const unearnedIncomeTotal =
      Number(form.watch('interestIncome') || 0) +
      Number(form.watch('dividends') || 0) +
      effectiveBusinessIncome +
      Number(form.watch('capitalGains') || 0) +
      Number(form.watch('rentalIncome') || 0);
      
    // 사용하지 않는 필드들은 0으로 설정 (businessIncome과 capitalGains 제외)
    form.setValue('retirementIncome', 0);
    form.setValue('unemploymentIncome', 0);
    form.setValue('otherIncome', 0);
    
    // QBI 사업소득이 있으면 businessIncome 필드 업데이트
    if (qbiBusinessIncome > 0 && Math.abs(currentBusinessIncome - qbiBusinessIncome) > 0.01) {
      form.setValue('businessIncome', qbiBusinessIncome);
    }
    
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
    
    // 기타소득은 사용자 직접 입력값 + 추가 소득 항목의 합계
    const totalOtherIncome = userOtherIncome + additionalItemsTotal;
    
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
                           additionalAdjustmentsTotal;
    
    // 조정 총소득(AGI) 계산
    const adjustedGrossIncome = totalIncome - totalAdjustments;
    
    console.log("조정 계산 세부사항:", {
      학자금대출이자: studentLoanInterest,
      은퇴기여금: retirementContributions,
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
      Number(form.watch('rentalIncome') || 0);
    
    const userOtherIncome = Number(form.watch('otherIncome') || 0);
    
    let additionalItemsTotal = 0;
    if (additionalIncomeItems.length > 0) {
      additionalItemsTotal = additionalIncomeItems.reduce((sum, item) => 
        sum + Number(item.amount || 0), 0);
    }
    
    // 기타소득은 사용자 직접 입력값 + 추가 소득 항목의 합계
    const totalOtherIncome = userOtherIncome + additionalItemsTotal;
    const totalIncome = earnedIncomeTotal + unearnedIncomeTotal + totalOtherIncome;
    
    const studentLoanInterest = Number(form.watch('adjustments.studentLoanInterest') || 0);
    const retirementContributions = Number(form.watch('adjustments.retirementContributions') || 0);
    
    let additionalAdjustmentsTotal = 0;
    if (additionalAdjustmentItems.length > 0) {
      additionalAdjustmentsTotal = additionalAdjustmentItems.reduce((sum, item) => 
        sum + Number(item.amount || 0), 0);
    }
    
    const totalAdjustments = studentLoanInterest + retirementContributions + additionalAdjustmentsTotal;
    
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
                                placeholder="급여 금액을 입력하세요"
                                value={field.value === 0 ? '' : field.value}
                                onChange={(e) => {
                                  field.onChange(parseFloat(e.target.value) || 0);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="border rounded-md p-4 bg-blue-50/50 mb-4">
                        <p className="text-sm font-medium text-blue-800 mb-2">W-2 폼 업로드 (W-2 Form Upload)</p>
                        <p className="text-xs text-blue-700 mb-3">
                          W-2 폼 파일을 업로드하면 급여 정보가 자동으로 입력됩니다. 파일이 없으면 수동으로 입력하세요.
                        </p>
                        <div className="flex items-center gap-3">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            className="flex items-center gap-2 bg-white hover:bg-blue-50 border-blue-200 text-blue-700"
                            onClick={() => document.getElementById('w2-file-upload')?.click()}
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>처리 중...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4" />
                                <span>W-2 폼 업로드</span>
                              </>
                            )}
                          </Button>
                          <input 
                            id="w2-file-upload"
                            type="file" 
                            accept=".pdf,.jpg,.jpeg,.png" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleW2Upload(file);
                                // 파일 입력 초기화
                                e.target.value = '';
                              }
                            }}
                          />
                          <p className="text-xs text-blue-600 mt-2">
                            JPG, PNG 또는 PDF 파일을 업로드하면 급여 정보가 자동으로 추출됩니다.
                          </p>
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
                                placeholder="기타 근로소득 금액"
                                value={field.value === 0 ? '' : field.value}
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
                    <h3 className="text-lg font-semibold mb-4">사업소득 (Business Income)</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="businessIncome"
                        render={({ field }) => (
                          <FormItem className="flex flex-col justify-center h-full">
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center gap-1">
                                <FormLabel>사업 순소득 (Schedule C Net Profit)</FormLabel>
                                <div className="tooltip">
                                  <InfoIcon className="h-4 w-4 text-gray-dark" />
                                  <span className="tooltip-text">Net profit from business operations (Schedule C)</span>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setLocation('/qbi-details')}
                                className="text-xs flex items-center gap-1"
                              >
                                <Calculator className="h-3 w-3" />
                                <span>QBI 계산기</span>
                              </Button>
                            </div>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="사업 순소득 금액"
                                value={(() => {
                                  // QBI 데이터가 있으면 우선 사용
                                  const qbiValue = taxData.income?.qbi?.totalQBI || 0;
                                  const fieldValue = field.value || 0;
                                  const displayValue = qbiValue > 0 ? qbiValue : fieldValue;
                                  
                                  console.log('사업소득 필드 값 표시:', {
                                    qbiValue,
                                    fieldValue,
                                    displayValue
                                  });
                                  
                                  return displayValue === 0 ? '' : displayValue;
                                })()}
                                onChange={(e) => {
                                  const newValue = parseFloat(e.target.value) || 0;
                                  console.log('사업소득 필드 수동 변경:', newValue);
                                  field.onChange(newValue);
                                  
                                  // 사업소득 변경시 즉시 총소득 재계산
                                  setTimeout(() => {
                                    calculateTotals();
                                  }, 50);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                            <div className="text-xs text-gray-500 mt-1">
                              Schedule C, K-1, REIT 배당금 등 QBI 적격 소득
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <div className="border rounded-md p-4 bg-green-50/50">
                        <p className="text-sm font-medium text-green-800 mb-2">QBI 공제 (Section 199A)</p>
                        <p className="text-xs text-green-700 mb-3">
                          적격 사업소득의 최대 20% 공제 가능. 소득 한도 및 사업 유형에 따라 제한됩니다.
                        </p>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>2024년 한도 (단독):</span>
                            <span className="font-medium">$191,950</span>
                          </div>
                          <div className="flex justify-between">
                            <span>2024년 한도 (부부합산):</span>
                            <span className="font-medium">$383,900</span>
                          </div>
                        </div>
                      </div>
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
                                placeholder="이자소득 금액"
                                value={field.value === 0 ? '' : field.value}
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
                                placeholder="배당소득 금액"
                                value={field.value === 0 ? '' : field.value}
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
                        name="capitalGains"
                        render={({ field }) => (
                          <FormItem className="flex flex-col justify-center h-full">
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center gap-1">
                                <FormLabel>자본 이득 (Capital Gains)</FormLabel>
                                <div className="tooltip">
                                  <InfoIcon className="h-4 w-4 text-gray-dark" />
                                  <span className="tooltip-text">Income from sale of investments</span>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setLocation('/capital-gains')}
                                className="text-xs flex items-center gap-1"
                              >
                                <Calculator className="h-3 w-3" />
                                <span>계산기 열기</span>
                              </Button>
                            </div>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="자본이득 금액"
                                value={field.value === 0 ? '' : field.value}
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
                                placeholder="임대소득 금액"
                                value={field.value === 0 ? '' : field.value}
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
                  
                  {/* 기타 소득 (Other Income) */}
                  <div className="mt-6 mb-6 border-t border-gray-light pt-6">
                    <div className="flex items-center mb-3">
                      <h3 className="text-lg font-semibold">기타 소득 (Other Income)</h3>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon className="h-4 w-4 text-gray-dark ml-2 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-64">
                              기타 소득에는 실업 급여, 도박 수익, 임대 소득 등이 포함됩니다.
                              (Other income includes unemployment benefits, gambling winnings, rental income, etc.)
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="otherIncome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>추가 소득 (Additional Income)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                <Input 
                                  {...field} 
                                  placeholder="0.00"
                                  className="pl-8"
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9.]/g, '');
                                    field.onChange(Number(value) || 0);
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                            <div className="text-xs text-gray-500 mt-1">
                              다른 곳에 보고되지 않은 소득 (실업급여, 도박, 등)
                              (Income not reported elsewhere (unemployment, gambling, etc.))
                            </div>
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
                        onClick={() => setLocation('/additional-income')}
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
                                placeholder="학자금 대출 이자 금액"
                                value={field.value === 0 ? '' : field.value}
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
                              <FormLabel>HSA 적립금 (Health Savings Account)</FormLabel>
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
                                placeholder="HSA 적립금 금액"
                                value={field.value === 0 ? '' : field.value}
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
                          onClick={() => setLocation('/additional-adjustments')}
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
              
              <StepNavigation 
                prevStep="/personal-info" 
                nextStep="/retirement-contributions"
                submitText="은퇴계획(Retirement)"
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