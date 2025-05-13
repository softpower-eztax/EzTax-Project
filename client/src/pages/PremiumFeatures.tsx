import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Check, ChevronRight, CreditCard, FileSpreadsheet, Lock, Upload, Zap } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function PremiumFeatures() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const goToSubscription = () => {
    toast({
      title: "결제 페이지로 이동합니다",
      description: "프리미엄 기능을 이용하려면 구독이 필요합니다.",
    });
    setLocation("/payment");
  };

  const goBack = () => {
    setLocation("/capital-gains");
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-2">자본 이득 계산기 프리미엄</h1>
      <p className="text-gray-500 mb-8">고급 세금 계산 및 최적화 기능으로 더 많은 세금을 절약하세요</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">기본 계산기</span>
              <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded-full">무료</span>
            </CardTitle>
            <CardDescription>기본적인 자본 이득 계산 기능</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>기본 자본 이득 계산</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>개별 거래 입력 (최대 10개)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>장/단기 투자 구분 및 기본 통계</span>
              </li>
              <li className="flex items-start gap-2 text-gray-400">
                <Lock className="h-5 w-5 shrink-0 mt-0.5" />
                <span>1099-B 파일 자동 업로드 및 파싱</span>
              </li>
              <li className="flex items-start gap-2 text-gray-400">
                <Lock className="h-5 w-5 shrink-0 mt-0.5" />
                <span>세금 최적화 추천</span>
              </li>
              <li className="flex items-start gap-2 text-gray-400">
                <Lock className="h-5 w-5 shrink-0 mt-0.5" />
                <span>여러 거래소/브로커 통합</span>
              </li>
              <li className="flex items-start gap-2 text-gray-400">
                <Lock className="h-5 w-5 shrink-0 mt-0.5" />
                <span>PDF/Excel 보고서 내보내기</span>
              </li>
              <li className="flex items-start gap-2 text-gray-400">
                <Lock className="h-5 w-5 shrink-0 mt-0.5" />
                <span>무제한 거래 내역 저장</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={goBack}>
              기본 버전으로 돌아가기
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-2 border-primary shadow-lg">
          <CardHeader className="bg-primary/5">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">프리미엄 계산기</span>
                <span className="bg-primary/20 text-primary text-xs font-medium px-2 py-1 rounded-full">추천</span>
              </CardTitle>
              <span className="text-2xl font-bold">$9.99<span className="text-sm font-normal">/월</span></span>
            </div>
            <CardDescription>고급 세금 계산 및 최적화 기능</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>모든 기본 기능 포함</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span className="font-medium">1099-B 파일 자동 업로드 및 파싱</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span className="font-medium">세금 최적화 추천</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span className="font-medium">여러 거래소/브로커 통합</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span className="font-medium">PDF/Excel 보고서 내보내기</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span className="font-medium">무제한 거래 내역 저장</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="lg" onClick={goToSubscription}>
              지금 업그레이드하기
            </Button>
          </CardFooter>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mb-6">프리미엄 기능 살펴보기</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">1099-B 파일 자동 업로드</h3>
              <p className="text-gray-500">브로커로부터 받은 1099-B 파일을 자동으로 파싱하여 모든 거래를 즉시 가져옵니다.</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">세금 최적화 추천</h3>
              <p className="text-gray-500">세금 부담을 최소화하는 방법을 자동으로 추천해드립니다.</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="bg-primary/10 p-3 rounded-lg">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">고급 보고서 생성</h3>
              <p className="text-gray-500">PDF 또는 Excel 형식의 상세한 세금 보고서를 쉽게 생성하고 다운로드 할 수 있습니다.</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="bg-primary/10 p-3 rounded-lg">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">여러 거래소/브로커 통합</h3>
              <p className="text-gray-500">여러 거래소나 브로커의 자료를 한 곳에서 통합하고 관리할 수 있습니다.</p>
            </div>
          </div>
        </div>
      </div>
      
      <Separator className="my-8" />
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">더 많은 세금을 절약할 준비가 되셨나요?</h2>
          <p className="text-gray-500">지금 업그레이드하고 고급 세금 계산 기능을 활용하세요.</p>
        </div>
        <Button size="lg" className="px-8 flex items-center gap-2" onClick={goToSubscription}>
          <span>프리미엄으로 업그레이드</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}