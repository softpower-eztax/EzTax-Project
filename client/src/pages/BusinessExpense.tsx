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

  // 실시간 계산
  useEffect(() => {
    const subscription = form.watch(() => {
      calculateNetIncome();
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (data: BusinessExpenseForm) => {
    try {
      // 사업 지출 데이터 저장
      await updateTaxData({
        income: {
          ...taxData.income,
          businessExpense: data,
          businessIncome: data.netIncome, // 순소득을 사업소득으로 업데이트
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
                  <span className="font-semibold text-green-800">순소득 (Net Income)</span>
                  <span className="text-2xl font-bold text-green-700">
                    ${calculateNetIncome().toLocaleString()}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mt-2">
                  * 이 순소득이 소득 페이지의 사업소득 필드에 자동으로 입력됩니다.
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