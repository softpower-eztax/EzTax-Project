import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTaxContext } from "@/context/TaxContext";
import { useLocation } from "wouter";
import { useState } from "react";
import { 
  TrendingUpIcon, 
  PiggyBankIcon, 
  TargetIcon, 
  CheckCircleIcon,
  ArrowRightIcon,
  DownloadIcon,
  CrownIcon,
  RefreshCwIcon
} from "lucide-react";
import expertPhotoPath from "@assets/내이미지_1750444585639.jpg";

const retirementFormSchema = z.object({
  currentAge: z.number().min(18).max(100),
  expectedRetirementAge: z.number().min(50).max(85),
  currentSavings: z.number().min(0),
  monthlyContribution: z.number().min(0),
  expectedAnnualReturn: z.number().min(0).max(20).default(7),
  desiredRetirementIncome: z.number().min(0),
  // Financial health factors
  currentIncome: z.number().min(0),
  emergencyFund: z.number().min(0),
  totalDebt: z.number().min(0),
  // Healthcare considerations
  healthStatus: z.enum(['excellent', 'good', 'fair', 'poor']).default('good'),
  hasHealthInsurance: z.boolean().default(true),
  // Lifestyle factors
  homeOwnership: z.enum(['own_outright', 'mortgage', 'rent']).default('mortgage'),
  familyStatus: z.enum(['single', 'married', 'divorced', 'widowed']).default('single'),
  dependentsCount: z.number().min(0).default(0),
  // Risk tolerance
  investmentExperience: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']).default('moderate'),
  // Social Security
  expectedSocialSecurityBenefit: z.number().min(0).default(0),
  // Inflation consideration
  expectedInflationRate: z.number().min(0).max(10).default(3)
});

type RetirementFormData = z.infer<typeof retirementFormSchema>;

interface RetirementAnalysis {
  score: number;
  projectedSavings: number;
  additionalNeeded: number;
  monthlyNeeded: number;
  recommendations: string[];
  strengths: string[];
  concerns: string[];
  // Monte Carlo simulation results
  monteCarloResults?: {
    percentile5: number;    // 5% worst case
    percentile25: number;   // 25% below average
    percentile50: number;   // 50% median
    percentile75: number;   // 75% above average
    percentile95: number;   // 95% best case
    successProbability: number; // Probability of meeting retirement goal
    scenarios: number[];    // All simulation results
  };
}

export default function RetirementScore() {
  const { taxData } = useTaxContext();
  const [, navigate] = useLocation();
  const [analysis, setAnalysis] = useState<RetirementAnalysis | null>(null);
  const [showForm, setShowForm] = useState(true);

  // Get current age from tax data
  const getCurrentAge = () => {
    if (taxData.personalInfo?.dateOfBirth) {
      const birthDate = new Date(taxData.personalInfo.dateOfBirth);
      const today = new Date();
      return today.getFullYear() - birthDate.getFullYear();
    }
    return 30; // Default
  };

  // Monte Carlo simulation for retirement planning
  const runMonteCarloSimulation = (
    currentSavings: number,
    monthlyContribution: number,
    yearsToRetirement: number,
    expectedReturn: number,
    volatility: number = 0.15, // 15% standard deviation
    simulations: number = 10000
  ) => {
    const scenarios: number[] = [];
    
    for (let i = 0; i < simulations; i++) {
      let savings = currentSavings;
      
      for (let year = 0; year < yearsToRetirement; year++) {
        // Generate random return using normal distribution approximation
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const annualReturn = expectedReturn + (volatility * z0);
        
        // Add monthly contributions throughout the year
        savings += monthlyContribution * 12;
        
        // Apply annual return (can be negative in bad years)
        savings *= (1 + annualReturn);
        
        // Ensure savings don't go negative
        savings = Math.max(0, savings);
      }
      
      scenarios.push(savings);
    }
    
    // Sort scenarios to calculate percentiles
    scenarios.sort((a, b) => a - b);
    
    const getPercentile = (percentile: number) => {
      const index = Math.floor((percentile / 100) * scenarios.length);
      return scenarios[Math.min(index, scenarios.length - 1)];
    };
    
    return {
      percentile5: getPercentile(5),
      percentile25: getPercentile(25),
      percentile50: getPercentile(50),
      percentile75: getPercentile(75),
      percentile95: getPercentile(95),
      scenarios
    };
  };

  const form = useForm<RetirementFormData>({
    resolver: zodResolver(retirementFormSchema),
    defaultValues: {
      currentAge: getCurrentAge(),
      expectedRetirementAge: 65,
      currentSavings: 0,
      monthlyContribution: 0,
      expectedAnnualReturn: 6,
      desiredRetirementIncome: 60000,
      // Financial health factors
      currentIncome: taxData.income?.adjustedGrossIncome || 0,
      emergencyFund: 0,
      totalDebt: 0,
      // Healthcare considerations
      healthStatus: 'good',
      hasHealthInsurance: true,
      // Lifestyle factors
      homeOwnership: 'mortgage',
      familyStatus: taxData.personalInfo?.filingStatus?.includes('married') ? 'married' : 'single',
      dependentsCount: taxData.personalInfo?.dependents?.length || 0,
      // Risk tolerance
      investmentExperience: 'intermediate',
      riskTolerance: 'moderate',
      // Social Security
      expectedSocialSecurityBenefit: 0,
      // Inflation consideration
      expectedInflationRate: 3
    }
  });

  const calculateRetirementScore = (data: RetirementFormData): RetirementAnalysis => {
    // Step 1: 은퇴까지 남은 기간
    const yearsToRetirement = data.expectedRetirementAge - data.currentAge;
    const lifeExpectancy = 90; // Default life expectancy
    const yearsInRetirement = lifeExpectancy - data.expectedRetirementAge;
    
    // Step 2: 은퇴 후 필요한 자금 계산 (생활비의 80-90% 가정)
    const annualRetirementExpense = data.desiredRetirementIncome * 0.85; // 85% of desired income
    const totalNeededInRetirement = annualRetirementExpense * yearsInRetirement;
    
    // Step 3: Monte Carlo 시뮬레이션으로 은퇴 시점 예상 자산 추정
    const expectedReturn = data.expectedAnnualReturn / 100;
    const annualSaving = data.monthlyContribution * 12;
    
    // 몬테카를로 시뮬레이션 실행
    const monteCarloResults = runMonteCarloSimulation(
      data.currentSavings,
      data.monthlyContribution,
      yearsToRetirement,
      expectedReturn
    );
    
    // 목표 은퇴 자금 대비 성공 확률 계산 (4% 출금 규칙 기준)
    const targetRetirementFund = data.desiredRetirementIncome * 25;
    const successfulScenarios = monteCarloResults.scenarios.filter(s => s >= targetRetirementFund);
    const successProbability = (successfulScenarios.length / monteCarloResults.scenarios.length) * 100;
    
    // 중위값(50%ile)을 기본 예상값으로 사용
    const totalSavingsAtRetirement = monteCarloResults.percentile50;
    
    // Step 4: Social Security 포함 (월 수령액을 연간으로 변환 후 총 수령액 계산)
    const totalSocialSecurityIncome = data.expectedSocialSecurityBenefit * 12 * yearsInRetirement;
    const totalResourcesAtRetirement = totalSavingsAtRetirement + totalSocialSecurityIncome;
    
    // Step 5: 준비율 계산
    const preparednessRatio = totalResourcesAtRetirement / totalNeededInRetirement;
    
    // Step 6: 점수 변환 (Preparedness Ratio ➔ Score)
    let score = 0;
    if (preparednessRatio >= 1.0) {
      score = Math.min(100, 95 + (preparednessRatio - 1.0) * 5);
    } else if (preparednessRatio >= 0.8) {
      score = 85 + (preparednessRatio - 0.8) * 50;
    } else if (preparednessRatio >= 0.6) {
      score = 70 + (preparednessRatio - 0.6) * 75;
    } else if (preparednessRatio >= 0.4) {
      score = 50 + (preparednessRatio - 0.4) * 100;
    } else {
      score = preparednessRatio * 125;
    }
    
    // Additional score adjustments based on comprehensive factors
    let adjustmentFactor = 1.0;
    
    // Financial health adjustments
    const emergencyFundMonths = data.emergencyFund / (data.currentIncome / 12);
    if (emergencyFundMonths >= 6) adjustmentFactor += 0.05;
    else if (emergencyFundMonths < 3) adjustmentFactor -= 0.1;
    
    const debtToIncomeRatio = data.totalDebt / data.currentIncome;
    if (debtToIncomeRatio > 0.4) adjustmentFactor -= 0.15;
    else if (debtToIncomeRatio < 0.1) adjustmentFactor += 0.05;
    
    // Health and insurance adjustments
    if (!data.hasHealthInsurance) adjustmentFactor -= 0.2;
    if (data.healthStatus === 'poor') adjustmentFactor -= 0.1;
    else if (data.healthStatus === 'excellent') adjustmentFactor += 0.05;
    
    // Risk tolerance and experience adjustments
    if (data.investmentExperience === 'beginner' && data.riskTolerance === 'aggressive') {
      adjustmentFactor -= 0.1; // Mismatch penalty
    }
    if (data.investmentExperience === 'advanced' && data.riskTolerance === 'conservative') {
      adjustmentFactor -= 0.05; // Conservative but experienced
    }
    
    // Apply adjustments
    score = Math.round(Math.max(0, Math.min(100, score * adjustmentFactor)));
    
    const additionalNeeded = Math.max(0, totalNeededInRetirement - totalResourcesAtRetirement);
    const monthlyNeeded = additionalNeeded > 0 && yearsToRetirement > 0 ? 
      (additionalNeeded / ((Math.pow(1 + expectedReturn, yearsToRetirement) - 1) / expectedReturn)) / 12 : 0;
    
    // Generate comprehensive recommendations
    const recommendations = [];
    const strengths = [];
    const concerns = [];
    
    // Score-based feedback
    if (score >= 85) {
      strengths.push("훌륭한 은퇴 준비 상태입니다!");
      recommendations.push("현재 전략을 유지하면서 세금 효율적인 계좌 활용을 극대화하세요");
    } else if (score >= 70) {
      strengths.push("양호하지만 추가 저축 필요");
      if (additionalNeeded > 0) {
        recommendations.push(`연간 저축액 $${Math.round(monthlyNeeded * 12).toLocaleString()} 증가 필요`);
      }
    } else if (score >= 50) {
      concerns.push("은퇴 준비가 부족한 상태입니다");
      recommendations.push("Roth IRA 추가 납입 제안");
      if (yearsToRetirement > 5) {
        recommendations.push("은퇴 목표를 2-3년 늦추는 대안 제시");
      }
    } else {
      concerns.push("즉시 적극적인 은퇴 준비가 필요합니다");
      recommendations.push("전문가 상담을 통한 종합적인 계획 수립");
    }
    
    // Specific factor-based recommendations
    if (data.currentAge >= 50) {
      recommendations.push("50세 이상 추가 기여금(Catch-up Contribution) 활용 가능");
    }
    
    if (emergencyFundMonths < 6) {
      recommendations.push("비상 자금을 6개월 생활비로 우선 확보");
    }
    
    if (debtToIncomeRatio > 0.3) {
      recommendations.push("고금리 부채 상환을 우선 진행");
    }
    
    if (!data.hasHealthInsurance) {
      concerns.push("건강보험 가입이 시급합니다");
    }
    
    if (data.homeOwnership === 'rent') {
      recommendations.push("주택 구매를 통한 자산 형성 고려");
    }
    
    return {
      score,
      projectedSavings: totalSavingsAtRetirement,
      additionalNeeded,
      monthlyNeeded,
      recommendations,
      strengths,
      concerns,
      monteCarloResults: {
        ...monteCarloResults,
        successProbability
      }
    };
  };

  const onSubmit = (data: RetirementFormData) => {
    const result = calculateRetirementScore(data);
    setAnalysis(result);
  };

  const generateReport = () => {
    if (!analysis) return;
    
    const reportContent = `
은퇴 준비 점수 리포트 (몬테카를로 시뮬레이션 포함)
=====================================================

📊 현재 점수: ${analysis.score}점

🎯 몬테카를로 시뮬레이션 결과 (10,000가지 시나리오 분석):
• 최악의 경우 (5%): $${analysis.monteCarloResults?.percentile5.toLocaleString() || 'N/A'}
• 하위 25%: $${analysis.monteCarloResults?.percentile25.toLocaleString() || 'N/A'}
• 중위값 (50%): $${analysis.monteCarloResults?.percentile50.toLocaleString() || 'N/A'}
• 상위 25%: $${analysis.monteCarloResults?.percentile75.toLocaleString() || 'N/A'}
• 최고의 경우 (95%): $${analysis.monteCarloResults?.percentile95.toLocaleString() || 'N/A'}

🎲 은퇴 목표 달성 확률: ${analysis.monteCarloResults?.successProbability.toFixed(1) || 'N/A'}%

💰 예상 은퇴 자금 (중위값): $${analysis.projectedSavings.toLocaleString()}
💸 추가 필요 금액: $${analysis.additionalNeeded.toLocaleString()}
📅 월 추가 저축액: $${analysis.monthlyNeeded.toLocaleString()}

✅ 강점:
${analysis.strengths.map(s => `• ${s}`).join('\n')}

⚠️ 개선 영역:
${analysis.concerns.map(c => `• ${c}`).join('\n')}

💡 추천 전략:
${analysis.recommendations.map(r => `• ${r}`).join('\n')}

📈 시뮬레이션 해석:
• 시장 변동성을 고려한 확률적 분석 결과입니다
• 중위값은 50% 확률로 달성 가능한 현실적 목표입니다
• 최악의 경우도 대비하여 위험 관리 전략을 수립하세요

Generated by EzTax - ${new Date().toLocaleDateString()}
    `;
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'retirement-score-report.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <TrendingUpIcon className="h-8 w-8 text-primary" />
          은퇴 준비 상태 진단 (무료)
        </h1>
        <p className="text-gray-600">
          간단한 질문으로 당신의 은퇴 준비 점수를 확인하고 맞춤 전략을 받아보세요
        </p>
      </div>

      {!analysis ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiggyBankIcon className="h-5 w-5" />
              은퇴 계획 정보 입력
            </CardTitle>
            <CardDescription>
              현재 상황과 목표를 입력해 주세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">기본 정보</TabsTrigger>
                    <TabsTrigger value="financial">재정 상태</TabsTrigger>
                    <TabsTrigger value="lifestyle">생활 환경</TabsTrigger>
                    <TabsTrigger value="investment">투자 성향</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="currentAge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>현재 나이</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="45"
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
                        name="expectedRetirementAge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>희망 은퇴 나이</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="65"
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
                        name="currentSavings"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>현재 총 저축액 ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="401k, IRA, 예금 등 합산"
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
                        name="monthlyContribution"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>월 저축액 ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="매월 추가 저축 금액"
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
                        name="desiredRetirementIncome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>은퇴 후 예상 생활비 ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="연간 필요 생활비"
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
                        name="expectedAnnualReturn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>예상 연 투자수익률 (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="5-6% 보수적 가정"
                                step="0.1"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="financial" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="currentIncome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>현재 연소득 ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="세후 소득"
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
                        name="emergencyFund"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>비상 자금 ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="6개월 생활비 권장"
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
                        name="totalDebt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>총 부채 ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="모기지 제외 부채"
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
                        name="expectedSocialSecurityBenefit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>예상 Social Security 연금 (월 수령액 $)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="월 예상 수령액 (예: 2000)"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <div className="text-xs text-blue-600 mt-1">
                              💡 <strong>추정 방법:</strong><br/>
                              • <a href="https://www.ssa.gov/myaccount/" target="_blank" className="underline">SSA.gov</a>에서 정확한 예상액 확인 (권장)<br/>
                              • 간단 추정: 현재 연봉 × 0.4 ÷ 12 (예: $60K 연봉 = $2,000/월)<br/>
                              • 평균 수령액: $1,800/월 (2024년 기준)
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="lifestyle" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="healthStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>건강 상태</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="건강 상태 선택" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="excellent">매우 좋음</SelectItem>
                                <SelectItem value="good">좋음</SelectItem>
                                <SelectItem value="fair">보통</SelectItem>
                                <SelectItem value="poor">나쁨</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="hasHealthInsurance"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>건강보험 가입</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="homeOwnership"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>주거 상태</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="주거 상태 선택" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="own_outright">자가 (완전 소유)</SelectItem>
                                <SelectItem value="mortgage">자가 (모기지)</SelectItem>
                                <SelectItem value="rent">임대</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="familyStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>가족 상태</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="가족 상태 선택" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="single">미혼</SelectItem>
                                <SelectItem value="married">기혼</SelectItem>
                                <SelectItem value="divorced">이혼</SelectItem>
                                <SelectItem value="widowed">사별</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dependentsCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>부양가족 수</FormLabel>
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
                  </TabsContent>

                  <TabsContent value="investment" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="investmentExperience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>투자 경험</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="투자 경험 선택" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="beginner">초급 (1-2년)</SelectItem>
                                <SelectItem value="intermediate">중급 (3-7년)</SelectItem>
                                <SelectItem value="advanced">고급 (8년 이상)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="riskTolerance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>위험 성향</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="위험 성향 선택" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="conservative">보수적 (안정성 중시)</SelectItem>
                                <SelectItem value="moderate">균형형 (중간 위험)</SelectItem>
                                <SelectItem value="aggressive">공격적 (고수익 추구)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="expectedInflationRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>예상 물가상승률 (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="3"
                                step="0.1"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <Button type="submit" className="w-full bg-primary hover:bg-primary-dark">
                  <TargetIcon className="h-4 w-4 mr-2" />
                  종합 은퇴 점수 계산하기
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Score Display */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                현재 은퇴 준비 점수
              </CardTitle>
              <div className="text-5xl font-bold text-primary my-4">
                {analysis.score}점
              </div>
              <Progress value={analysis.score} className="w-full max-w-md mx-auto" />
            </CardHeader>
          </Card>

          {/* Monte Carlo Simulation Results */}
          {analysis.monteCarloResults && (
            <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  📊 몬테카를로 시뮬레이션 결과
                </CardTitle>
                <CardDescription className="text-purple-600">
                  10,000가지 시나리오를 분석한 확률적 예측
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                      <div className="text-xs text-red-600 font-medium">최악 5%</div>
                      <div className="text-lg font-bold text-red-700">
                        ${analysis.monteCarloResults.percentile5.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <div className="text-xs text-orange-600 font-medium">하위 25%</div>
                      <div className="text-lg font-bold text-orange-700">
                        ${analysis.monteCarloResults.percentile25.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="text-xs text-blue-600 font-medium">중위값 50%</div>
                      <div className="text-lg font-bold text-blue-700">
                        ${analysis.monteCarloResults.percentile50.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="text-xs text-green-600 font-medium">상위 25%</div>
                      <div className="text-lg font-bold text-green-700">
                        ${analysis.monteCarloResults.percentile75.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                      <div className="text-xs text-emerald-600 font-medium">최고 5%</div>
                      <div className="text-lg font-bold text-emerald-700">
                        ${analysis.monteCarloResults.percentile95.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/80 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">은퇴 목표 달성 확률</span>
                      <span className="text-2xl font-bold text-primary">
                        {analysis.monteCarloResults.successProbability.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={analysis.monteCarloResults.successProbability} className="h-2" />
                    <p className="text-sm text-gray-600 mt-2">
                      {analysis.monteCarloResults.successProbability >= 80 ? 
                        "매우 높은 성공 확률" : 
                        analysis.monteCarloResults.successProbability >= 60 ?
                        "적정 수준의 성공 확률" :
                        "성공 확률 개선 필요"
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Results */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUpIcon className="h-5 w-5" />
                  예상 은퇴 자금 (중위값)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  ${analysis.projectedSavings.toLocaleString()}
                </div>
                <p className="text-gray-600">50% 확률로 달성 가능한 금액</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TargetIcon className="h-5 w-5" />
                  추가 필요 금액
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  ${analysis.additionalNeeded.toLocaleString()}
                </div>
                <p className="text-gray-600">
                  월 ${analysis.monthlyNeeded.toLocaleString()} 추가 저축 필요
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PiggyBankIcon className="h-5 w-5" />
                  준비율
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {((analysis.projectedSavings / (form.getValues('desiredRetirementIncome') * 0.85 * 25)) * 100).toFixed(1)}%
                </div>
                <p className="text-gray-600">은퇴 후 필요 자금 대비 준비율</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analysis */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>재정 건강도 분석</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>비상 자금:</span>
                  <Badge variant={form.getValues('emergencyFund') >= (form.getValues('currentIncome') / 2) ? 'default' : 'destructive'}>
                    {(form.getValues('emergencyFund') / (form.getValues('currentIncome') / 12)).toFixed(1)}개월분
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>부채 비율:</span>
                  <Badge variant={(form.getValues('totalDebt') / form.getValues('currentIncome')) < 0.3 ? 'default' : 'destructive'}>
                    {((form.getValues('totalDebt') / form.getValues('currentIncome')) * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>저축률:</span>
                  <Badge variant={(form.getValues('monthlyContribution') * 12 / form.getValues('currentIncome')) >= 0.15 ? 'default' : 'secondary'}>
                    {((form.getValues('monthlyContribution') * 12 / form.getValues('currentIncome')) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>라이프스타일 요인</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>건강 상태:</span>
                  <Badge variant={form.getValues('healthStatus') === 'excellent' || form.getValues('healthStatus') === 'good' ? 'default' : 'secondary'}>
                    {form.getValues('healthStatus') === 'excellent' ? '매우 좋음' : 
                     form.getValues('healthStatus') === 'good' ? '좋음' :
                     form.getValues('healthStatus') === 'fair' ? '보통' : '나쁨'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>건강보험:</span>
                  <Badge variant={form.getValues('hasHealthInsurance') ? 'default' : 'destructive'}>
                    {form.getValues('hasHealthInsurance') ? '가입' : '미가입'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>주거 상태:</span>
                  <Badge variant="secondary">
                    {form.getValues('homeOwnership') === 'own_outright' ? '자가(완전소유)' :
                     form.getValues('homeOwnership') === 'mortgage' ? '자가(모기지)' : '임대'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>부양가족:</span>
                  <Badge variant="secondary">
                    {form.getValues('dependentsCount')}명
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Strengths */}
          {analysis.strengths.length > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircleIcon className="h-5 w-5" />
                  강점
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-green-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Concerns */}
          {analysis.concerns.length > 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertDescription className="text-orange-700">
                <strong>개선이 필요한 영역:</strong>
                <ul className="mt-2 space-y-1">
                  {analysis.concerns.map((concern, index) => (
                    <li key={index}>• {concern}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUpIcon className="h-5 w-5" />
                맞춤 추천 전략
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {analysis.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <ArrowRightIcon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={() => {
              setAnalysis(null);
              setShowForm(true);
              form.reset();
            }} variant="outline" className="flex-1">
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              다시 계산하기
            </Button>
            <Button onClick={() => navigate('/review')} className="flex-1">
              세금 신고 완료하기
            </Button>
          </div>

          {/* Expert Introduction */}
          {analysis.score < 80 && (
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <CrownIcon className="h-5 w-5" />
                  전문가 상담 추천
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <img 
                      src={expertPhotoPath}
                      alt="지대현 EA/RIA"
                      className="w-24 h-24 rounded-full object-cover border-2 border-blue-200"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-blue-800 mb-2">
                      지대현 EA / RIA
                    </h3>
                    <p className="text-blue-700 font-medium mb-3">
                      미국 세무·투자 전문가 | 『절세로 시작하는 은퇴설계 Less Tax, Better Retirement』 저자
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-semibold text-blue-800 mb-2">📚 주요 이력</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>💼 EzTax – 창립자 & CEO</li>
                          <li>📈 Nomura Securities – 애널리스트</li>
                          <li>🏦 교보생명 – 재무실부장</li>
                          <li>🏢 LG전자 – IR팀장</li>
                          <li>🏭 한화그룹 – 전략기획 및 재무담당 임원</li>
                          <li>🧾 IRS 공인 EA (Enrolled Agent)</li>
                          <li>📊 SEC 등록 투자자문인 (RIA)</li>
                        </ul>
                        
                        <h4 className="font-semibold text-blue-800 mb-2 mt-3">🎓 학력</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>🎓 University of Pennsylvania – 경제학 학사</li>
                          <li>🎓 연세대학교 국제대학원 – MBA</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-blue-800 mb-2">🧠 전문 분야</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• 미국 개인 및 사업자 세무 상담</li>
                          <li>• 자산관리 및 은퇴 플랜 최적화</li>
                          <li>• 투자전략수립, 자산운용</li>
                          <li>• 고액자산가 맞춤 절세 전략</li>
                          <li>• 해외자산 및 글로벌 세무 규정 대응</li>
                          <li>• 투자수익 대비 실효세율 분석</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-white/50 p-4 rounded-lg mb-4">
                      <p className="text-blue-800 text-sm leading-relaxed">
                        <strong>📌 프로필 요약:</strong> 지대현은 미국 연방 국세청(IRS) 공인 EA이며, 등록 투자자문인(RIA)으로 활동하고 있습니다. 
                        국내외 유수의 금융·기업 그룹에서 재무 및 IR 책임자로 경력을 쌓았으며, 풍부한 실무경험과 통찰을 바탕으로 
                        <strong>세금 절감(Tax Minimization)</strong>과 <strong>부의 극대화(Wealth Maximization)</strong> 전략을 제시합니다.
                      </p>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        전문가 상담 예약하기
                      </Button>
                      <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                        더 알아보기
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}