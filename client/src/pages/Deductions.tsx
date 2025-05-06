import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { deductionsSchema, type Deductions } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ProgressTracker from '@/components/ProgressTracker';
import TaxSummary from '@/components/TaxSummary';
import StepNavigation from '@/components/StepNavigation';
import { useTaxContext } from '@/context/TaxContext';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateStandardDeduction } from '@/lib/taxCalculations';

const Deductions: React.FC = () => {
  const { taxData, updateTaxData } = useTaxContext();
  const { toast } = useToast();
  const [isItemizedDisabled, setIsItemizedDisabled] = useState(true);
  
  // Calculate standard deduction based on filing status
  const standardDeductionAmount = calculateStandardDeduction(taxData.personalInfo?.filingStatus || 'single');
  
  // 테스트용 하드코딩된 데이터로 시작
  const defaultValues: Deductions = {
    useStandardDeduction: false,
    standardDeductionAmount: 27700,
    itemizedDeductions: {
      medicalExpenses: 5000,
      stateLocalIncomeTax: 7500,
      realEstateTaxes: 8000,
      mortgageInterest: 9500,
      charitableCash: 3000,
      charitableNonCash: 2000
    },
    totalDeductions: 35000,
    ...taxData.deductions
  };

  const form = useForm<Deductions>({
    resolver: zodResolver(deductionsSchema),
    defaultValues,
    mode: 'onChange'
  });

  const watchDeductionType = form.watch('useStandardDeduction');
  
  // When useStandardDeduction changes, update form field status
  useEffect(() => {
    setIsItemizedDisabled(watchDeductionType);
    
    // Calculate total deductions
    if (watchDeductionType) {
      form.setValue('totalDeductions', standardDeductionAmount);
      
      // Clear validation errors for itemized deduction fields when standard deduction is selected
      form.clearErrors('itemizedDeductions');
    } else {
      const itemized = form.getValues('itemizedDeductions');
      if (itemized) {
        const total = 
          Number(itemized.medicalExpenses || 0) +
          Number(itemized.stateLocalIncomeTax || 0) +
          Number(itemized.realEstateTaxes || 0) +
          Number(itemized.mortgageInterest || 0) +
          Number(itemized.charitableCash || 0) +
          Number(itemized.charitableNonCash || 0);
        
        form.setValue('totalDeductions', total);
      }
    }
  }, [watchDeductionType, form, standardDeductionAmount]);

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
      if (itemized) {
        const total = 
          Number(itemized.medicalExpenses || 0) +
          Number(itemized.stateLocalIncomeTax || 0) +
          Number(itemized.realEstateTaxes || 0) +
          Number(itemized.mortgageInterest || 0) +
          Number(itemized.charitableCash || 0) +
          Number(itemized.charitableNonCash || 0);
        
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
    watchDeductionType,
    form
  ]);

  const onSubmit = (data: Deductions) => {
    updateTaxData({ deductions: data });
    return true;
  };

  // Helper function to format currency input
  const formatCurrency = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/[^\d.]/g, '');
    return digits;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-primary-dark mb-2">귀하의 2025년 세금 신고서</h1>
        <p className="text-gray-dark">세금 신고서를 준비하기 위해 모든 섹션을 작성하세요. 입력한 정보는 자동으로 저장됩니다.</p>
      </div>

      <ProgressTracker currentStep={3} />
      
      <div className="md:hidden mb-4 border-b border-gray-medium">
        <button className="py-2 px-4 border-b-2 border-transparent text-gray-dark">Personal</button>
        <button className="py-2 px-4 border-b-2 border-primary text-primary font-semibold">Deductions</button>
        <button className="py-2 px-4 border-b-2 border-transparent text-gray-dark">Credits</button>
        <button className="py-2 px-4 border-b-2 border-transparent text-gray-dark">Add. Tax</button>
        <button className="py-2 px-4 border-b-2 border-transparent text-gray-dark">Review</button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-grow">
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-heading font-semibold text-primary-dark mb-6">공제 (Deductions)</h2>
              
              <Form {...form}>
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

                  <div id="itemized-deductions-section" className={isItemizedDisabled ? 'opacity-50' : ''}>
                    <h3 className="text-lg font-heading font-semibold mb-4">항목별공제 (Itemized Deductions)</h3>

                    {/* Medical Expenses */}
                    <div className="mb-6 border-b border-gray-light pb-6">
                      <div className="flex items-center mb-3">
                        <h4 className="font-semibold">의료비 (Medical Expenses)</h4>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-gray-dark ml-2 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-64">
                                의료비는 조정총소득(AGI)의 7.5%를 초과하는 부분에 대해 공제될 수 있습니다.
                                (Medical expenses are deductible to the extent they exceed 7.5% of your adjusted gross income.)
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="itemizedDeductions.medicalExpenses"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>의료비및치과비용 (Medical and Dental Expenses)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                  <Input 
                                    {...field} 
                                    placeholder="0.00"
                                    disabled={isItemizedDisabled}
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

                    {/* State and Local Taxes */}
                    <div className="mb-6 border-b border-gray-light pb-6">
                      <div className="flex items-center mb-3">
                        <h4 className="font-semibold">주세및지방세 (State and Local Taxes)</h4>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-gray-dark ml-2 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-64">
                                주세 및 지방세에 대한 공제는 $10,000로 제한됩니다 (부부별도신고의 경우 $5,000).
                                (Deduction for state and local taxes is limited to $10,000 ($5,000 if married filing separately).)
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="itemizedDeductions.stateLocalIncomeTax"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>주및지방소득세 (State and Local Income Taxes)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                  <Input 
                                    {...field} 
                                    placeholder="0.00"
                                    disabled={isItemizedDisabled}
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
                        
                        <FormField
                          control={form.control}
                          name="itemizedDeductions.realEstateTaxes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>부동산세 (Real Estate Taxes)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                  <Input 
                                    {...field} 
                                    placeholder="0.00"
                                    disabled={isItemizedDisabled}
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

                    {/* Interest Paid */}
                    <div className="mb-6 border-b border-gray-light pb-6">
                      <div className="flex items-center mb-3">
                        <h4 className="font-semibold">지급이자 (Interest Paid)</h4>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-gray-dark ml-2 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-64">
                                주택담보대출 이자는 최대 $750,000까지의 대출에 대해 공제 가능합니다.
                                (Mortgage interest on up to $750,000 of mortgage debt is deductible.)
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="itemizedDeductions.mortgageInterest"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>주택담보대출이자 (Mortgage Interest)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                  <Input 
                                    {...field} 
                                    placeholder="0.00"
                                    disabled={isItemizedDisabled}
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

                    {/* Charitable Contributions */}
                    <div className="mb-6">
                      <div className="flex items-center mb-3">
                        <h4 className="font-semibold">자선기부 (Charitable Contributions)</h4>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-gray-dark ml-2 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-64">
                                적격 기관에 대한 현금 기부는 일반적으로 조정총소득의 최대 60%까지 공제 가능합니다.
                                (Cash contributions to qualified organizations are generally deductible up to 60% of your adjusted gross income.)
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="itemizedDeductions.charitableCash"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>현금기부 (Cash Contributions)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                  <Input 
                                    {...field} 
                                    placeholder="0.00"
                                    disabled={isItemizedDisabled}
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
                        
                        <FormField
                          control={form.control}
                          name="itemizedDeductions.charitableNonCash"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>비현금기부 (Non-Cash Contributions)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                  <Input 
                                    {...field} 
                                    placeholder="0.00"
                                    disabled={isItemizedDisabled}
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
                  </div>
                </form>
              </Form>
              
              <StepNavigation
                prevStep="/income"
                nextStep="/tax-credits"
                submitText="세금공제 (Tax Credits)"
                onNext={() => {
                  if (form.formState.isValid) {
                    onSubmit(form.getValues());
                    return true;
                  } else {
                    form.trigger();
                    if (!form.formState.isValid) {
                      toast({
                        title: "Invalid form",
                        description: "Please fix the errors in the form before proceeding.",
                        variant: "destructive",
                      });
                    }
                    return false;
                  }
                }}
              />
            </CardContent>
          </Card>
        </div>
        
        <TaxSummary />
      </div>
    </div>
  );
};

export default Deductions;
