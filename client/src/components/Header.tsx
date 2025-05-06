import React from 'react';
import Logo from './Logo';
import { useToast } from "@/hooks/use-toast";
import { HelpCircle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useTaxContext } from '@/context/TaxContext';

const Header: React.FC = () => {
  const { toast } = useToast();
  const [location] = useLocation();
  const { saveTaxReturn } = useTaxContext();

  const handleSaveProgress = async () => {
    try {
      await saveTaxReturn();
      toast({
        title: "진행 상황 저장됨",
        description: "세금 신고 진행 상황이 성공적으로 저장되었습니다.",
      });
    } catch (error) {
      toast({
        title: "저장 오류",
        description: "진행 상황을 저장하는 중 문제가 발생했습니다. 다시 시도해 주세요.",
        variant: "destructive",
      });
    }
  };

  // Only show buttons on tax form pages
  const showButtons = location !== '/' && location !== '/not-found';

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Logo />
        
        {showButtons && (
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              className="text-primary-dark hover:text-primary flex items-center text-sm"
              onClick={handleSaveProgress}
            >
              <Save className="h-4 w-4 mr-1" />
              진행 상황 저장
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="text-primary-dark hover:text-primary flex items-center text-sm"
              onClick={() => {
                toast({
                  title: "도움말 및 지원",
                  description: "지원 팀은 월요일부터 금요일까지 오전 9시부터 오후 5시(동부 시간)까지 support@eztax.com에서 이용 가능합니다.",
                });
              }}
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              도움말
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
