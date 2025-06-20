import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { File, FileText, Clock, Shield } from 'lucide-react';
import { useTaxContext } from '@/context/TaxContext';
import { useAuth } from '@/hooks/use-auth';

const Home: React.FC = () => {
  const [, navigate] = useLocation();
  const { updateTaxData } = useTaxContext();
  const { user } = useAuth();
  
  // 초기 데이터는 한 번만 로드
  useEffect(() => {
    // 하드코딩된 테스트 데이터
    const testData = {
      personalInfo: {
        firstName: 'John',
        middleInitial: 'A',
        lastName: 'Smith',
        ssn: '123-45-6789',
        dateOfBirth: '1980-01-15',
        email: 'john.smith@example.com',
        phone: '123-456-7890',
        address1: '123 Main Street',
        address2: 'Apt 4B',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62704',
        filingStatus: 'married_joint' as any, // Type assertion to avoid FilingStatus error
        spouseInfo: {
          firstName: 'Jane',
          middleInitial: 'B',
          lastName: 'Smith',
          ssn: '987-65-4321',
          dateOfBirth: '1982-05-20'
        },
        dependents: [
          {
            firstName: 'Tommy',
            lastName: 'Smith',
            ssn: '111-22-3333',
            relationship: 'Son',
            dateOfBirth: '2010-03-12'
          }
        ]
      },
      income: {
        wages: 75000,
        otherEarnedIncome: 0, 
        interestIncome: 1200,
        dividends: 3500,
        businessIncome: 15000,
        capitalGains: 5000,
        rentalIncome: 12000,
        retirementIncome: 0,
        unemploymentIncome: 0,
        otherIncome: 1500,
        totalIncome: 113200,
        adjustments: {
          studentLoanInterest: 2500,
          retirementContributions: 6000,
          healthSavingsAccount: 3500,
          otherAdjustments: 1000
        },
        adjustedGrossIncome: 100200
      },
      deductions: {
        useStandardDeduction: false,
        standardDeductionAmount: 27700,
        itemizedDeductions: {
          medicalExpenses: 5000,
          stateLocalIncomeTax: 7500,
          realEstateTaxes: 8000,
          mortgageInterest: 9500,
          charitableCash: 3000,
          charitableNonCash: 2000
        },
        totalDeductions: 35000
      },
      taxCredits: {
        childTaxCredit: 2000,
        childDependentCareCredit: 1000,
        educationCredits: 1500,
        retirementSavingsCredit: 500,
        otherCredits: 200,
        totalCredits: 5200
      },
      additionalTax: {
        selfEmploymentIncome: 15000,
        selfEmploymentTax: 2120,
        estimatedTaxPayments: 5000,
        otherIncome: 1500,
        otherTaxes: 800
      }
    };
    
    // 데이터 업데이트 - 빈 의존성 배열로 최초 마운트시에만 실행
    if(updateTaxData) {
      updateTaxData(testData);
    }
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <section className="mb-12 text-center py-10">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-primary-dark mb-4">
          세상쉬운 세금 계산
        </h1>
        <p className="text-xl text-gray-dark max-w-3xl mx-auto mb-4">
          EzTax로 간단한 과정을 통해 자신감 있게 세금 보고를 완료하세요.
        </p>
        <p className="text-lg font-medium text-primary-dark max-w-4xl mx-auto mb-8 bg-primary/5 p-4 rounded-lg border border-primary/20">
          EzTax는 단순히 올해 세금을 정리하는 것에 그치지 않고,<br />
          당신의 평생 세금+은퇴 전략을 함께 설계합니다.
        </p>
        {user ? (
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary-dark text-white font-bold"
            onClick={() => navigate('/personal-info')}
          >
            2025년 세금 보고 시작하기
          </Button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary-dark text-white font-bold"
              onClick={() => navigate('/auth')}
            >
              로그인하고 시작하기(Login and Start)
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10"
              onClick={() => navigate('/auth')}
            >
              계정 만들기(Create Account)
            </Button>
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-green-500 hover:bg-green-600 text-white"
              onClick={() => navigate('/personal-info')}
            >
              세금시뮬레이터(Tax Simulator)
            </Button>
          </div>
        )}
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
              30분 만에 2025년 세금 신고를 완료하세요.
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
          <CardFooter className="flex flex-col sm:flex-row gap-4">
            <Button 
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold"
              onClick={() => user ? navigate('/personal-info') : navigate('/auth')}
            >
              {user ? '지금 시작하기' : '로그인하고 시작하기(Login to Start)'}
            </Button>
            <Button 
              className="w-full bg-green-500 hover:bg-green-600 text-white"
              onClick={() => navigate('/personal-info')}
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
