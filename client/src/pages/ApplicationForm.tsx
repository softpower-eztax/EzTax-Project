import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';

interface ApplicationFormData {
  name: string;
  phone: string;
  email: string;
  selectedPlan: string;
  additionalRequests: string;
}

const ApplicationForm: React.FC = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ApplicationFormData>({
    name: '',
    phone: '',
    email: '',
    selectedPlan: '',
    additionalRequests: ''
  });

  // Get plan from URL parameters and pre-select it
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const planParam = urlParams.get('plan');
    if (planParam) {
      setFormData(prev => ({
        ...prev,
        selectedPlan: planParam
      }));
    }
  }, []);

  const handleInputChange = (field: keyof ApplicationFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast({
        title: "입력 오류",
        description: "이름을 입력해주세요.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!formData.phone.trim()) {
      toast({
        title: "입력 오류",
        description: "전화번호를 입력해주세요.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!formData.email.trim()) {
      toast({
        title: "입력 오류",
        description: "이메일을 입력해주세요.",
        variant: "destructive",
      });
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "입력 오류",
        description: "올바른 이메일 주소를 입력해주세요.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!formData.selectedPlan) {
      toast({
        title: "입력 오류",
        description: "검토 플랜을 선택해주세요.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call backend API to send application email
      const response = await fetch('/api/send-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to send application');
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "신청이 완료되었습니다",
          description: "eztax88@gmail.com으로 신청 정보가 전송되었습니다. 담당 세무사가 빠른 시일 내에 연락드릴 예정입니다.",
          variant: "default",
        });
        
        // Navigate back to pricing page
        navigate('/pricing');
      } else {
        throw new Error(result.message || 'Application failed');
      }
      
    } catch (error) {
      console.error('Application submission error:', error);
      toast({
        title: "신청 실패",
        description: "신청 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="mb-8">
        <Button 
          variant="outline" 
          onClick={() => navigate('/pricing')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          가격 안내로 돌아가기
        </Button>
        
        <h1 className="text-3xl font-heading font-bold text-primary-dark mb-2">
          유료검토 서비스 신청
        </h1>
        <p className="text-gray-dark">
          아래 정보를 입력해주시면 전문 세무사가 연락드리겠습니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-heading font-semibold">
            신청 정보 입력
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                type="text"
                placeholder="성함을 입력해주세요"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">전화번호 *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="연락 가능한 전화번호를 입력해주세요"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">이메일 *</Label>
              <Input
                id="email"
                type="email"
                placeholder="이메일 주소를 입력해주세요"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="selectedPlan">검토 플랜 선택 *</Label>
              <Select onValueChange={(value) => handleInputChange('selectedPlan', value)} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue placeholder="원하시는 검토 플랜을 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">기본 검토 ($99) - 개인 기본 세금 신고 검토</SelectItem>
                  <SelectItem value="advanced">고급 검토 ($199) - 복잡한 세무 상황 검토</SelectItem>
                  <SelectItem value="premium">프리미엄 검토 ($299) - 종합 세무 자문 및 최적화</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalRequests">추가 요청사항 (선택사항)</Label>
              <Textarea
                id="additionalRequests"
                placeholder="특별히 검토받고 싶은 부분이나 궁금한 점을 적어주세요"
                value={formData.additionalRequests}
                onChange={(e) => handleInputChange('additionalRequests', e.target.value)}
                disabled={isSubmitting}
                rows={4}
              />
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary-dark text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    신청 중...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    신청하기
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>안내사항:</strong> 신청서 제출 후 1-2일 내에 담당 세무사가 연락드립니다. 
          급하신 경우 eztax88@gmail.com으로 직접 문의해주세요.
        </p>
      </div>
    </div>
  );
};

export default ApplicationForm;