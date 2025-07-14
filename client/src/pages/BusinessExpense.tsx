import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calculator, Plus, X, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTaxContext } from '@/context/TaxContext';

const businessExpenseSchema = z.object({
  grossIncome: z.number().min(0).default(0),
  expenses: z.object({
    advertising: z.number().min(0).default(0),
    carAndTruck: z.number().min(0).default(0),
    commissions: z.number().min(0).default(0),
    contractLabor: z.number().min(0).default(0),
    depletion: z.number().min(0).default(0),
    depreciation: z.number().min(0).default(0),
    employeeBenefits: z.number().min(0).default(0),
    insurance: z.number().min(0).default(0),
    interest: z.number().min(0).default(0),
    legal: z.number().min(0).default(0),
    meals: z.number().min(0).default(0),
    office: z.number().min(0).default(0),
    pension: z.number().min(0).default(0),
    rent: z.number().min(0).default(0),
    repairs: z.number().min(0).default(0),
    supplies: z.number().min(0).default(0),
    taxes: z.number().min(0).default(0),
    travel: z.number().min(0).default(0),
    utilities: z.number().min(0).default(0),
    wages: z.number().min(0).default(0),
    other: z.number().min(0).default(0),
  }).default({}),
  netIncome: z.number().default(0),
  k1Items: z.array(z.object({
    entityName: z.string().default(''),
    entityType: z.enum(['partnership', 'scorp', 'trust']).default('partnership'),
    ordinaryIncome: z.number().min(0).default(0),
    rentalIncome: z.number().default(0),
    interestIncome: z.number().min(0).default(0),
    dividendIncome: z.number().min(0).default(0),
    capitalGains: z.number().default(0),
    section199ADeduction: z.number().min(0).default(0),
    charitableContributions: z.number().min(0).default(0),
    section179Deduction: z.number().min(0).default(0),
    credits: z.number().min(0).default(0),
    taxesPaid: z.number().min(0).default(0),
  })).default([]),
  totalK1Income: z.number().default(0),
});

type BusinessExpenseForm = z.infer<typeof businessExpenseSchema>;

export default function BusinessExpensePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { taxData, updateTaxData } = useTaxContext();

  const form = useForm<BusinessExpenseForm>({
    resolver: zodResolver(businessExpenseSchema),
    defaultValues: {
      grossIncome: 0,
      expenses: {
        advertising: 0,
        carAndTruck: 0,
        commissions: 0,
        contractLabor: 0,
        depletion: 0,
        depreciation: 0,
        employeeBenefits: 0,
        insurance: 0,
        interest: 0,
        legal: 0,
        meals: 0,
        office: 0,
        pension: 0,
        rent: 0,
        repairs: 0,
        supplies: 0,
        taxes: 0,
        travel: 0,
        utilities: 0,
        wages: 0,
        other: 0,
      },
      netIncome: 0,
      k1Items: [],
      totalK1Income: 0,
    },
  });

  // 기존 데이터 로드
  useEffect(() => {
    if (taxData.income?.businessExpense) {
      form.reset(taxData.income.businessExpense);
    }
  }, [taxData.income?.businessExpense, form]);

  // 총 지출 계산
  const calculateTotalExpenses = () => {
    const expenses = form.watch('expenses');
    return Object.values(expenses).reduce((sum, value) => sum + (value || 0), 0);
  };

  // 순소득 계산
  const calculateNetIncome = () => {
    const grossIncome = form.watch('grossIncome') || 0;
    const totalExpenses = calculateTotalExpenses();
    const netIncome = grossIncome - totalExpenses;
    form.setValue('netIncome', netIncome);
    return netIncome;
  };

  // K-1 총 소득 계산
  const calculateTotalK1Income = () => {
    const k1Items = form.watch('k1Items') || [];
    const totalK1 = k1Items.reduce((sum, item) => {
      return sum + (item.ordinaryIncome || 0) + (item.rentalIncome || 0) + 
             (item.interestIncome || 0) + (item.dividendIncome || 0) + 
             (item.capitalGains || 0);
    }, 0);
    form.setValue('totalK1Income', totalK1);
    return totalK1;
  };

  // K-1 항목 추가
  const addK1Item = () => {
    const currentItems = form.watch('k1Items') || [];
    const newItem = {
      entityName: '',
      entityType: 'partnership' as const,
      ordinaryIncome: 0,
      rentalIncome: 0,
      interestIncome: 0,
      dividendIncome: 0,
      capitalGains: 0,
      section199ADeduction: 0,
      charitableContributions: 0,
      section179Deduction: 0,
      credits: 0,
      taxesPaid: 0,
    };
    form.setValue('k1Items', [...currentItems, newItem]);
  };

  // K-1 항목 제거
  const removeK1Item = (index: number) => {
    const currentItems = form.watch('k1Items') || [];
    const updatedItems = currentItems.filter((_, i) => i !== index);
    form.setValue('k1Items', updatedItems);
  };

  // 실시간 계산
  useEffect(() => {
    const subscription = form.watch(() => {
      calculateNetIncome();
      calculateTotalK1Income();
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (data: BusinessExpenseForm) => {
    try {
      // 사업 지출 및 K-1 데이터 저장
      const totalBusinessIncome = data.netIncome + data.totalK1Income;
      await updateTaxData({
        income: {
          ...taxData.income,
          businessExpense: data,
          businessIncome: totalBusinessIncome, // Schedule C + K-1 합계
        },
      });

      toast({
        title: "저장 완료",
        description: "사업 순소득 정보가 성공적으로 저장되었습니다.",
      });

      // 소득 페이지로 돌아가기
      setLocation('/income');
    } catch (error) {
      console.error('사업 순소득 저장 오류:', error);
      toast({
        title: "저장 실패",
        description: "사업 순소득 정보 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const expenseCategories = [
    { key: 'advertising', label: '광고비 (Advertising)' },
    { key: 'carAndTruck', label: '차량비 (Car and Truck Expenses)' },
    { key: 'commissions', label: '수수료 (Commissions and Fees)' },
    { key: 'contractLabor', label: '계약직 인건비 (Contract Labor)' },
    { key: 'depletion', label: '고갈비 (Depletion)' },
    { key: 'depreciation', label: '감가상각비 (Depreciation)' },
    { key: 'employeeBenefits', label: '직원 복리후생비 (Employee Benefit Programs)' },
    { key: 'insurance', label: '보험료 (Insurance)' },
    { key: 'interest', label: '이자비용 (Interest)' },
    { key: 'legal', label: '법무비 (Legal and Professional Services)' },
    { key: 'meals', label: '식비 (Meals)' },
    { key: 'office', label: '사무용품비 (Office Expenses)' },
    { key: 'pension', label: '퇴직연금 (Pension and Profit-sharing Plans)' },
    { key: 'rent', label: '임대료 (Rent or Lease)' },
    { key: 'repairs', label: '수리비 (Repairs and Maintenance)' },
    { key: 'supplies', label: '소모품비 (Supplies)' },
    { key: 'taxes', label: '세금 (Taxes and Licenses)' },
    { key: 'travel', label: '여행비 (Travel)' },
    { key: 'utilities', label: '공과금 (Utilities)' },
    { key: 'wages', label: '급여 (Wages)' },
    { key: 'other', label: '기타 지출 (Other Expenses)' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation('/income')}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          소득 페이지로 돌아가기
        </Button>
        
        <h1 className="text-3xl font-bold text-primary-dark mb-2">사업 순소득 계산기</h1>
        <p className="text-gray-600">
          Schedule C 사업 소득과 지출을 입력하여 순소득을 계산하세요.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* 총 수입 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                사업 총수입 (Gross Income)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="grossIncome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>총 수입 (Gross Receipts or Sales)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="사업 총수입 금액"
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

          {/* 사업 지출 */}
          <Card>
            <CardHeader>
              <CardTitle>사업 지출 (Business Expenses)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {expenseCategories.map((category) => (
                  <FormField
                    key={category.key}
                    control={form.control}
                    name={`expenses.${category.key}` as any}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{category.label}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
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
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Schedule K-1 섹션 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Schedule K-1 (파트너십/S-Corporation/신탁 소득)</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addK1Item}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  K-1 추가
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {form.watch('k1Items').length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>K-1 양식이 없습니다.</p>
                  <p className="text-sm mt-2">파트너십, S-Corporation, 또는 신탁에서 받은 K-1 양식이 있다면 위의 버튼을 눌러 추가하세요.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {form.watch('k1Items').map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-lg">K-1 #{index + 1}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeK1Item(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`k1Items.${index}.entityName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>엔터티 명칭 (Entity Name)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="회사 또는 파트너십 이름"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`k1Items.${index}.entityType`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>엔터티 유형 (Entity Type)</FormLabel>
                              <FormControl>
                                <select
                                  {...field}
                                  className="w-full p-2 border rounded-md"
                                >
                                  <option value="partnership">파트너십 (Partnership)</option>
                                  <option value="scorp">S-Corporation</option>
                                  <option value="trust">신탁 (Trust)</option>
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`k1Items.${index}.ordinaryIncome`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>경상소득 (Ordinary Business Income)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
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
                          name={`k1Items.${index}.rentalIncome`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>임대소득 (Rental Income)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
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
                          name={`k1Items.${index}.interestIncome`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>이자소득 (Interest Income)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
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
                          name={`k1Items.${index}.dividendIncome`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>배당소득 (Dividend Income)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
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
                          name={`k1Items.${index}.capitalGains`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>자본이익 (Capital Gains)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
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
                          name={`k1Items.${index}.section199ADeduction`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Section 199A 공제 (QBI Deduction)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
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
                      
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm font-medium text-blue-800">
                          이 K-1의 총 소득: ${((item.ordinaryIncome || 0) + (item.rentalIncome || 0) + (item.interestIncome || 0) + (item.dividendIncome || 0) + (item.capitalGains || 0)).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 계산 결과 */}
          <Card>
            <CardHeader>
              <CardTitle>계산 결과 (Calculation Results)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium">총 수입 (Gross Income)</span>
                  <span className="text-xl font-semibold">
                    ${form.watch('grossIncome').toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium">총 지출 (Total Expenses)</span>
                  <span className="text-xl font-semibold text-red-600">
                    -${calculateTotalExpenses().toLocaleString()}
                  </span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <span className="font-semibold text-green-800">Schedule C 순소득 (Net Income)</span>
                  <span className="text-2xl font-bold text-green-700">
                    ${calculateNetIncome().toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <span className="font-semibold text-blue-800">K-1 총소득 (Total K-1 Income)</span>
                  <span className="text-2xl font-bold text-blue-700">
                    ${calculateTotalK1Income().toLocaleString()}
                  </span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <span className="font-semibold text-purple-800">총 사업소득 (Total Business Income)</span>
                  <span className="text-2xl font-bold text-purple-700">
                    ${(calculateNetIncome() + calculateTotalK1Income()).toLocaleString()}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mt-2">
                  * 이 총 사업소득이 소득 페이지의 사업소득 필드에 자동으로 입력됩니다.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 저장 및 돌아가기 버튼 */}
          <div className="flex gap-4 justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/income')}
            >
              취소
            </Button>
            <Button type="submit" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              저장하고 돌아가기
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}