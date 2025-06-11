import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useTaxContext } from "@/context/TaxContext";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, PiggyBankIcon, TrendingUpIcon } from "lucide-react";
import { useState, useEffect } from "react";

// 2025 IRS Contribution Limits
const CONTRIBUTION_LIMITS_2025 = {
  traditionalIRA: { under50: 7000, over50: 8000 },
  rothIRA: { under50: 7000, over50: 8000 },
  plan401k: { under50: 23500, over50: 31000 },
  plan403b: { under50: 23500, over50: 31000 },
  plan457: { under50: 23500, over50: 31000 },
  simpleIRA: { under50: 16000, over50: 19500 },
  sepIRA: { lesserOf: "25% of compensation or $70,000" },
  able: 15000,
  tsp: { under50: 23500, over50: 31000 }
};

const retirementSchema = z.object({
  traditionalIRA: z.number().min(0).max(8000),
  rothIRA: z.number().min(0).max(8000),
  plan401k: z.number().min(0).max(31000),
  plan403b: z.number().min(0).max(31000),
  plan457: z.number().min(0).max(31000),
  simpleIRA: z.number().min(0).max(19500),
  sepIRA: z.number().min(0).max(70000),
  able: z.number().min(0).max(15000),
  tsp: z.number().min(0).max(31000),
  otherRetirementPlans: z.number().min(0),
});

type RetirementFormData = z.infer<typeof retirementSchema>;

export default function RetirementContributions() {
  const { taxData, updateTaxData } = useTaxContext();
  const [, navigate] = useLocation();
  const [userAge, setUserAge] = useState(25);
  const [estimatedCredit, setEstimatedCredit] = useState(0);

  // Calculate user age from date of birth
  useEffect(() => {
    if (taxData.personalInfo?.dateOfBirth) {
      const birthDate = new Date(taxData.personalInfo.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      setUserAge(age);
    }
  }, [taxData.personalInfo?.dateOfBirth]);

  const form = useForm<RetirementFormData>({
    resolver: zodResolver(retirementSchema),
    defaultValues: {
      traditionalIRA: taxData.retirementContributions?.traditionalIRA || 0,
      rothIRA: taxData.retirementContributions?.rothIRA || 0,
      plan401k: taxData.retirementContributions?.plan401k || 0,
      plan403b: taxData.retirementContributions?.plan403b || 0,
      plan457: taxData.retirementContributions?.plan457 || 0,
      simpleIRA: taxData.retirementContributions?.simpleIRA || 0,
      sepIRA: taxData.retirementContributions?.sepIRA || 0,
      able: taxData.retirementContributions?.able || 0,
      tsp: taxData.retirementContributions?.tsp || 0,
      otherRetirementPlans: taxData.retirementContributions?.otherRetirementPlans || 0,
    },
  });

  // Calculate Saver's Credit eligibility
  useEffect(() => {
    const watchedValues = form.watch();
    const totalDeductibleContributions = 
      watchedValues.traditionalIRA + 
      watchedValues.plan401k + 
      watchedValues.plan403b + 
      watchedValues.plan457 + 
      watchedValues.simpleIRA + 
      watchedValues.sepIRA + 
      watchedValues.tsp;

    const agi = taxData.income?.adjustedGrossIncome || 0;
    let creditRate = 0;

    // 2025 Saver's Credit income thresholds
    if (taxData.personalInfo?.filingStatus === 'married_joint') {
      if (agi <= 46000) creditRate = 0.50;
      else if (agi <= 50000) creditRate = 0.20;
      else if (agi <= 77000) creditRate = 0.10;
    } else {
      if (agi <= 23000) creditRate = 0.50;
      else if (agi <= 25000) creditRate = 0.20;
      else if (agi <= 38500) creditRate = 0.10;
    }

    const maxCreditableAmount = Math.min(totalDeductibleContributions, 2000);
    setEstimatedCredit(maxCreditableAmount * creditRate);
  }, [form.watch, taxData.income?.adjustedGrossIncome, taxData.personalInfo?.filingStatus]);

  const onSubmit = async (data: RetirementFormData) => {
    const totalContributions = Object.values(data).reduce((sum, value) => sum + value, 0);
    
    const retirementContributions = {
      ...data,
      totalContributions,
    };

    // Update adjustments to include retirement contributions in AGI calculation
    const updatedAdjustments = {
      ...taxData.income?.adjustments,
      retirementContributions: data.traditionalIRA + data.plan401k + data.plan403b + 
                               data.plan457 + data.simpleIRA + data.sepIRA + data.tsp
    };

    // Recalculate AGI
    const totalIncome = taxData.income?.totalIncome || 0;
    const totalAdjustments = Object.values(updatedAdjustments).reduce((sum, value) => sum + value, 0);
    const adjustedGrossIncome = Math.max(0, totalIncome - totalAdjustments);

    await updateTaxData({
      retirementContributions,
      income: {
        ...taxData.income,
        adjustments: updatedAdjustments,
        adjustedGrossIncome,
      }
    });

    navigate('/deductions');
  };

  const getLimit = (planType: keyof typeof CONTRIBUTION_LIMITS_2025, isOver50: boolean = userAge >= 50) => {
    const limit = CONTRIBUTION_LIMITS_2025[planType];
    if (typeof limit === 'object' && 'under50' in limit) {
      return isOver50 ? limit.over50 : limit.under50;
    }
    return limit;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          은퇴 계획 기여금 (Retirement Plan Contributions)
        </h1>
        <p className="text-gray-600">
          세금 혜택을 받을 수 있는 은퇴 계획 기여금을 입력하세요
        </p>
      </div>

      {estimatedCredit > 0 && (
        <Alert className="bg-green-50 border-green-200">
          <TrendingUpIcon className="h-4 w-4" />
          <AlertDescription>
            <strong>세이버즈 크레딧 예상액: ${estimatedCredit.toFixed(0)}</strong>
            <br />
            귀하의 소득 수준에서 은퇴 기여금에 대한 세금 크레딧을 받을 수 있습니다.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Tax-Deductible Retirement Plans */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBankIcon className="h-5 w-5" />
                세금 공제 가능한 은퇴 계획 (Tax-Deductible Plans)
              </CardTitle>
              <CardDescription>
                이 기여금들은 조정총소득(AGI)을 줄여 세금을 절약합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="traditionalIRA"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex justify-between">
                        전통적 IRA (Traditional IRA)
                        <Badge variant="outline">
                          한도: ${getLimit('traditionalIRA').toLocaleString()}
                        </Badge>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plan401k"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex justify-between">
                        401(k) 플랜
                        <Badge variant="outline">
                          한도: ${getLimit('plan401k').toLocaleString()}
                        </Badge>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plan403b"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex justify-between">
                        403(b) 플랜
                        <Badge variant="outline">
                          한도: ${getLimit('plan403b').toLocaleString()}
                        </Badge>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plan457"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex justify-between">
                        457 플랜
                        <Badge variant="outline">
                          한도: ${getLimit('plan457').toLocaleString()}
                        </Badge>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="simpleIRA"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex justify-between">
                        SIMPLE IRA
                        <Badge variant="outline">
                          한도: ${getLimit('simpleIRA').toLocaleString()}
                        </Badge>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sepIRA"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex justify-between">
                        SEP-IRA
                        <Badge variant="outline">
                          한도: $70,000
                        </Badge>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tsp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex justify-between">
                        TSP (연방직원)
                        <Badge variant="outline">
                          한도: ${getLimit('tsp').toLocaleString()}
                        </Badge>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tax-Free Growth Plans */}
          <Card>
            <CardHeader>
              <CardTitle>세후 기여금 (After-Tax Contributions)</CardTitle>
              <CardDescription>
                이 기여금들은 현재 세금 공제는 없지만 향후 성장분이 비과세입니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rothIRA"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex justify-between">
                        로스 IRA (Roth IRA)
                        <Badge variant="outline">
                          한도: ${getLimit('rothIRA').toLocaleString()}
                        </Badge>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="able"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex justify-between">
                        ABLE 계정
                        <Badge variant="outline">
                          한도: $15,000
                        </Badge>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Other Retirement Plans */}
          <Card>
            <CardHeader>
              <CardTitle>기타 은퇴 계획 (Other Retirement Plans)</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="otherRetirementPlans"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>기타 은퇴 계획 기여금</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-blue-50">
            <CardHeader>
              <CardTitle>기여금 요약 (Contribution Summary)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>세금 공제 가능한 기여금:</span>
                  <span className="font-semibold">
                    ${(form.watch('traditionalIRA') + form.watch('plan401k') + 
                      form.watch('plan403b') + form.watch('plan457') + 
                      form.watch('simpleIRA') + form.watch('sepIRA') + 
                      form.watch('tsp')).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>세후 기여금:</span>
                  <span className="font-semibold">
                    ${(form.watch('rothIRA') + form.watch('able')).toLocaleString()}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>총 은퇴 기여금:</span>
                  <span>
                    ${Object.values(form.watch()).reduce((sum, val) => sum + val, 0).toLocaleString()}
                  </span>
                </div>
                {estimatedCredit > 0 && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>예상 세이버즈 크레딧:</span>
                    <span>${estimatedCredit.toFixed(0)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/additional-adjustments')}
            >
              이전 단계 (Previous)
            </Button>
            <Button type="submit">
              다음 단계 (Next: Deductions)
            </Button>
          </div>
        </form>
      </Form>

      {/* Information Alert */}
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          <strong>참고사항:</strong> 은퇴 계획 기여금 한도는 2025년 IRS 규정에 따릅니다. 
          50세 이상인 경우 추가 기여금(catch-up contributions)이 허용됩니다. 
          실제 한도는 소득 수준과 고용주 계획에 따라 달라질 수 있습니다.
        </AlertDescription>
      </Alert>
    </div>
  );
}