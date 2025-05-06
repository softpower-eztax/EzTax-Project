import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Income, incomeSchema } from '@shared/schema';
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
import { InfoIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/taxCalculations';

const IncomePage: React.FC = () => {
  const [, navigate] = useLocation();
  const { taxData, updateTaxData, saveTaxReturn } = useTaxContext();
  const { toast } = useToast();

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
  const calculateTotals = () => {
    const values = form.getValues();
    
    // Calculate total income
    const totalIncome = 
      Number(values.wages) +
      Number(values.interestIncome) +
      Number(values.dividends) +
      Number(values.businessIncome) +
      Number(values.capitalGains) +
      Number(values.rentalIncome) +
      Number(values.retirementIncome) +
      Number(values.unemploymentIncome) +
      Number(values.otherIncome);
    
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                            <FormLabel>Rental Income</FormLabel>
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
                            <FormLabel>Retirement Income</FormLabel>
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
                            <FormLabel>Unemployment Income</FormLabel>
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
                            <FormLabel>Other Income</FormLabel>
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
                        <span className="font-semibold">Total Income:</span>
                        <span className="font-semibold">{formatCurrency(form.watch('totalIncome'))}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Adjustments to Income</h3>
                    <p className="text-sm text-gray-dark mb-4">
                      These adjustments reduce your income before calculating your adjusted gross income (AGI).
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <FormField
                        control={form.control}
                        name="adjustments.studentLoanInterest"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Student Loan Interest</FormLabel>
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