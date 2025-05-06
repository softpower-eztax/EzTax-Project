import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { additionalTaxSchema, type AdditionalTax } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import ProgressTracker from '@/components/ProgressTracker';
import TaxSummary from '@/components/TaxSummary';
import StepNavigation from '@/components/StepNavigation';
import { useTaxContext } from '@/context/TaxContext';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const AdditionalTaxPage: React.FC = () => {
  const { taxData, updateTaxData, recalculateTaxes } = useTaxContext();
  const { toast } = useToast();
  
  const defaultValues: AdditionalTax = {
    selfEmploymentIncome: 0,
    selfEmploymentTax: 0,
    estimatedTaxPayments: 0,
    otherIncome: 0,
    otherTaxes: 0,
    ...taxData.additionalTax
  };

  const form = useForm<AdditionalTax>({
    resolver: zodResolver(additionalTaxSchema),
    defaultValues,
    mode: 'onChange'
  });

  // Watch self-employment income to calculate tax
  const watchSelfEmploymentIncome = form.watch('selfEmploymentIncome');
  
  // Calculate self-employment tax (15.3% of 92.35% of self-employment income)
  React.useEffect(() => {
    const income = Number(watchSelfEmploymentIncome || 0);
    if (income > 0) {
      const taxableIncome = income * 0.9235;
      const tax = taxableIncome * 0.153;
      form.setValue('selfEmploymentTax', Math.round(tax * 100) / 100);
    } else {
      form.setValue('selfEmploymentTax', 0);
    }
  }, [watchSelfEmploymentIncome, form]);

  const onSubmit = (data: AdditionalTax) => {
    updateTaxData({ additionalTax: data });
    recalculateTaxes();
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
        <h1 className="text-3xl font-heading font-bold text-primary-dark mb-2">귀하의 2025년 세금 신고서 (Your 2025 Tax Return)</h1>
        <p className="text-gray-dark">세금 신고서를 준비하기 위해 모든 섹션을 작성하세요. 입력한 정보는 자동으로 저장됩니다. (Complete all sections to prepare your tax return. Your information is saved automatically.)</p>
      </div>

      <ProgressTracker currentStep={5} />

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-grow">
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-heading font-semibold text-primary-dark mb-6">추가 세금 (Additional Tax)</h2>
              
              <Form {...form}>
                <form>
                  {/* Self-Employment Income */}
                  <div className="mb-6 border-b border-gray-light pb-6">
                    <div className="flex items-center mb-3">
                      <h4 className="font-semibold">자영업 소득 (Self-Employment Income)</h4>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-dark ml-2 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-64">
                              자영업 소득에는 사업 소득, 프리랜서 수입, 독립 계약자 소득이 포함됩니다.
                              (Self-employment income includes business income, freelance work, and independent contractor earnings.)
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="selfEmploymentIncome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>순 자영업 소득 (Net Self-Employment Income)</FormLabel>
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
                              비용을 제외한 순사업 소득을 입력하세요.
                              (Your net business income after expenses.)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="selfEmploymentTax"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>자영업 세금 (계산됨) (Self-Employment Tax)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-dark">$</span>
                                <Input 
                                  {...field} 
                                  placeholder="0.00"
                                  className="pl-8 bg-gray-bg"
                                  value={field.value?.toFixed(2) || '0.00'}
                                  disabled
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              자영업 소득의 92.35%에 대해 15.3%가 계산됩니다.
                              (15.3% of 92.35% of your self-employment income.)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Other Income */}
                  <div className="mb-6 border-b border-gray-light pb-6">
                    <div className="flex items-center mb-3">
                      <h4 className="font-semibold">기타 소득 (Other Income)</h4>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-dark ml-2 cursor-help" />
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
                                    const formatted = formatCurrency(e.target.value);
                                    field.onChange(Number(formatted));
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              다른 곳에 보고되지 않은 소득 (실업급여, 도박, 등)
                              (Income not reported elsewhere (unemployment, gambling, etc.))
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Other Taxes */}
                  <div className="mb-6 border-b border-gray-light pb-6">
                    <div className="flex items-center mb-3">
                      <h4 className="font-semibold">기타 세금 (Other Taxes)</h4>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-dark ml-2 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-64">
                              기타 세금에는 조기 인출 벌금, 가정 고용 세금 등이 포함됩니다.
                              (Other taxes include early withdrawal penalties, household employment taxes, etc.)
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="otherTaxes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>추가 세금 (Additional Taxes)</FormLabel>
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
                              다른 곳에서 계산되지 않은 추가 세금
                              (Additional taxes not calculated elsewhere)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Estimated Tax Payments */}
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <h4 className="font-semibold">예상세금 선납액 (Estimated Tax Payments)</h4>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-dark ml-2 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-64">
                              2025년 세무연도에 납부한 분기별 예상세금 선납액의 총액을 포함하세요.
                              (Include the total of your quarterly estimated tax payments made for the 2025 tax year.)
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="estimatedTaxPayments"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>총 예상세금 선납액 (Total Estimated Tax Payments)</FormLabel>
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
                              2025년 동안 납부한 모든 분기별 선납액의 총액
                              (Total of all quarterly payments made during 2025)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </form>
              </Form>
              
              <StepNavigation
                prevStep="/tax-credits"
                nextStep="/review"
                submitText="검토 및 계산 (Review & Calculate)"
                onNext={() => {
                  if (form.formState.isValid) {
                    onSubmit(form.getValues());
                    return true;
                  } else {
                    form.trigger();
                    if (!form.formState.isValid) {
                      toast({
                        title: "잘못된 양식 (Invalid form)",
                        description: "계속하기 전에 양식의 오류를 수정해주세요. (Please fix the errors in the form before proceeding.)",
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

export default AdditionalTaxPage;
