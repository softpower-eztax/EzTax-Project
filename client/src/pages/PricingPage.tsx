import React from 'react';
import { useLocation } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Award, Mail, Phone, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';

const PricingPage = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handlePurchase = (planName: string) => {
    toast({
      title: "결제 신청이 접수되었습니다",
      description: "담당 세무사가 빠른 시일 내에 연락드릴 예정입니다.",
      variant: "default",
    });
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-heading font-bold text-primary-dark mb-4">
          유료검토 서비스 안내(Paid Review Service)
        </h1>
        <p className="text-gray-dark max-w-2xl mx-auto">
          전문적인 세무사의 검토를 통해 더 많은 세금 환급을 받거나 세무 위험을 줄일 수 있습니다. 
          아래의 다양한 검토 옵션 중에서 선택하세요.(Choose from our professional tax review options to maximize your refund or minimize tax risks.)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 기본 검토 플랜 */}
        <Card className="border-primary/20 hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold text-primary-dark">기본 검토(Basic)</CardTitle>
              <Badge variant="outline" className="bg-primary/10">가장 인기</Badge>
            </div>
            <CardDescription>개인 기본 세금 신고 검토</CardDescription>
            <div className="mt-4">
              <span className="text-3xl font-bold text-primary-dark">$99</span>
              <span className="text-gray-500 ml-1">/ 건당</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>일반 소득 및 공제 항목 검토</span>
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>기본 세액공제 항목 확인</span>
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>이메일 상담 2회 포함</span>
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>검토 결과 문서 제공</span>
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>처리 시간: 최대 3일</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-primary hover:bg-primary-dark text-white"
              onClick={() => handlePurchase('basic')}
            >
              신청하기
            </Button>
          </CardFooter>
        </Card>

        {/* 전문 검토 플랜 */}
        <Card className="border-primary shadow-md relative overflow-hidden">
          <div className="absolute -rotate-45 bg-primary text-white text-xs px-6 py-1 -left-6 top-4">
            추천
          </div>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold text-primary-dark">전문 검토(Professional)</CardTitle>
              <Badge className="bg-primary text-white">Best Value</Badge>
            </div>
            <CardDescription>심층적인 세금 분석 및 최적화</CardDescription>
            <div className="mt-4">
              <span className="text-3xl font-bold text-primary-dark">$199</span>
              <span className="text-gray-500 ml-1">/ 건당</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>기본 검토 모든 항목 포함</span>
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>복잡한 투자 소득 분석</span>
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>세금 최적화 전략 제안</span>
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>화상 상담 1회 + 이메일 상담 3회</span>
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>처리 시간: 최대 5일</span>
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>1년간 세금 자문 가능</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-primary hover:bg-primary-dark text-white"
              onClick={() => handlePurchase('professional')}
            >
              신청하기
            </Button>
          </CardFooter>
        </Card>

        {/* 프리미엄 검토 플랜 */}
        <Card className="border-primary/20 hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold text-primary-dark">프리미엄(Premium)</CardTitle>
              <Badge variant="outline" className="bg-primary/10">기업용</Badge>
            </div>
            <CardDescription>맞춤형 세무 컨설팅</CardDescription>
            <div className="mt-4">
              <span className="text-3xl font-bold text-primary-dark">$399</span>
              <span className="text-gray-500 ml-1">/ 건당</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>전문 검토 모든 항목 포함</span>
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>자영업자/기업 세금 최적화</span>
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>장기 세금 전략 계획</span>
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>직접 미팅 1회 + 화상 상담 2회</span>
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>영문 세금 보고서 제공</span>
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>세무 조사 대응 지원</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-primary hover:bg-primary-dark text-white"
              onClick={() => handlePurchase('premium')}
            >
              신청하기
            </Button>
          </CardFooter>
        </Card>
      </div>



      <div className="flex justify-center mt-10">
        <Button 
          variant="outline" 
          className="border-primary text-primary hover:bg-primary-light hover:text-white"
          onClick={() => navigate('/review')}
        >
          세금 신고 페이지로 돌아가기
        </Button>
      </div>
    </div>
  );
};

export default PricingPage;