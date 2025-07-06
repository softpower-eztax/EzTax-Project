import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Income, incomeSchema } from '@shared/schema';
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
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Save, ArrowRight } from 'lucide-react';

export default function IncomePage() {
  const [, navigate] = useLocation();
  const { taxData, updateTaxData } = useTaxContext();
  const { toast } = useToast();

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

  // Manual save function (only saves when explicitly called)
  const handleSave = async () => {
    try {
      calculateTotals();
      const data = form.getValues();
      
      updateTaxData({ income: data });
      
      toast({
        title: "저장 완료",
        description: "소득 정보가 성공적으로 저장되었습니다.",
      });
    } catch (error) {
      toast({
        title: "저장 실패",
        description: "소득 정보 저장 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  // Handle form submission
  const onSubmit = async (data: Income) => {
    try {
      calculateTotals();
      
      const updatedData = {
        ...data,
        totalIncome: form.getValues('totalIncome'),
        adjustedGrossIncome: form.getValues('adjustedGrossIncome')
      };
      
      updateTaxData({ income: updatedData });
      
      toast({
        title: "저장 완료",
        description: "소득 정보가 저장되었습니다.",
      });
      
      navigate('/deductions');
    } catch (error) {
      toast({
        title: "오류",
        description: "소득 정보 저장 중 문제가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-dark mb-2">소득 정보</h1>
        <p className="text-gray-600">세금 신고를 위한 소득 정보를 입력하세요.</p>
      </div>

      <div className="space-y-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* 근로소득 섹션 */}
            <Card>
              <CardHeader>
                <CardTitle>근로소득</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="wages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>급여 (W-2 Wages)</FormLabel>
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

                <FormField
                  control={form.control}
                  name="otherEarnedIncome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>기타 근로소득</FormLabel>
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
              </CardContent>
            </Card>

            {/* 투자소득 섹션 */}
            <Card>
              <CardHeader>
                <CardTitle>투자소득</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="interestIncome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이자소득</FormLabel>
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
                    <FormItem>
                      <FormLabel>배당소득</FormLabel>
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
                    <FormItem>
                      <FormLabel>자본이득</FormLabel>
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
                  name="businessIncome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>사업소득</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="사업소득 금액"
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
              </CardContent>
            </Card>

            {/* 조정 항목 섹션 */}
            <Card>
              <CardHeader>
                <CardTitle>조정 항목 (Above-the-Line Deductions)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="adjustments.studentLoanInterest"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>학자금 대출 이자</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
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
                      <FormLabel>은퇴계좌 기여금 (IRA/401k)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="은퇴계좌 기여금 금액"
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
              </CardContent>
            </Card>

            <Separator />

            {/* 저장 및 계산 버튼 */}
            <div className="flex gap-4 justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleSave}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                진행상황 저장
              </Button>
              
              <Button 
                type="button"
                onClick={calculateTotals}
                variant="secondary"
              >
                총액 계산
              </Button>

              <Button type="submit" className="flex items-center gap-2">
                다음 단계
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

          </form>
        </Form>
      </div>
    </div>
  );
}