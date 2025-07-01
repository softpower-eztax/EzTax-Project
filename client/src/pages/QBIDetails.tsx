import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from '@/components/ui/form';
import { useTaxContext } from '@/context/TaxContext';
import { ArrowLeft, Plus, Trash2, Calculator, InfoIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const qbiSchema = z.object({
  scheduleC: z.array(z.object({
    businessName: z.string().min(1, "사업체명은 필수입니다"),
    businessCode: z.string().min(1, "사업코드는 필수입니다"),
    netProfit: z.number().min(0, "순이익은 0 이상이어야 합니다"),
    w2Wages: z.number().min(0, "W-2 급여는 0 이상이어야 합니다"),
    qualifiedProperty: z.number().min(0, "적격자산은 0 이상이어야 합니다"),
    isSSTE: z.boolean().optional()
  })),
  partnershipK1: z.array(z.object({
    partnershipName: z.string().min(1, "파트너십명은 필수입니다"),
    qbiIncome: z.number(),
    w2Wages: z.number().min(0),
    qualifiedProperty: z.number().min(0),
    isSSTE: z.boolean().optional()
  })),
  sCorporationK1: z.array(z.object({
    corporationName: z.string().min(1, "법인명은 필수입니다"),
    qbiIncome: z.number(),
    w2Wages: z.number().min(0),
    qualifiedProperty: z.number().min(0),
    isSSTE: z.boolean().optional()
  })),
  reitDividends: z.number().min(0),
  ptpIncome: z.number(),
  totalQBI: z.number(),
  qbiDeduction: z.number()
});

type QBIFormData = z.infer<typeof qbiSchema>;

export default function QBIDetails() {
  const [, setLocation] = useLocation();
  const { taxData, updateTaxData } = useTaxContext();
  const { toast } = useToast();

  const form = useForm<QBIFormData>({
    resolver: zodResolver(qbiSchema),
    defaultValues: {
      scheduleC: [{ businessName: '', businessCode: '', netProfit: 0, w2Wages: 0, qualifiedProperty: 0, isSSTE: false }],
      partnershipK1: [],
      sCorporationK1: [],
      reitDividends: 0,
      ptpIncome: 0,
      totalQBI: 0,
      qbiDeduction: 0
    }
  });

  // QBI 자동 계산 함수
  const calculateQBI = () => {
    const values = form.getValues();
    const filingStatus = taxData.personalInfo?.filingStatus || 'single';
    const agi = taxData.income?.adjustedGrossIncome || 0;
    const taxableIncome = Math.max(0, agi - (taxData.deductions?.totalDeductions || 0));

    // 2024년 QBI 한도
    const thresholds = {
      single: 191950,
      married_joint: 383900,
      married_separate: 191950,
      head_of_household: 191950,
      qualifying_widow: 383900
    };

    const threshold = thresholds[filingStatus as keyof typeof thresholds] || 191950;

    // 총 QBI 소득 계산
    const totalScheduleC = values.scheduleC.reduce((sum, business) => sum + business.netProfit, 0);
    const totalPartnership = values.partnershipK1.reduce((sum, k1) => sum + k1.qbiIncome, 0);
    const totalSCorp = values.sCorporationK1.reduce((sum, k1) => sum + k1.qbiIncome, 0);
    
    const totalQBI = totalScheduleC + totalPartnership + totalSCorp + values.reitDividends + values.ptpIncome;

    // SSTB(전문서비스업) 확인
    const hasSST = values.scheduleC.some(business => business.isSST) ||
                   values.partnershipK1.some(k1 => k1.isSST) ||
                   values.sCorporationK1.some(k1 => k1.isSST);
    
    // QBI 공제 계산
    let qbiDeduction = 0;
    
    if (totalQBI > 0) {
      // SSTB는 소득 한도 초과시 QBI 공제 불가
      if (hasSST && agi > threshold) {
        console.log('SSTB 사업으로 소득 한도 초과 - QBI 공제 불가');
        qbiDeduction = 0;
      } else {
        // 기본 20% 공제
        const basicDeduction = totalQBI * 0.20;
        
        // 과세소득의 20% 한도
        const taxableIncomeLimit = taxableIncome * 0.20;
        
        if (agi <= threshold) {
          // 소득 한도 이하: 20% 또는 과세소득의 20% 중 작은 값
          qbiDeduction = Math.min(basicDeduction, taxableIncomeLimit);
        } else {
          // 소득 한도 초과: W-2 임금/자산 기준 제한 적용 (간소화)
        const totalW2Wages = values.scheduleC.reduce((sum, business) => sum + business.w2Wages, 0) +
                            values.partnershipK1.reduce((sum, k1) => sum + k1.w2Wages, 0) +
                            values.sCorporationK1.reduce((sum, k1) => sum + k1.w2Wages, 0);
        
        const totalQualifiedProperty = values.scheduleC.reduce((sum, business) => sum + business.qualifiedProperty, 0) +
                                     values.partnershipK1.reduce((sum, k1) => sum + k1.qualifiedProperty, 0) +
                                     values.sCorporationK1.reduce((sum, k1) => sum + k1.qualifiedProperty, 0);

        // W-2 임금 제한: W-2 임금의 50% 또는 W-2 임금의 25% + 적격자산의 2.5% 중 큰 값
        const wageLimit = Math.max(
          totalW2Wages * 0.50,
          totalW2Wages * 0.25 + totalQualifiedProperty * 0.025
        );
        
          const limitedDeduction = Math.min(totalQBI * 0.20, wageLimit);
          qbiDeduction = Math.min(limitedDeduction, taxableIncomeLimit);
        }
      }
    }

    // 폼 업데이트
    form.setValue('totalQBI', totalQBI);
    form.setValue('qbiDeduction', Math.max(0, qbiDeduction));

    console.log("QBI 계산 결과:", {
      totalQBI,
      qbiDeduction,
      agi,
      threshold,
      taxableIncome,
      basicDeduction: totalQBI * 0.20,
      taxableIncomeLimit: taxableIncome * 0.20
    });

    return { totalQBI, qbiDeduction };
  };

  // Schedule C 사업 추가
  const addScheduleC = () => {
    const current = form.getValues('scheduleC');
    form.setValue('scheduleC', [...current, { 
      businessName: '', 
      businessCode: '', 
      netProfit: 0, 
      w2Wages: 0, 
      qualifiedProperty: 0, 
      isSSTE: false 
    }]);
  };

  // Schedule C 사업 제거
  const removeScheduleC = (index: number) => {
    const current = form.getValues('scheduleC');
    if (current.length > 1) {
      form.setValue('scheduleC', current.filter((_, i) => i !== index));
    }
  };

  const onSubmit = (data: QBIFormData) => {
    // Income 데이터에 QBI 정보 저장
    const updatedIncome = {
      ...taxData.income,
      qbi: data,
      businessIncome: data.totalQBI
    };

    updateTaxData({ income: updatedIncome });
    
    toast({
      title: "QBI 정보 저장됨",
      description: `총 QBI: $${data.totalQBI.toLocaleString()}, QBI 공제: $${data.qbiDeduction.toLocaleString()}`,
    });

    setLocation('/income');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation('/income')}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          소득정보로 돌아가기
        </Button>
        <h1 className="text-2xl font-bold text-primary-dark">QBI 공제 계산기 (Section 199A)</h1>
        <p className="text-gray-600 mt-2">
          적격 사업소득(QBI)에 대한 20% 공제를 계산합니다. 소득 한도와 사업 유형에 따라 제한됩니다.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Schedule C 사업소득 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Schedule C 사업소득
                <Button type="button" variant="outline" size="sm" onClick={addScheduleC}>
                  <Plus className="h-4 w-4 mr-1" />
                  사업 추가
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {form.watch('scheduleC').map((_, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">사업 {index + 1}</h4>
                    {form.watch('scheduleC').length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeScheduleC(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`scheduleC.${index}.businessName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>사업체명</FormLabel>
                          <FormControl>
                            <Input placeholder="사업체명을 입력하세요" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`scheduleC.${index}.businessCode`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>사업코드 (NAICS)</FormLabel>
                          <FormControl>
                            <Input placeholder="예: 541211" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`scheduleC.${index}.netProfit`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>순이익 (Net Profit)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0"
                              value={field.value === 0 ? '' : field.value}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`scheduleC.${index}.w2Wages`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>W-2 급여 지급액</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0"
                              value={field.value === 0 ? '' : field.value}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`scheduleC.${index}.qualifiedProperty`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>적격자산 기준액</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0"
                              value={field.value === 0 ? '' : field.value}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`scheduleC.${index}.isSSTE`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>SSTB 해당 여부</FormLabel>
                            <div className="text-xs text-red-500">
                              전문서비스업(법률, 회계, 의료, 컨설팅 등) - QBI 공제 제한 적용
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 기타 QBI 소득 */}
          <Card>
            <CardHeader>
              <CardTitle>기타 QBI 소득</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reitDividends"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>REIT 배당금</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          value={field.value === 0 ? '' : field.value}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="ptpIncome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PTP 소득</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          value={field.value === 0 ? '' : field.value}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* QBI 계산 결과 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                QBI 공제 계산 결과
                <Button type="button" variant="outline" onClick={calculateQBI}>
                  <Calculator className="h-4 w-4 mr-1" />
                  자동 계산
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>총 QBI 소득</Label>
                  <div className="text-2xl font-bold text-green-600">
                    ${form.watch('totalQBI')?.toLocaleString() || '0'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>QBI 공제액 (20%)</Label>
                  <div className="text-2xl font-bold text-blue-600">
                    ${form.watch('qbiDeduction')?.toLocaleString() || '0'}
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-2">
                  <InfoIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 mb-1">QBI 공제 한도</p>
                    <p className="text-yellow-700">
                      • 2024년 소득 한도: 단독 $191,950, 부부합산 $383,900<br/>
                      • 한도 초과시 W-2 급여 및 적격자산 기준 제한 적용<br/>
                      • <strong>전문서비스업(SSTB): 소득 한도 초과시 QBI 공제 불가</strong><br/>
                      • SSTB: 법률, 회계, 의료, 컨설팅, 금융서비스, 운동선수, 연예인 등
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => setLocation('/income')}>
              취소
            </Button>
            <Button type="submit">
              QBI 정보 저장
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}