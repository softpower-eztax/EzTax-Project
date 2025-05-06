import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { File, FileText, Clock, Shield } from 'lucide-react';

const Home: React.FC = () => {
  const [, navigate] = useLocation();

  return (
    <div className="max-w-5xl mx-auto">
      <section className="mb-12 text-center py-10">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-primary-dark mb-4">
          세상쉬운 세금 보고
        </h1>
        <p className="text-xl text-gray-dark max-w-3xl mx-auto mb-8">
          EzTax로 간단한 과정을 통해 자신감 있게 세금 보고를 완료하세요.
        </p>
        <Button 
          size="lg" 
          className="bg-primary hover:bg-primary-dark text-white font-bold"
          onClick={() => navigate('/personal-info')}
        >
          2023년 세금 보고 시작하기
        </Button>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-heading font-bold text-primary-dark text-center mb-8">
          왜 EzTax인가요?
        </h2>
        
        <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <File className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">간편한 절차</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-dark">세금 신고의 각 단계를 차례대로 안내해 드립니다.</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <FileText className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">최대 공제 혜택</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-dark">귀하가 받을 수 있는 모든 공제와 세액 공제를 찾아드립니다.</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <Clock className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">저장 및 재개</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-dark">자동 저장 기능으로 원하는 속도에 맞춰 작업할 수 있습니다.</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">안전하고 비공개적</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-dark">귀하의 데이터는 은행 수준의 보안으로 암호화되고 보호됩니다.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-heading text-primary-dark">세금 신고 준비가 되셨나요?</CardTitle>
            <CardDescription>
              30분 만에 2023년 세금 신고를 완료하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              저희의 간단한 과정은 다음 여섯 가지 섹션으로 안내합니다:
            </p>
            <ol className="list-decimal pl-6 mb-4 space-y-2">
              <li><strong>개인 정보</strong> - 기본 정보 및 신고 상태</li>
              <li><strong>소득 정보</strong> - 급여, 이자, 기타 소득 입력</li>
              <li><strong>공제 항목</strong> - 표준 공제 또는 항목별 공제 선택</li>
              <li><strong>세액 공제</strong> - 자격이 있는 공제 항목 확인</li>
              <li><strong>추가 세금</strong> - 자영업 및 기타 소득</li>
              <li><strong>검토 및 계산</strong> - 최종 확인 및 신고서 생성</li>
            </ol>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold"
              onClick={() => navigate('/personal-info')}
            >
              지금 시작하기
            </Button>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
};

export default Home;
