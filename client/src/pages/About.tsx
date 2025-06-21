import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  TrendingUpIcon, 
  StarIcon, 
  UsersIcon,
  ShieldIcon,
  GlobeIcon,
  AwardIcon,
  BuildingIcon,
  PhoneIcon,
  MailIcon
} from "lucide-react";
import expertPhotoPath from "@assets/내이미지_1750444585639.jpg";
import visionImagePath from "@assets/ChatGPT Image Jun 20, 2025, 09_38_11 PM_1750473512527.png";
import missionImagePath from "@assets/ChatGPT Image Jun 20, 2025, 09_42_31 PM_1750473769339.png";

export default function About() {
  const [, navigate] = useLocation();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">


      {/* Company Mission & Vision */}
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <StarIcon className="h-6 w-6" />
              우리의 미션
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-gray-700 leading-relaxed mb-4">
                  기술의 힘으로 복잡한 세무와 은퇴 계획을 누구나 쉽게 이해하고 실행할 수 있게 만듭니다. 
                  혁신적인 핀테크 솔루션을 통해 개인의 재정적 성공을 지원하고, 
                  더 풍요로운 미래를 향한 여정에 동행합니다.
                </p>
                <p className="text-blue-600 font-medium text-sm">
                  혁신적인 핀테크 솔루션을 통해 개인의 재정적 성공을 지원
                </p>
              </div>
              
              <div className="flex justify-center">
                <img 
                  src={missionImagePath} 
                  alt="EzTax Mission - 혁신적인 핀테크 솔루션을 통해 개인의 재정적 성공을 지원" 
                  className="max-w-full h-auto rounded-lg shadow-md"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <TrendingUpIcon className="h-6 w-6" />
              우리의 비전
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-gray-700 leading-relaxed mb-4">
                  세계 최고의 AI 기반 세무·은퇴 플랫폼이 되어 모든 사람이 재정적 자유를 달성할 수 있도록 돕겠습니다. 
                  몬테카를로 시뮬레이션과 같은 첨단 기술로 정확한 예측을 제공하고, 
                  개인 맞춤형 전략으로 부의 창조를 실현합니다.
                </p>
                <p className="text-green-600 font-medium text-sm">
                  절세, 그 이상의 가치를 전하는 재정플랜 플랫폼
                </p>
              </div>
              
              <div className="flex justify-center">
                <img 
                  src={visionImagePath} 
                  alt="EzTax Vision - 절세, 그 이상의 가치를 전하는 재정플랜 플랫폼" 
                  className="max-w-full h-auto rounded-lg shadow-md"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Core Values */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">핵심 가치</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <ShieldIcon className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">신뢰성</h3>
              <p className="text-sm text-gray-600">
                정확한 계산과 검증된 데이터로 믿을 수 있는 서비스를 제공합니다.
              </p>
            </div>
            <div className="text-center">
              <UsersIcon className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">접근성</h3>
              <p className="text-sm text-gray-600">
                복잡한 세무를 누구나 쉽게 이해할 수 있도록 단순화합니다.
              </p>
            </div>
            <div className="text-center">
              <AwardIcon className="h-12 w-12 text-orange-600 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">전문성</h3>
              <p className="text-sm text-gray-600">
                세무 전문가의 깊이 있는 지식과 경험을 기술로 구현합니다.
              </p>
            </div>
            <div className="text-center">
              <GlobeIcon className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">혁신</h3>
              <p className="text-sm text-gray-600">
                AI와 데이터 분석으로 차세대 금융 서비스를 선도합니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Founder & CEO Profile */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 text-2xl">
            <BuildingIcon className="h-6 w-6" />
            창립자 & CEO 소개
          </CardTitle>
          <CardDescription className="text-blue-600">
            EzTax를 이끄는 세무·투자 전문가를 만나보세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-shrink-0 text-center lg:text-left">
              <img 
                src={expertPhotoPath}
                alt="지대현 EA/RIA"
                className="w-32 h-32 rounded-full object-cover border-4 border-blue-200 mx-auto lg:mx-0"
              />
              <h3 className="text-2xl font-bold text-blue-800 mt-4 mb-2">
                지대현 EA / RIA
              </h3>
              <p className="text-blue-700 font-medium mb-4">
                EzTax 창립자 & CEO | 세무·투자 전문가
              </p>
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                <Badge variant="outline" className="border-blue-300 text-blue-700">IRS EA</Badge>
                <Badge variant="outline" className="border-blue-300 text-blue-700">SEC RIA</Badge>
                <Badge variant="outline" className="border-blue-300 text-blue-700">저자</Badge>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-blue-800 mb-3">📚 주요 이력</h4>
                  <ul className="text-sm text-blue-700 space-y-2">
                    <li>💼 EzTax – 창립자 & CEO</li>
                    <li>📈 Nomura Securities – 애널리스트</li>
                    <li>🏦 교보생명 – 재무실부장</li>
                    <li>🏢 LG전자 – IR팀장</li>
                    <li>🏭 한화그룹 – 전략기획 및 재무담당 임원</li>
                    <li>🧾 IRS 공인 EA (Enrolled Agent)</li>
                    <li>📊 SEC 등록 투자자문인 (RIA)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-blue-800 mb-3">🧠 전문 분야</h4>
                  <ul className="text-sm text-blue-700 space-y-2">
                    <li>• 미국 개인 및 사업자 세무 상담</li>
                    <li>• 자산관리 및 은퇴 플랜 최적화</li>
                    <li>• 고액자산가 맞춤 절세 전략</li>
                    <li>• 해외자산 및 글로벌 세무 규정 대응</li>
                    <li>• 투자수익 대비 실효세율 분석</li>
                    <li>• 몬테카를로 시뮬레이션 모델링</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-white/80 p-6 rounded-lg mb-6">
                <h4 className="font-semibold text-blue-800 mb-3">💭 CEO 메시지</h4>
                <p className="text-blue-800 leading-relaxed mb-4">
                  <strong>📌 "Less Tax, More Wealth"</strong> 철학을 바탕으로 EzTax를 설립했습니다. 
                  국내외 유수의 금융·기업 그룹에서 재무 및 IR 책임자로 경력을 쌓으며, 
                  복잡한 세무와 투자의 세계에서 많은 사람들이 겪는 어려움을 목격했습니다.
                </p>
                <p className="text-blue-800 leading-relaxed mb-4">
                  EzTax는 단순한 세무 계산기가 아닙니다. 첨단 AI 기술과 몬테카를로 시뮬레이션을 활용하여 
                  개인의 재정 상황을 종합적으로 분석하고, 세금 절감과 부의 극대화를 동시에 달성할 수 있는 
                  맞춤형 전략을 제시합니다.
                </p>
                <p className="text-blue-800 leading-relaxed italic font-medium">
                  "기술로 세상의 세금 고민을 해결하고, 더 풍요로운 은퇴를 만들어갑니다."
                </p>
              </div>

              <div className="bg-blue-100/50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-3">📖 저서</h4>
                <p className="text-blue-700 font-medium">
                  『절세로 시작하는 은퇴설계 Less Tax, Better Retirement』
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  실무진이 알려주는 세금 절감과 자산 증대의 비밀
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-center">
            <PhoneIcon className="h-6 w-6 text-primary" />
            연락처 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-4">전문가 상담 예약</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <PhoneIcon className="h-5 w-5 text-primary" />
                  <span>전화 상담 가능</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <MailIcon className="h-5 w-5 text-primary" />
                  <span>이메일 상담 가능</span>
                </div>
              </div>
              <Button className="mt-4 bg-primary hover:bg-primary-dark">
                상담 예약하기
              </Button>
            </div>
            
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-4">EzTax 플랫폼</h3>
              <p className="text-gray-600 mb-4">
                지금 바로 무료로 세금 계산과 은퇴 진단을 시작해보세요
              </p>
              <div className="space-y-2">
                <Button 
                  className="w-full bg-green-500 hover:bg-green-600"
                  onClick={() => navigate('/personal-info')}
                >
                  세금 신고 시작하기
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-primary text-primary hover:bg-primary/10"
                  onClick={() => navigate('/retirement-score')}
                >
                  은퇴 준비 상태 진단
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Back to Home */}
      <div className="text-center">
        <Button 
          variant="outline" 
          onClick={() => navigate('/')}
          className="border-gray-300"
        >
          홈으로 돌아가기
        </Button>
      </div>
    </div>
  );
}