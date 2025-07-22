import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { File, FileText, Clock, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/context/LanguageContext";

const Home: React.FC = () => {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { messages } = useLanguage();

  // 자동 데이터 주입 제거 - 사용자가 직접 입력하도록 변경

  return (
    <div className="max-w-5xl mx-auto">
      <section className="mb-12 text-center py-10">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-primary-dark mb-2">
          {messages.home.title}
        </h1>
        <p
          className="text-2xl md:text-3xl font-bold text-gray-600 mb-4 tracking-wide"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {messages.home.subtitle}
        </p>
        <p className="text-xl text-gray-dark mb-8 text-center">
          {messages.home.tagline}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-green-500 hover:bg-green-600 text-white font-bold w-full sm:w-64"
                  onClick={() => navigate("/personal-info")}
                >
                  {messages.home.taxSimulatorButton}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>가입없이도 세금을 계산해볼수 있습니다</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            size="lg"
            className="bg-primary hover:bg-primary-dark text-white font-bold w-full sm:w-64"
            onClick={() => navigate("/retirement-score")}
          >
            {messages.home.retirementDiagnosisButton}
          </Button>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-heading font-bold text-primary-dark text-center mb-8">
          왜 EzTax인가요?
        </h2>

        <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <File className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">{messages.home.features.easyCalculation}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-dark">
                세금 신고의 각 단계를 차례대로 안내해 드립니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <FileText className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">최대 공제 혜택</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-dark">
                귀하가 받을 수 있는 모든 공제와 세액 공제를 찾아드립니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <Clock className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">{messages.home.features.retirementPlanning}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-dark">
                개인 맞춤형 은퇴 계획과 세금 최적화 전략을 제공합니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">안전하고 비공개적</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-dark">
                귀하의 데이터는 은행 수준의 보안으로 암호화되고 보호됩니다.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Button
            variant="ghost"
            className="text-gray-600 hover:text-primary underline"
            onClick={() => navigate("/about")}
          >
            EzTax와 운영진에 대해 더 알아보기 →
          </Button>
        </div>
      </section>

      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-heading text-primary-dark">
              세금 신고 준비가 되셨나요?
            </CardTitle>
            <CardDescription>
              30분 만에 2025년 세금 신고를 완료하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              저희의 간단한 과정은 다음 여섯 가지 섹션으로 안내합니다:
            </p>
            <ol className="list-decimal pl-6 mb-4 space-y-2">
              <li>
                <strong>개인 정보</strong> - 기본 정보 및 신고 상태
              </li>
              <li>
                <strong>소득 정보</strong> - 급여, 이자, 기타 소득 입력
              </li>
              <li>
                <strong>공제 항목</strong> - 표준 공제 또는 항목별 공제 선택
              </li>
              <li>
                <strong>세액 공제</strong> - 자격이 있는 공제 항목 확인
              </li>
              <li>
                <strong>추가 세금</strong> - 자영업 및 기타 소득
              </li>
              <li>
                <strong>검토 및 계산</strong> - 최종 확인 및 신고서 생성
              </li>
            </ol>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold"
              onClick={() =>
                user ? navigate("/personal-info") : navigate("/auth")
              }
            >
              {user ? "지금 시작하기" : "로그인하고 시작하기(Login to Start)"}
            </Button>
            <Button
              size="lg"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold"
              onClick={() => navigate("/personal-info")}
            >
              세금시뮬레이터(Tax Simulator)
            </Button>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
};

export default Home;
