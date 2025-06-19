import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { AlertCircle, ArrowLeft, Lightbulb, TrendingUp, ArrowRight, Phone, Mail, MessageCircle, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TaxSavingSuggestion, generateTaxSavingSuggestions } from '@/lib/taxSavingSuggestions';
import { useTaxContext } from '@/context/TaxContext';
import { formatCurrency } from '@/lib/taxCalculations';

const TaxSavingAdvice: React.FC = () => {
  const { taxData } = useTaxContext();
  
  // Generate tax-saving suggestions based on tax data
  const suggestions = generateTaxSavingSuggestions(taxData);
  
  // Calculate total potential savings
  const totalPotentialSavings = suggestions.reduce((sum, suggestion) => {
    return sum + (suggestion.potentialSavings || 0);
  }, 0);
  
  // Sort suggestions by priority (high to low)
  const sortedSuggestions = [...suggestions].sort((a, b) => {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className="max-w-5xl mx-auto pt-8 pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-primary-dark mb-2">세금 절세 제안(Tax-Saving Advice)</h1>
        <p className="text-gray-dark">입력하신 정보를 분석하여 추가 공제 및 세금 절약 가능성을 제안해 드립니다.</p>
      </div>
      
      <div className="mb-6">
        <Link href="/review">
          <Button variant="outline" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            검토 페이지로 돌아가기(Back to Review)
          </Button>
        </Link>
      </div>
      
      <Card className="mb-6 border-2 border-primary">
        <CardHeader className="bg-primary-light/10">
          <div className="flex items-center">
            <Lightbulb className="h-6 w-6 mr-2 text-primary" />
            <CardTitle className="text-xl font-heading font-semibold text-primary-dark">
              맞춤형 세금 절세 제안(Personalized Tax-Saving Suggestions)
            </CardTitle>
          </div>
          <CardDescription className="text-base">
            입력하신 재무 정보를 기반으로 분석한 세금 절세 방안입니다.
            {totalPotentialSavings > 0 && (
              <div className="font-semibold mt-1 text-lg text-primary">
                총 예상 절세 가능 금액: {formatCurrency(totalPotentialSavings)}
              </div>
            )}
          </CardDescription>
        </CardHeader>
      </Card>
      
      <Alert variant="default" className="mb-8 bg-blue-50 border-blue-200">
        <AlertCircle className="h-5 w-5 text-blue-500" />
        <AlertTitle className="text-blue-700 text-lg">참고 사항</AlertTitle>
        <AlertDescription className="text-blue-600">
          아래 제안은 입력하신 정보를 기반으로 한 일반적인 세금 절세 방안입니다. 
          실제 세금 상황은 개인마다 다를 수 있으므로, 최종 결정 전에 세무 전문가와 상담하시기 바랍니다.
        </AlertDescription>
      </Alert>
      
      {suggestions.length === 0 ? (
        <div className="text-center py-10 border rounded-lg">
          <Lightbulb className="h-12 w-12 text-primary mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">현재 추가 절세 제안이 없습니다</h3>
          <p className="text-gray-600 max-w-lg mx-auto">
            입력하신 정보를 분석한 결과, 현재로서는 추가 절세 방안을 찾지 못했습니다. 
            더 자세한 재무 정보를 입력하시면 더 정확한 분석이 가능합니다.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedSuggestions.map((suggestion) => (
            <Card key={suggestion.id} className="border border-gray-200 bg-white hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <TrendingUp className="h-6 w-6 mr-3 text-primary" />
                    <CardTitle className="text-lg font-semibold text-primary-dark">{suggestion.title}</CardTitle>
                  </div>
                  <Badge 
                    variant={
                      suggestion.priority === 'high' ? 'default' : 
                      suggestion.priority === 'medium' ? 'secondary' : 'outline'
                    }
                    className={
                      suggestion.priority === 'high' ? 'bg-primary text-white' : 
                      suggestion.priority === 'medium' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' : 
                      'bg-gray-100 text-gray-800 hover:bg-gray-100'
                    }
                  >
                    {suggestion.priority === 'high' ? '높은 우선순위' : 
                     suggestion.priority === 'medium' ? '중간 우선순위' : '낮은 우선순위'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{suggestion.description}</p>
                
                {suggestion.potentialSavings && suggestion.potentialSavings > 0 && (
                  <div className="flex items-center text-success font-medium mt-2 bg-success/5 p-3 rounded-md">
                    <ArrowRight className="h-5 w-5 mr-2 flex-shrink-0" />
                    <span>예상 절세 가능 금액: <span className="font-bold">{formatCurrency(suggestion.potentialSavings)}</span></span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Expert Consultation Section */}
      <Card className="mt-8 border-2 border-blue-200 bg-blue-50">
        <CardHeader className="bg-blue-100">
          <div className="flex items-center">
            <Users className="h-6 w-6 mr-2 text-blue-600" />
            <CardTitle className="text-xl font-heading font-semibold text-blue-800">
              세무 전문가 상담 (Expert Tax Consultation)
            </CardTitle>
          </div>
          <CardDescription className="text-blue-700">
            절세방안을 실현하시길 원하시면 전문가와 상담하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone Consultation */}
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <div className="flex items-center mb-2">
                <Phone className="h-5 w-5 mr-2 text-blue-600" />
                <h3 className="font-semibold text-blue-800">전화 상담 (Phone Consultation)</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                즉시 전문가와 통화하여 세무 문제를 해결하세요
              </p>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => window.open('tel:+1-800-TAX-HELP', '_self')}
              >
                <Phone className="h-4 w-4 mr-2" />
                1-800-TAX-HELP
              </Button>
            </div>

            {/* Email Consultation */}
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <div className="flex items-center mb-2">
                <Mail className="h-5 w-5 mr-2 text-blue-600" />
                <h3 className="font-semibold text-blue-800">이메일 상담 (Email Consultation)</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                세부적인 세무 질문을 이메일로 문의하세요
              </p>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => window.open('mailto:experts@eztax.com?subject=세무상담 문의 (Tax Consultation Inquiry)', '_blank')}
              >
                <Mail className="h-4 w-4 mr-2" />
                experts@eztax.com
              </Button>
            </div>

            {/* Live Chat */}
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <div className="flex items-center mb-2">
                <MessageCircle className="h-5 w-5 mr-2 text-blue-600" />
                <h3 className="font-semibold text-blue-800">실시간 채팅 (Live Chat)</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                온라인 채팅으로 빠른 답변을 받으세요
              </p>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={() => window.open('https://chat.eztax.com', '_blank')}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                채팅 시작하기
              </Button>
            </div>

            {/* Video Consultation */}
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <div className="flex items-center mb-2">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                <h3 className="font-semibold text-blue-800">화상 상담 (Video Consultation)</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                화상통화로 전문가와 1:1 상담을 진행하세요
              </p>
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => window.open('https://calendly.com/eztax-experts', '_blank')}
              >
                <Users className="h-4 w-4 mr-2" />
                상담 예약하기
              </Button>
            </div>
          </div>

          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-yellow-800">
              <strong>상담 시간:</strong> 월-금 9AM-6PM (EST) | <strong>응답 시간:</strong> 이메일 24시간 이내, 채팅 즉시
              <br />
              <strong>상담료:</strong> 첫 15분 무료, 이후 분당 $2.99
            </AlertDescription>
          </Alert>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-2">전문가 상담이 도움이 되는 경우:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 복잡한 사업 소득이나 투자 소득이 있는 경우</li>
              <li>• 여러 주에서 소득이 발생한 경우</li>
              <li>• 국제 소득이나 해외 자산이 있는 경우</li>
              <li>• 대규모 자선 기부나 특별 공제가 필요한 경우</li>
              <li>• IRS 감사나 세무 문제가 발생한 경우</li>
              <li>• 은퇴 계획이나 부동산 거래와 관련된 세무 문제</li>
            </ul>
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