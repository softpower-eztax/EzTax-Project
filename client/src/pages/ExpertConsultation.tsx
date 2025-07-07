import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Mail, ArrowLeft } from "lucide-react";

export default function ExpertConsultation() {
  const [, navigate] = useLocation();

  const handleEmailContact = () => {
    window.open('mailto:eztax88@gmail.com?subject=세무상담 문의 (Tax Consultation Inquiry)&body=안녕하세요,%0A%0A세무 상담을 요청드립니다.%0A%0A문의 내용:%0A%0A연락처:%0A%0A감사합니다.', '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Mail className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">전문가 상담</h1>
        </div>
        <p className="text-lg text-gray-600">
          절세방안을 실현하시려면 전문가와 상담하세요
        </p>
      </div>

      {/* When Expert Consultation is Helpful */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-800">
            전문가 상담이 도움이 되는 경우:
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-blue-600 font-bold mr-3">•</span>
              <span>복잡한 사업 소득이나 투자 소득이 있는 경우</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 font-bold mr-3">•</span>
              <span>여러 주에서 소득이 발생한 경우</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 font-bold mr-3">•</span>
              <span>국제 소득이나 해외 자산이 있는 경우</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 font-bold mr-3">•</span>
              <span>대규모 자선 기부나 특별 공제가 필요한 경우</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 font-bold mr-3">•</span>
              <span>IRS 감사나 세무 문제가 발생한 경우</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 font-bold mr-3">•</span>
              <span>은퇴 계획이나 부동산 거래와 관련된 세무 문제</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Contact Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Mail className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-blue-800">전문가 상담 문의</h2>
          </div>
          <p className="text-blue-700 mb-6">
            위와 같은 복잡한 세무 상황이 있으시면 전문가에게 문의하세요
          </p>
          
          <Button
            onClick={handleEmailContact}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 text-lg"
            size="lg"
          >
            <Mail className="mr-2 h-5 w-5" />
            eztax88@gmail.com으로 문의하기
          </Button>
        </CardContent>
      </Card>

      {/* Back Button */}
      <div className="text-center pt-4">
        <Button
          variant="outline"
          onClick={() => navigate('/review')}
          className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 font-semibold px-6 py-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          검토 페이지로 돌아가기 (Back to Review)
        </Button>
      </div>
    </div>
  );
}