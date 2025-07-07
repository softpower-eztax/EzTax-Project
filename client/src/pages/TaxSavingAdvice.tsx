import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { ArrowLeft, Mail } from 'lucide-react';

const TaxSavingAdvice: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto pt-8 pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-primary-dark mb-2">세금 절세 제안(Tax-Saving Advice)</h1>
        <p className="text-gray-dark">복잡한 세무 상황에서는 전문가 상담을 받으시기 바랍니다.</p>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center">
            <Mail className="h-8 w-8 mr-3 text-blue-600" />
            <div>
              <CardTitle className="text-2xl font-heading text-primary-dark">전문가 상담</CardTitle>
              <CardDescription className="text-blue-700">
                절세방안을 실현하시길 원하시면 전문가와 상담하세요
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-4 text-lg">전문가 상담이 도움이 되는 경우:</h4>
            <ul className="text-gray-600 space-y-2">
              <li>• 복잡한 사업 소득이나 투자 소득이 있는 경우</li>
              <li>• 여러 주에서 소득이 발생한 경우</li>
              <li>• 국제 소득이나 해외 자산이 있는 경우</li>
              <li>• 대규모 자선 기부나 특별 공제가 필요한 경우</li>
              <li>• IRS 감사나 세무 문제가 발생한 경우</li>
              <li>• 은퇴 계획이나 부동산 거래와 관련된 세무 문제</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 text-center">
            <div className="flex items-center justify-center mb-3">
              <Mail className="h-6 w-6 mr-2 text-blue-600" />
              <h3 className="font-semibold text-blue-800 text-lg">전문가 상담 문의</h3>
            </div>
            <p className="text-blue-700 mb-4">
              위와 같은 복잡한 세무 상황이 있으시면 전문가에게 문의하세요
            </p>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              onClick={() => window.open('mailto:eztax88@gmail.com?subject=세무상담 문의 (Tax Consultation Inquiry)&body=안녕하세요,%0A%0A세무 상담을 요청드립니다.%0A%0A문의 내용:%0A%0A연락처:%0A%0A감사합니다.', '_blank')}
            >
              <Mail className="h-5 w-5 mr-2" />
              eztax88@gmail.com으로 문의하기
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-10 text-center">
        <Link href="/review">
          <Button className="bg-primary text-white font-semibold rounded hover:bg-primary-dark transition duration-200 w-[240px] justify-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            검토 페이지로 돌아가기(Back to Review)
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default TaxSavingAdvice;