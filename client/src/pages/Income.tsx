import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { AdditionalIncomeItem, Income, incomeSchema } from '@shared/schema';
import { useTaxContext } from '@/context/TaxContext';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { StepNavigation } from '@/components/ui/step-navigation';
import { ProgressTracker } from '@/components/ui/progress-tracker';
import { useToast } from '@/hooks/use-toast';

const IncomePageClean: React.FC = () => {
  const [, navigate] = useLocation();
  const { taxData, updateTaxData, saveTaxReturn, isDataReady } = useTaxContext();
  const { toast } = useToast();
  
  // 데이터가 로드되지 않았으면 로딩 표시
  if (!isDataReady) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="text-center">데이터 로딩 중...</div>
      </div>
    );
  }

  // Initialize form with saved data only (no auto-updates)
  const defaultValues: Income = {
    wages: taxData.income?.wages || 0,
    otherEarnedIncome: taxData.income?.otherEarnedIncome || 0,
    interestIncome: taxData.income?.interestIncome || 0,
    dividends: taxData.income?.dividends || 0,
    businessIncome: taxData.income?.businessIncome || 0,
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
      otherAdjustments: taxData.income?.adjustments?.otherAdjustments || 0
    },
    adjustedGrossIncome: taxData.income?.adjustedGrossIncome || 0,
    additionalAdjustmentItems: taxData.income?.additionalAdjustmentItems || []
  };

  const form = useForm<Income>({
    resolver: zodResolver(incomeSchema),
    defaultValues,
    mode: 'onChange',
  });

  // Manual calculation function (no auto-trigger)
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
      Number(values.adjustments.otherAdjustments);
    
    // Calculate adjusted gross income (AGI)
    const adjustedGrossIncome = totalIncome - totalAdjustments;
    
    // Update the form
    form.setValue('totalIncome', totalIncome);
    form.setValue('adjustedGrossIncome', adjustedGrossIncome);
  };

  // Handle form submission (manual save only)
  const onSubmit = async (data: Income) => {
    try {
      // Calculate totals before saving
      calculateTotals();
      
      // Get updated values
      const updatedData = {
        ...data,
        totalIncome: form.getValues('totalIncome'),
        adjustedGrossIncome: form.getValues('adjustedGrossIncome')
      };
      
      // Update local state
      updateTaxData({ income: updatedData });
      
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

  // Manual save function
  const handleSave = async () => {
    try {
      calculateTotals();
      const data = form.getValues();
      
      updateTaxData({ income: data });
      await saveTaxReturn();
      
      toast({
        title: "Progress saved",
        description: "Your income information has been saved.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Could not save your progress.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <ProgressTracker currentStep={2} />
      </div>
      
      <div className="md:flex gap-8">
        <div className="flex-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl font-heading text-primary-dark">
                    소득 정보 (Income Information)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">근로 소득 (Earned Income)</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="wages"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>급여 (Wages, Salaries)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '') {
                                    field.onChange(0);
                                  } else {
                                    const numValue = parseFloat(value);
                                    field.onChange(isNaN(numValue) ? 0 : numValue);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="otherEarnedIncome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>기타 근로소득 (Other Earned Income)</FormLabel>
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
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">투자 소득 (Investment Income)</h3>
                    
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
                      
                      <FormField
                        control={form.control}
                        name="dividends"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>배당 소득 (Dividend Income)</FormLabel>
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
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">기타 소득 (Other Income)</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    
                    <div className="mt-4 p-4 bg-gray-bg rounded-md">
                      <div className="flex justify-between">
                        <span className="font-semibold">총 소득 (Total Income):</span>
                        <span className="font-semibold">{formatCurrency(form.watch('totalIncome'))}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">소득 조정 (Adjustments to Income)</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <FormLabel>은퇴 기여금 (Retirement Contributions)</FormLabel>
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
                        name="adjustments.otherAdjustments"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>기타 조정 (Other Adjustments)</FormLabel>
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
                        <span className="font-semibold">총 조정액 (Total Adjustments):</span>
                        <span className="font-semibold">
                          {formatCurrency(
                            Number(form.watch('adjustments.studentLoanInterest')) +
                            Number(form.watch('adjustments.retirementContributions')) +
                            Number(form.watch('adjustments.otherAdjustments'))
                          )}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-4 bg-primary-light bg-opacity-10 rounded-md">
                      <div className="flex justify-between text-lg">
                        <span className="font-bold">조정 총소득 (Adjusted Gross Income):</span>
                        <span className="font-bold">{formatCurrency(form.watch('adjustedGrossIncome'))}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <Button type="button" onClick={calculateTotals} variant="outline">
                      계산하기 (Calculate)
                    </Button>
                    <Button type="button" onClick={handleSave} variant="outline">
                      진행상황 저장 (Save Progress)
                    </Button>
                  </div>
                  
                  <div className="mt-8">
                    <StepNavigation 
                      prevStep="/personal-info" 
                      nextStep="/deductions"
                      onNext={() => form.handleSubmit(onSubmit)()}
                      submitText="다음 단계 (Next Step)"
                    />
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default IncomePageClean;