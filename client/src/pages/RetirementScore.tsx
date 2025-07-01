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
import { useTaxContext } from "@/context/TaxContext";
import { useLocation } from "wouter";
import { useState } from "react";
import { 
  TrendingUpIcon, 
  PiggyBankIcon, 
  TargetIcon, 
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  RefreshCwIcon,
  ChevronRightIcon,
  ChevronLeftIcon
} from "lucide-react";

const retirementFormSchema = z.object({
  // 기본 정보
  currentAge: z.number().min(18).max(100),
  expectedRetirementAge: z.number().min(50).max(85),
  currentSavings: z.number().min(0),
  monthlyContribution: z.number().min(0),
  desiredRetirementIncome: z.number().min(0),
  expectedAnnualReturn: z.number().min(0).max(20).default(7),
  
  // 재정 상태
  currentIncome: z.number().min(0),
  emergencyFund: z.number().min(0),
  totalDebt: z.number().min(0),
  expectedSocialSecurityBenefit: z.number().min(0).default(0),
  
  // 생활 환경
  healthStatus: z.enum(['excellent', 'good', 'fair', 'poor']).default('good'),
  hasHealthInsurance: z.boolean().default(true),
  homeOwnership: z.enum(['own_outright', 'mortgage', 'rent']).default('mortgage'),
  familyStatus: z.enum(['single', 'married', 'divorced', 'widowed']).default('single'),
  dependentsCount: z.number().min(0).default(0),
  
  // 투자 성향
  investmentExperience: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']).default('moderate'),
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

export default function RetirementScoreStepByStep() {
  const { taxData } = useTaxContext();
  const [, navigate] = useLocation();
  const [analysis, setAnalysis] = useState<RetirementAnalysis | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([false, false, false, false]);
  const [showSSCalculator, setShowSSCalculator] = useState(false);
  
  // Social Security calculator state
  const [ssStartAge, setSsStartAge] = useState(25);
  const [ssRetireAge, setSsRetireAge] = useState(65);
  const [ssAvgSalary, setSsAvgSalary] = useState(5000);
  const [ssClaimAge, setSsClaimAge] = useState(67);

  const form = useForm<RetirementFormData>({
    resolver: zodResolver(retirementFormSchema),
    defaultValues: {
      currentAge: 45,
      expectedRetirementAge: 65,
      currentSavings: 0,
      monthlyContribution: 0,
      desiredRetirementIncome: 5000,
      expectedAnnualReturn: 7,
      currentIncome: 0,
      emergencyFund: 0,
      totalDebt: 0,
      expectedSocialSecurityBenefit: 0,
      healthStatus: 'good',
      hasHealthInsurance: true,
      homeOwnership: 'mortgage',
      familyStatus: 'single',
      dependentsCount: 0,
      investmentExperience: 'intermediate',
      riskTolerance: 'moderate',
      expectedInflationRate: 3
    }
  });

  const stepTitles = [
    "1단계: 기본 정보",
    "2단계: 재정 상태", 
    "3단계: 생활 환경",
    "4단계: 투자 성향"
  ];

  const stepDescriptions = [
    "나이, 은퇴계획, 현재 저축 상황을 입력해주세요",
    "소득, 부채, 비상자금 등 재정상태를 진단합니다", 
    "건강, 주거, 가족상황 등을 확인합니다",
    "투자경험과 위험성향을 파악합니다"
  ];

  // 각 단계별 필수 필드 정의
  const requiredFieldsByStep = [
    ['currentAge', 'expectedRetirementAge', 'currentSavings', 'monthlyContribution', 'desiredRetirementIncome', 'expectedAnnualReturn'],
    ['currentIncome', 'emergencyFund', 'totalDebt', 'expectedSocialSecurityBenefit'],
    ['healthStatus', 'hasHealthInsurance', 'homeOwnership', 'familyStatus', 'dependentsCount'],
    ['investmentExperience', 'riskTolerance', 'expectedInflationRate']
  ];

  // 현재 단계의 필수 필드가 모두 입력되었는지 확인
  const validateCurrentStep = () => {
    const formValues = form.getValues();
    const currentStepFields = requiredFieldsByStep[currentStep];
    
    return currentStepFields.every(field => {
      const value = formValues[field as keyof RetirementFormData];
      if (typeof value === 'boolean') return true;
      if (typeof value === 'string') return value !== '';
      if (typeof value === 'number') return !isNaN(value) && value >= 0;
      return value !== undefined && value !== null;
    });
  };

  // 다음 단계로 진행
  const goToNextStep = () => {
    if (validateCurrentStep()) {
      const newCompletedSteps = [...completedSteps];
      newCompletedSteps[currentStep] = true;
      setCompletedSteps(newCompletedSteps);
      
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  // 이전 단계로 돌아가기
  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 모든 단계가 완료되었는지 확인
  const allStepsCompleted = completedSteps.every(step => step === true);

  // Social Security 계산 함수
  const calculateSocialSecurity = () => {
    const workingYears = ssRetireAge - ssStartAge;
    const totalEarnings = ssAvgSalary * 12 * workingYears;
    const avgIndexedEarnings = totalEarnings / (35 * 12); // 최고 35년 기준
    
    // 간단한 PIA 계산 (실제보다 단순화)
    let pia = 0;
    if (avgIndexedEarnings <= 1024) {
      pia = avgIndexedEarnings * 0.9;
    } else if (avgIndexedEarnings <= 6172) {
      pia = 1024 * 0.9 + (avgIndexedEarnings - 1024) * 0.32;
    } else {
      pia = 1024 * 0.9 + (6172 - 1024) * 0.32 + (avgIndexedEarnings - 6172) * 0.15;
    }
    
    // 수령 시작 나이에 따른 조정
    const fullRetirementAge = 67;
    let adjustmentFactor = 1.0;
    
    if (ssClaimAge < fullRetirementAge) {
      const monthsEarly = (fullRetirementAge - ssClaimAge) * 12;
      adjustmentFactor = Math.max(0.75, 1 - (monthsEarly * 0.0055)); // 조기수령 감액
    } else if (ssClaimAge > fullRetirementAge) {
      const monthsDelay = (ssClaimAge - fullRetirementAge) * 12;
      adjustmentFactor = Math.min(1.32, 1 + (monthsDelay * 0.0067)); // 연기수령 증액
    }
    
    return Math.round(pia * adjustmentFactor);
  };

  // 은퇴 점수 계산
  const calculateRetirementScore = (data: RetirementFormData): RetirementAnalysis => {
    const yearsToRetirement = data.expectedRetirementAge - data.currentAge;
    const annualContribution = data.monthlyContribution * 12;
    const futureValue = data.currentSavings * Math.pow(1 + data.expectedAnnualReturn / 100, yearsToRetirement) +
                       annualContribution * (Math.pow(1 + data.expectedAnnualReturn / 100, yearsToRetirement) - 1) / (data.expectedAnnualReturn / 100);
    
    const requiredAmount = data.desiredRetirementIncome * 12 * 25; // 4% rule
    const preparednessRatio = futureValue / requiredAmount;
    
    let score = Math.min(100, preparednessRatio * 50 + 50);
    
    // 추가 점수 조정
    if (data.emergencyFund >= data.currentIncome / 2) score += 5;
    if (data.totalDebt / data.currentIncome < 0.3) score += 5;
    if (data.hasHealthInsurance) score += 5;
    if (data.healthStatus === 'excellent' || data.healthStatus === 'good') score += 5;
    
    const additionalNeeded = Math.max(0, requiredAmount - futureValue);
    const monthlyNeeded = additionalNeeded > 0 ? additionalNeeded / (yearsToRetirement * 12) : 0;

    const strengths: string[] = [];
    const concerns: string[] = [];
    const recommendations: string[] = [];

    if (preparednessRatio >= 0.8) {
      strengths.push("은퇴 자금 목표 달성에 근접했습니다");
    } else {
      concerns.push("은퇴 자금이 부족합니다");
      recommendations.push(`월 ${Math.round(monthlyNeeded).toLocaleString()}달러 추가 저축을 권장합니다`);
    }

    if (data.emergencyFund >= data.currentIncome / 2) {
      strengths.push("충분한 비상 자금을 보유하고 있습니다");
    } else {
      concerns.push("비상 자금이 부족합니다");
      recommendations.push("6개월치 생활비에 해당하는 비상 자금을 마련하세요");
    }

    return {
      score: Math.round(score),
      projectedSavings: Math.round(futureValue),
      additionalNeeded: Math.round(additionalNeeded),
      monthlyNeeded: Math.round(monthlyNeeded),
      recommendations,
      strengths,
      concerns
    };
  };

  const onSubmit = (data: RetirementFormData) => {
    const result = calculateRetirementScore(data);
    setAnalysis(result);
  };

  const resetForm = () => {
    setAnalysis(null);
    setCurrentStep(0);
    setCompletedSteps([false, false, false, false]);
    form.reset();
  };

  if (analysis) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <TrendingUpIcon className="h-8 w-8 text-primary" />
            종합 은퇴 준비 점수
          </h1>
          <div className="text-5xl font-bold text-primary my-4">
            {analysis.score}점
          </div>
          <Progress value={analysis.score} className="w-full max-w-md mx-auto" />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
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
                {((analysis.projectedSavings / (form.getValues('desiredRetirementIncome') * 12 * 25)) * 100).toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

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

        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={resetForm} variant="outline" className="flex-1">
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            다시 계산하기
          </Button>
          <Button onClick={() => navigate('/review')} className="flex-1">
            세금 신고 완료하기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <TrendingUpIcon className="h-8 w-8 text-primary" />
          은퇴 준비 상태 진단 (무료)
        </h1>
        <p className="text-gray-600">
          4단계 간단한 질문으로 당신의 은퇴 준비 점수를 확인하고 맞춤 전략을 받아보세요
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBankIcon className="h-5 w-5" />
            {stepTitles[currentStep]}
          </CardTitle>
          <CardDescription>
            {stepDescriptions[currentStep]}
          </CardDescription>
        </CardHeader>
        
        {/* Progress Bar */}
        <div className="px-6 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">진행 상황</span>
            <span className="text-sm font-medium text-primary">{currentStep + 1}/4 단계</span>
          </div>
          <Progress value={(currentStep + 1) * 25} className="h-2" />
          
          {/* Step indicators */}
          <div className="flex justify-between mt-3">
            {stepTitles.map((title, index) => (
              <div key={index} className="flex flex-col items-center space-y-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index === currentStep 
                    ? 'bg-primary text-white' 
                    : completedSteps[index] 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {completedSteps[index] ? '✓' : index + 1}
                </div>
                <span className={`text-xs text-center max-w-16 ${
                  index === currentStep ? 'text-primary font-medium' : 'text-gray-500'
                }`}>
                  {title.split(': ')[1]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <CardContent>
          <Form {...form}>
            <div className="space-y-6">
              {/* Step 0: 기본 정보 */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="currentAge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>현재 나이 *</FormLabel>
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
                          <FormLabel>희망 은퇴 나이 *</FormLabel>
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
                          <FormLabel>현재 총 저축액 ($) *</FormLabel>
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
                          <FormLabel>월 저축액 ($) *</FormLabel>
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
                          <FormLabel>은퇴 후 예상 생활비 (월 비용 $) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="매월 필요 생활비 (예: 5000)"
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
                          <FormLabel>예상 연 투자수익률 (%) *</FormLabel>
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
                </div>
              )}

              {/* Step 1: 재정 상태 */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="currentIncome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>현재 연소득 ($) *</FormLabel>
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
                          <FormLabel>비상 자금 ($) *</FormLabel>
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
                          <FormLabel>총 부채 ($) *</FormLabel>
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
                          <FormLabel>예상 Social Security 연금 (월 수령액 $) *</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="월 예상 수령액 (예: 2000)"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowSSCalculator(!showSSCalculator)}
                              className="flex items-center gap-1 whitespace-nowrap"
                            >
                              📊 상세 Social Security 계산기
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Social Security Calculator */}
                    {showSSCalculator && (
                      <div className="col-span-full">
                        <Card className="bg-blue-50 border-blue-200">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-blue-700">
                              📊 상세 Social Security 계산기
                            </CardTitle>
                            <CardDescription>
                              근무기간과 평균소득을 기반으로 예상 Social Security 연금을 계산합니다
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  납부 시작 연령
                                </label>
                                <Input
                                  type="number"
                                  value={ssStartAge}
                                  onChange={(e) => setSsStartAge(Number(e.target.value))}
                                  min="18"
                                  max="67"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  은퇴 연령
                                </label>
                                <Input
                                  type="number"
                                  value={ssRetireAge}
                                  onChange={(e) => setSsRetireAge(Number(e.target.value))}
                                  min="62"
                                  max="70"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  연평균 연봉 ($)
                                </label>
                                <Input
                                  type="number"
                                  value={ssAvgSalary}
                                  onChange={(e) => setSsAvgSalary(Number(e.target.value))}
                                  min="0"
                                  step="1000"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  수령 시작 연령
                                </label>
                                <Input
                                  type="number"
                                  value={ssClaimAge}
                                  onChange={(e) => setSsClaimAge(Number(e.target.value))}
                                  min="62"
                                  max="70"
                                />
                              </div>
                            </div>
                            
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-semibold text-lg mb-2">
                                예상 월 수령액: ${calculateSocialSecurity()}
                              </h4>
                              <div className="text-sm text-gray-600 space-y-1">
                                <div>• 근무년수: {ssRetireAge - ssStartAge}년</div>
                                <div>• 수령 조정: {ssClaimAge === 67 ? '정상' : ssClaimAge < 67 ? '조기수령' : '연기수령'}</div>
                              </div>
                            </div>
                            
                            <Button
                              type="button"
                              onClick={() => {
                                const calculatedAmount = calculateSocialSecurity();
                                form.setValue('expectedSocialSecurityBenefit', calculatedAmount);
                                setShowSSCalculator(false);
                              }}
                              className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                              이 금액으로 적용
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: 생활 환경 */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="healthStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>건강 상태 *</FormLabel>
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
                            <FormLabel>건강보험 가입 *</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="homeOwnership"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>주거 상태 *</FormLabel>
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
                          <FormLabel>가족 상태 *</FormLabel>
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
                          <FormLabel>부양가족 수 *</FormLabel>
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
                </div>
              )}

              {/* Step 3: 투자 성향 */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="investmentExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>투자 경험 *</FormLabel>
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
                          <FormLabel>위험 성향 *</FormLabel>
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
                          <FormLabel>예상 물가상승률 (%) *</FormLabel>
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
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={goToPreviousStep}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  이전 단계
                </Button>

                {currentStep < 3 ? (
                  <Button 
                    type="button" 
                    onClick={goToNextStep}
                    disabled={!validateCurrentStep()}
                    className="flex items-center gap-2"
                  >
                    다음 단계
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    onClick={() => onSubmit(form.getValues())}
                    disabled={!validateCurrentStep()}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <TargetIcon className="h-4 w-4" />
                    종합 은퇴 점수 계산하기
                  </Button>
                )}
              </div>

              {/* Validation Message */}
              {!validateCurrentStep() && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertDescription className="text-orange-700">
                    현재 단계의 모든 필수 항목(*)을 입력해주세요.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}