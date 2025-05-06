import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { AdditionalIncomeItem, Income, incomeSchema } from '@shared/schema';
import { useTaxContext } from '@/context/TaxContext';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import ProgressTracker from '@/components/ProgressTracker';
import StepNavigation from '@/components/StepNavigation';
import TaxSummary from '@/components/TaxSummary';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoIcon, Plus, X, Upload, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/taxCalculations';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const IncomePage: React.FC = () => {
  const [, navigate] = useLocation();
  const { taxData, updateTaxData, saveTaxReturn } = useTaxContext();
  const { toast } = useToast();
  const [showAdditionalIncomeDialog, setShowAdditionalIncomeDialog] = useState(false);
  const [selectedIncomeType, setSelectedIncomeType] = useState<string>("");
  const [additionalIncomeAmount, setAdditionalIncomeAmount] = useState<number>(0);
  const [additionalIncomeDescription, setAdditionalIncomeDescription] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // 테스트용 하드코딩된 데이터로 시작
  const defaultValues: Income = {
    wages: 75000,
    interestIncome: 1200,
    dividends: 3500,
    businessIncome: 15000,
    capitalGains: 5000,
    rentalIncome: 12000,
    retirementIncome: 0,
    unemploymentIncome: 0,
    otherIncome: 1500,
    totalIncome: 113200,
    adjustments: {
      studentLoanInterest: 2500,
      retirementContributions: 6000,
      healthSavingsAccount: 3500,
      otherAdjustments: 1000
    },
    adjustedGrossIncome: 100200
  };

  // Initialize the form with react-hook-form
  const form = useForm<Income>({
    resolver: zodResolver(incomeSchema),
    defaultValues,
    mode: 'onChange',
  });

  // Update calculated fields when form values change
  // Additional income types
  const additionalIncomeTypes = [
    // 기존 사업 관련 소득
    "종교지도자 및 자영업자 소득 (Income of clergy and self-employed)",
    "파트너쉽 소득 (Partnership income)",
    "S Corp 소득 (S Corporation income)",
    "농업 및 어업 관련 소득 (Farm and fishing income)",
    "프리랜서, 독립계약자(1099-NEC), 사업자 등록 없이 활동하는 파트너십 파트너 등 해당 수입 (For freelancers, independent contractors, and partners without a business under their name)",
    
    // 특이한 수입 카테고리
    "메디케이드 수입 (Medicaid income)",
    "고용주 제공 입양 혜택 (Employer-provided adoption benefits)",
    "IRA 분배금 수령액 (IRA distributions)",
    "주 및 지방 소득세 환급, 크레딧 또는 상계 금액 (Taxable refunds, credits, or offsets of state and local income taxes)",
    "위자료 수령액 (Alimony received)",
    "도박 소득 (Gambling winnings)",
    "부채 탕감 (Cancellation of debt)",
    "해외 근로소득 제외액 (Foreign earned income exclusion)",
    "Archer 의료 저축 계좌 인출액 및 장기요양보험 지급금 (Distributions from Archer MSAs and long-term care insurance contracts)",
    "HSA 계좌 인출액 (Health Savings Accounts)",
    "알래스카 영구 기금 배당금 (Alaska Permanent Fund dividends)",
    "배심원 수당 (Jury duty pay)",
    "상금 및 수상금 (Prizes and awards)",
    "취미활동 소득 (Activity not engaged in for profit income)",
    "스톡옵션 소득 (Stock options)",
    "올림픽 및 패럴림픽 메달과 미국올림픽위원회(USOC) 상금 (Olympic and Paralympic medals and USOC prize money)",
    "ABLE 계좌로부터의 과세 대상 분배금 (Taxable distributions from an ABLE account)",
    "Form W-2에 보고되지 않은 장학금 및 연구비 보조금 (Scholarship and fellowship grants not reported on Form W-2)",
    "비자격 이연 보상 계획 또는 비정부 457 플랜으로부터의 연금 또는 연금소득 (Pension or annuity from a nonqualified deferred compensation plan or a nongovernmental section 457 plan)",
    "수감 중 벌어들인 임금 (Wages earned while incarcerated)",
    "다른 곳에 보고되지 않은 일반 소득으로 수령한 디지털 자산 (Digital assets received as ordinary income not reported elsewhere)"
  ];

  // Handle adding additional income
  const handleAddAdditionalIncome = () => {
    if (!selectedIncomeType || additionalIncomeAmount <= 0) return;
    
    const newItem: AdditionalIncomeItem = {
      type: selectedIncomeType,
      amount: additionalIncomeAmount,
      description: additionalIncomeDescription || undefined
    };
    
    const currentItems = form.getValues('additionalIncomeItems') || [];
    form.setValue('additionalIncomeItems', [...currentItems, newItem]);
    
    // Reset form fields
    setSelectedIncomeType("");
    setAdditionalIncomeAmount(0);
    setAdditionalIncomeDescription("");
    setShowAdditionalIncomeDialog(false);
    
    // Recalculate totals
    calculateTotals();
  };
  
  // Handle removing additional income
  const handleRemoveAdditionalIncome = (index: number) => {
    const currentItems = form.getValues('additionalIncomeItems') || [];
    const newItems = currentItems.filter((_, i) => i !== index);
    form.setValue('additionalIncomeItems', newItems);
    calculateTotals();
  };

  const calculateTotals = () => {
    const values = form.getValues();
    
    // Calculate base income
    let totalIncome = 
      Number(values.wages) +
      Number(values.interestIncome) +
      Number(values.dividends) +
      Number(values.businessIncome) +
      Number(values.capitalGains) +
      Number(values.rentalIncome) +
      Number(values.retirementIncome) +
      Number(values.unemploymentIncome) +
      Number(values.otherIncome);
    
    // Add additional income items
    if (values.additionalIncomeItems && values.additionalIncomeItems.length > 0) {
      const additionalTotal = values.additionalIncomeItems.reduce(
        (sum, item) => sum + Number(item.amount), 0
      );
      totalIncome += additionalTotal;
    }
    
    // Calculate total adjustments
    const totalAdjustments = 
      Number(values.adjustments.studentLoanInterest) +
      Number(values.adjustments.retirementContributions) +
      Number(values.adjustments.healthSavingsAccount) +
      Number(values.adjustments.otherAdjustments);
    
    // Calculate adjusted gross income (AGI)
    const adjustedGrossIncome = totalIncome - totalAdjustments;
    
    // Update the form
    form.setValue('totalIncome', totalIncome);
    form.setValue('adjustedGrossIncome', adjustedGrossIncome);
  };

  // Re-calculate when the form values change
  React.useEffect(() => {
    const subscription = form.watch(() => calculateTotals());
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Handle form submission
  const onSubmit = async (data: Income) => {
    try {
      // Update local state
      updateTaxData({ income: data });
      
      // Save to server
      await saveTaxReturn();
      
      // Show success message
      toast({
        title: "Income saved",
        description: "Your income information has been saved successfully.",
      });
      
      // Navigate to the next step
      navigate('/deductions');
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem saving your income information.",
        variant: "destructive"
      });
    }
  };

  // Validate before navigating away
  const handleNext = () => {
    form.handleSubmit(onSubmit)();
    return true;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Dialog open={showAdditionalIncomeDialog} onOpenChange={setShowAdditionalIncomeDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>추가 소득 항목 입력 (Add Additional Income)</DialogTitle>
            <DialogDescription>
              추가 소득 유형을 선택하고 금액을 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="income-type" className="text-sm font-medium">
                소득 유형 (Income Type)
              </label>
              <Select 
                value={selectedIncomeType} 
                onValueChange={setSelectedIncomeType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="소득 유형을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {additionalIncomeTypes.map((type, index) => (
                    <SelectItem key={index} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="amount" className="text-sm font-medium">
                금액 (Amount)
              </label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={additionalIncomeAmount || ''}
                onChange={(e) => setAdditionalIncomeAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                설명 (Description - Optional)
              </label>
              <Input
                id="description"
                value={additionalIncomeDescription}
                onChange={(e) => setAdditionalIncomeDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdditionalIncomeDialog(false)}>
              취소 (Cancel)
            </Button>
            <Button onClick={handleAddAdditionalIncome}>
              추가 (Add)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-primary-dark mb-2">2023년 세금 신고</h1>
        <p className="text-gray-dark">세금 신고를 준비하기 위해 모든 섹션을 작성하세요. 정보는 입력하는 대로 저장됩니다.</p>
      </div>

      <ProgressTracker currentStep={2} />
      
      <div className="md:flex gap-8">
        <div className="flex-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-heading text-primary-dark">소득 정보 (Income Information)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">근로 및 기타 소득 (Employment & Other Income)</h3>
                    
                    <div className="space-y-4">
                      {/* W2 Upload Button */}
                      <div className="border rounded-md p-3 bg-gray-50/50">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <h4 className="text-base font-medium mb-1">
                              W-2 폼 업로드 (Upload W-2 Form)
                            </h4>
                            <p className="text-sm text-gray-500 mb-2">
                              W-2 파일을 업로드하여 자동으로 정보를 추출합니다.
                            </p>
                          </div>
                          <div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <label className="cursor-pointer">
                                    <div className="flex items-center gap-2 rounded-md border bg-white px-4 py-2 text-sm shadow-sm">
                                      {isUploading ? (
                                        <>
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                          <span>처리 중...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Upload className="h-4 w-4" />
                                          <span>파일 업로드</span>
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
                                  <p>W-2 폼에서 정보를 자동으로 추출합니다</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </div>
                      
                      {/* Wages Input Field */}
                      <FormField
                        control={form.control}
                        name="wages"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between">
                              <FormLabel>급여, 월급, 팁 (Wages, Salaries, Tips)</FormLabel>
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
                    </div>
                    
                    <div className="space-y-4 mt-4">
                      {/* 1099-INT Upload Section */}
                      <div className="border rounded-md p-3 bg-gray-50/50">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <h4 className="text-base font-medium mb-1">
                              1099-INT 폼 업로드 (Upload 1099-INT Form)
                            </h4>
                            <p className="text-sm text-gray-500 mb-2">
                              1099-INT 파일을 업로드하여 이자 소득 정보를 자동으로 추출합니다.
                            </p>
                          </div>
                          <div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <label className="cursor-pointer">
                                    <div className="flex items-center gap-2 rounded-md border bg-white px-4 py-2 text-sm shadow-sm">
                                      <Upload className="h-4 w-4" />
                                      <span>파일 업로드</span>
                                    </div>
                                    <input 
                                      type="file" 
                                      accept=".pdf,.jpg,.jpeg,.png" 
                                      className="hidden" 
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          // 실제 환경에서는 파일을 서버에 업로드하고 데이터를 추출하는 API를 호출합니다.
                                          // 여기서는 시뮬레이션을 위해 타이머를 사용하여 1초 후에 임의의 데이터를 설정합니다.
                                          toast({
                                            title: "1099-INT 처리 중",
                                            description: "잠시만 기다려주세요...",
                                          });
                                          
                                          setTimeout(() => {
                                            // 1099-INT에서 추출한 이자 소득 데이터 (시뮬레이션)
                                            const extractedInterestIncome = 2450;
                                            
                                            // 폼 값 업데이트
                                            form.setValue('interestIncome', extractedInterestIncome);
                                            
                                            // 총소득 재계산
                                            calculateTotals();
                                            
                                            // 알림 표시
                                            toast({
                                              title: "1099-INT 데이터 추출 완료",
                                              description: "이자 소득 정보가 자동으로 입력되었습니다.",
                                            });
                                          }, 1000);
                                        }
                                      }}
                                    />
                                  </label>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>1099-INT 폼에서 이자 소득 정보를 추출합니다</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="interestIncome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>이자 소득 (Interest Income)</FormLabel>
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
                      
                      {/* 1099-DIV Upload Section */}
                      <div className="border rounded-md p-3 bg-gray-50/50 mt-6">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <h4 className="text-base font-medium mb-1">
                              1099-DIV 폼 업로드 (Upload 1099-DIV Form)
                            </h4>
                            <p className="text-sm text-gray-500 mb-2">
                              1099-DIV 파일을 업로드하여 배당금 정보를 자동으로 추출합니다.
                            </p>
                          </div>
                          <div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <label className="cursor-pointer">
                                    <div className="flex items-center gap-2 rounded-md border bg-white px-4 py-2 text-sm shadow-sm">
                                      <Upload className="h-4 w-4" />
                                      <span>파일 업로드</span>
                                    </div>
                                    <input 
                                      type="file" 
                                      accept=".pdf,.jpg,.jpeg,.png" 
                                      className="hidden" 
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          // 실제 환경에서는 파일을 서버에 업로드하고 데이터를 추출하는 API를 호출합니다.
                                          // 여기서는 시뮬레이션을 위해 타이머를 사용하여 1초 후에 임의의 데이터를 설정합니다.
                                          toast({
                                            title: "1099-DIV 처리 중",
                                            description: "잠시만 기다려주세요...",
                                          });
                                          
                                          setTimeout(() => {
                                            // 1099-DIV에서 추출한 배당금 데이터 (시뮬레이션)
                                            const extractedDividends = 4250;
                                            
                                            // 폼 값 업데이트
                                            form.setValue('dividends', extractedDividends);
                                            
                                            // 총소득 재계산
                                            calculateTotals();
                                            
                                            // 알림 표시
                                            toast({
                                              title: "1099-DIV 데이터 추출 완료",
                                              description: "배당금 정보가 자동으로 입력되었습니다.",
                                            });
                                          }, 1000);
                                        }
                                      }}
                                    />
                                  </label>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>1099-DIV 폼에서 배당금 정보를 추출합니다</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="dividends"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>배당금 (Dividends)</FormLabel>
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <FormField
                        control={form.control}
                        name="businessIncome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>사업 소득 (Business Income)</FormLabel>
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
                        name="capitalGains"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>자본 이득 (Capital Gains)</FormLabel>
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <FormField
                        control={form.control}
                        name="rentalIncome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>임대 소득 (Rental Income)</FormLabel>
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
                        name="retirementIncome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>은퇴 소득 (Retirement Income)</FormLabel>
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <FormField
                        control={form.control}
                        name="unemploymentIncome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>실업 급여 (Unemployment Income)</FormLabel>
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
                        name="otherIncome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>기타 소득 (Other Income)</FormLabel>
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
                    
                    <div className="mt-4">
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center border rounded-md p-3">
                          <Plus className="w-5 h-5 mr-3 shrink-0" />
                          <div className="flex-1">
                            <button 
                              type="button"
                              className="text-base font-medium hover:text-primary focus:outline-none"
                              onClick={() => setShowAdditionalIncomeDialog(true)}
                            >
                              추가 소득 항목 (Add Additional Income)
                            </button>
                            <p className="text-sm text-gray-500">
                              여기를 클릭해 해당되는 사항이 있는지 확인하세요
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center border rounded-md p-3 bg-gray-50">
                          <Plus className="w-5 h-5 mr-3 shrink-0" />
                          <div className="flex-1">
                            <button 
                              type="button"
                              className="text-base font-medium hover:text-primary focus:outline-none"
                              onClick={() => setShowAdditionalIncomeDialog(true)}
                            >
                              특이한 수입 (Unusual Income)
                            </button>
                            <p className="text-sm text-gray-500">
                              여기를 클릭해 해당되는 사항이 있는지 확인하세요
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {form.watch('additionalIncomeItems') && form.watch('additionalIncomeItems').length > 0 && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-md border">
                          <h4 className="font-medium mb-2">추가 소득 항목 (Additional Income Items)</h4>
                          <ul className="space-y-2">
                            {form.watch('additionalIncomeItems').map((item, index) => (
                              <li key={index} className="flex justify-between">
                                <span>{item.type}</span>
                                <div className="flex items-center space-x-2">
                                  <span>{formatCurrency(item.amount)}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveAdditionalIncome(index)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="p-4 bg-gray-bg rounded-md">
                        <div className="flex justify-between">
                          <span className="font-semibold">총 소득 (Total Income):</span>
                          <span className="font-semibold">{formatCurrency(form.watch('totalIncome'))}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">소득 조정 (Adjustments to Income)</h3>
                    <p className="text-sm text-gray-dark mb-4">
                      이 조정 사항들은 조정된 총소득(AGI)을 계산하기 전에 귀하의 소득을 줄여줍니다.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <FormField
                        control={form.control}
                        name="adjustments.studentLoanInterest"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>학자금 대출 이자 (Student Loan Interest)</FormLabel>
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
                        name="adjustments.retirementContributions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Retirement Contributions</FormLabel>
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <FormField
                        control={form.control}
                        name="adjustments.healthSavingsAccount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Health Savings Account</FormLabel>
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
                            <FormLabel>Other Adjustments</FormLabel>
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
                    
                    <div className="mt-4 p-4 bg-gray-bg rounded-md">
                      <div className="flex justify-between">
                        <span className="font-semibold">Total Adjustments:</span>
                        <span className="font-semibold">
                          {formatCurrency(
                            Number(form.watch('adjustments.studentLoanInterest')) +
                            Number(form.watch('adjustments.retirementContributions')) +
                            Number(form.watch('adjustments.healthSavingsAccount')) +
                            Number(form.watch('adjustments.otherAdjustments'))
                          )}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-4 bg-primary-light bg-opacity-10 rounded-md">
                      <div className="flex justify-between text-lg">
                        <span className="font-bold">Adjusted Gross Income (AGI):</span>
                        <span className="font-bold">{formatCurrency(form.watch('adjustedGrossIncome'))}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <StepNavigation 
                prevStep="/personal-info" 
                nextStep="/deductions"
                onNext={handleNext}
              />
            </form>
          </Form>
        </div>
        
        <div className="hidden md:block">
          <TaxSummary recalculate={calculateTotals} />
        </div>
      </div>
    </div>
  );
};

export default IncomePage;