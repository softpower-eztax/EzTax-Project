import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Check, CreditCard, Lock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

// 결제 수단 타입
type PaymentMethod = 'card' | 'paypal';

export default function Payment() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // URL에서 선택한 플랜 정보 가져오기
  const [plan, setPlan] = useState('');
  const [planDetails, setPlanDetails] = useState({
    name: '',
    price: '',
    period: '',
    isAnnual: false
  });
  
  // 결제 수단 상태
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  
  // 신용카드 입력 상태
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvc: ''
  });
  
  // 결제 처리 상태
  const [isProcessing, setIsProcessing] = useState(false);
  
  // URL에서 플랜 파라미터 파싱
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get('plan') || '';
    setPlan(planParam);
    
    // 플랜 정보 설정
    const isStandard = planParam.includes('standard');
    const isAnnual = planParam.includes('annual');
    
    setPlanDetails({
      name: isStandard ? '스탠다드 플랜' : '프로 플랜',
      price: isStandard 
        ? (isAnnual ? '$95.88' : '$9.99') 
        : (isAnnual ? '$191.88' : '$19.99'),
      period: isAnnual ? '년' : '월',
      isAnnual
    });
  }, [location]);
  
  // 카드 정보 입력 핸들러
  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardDetails({
      ...cardDetails,
      [name]: value
    });
  };
  
  // 결제 처리 핸들러
  const handlePayment = () => {
    // 결제 처리 시작
    setIsProcessing(true);
    
    // 실제로는 여기서 Stripe 또는 PayPal SDK를 통해 결제 처리를 해야함
    // 현재는 시뮬레이션만 진행
    setTimeout(() => {
      setIsProcessing(false);
      
      // 결제 성공 토스트
      toast({
        title: "결제 성공",
        description: "프리미엄 기능이 활성화되었습니다.",
        duration: 5000
      });
      
      // 자본 이득 계산기 페이지로 이동
      setTimeout(() => {
        setLocation('/capital-gains');
      }, 1500);
    }, 2000);
  };
  
  return (
    <div className="container max-w-3xl mx-auto py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">결제 (Payment)</h1>
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/premium-features')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>프리미엄 기능으로 돌아가기</span>
        </Button>
      </div>
      
      {/* 선택한 플랜 정보 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>선택한 구독 플랜</CardTitle>
          <CardDescription>결제를 완료하면 즉시 프리미엄 기능이 활성화됩니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">{planDetails.name}</h3>
              <p className="text-gray-500">
                {planDetails.isAnnual ? '연간 구독' : '월간 구독'} 
                {planDetails.isAnnual && ' (20% 할인 적용)'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{planDetails.price}</p>
              <p className="text-gray-500">/{planDetails.period}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 결제 수단 선택 */}
      <Tabs defaultValue="card" onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="card">신용카드</TabsTrigger>
          <TabsTrigger value="paypal">PayPal</TabsTrigger>
        </TabsList>
        
        {/* 신용카드 결제 */}
        <TabsContent value="card">
          <Card>
            <CardHeader>
              <CardTitle>신용카드 정보</CardTitle>
              <CardDescription>안전한 결제를 위해 SSL 암호화를 사용합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cardNumber">카드 번호</Label>
                <div className="relative">
                  <input
                    id="cardNumber"
                    name="number"
                    value={cardDetails.number}
                    onChange={handleCardInputChange}
                    placeholder="1234 5678 9012 3456"
                    className="w-full p-2 border rounded pl-10 mt-1"
                  />
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="cardName">카드 소유자 이름</Label>
                <input
                  id="cardName"
                  name="name"
                  value={cardDetails.name}
                  onChange={handleCardInputChange}
                  placeholder="홍길동"
                  className="w-full p-2 border rounded mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryDate">만료일 (MM/YY)</Label>
                  <input
                    id="expiryDate"
                    name="expiry"
                    value={cardDetails.expiry}
                    onChange={handleCardInputChange}
                    placeholder="MM/YY"
                    className="w-full p-2 border rounded mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cvc">CVC/CVV</Label>
                  <div className="relative">
                    <input
                      id="cvc"
                      name="cvc"
                      value={cardDetails.cvc}
                      onChange={handleCardInputChange}
                      placeholder="123"
                      className="w-full p-2 border rounded pl-10 mt-1"
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handlePayment} 
                className="w-full" 
                disabled={isProcessing}
              >
                {isProcessing ? '처리중...' : `${planDetails.price} 결제하기`}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* PayPal 결제 */}
        <TabsContent value="paypal">
          <Card>
            <CardHeader>
              <CardTitle>PayPal로 결제</CardTitle>
              <CardDescription>
                PayPal로 안전하게 결제하세요. 계정이 없으셔도 게스트 결제가 가능합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center p-8">
              {/* PayPal 버튼은 실제로는 PayPal SDK를 통해 렌더링해야 함 */}
              <div className="p-6 border-2 border-blue-500 rounded-md bg-blue-50 text-blue-700 w-full text-center cursor-pointer">
                <div className="text-xl font-bold mb-2">PayPal</div>
                <div className="text-sm">PayPal 버튼을 클릭하여 결제를 진행하세요</div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handlePayment} 
                className="w-full" 
                disabled={isProcessing}
              >
                {isProcessing ? '처리중...' : 'PayPal로 결제하기'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* 보안 및 환불 정책 */}
      <div className="mt-8 p-4 bg-gray-50 rounded border text-sm text-gray-600">
        <div className="flex items-start gap-2 mb-2">
          <Lock className="h-4 w-4 mt-0.5 text-gray-500" />
          <p>
            <strong>보안 결제:</strong> 모든 결제 정보는 SSL 암호화되어 안전하게 처리됩니다.
          </p>
        </div>
        <div className="flex items-start gap-2">
          <Check className="h-4 w-4 mt-0.5 text-gray-500" />
          <p>
            <strong>환불 정책:</strong> 구독 후 30일 이내에 환불 요청 시 전액 환불이 가능합니다.
            프리미엄 기능에 만족하지 못하신 경우 고객센터로 문의해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}