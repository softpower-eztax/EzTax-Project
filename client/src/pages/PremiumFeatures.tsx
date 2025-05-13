import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Crown, Zap } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function PremiumFeatures() {
  const [, setLocation] = useLocation();
  
  // 요금제 상태
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  
  // 결제 페이지로 이동
  const goToPayment = (planType: string) => {
    setLocation('/payment?plan=' + planType);
  };
  
  return (
    <div className="container max-w-5xl mx-auto py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">프리미엄 기능 (Premium Features)</h1>
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/capital-gains')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>자본 이득 계산기로 돌아가기</span>
        </Button>
      </div>
      
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">자본 이득 계산기 프리미엄</h2>
        <p className="text-gray-600 max-w-3xl mb-4">
          프리미엄 기능으로 더 정확하고 효율적인 세금 계산과 최적화를 경험하세요. 
          자동 파일 파싱, 세금 최적화 추천, 여러 브로커 통합 등 다양한 기능을 활용하여 
          세금 신고를 간편하게 처리하고 세금 부담을 최소화할 수 있습니다.
        </p>
      </div>
      
      {/* 요금제 선택 토글 */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center bg-gray-100 p-1 rounded-lg">
          <Button 
            variant={selectedPlan === 'monthly' ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedPlan('monthly')}
            className="rounded-md"
          >
            월간 구독
          </Button>
          <Button 
            variant={selectedPlan === 'annual' ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedPlan('annual')}
            className="rounded-md"
          >
            연간 구독
            <Badge variant="outline" className="ml-2 bg-primary/20 text-primary border-0">
              20% 할인
            </Badge>
          </Button>
        </div>
      </div>
      
      {/* 요금제 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 스탠다드 플랜 */}
        <Card className="relative overflow-hidden border-primary/20">
          <div className="absolute top-0 right-0 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            인기
          </div>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              <span>스탠다드 플랜</span>
            </CardTitle>
            <CardDescription>자본 이득 계산을 위한 필수 고급 기능</CardDescription>
            <div className="mt-3">
              <span className="text-3xl font-bold">
                {selectedPlan === 'monthly' ? '$9.99' : '$95.88'}
              </span>
              <span className="text-gray-500 ml-1">
                /{selectedPlan === 'monthly' ? '월' : '년'}
              </span>
              {selectedPlan === 'annual' && (
                <span className="block text-sm text-green-600 mt-1">연간 $23.97 절약</span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>1099-B 데이터 자동 가져오기</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>장기/단기 자본 이득 자동 분류</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>세금 최적화 추천</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>PDF 보고서 내보내기</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>최대 100개 거래 저장</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => goToPayment('standard-' + selectedPlan)}
              size="lg" 
              className="w-full"
            >
              구독하기
            </Button>
          </CardFooter>
        </Card>
        
        {/* 프로 플랜 */}
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              <span>프로 플랜</span>
            </CardTitle>
            <CardDescription>세금 전문가를 위한 고급 기능</CardDescription>
            <div className="mt-3">
              <span className="text-3xl font-bold">
                {selectedPlan === 'monthly' ? '$19.99' : '$191.88'}
              </span>
              <span className="text-gray-500 ml-1">
                /{selectedPlan === 'monthly' ? '월' : '년'}
              </span>
              {selectedPlan === 'annual' && (
                <span className="block text-sm text-green-600 mt-1">연간 $47.97 절약</span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>스탠다드 플랜의 모든 기능</span>
              </li>
              <Separator className="my-2" />
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>여러 브로커 계정 통합</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>손실 하베스팅 전략 추천</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>Excel/CSV 내보내기</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>무제한 거래 저장</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>우선 기술 지원</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => goToPayment('pro-' + selectedPlan)}
              size="lg" 
              variant="outline"
              className="w-full"
            >
              구독하기
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* 특징 및 비교 */}
      <div className="mt-16">
        <h3 className="text-xl font-semibold mb-6">자본 이득 계산기 프리미엄으로 무엇을 할 수 있나요?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">1099-B 파일 자동 가져오기</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                브로커로부터 받은 1099-B 파일을 업로드하면 모든 거래 내역이 자동으로 추출되어
                장기/단기 이득으로 분류됩니다.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">세금 최적화 추천</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                다양한 세금 최적화 전략을 추천받아 자본 이득 세금을 최소화할 수 있습니다.
                손실 상계, 손실 이월, 세금 브래킷 최적화 등을 포함합니다.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">보고서 내보내기</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                계산된 자본 이득과 세금 정보를 PDF, Excel 또는 CSV 형식으로 내보내 
                세무사와 쉽게 공유하거나 세금 신고에 활용할 수 있습니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}