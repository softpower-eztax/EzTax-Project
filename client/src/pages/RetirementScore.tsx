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
  CrownIcon
} from "lucide-react";

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
}

export default function RetirementScore() {
  const { taxData } = useTaxContext();
  const [, navigate] = useLocation();
  const [analysis, setAnalysis] = useState<RetirementAnalysis | null>(null);
  const [showPremiumOffer, setShowPremiumOffer] = useState(false);

  // Get current age from tax data
  const getCurrentAge = () => {
    if (taxData.personalInfo?.dateOfBirth) {
      const birthDate = new Date(taxData.personalInfo.dateOfBirth);
      const today = new Date();
      return today.getFullYear() - birthDate.getFullYear();
    }
    return 30; // Default
  };

  const form = useForm<RetirementFormData>({
    resolver: zodResolver(retirementFormSchema),
    defaultValues: {
      currentAge: getCurrentAge(),
      expectedRetirementAge: 65,
      currentSavings: 0,
      monthlyContribution: 0,
      expectedAnnualReturn: 7,
      desiredRetirementIncome: 60000
    }
  });

  const calculateRetirementScore = (data: RetirementFormData): RetirementAnalysis => {
    const yearsToRetirement = data.expectedRetirementAge - data.currentAge;
    const monthsToRetirement = yearsToRetirement * 12;
    const monthlyReturn = data.expectedAnnualReturn / 100 / 12;
    
    // Calculate future value of current savings
    const futureValueCurrent = data.currentSavings * Math.pow(1 + data.expectedAnnualReturn / 100, yearsToRetirement);
    
    // Calculate future value of monthly contributions
    const futureValueContributions = data.monthlyContribution * 
      ((Math.pow(1 + monthlyReturn, monthsToRetirement) - 1) / monthlyReturn);
    
    const totalProjected = futureValueCurrent + futureValueContributions;
    
    // Estimate needed retirement fund (25x annual income rule)
    const neededForRetirement = data.desiredRetirementIncome * 25;
    
    const additionalNeeded = Math.max(0, neededForRetirement - totalProjected);
    const monthlyNeeded = additionalNeeded > 0 ? 
      (additionalNeeded / ((Math.pow(1 + monthlyReturn, monthsToRetirement) - 1) / monthlyReturn)) : 0;
    
    // Calculate score (0-100)
    const readinessRatio = totalProjected / neededForRetirement;
    let score = Math.min(100, readinessRatio * 100);
    
    // Adjust score based on factors
    if (yearsToRetirement < 10) score *= 0.9; // Penalty for late start
    if (data.monthlyContribution > data.desiredRetirementIncome * 0.15 / 12) score += 5; // Bonus for high savings rate
    
    score = Math.round(Math.max(0, Math.min(100, score)));
    
    // Generate recommendations
    const recommendations = [];
    const strengths = [];
    const concerns = [];
    
    if (score >= 80) {
      strengths.push("훌륭한 은퇴 준비 상태입니다!");
      recommendations.push("현재 전략을 유지하면서 세금 효율적인 계좌 활용을 극대화하세요");
    } else if (score >= 60) {
      strengths.push("양호한 은퇴 준비 기반이 있습니다");
      recommendations.push("월 저축액을 증가시키거나 더 적극적인 투자 전략을 고려하세요");
    } else {
      concerns.push("은퇴 준비가 부족한 상태입니다");
      recommendations.push("즉시 저축을 시작하고 Catch-up Contribution을 활용하세요");
    }
    
    if (data.currentAge >= 50) {
      recommendations.push("50세 이상 추가 기여금(Catch-up Contribution) 활용 가능");
    }
    
    if (additionalNeeded > 0) {
      recommendations.push("Roth IRA 추가 납입으로 세후 소득 증대");
      recommendations.push("HSA를 은퇴 저축 계좌로 활용");
    }
    
    return {
      score,
      projectedSavings: totalProjected,
      additionalNeeded,
      monthlyNeeded,
      recommendations,
      strengths,
      concerns
    };
  };

  const onSubmit = (data: RetirementFormData) => {
    const result = calculateRetirementScore(data);
    setAnalysis(result);
    
    // Show premium offer if score is below 70
    if (result.score < 70) {
      setTimeout(() => setShowPremiumOffer(true), 2000);
    }
  };

  const generateReport = () => {
    if (!analysis) return;
    
    const reportContent = `
은퇴 준비 점수 리포트
=====================

📊 현재 점수: ${analysis.score}점

💰 예상 은퇴 자금: $${analysis.projectedSavings.toLocaleString()}
💸 추가 필요 금액: $${analysis.additionalNeeded.toLocaleString()}
📅 월 추가 저축액: $${analysis.monthlyNeeded.toLocaleString()}

✅ 강점:
${analysis.strengths.map(s => `• ${s}`).join('\n')}

⚠️ 개선 영역:
${analysis.concerns.map(c => `• ${c}`).join('\n')}

💡 추천 전략:
${analysis.recommendations.map(r => `• ${r}`).join('\n')}

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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                            placeholder="30"
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
                        <FormLabel>예상 은퇴 나이</FormLabel>
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
                        <FormLabel>현재 은퇴 저축액 ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="50000"
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
                            placeholder="500"
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
                        <FormLabel>희망 연 은퇴 소득 ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="60000"
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
                        <FormLabel>예상 연 수익률 (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="7"
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

                <Button type="submit" className="w-full bg-primary hover:bg-primary-dark">
                  <TargetIcon className="h-4 w-4 mr-2" />
                  은퇴 점수 계산하기
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

          {/* Analysis Results */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUpIcon className="h-5 w-5" />
                  예상 은퇴 자금
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  ${analysis.projectedSavings.toLocaleString()}
                </div>
                <p className="text-gray-600">현재 계획대로 진행시 예상 금액</p>
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
            <Button onClick={generateReport} variant="outline" className="flex-1">
              <DownloadIcon className="h-4 w-4 mr-2" />
              리포트 다운로드
            </Button>
            <Button onClick={() => navigate('/review')} className="flex-1">
              세금 신고 완료하기
            </Button>
          </div>

          {/* Premium Offer */}
          {showPremiumOffer && (
            <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700">
                  <CrownIcon className="h-5 w-5" />
                  프리미엄 은퇴 최적화 리포트
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-700 mb-4">
                  더 상세한 분석과 개인화된 은퇴 전략이 필요하신가요?
                </p>
                <ul className="space-y-2 mb-4 text-sm">
                  <li>✓ 세금 최적화 은퇴 출금 전략</li>
                  <li>✓ 사회보장연금 최적화 방안</li>
                  <li>✓ 자산 배분 및 리밸런싱 가이드</li>
                  <li>✓ 상속세 최소화 전략</li>
                </ul>
                <div className="flex gap-3">
                  <Button className="bg-amber-600 hover:bg-amber-700">
                    $49에 프리미엄 리포트 받기
                  </Button>
                  <Button variant="outline" onClick={() => setShowPremiumOffer(false)}>
                    나중에
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}