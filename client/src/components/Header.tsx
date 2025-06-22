import React, { useState } from 'react';
import Logo from './Logo';
import { useToast } from "@/hooks/use-toast";
import { HelpCircle, Save, LogIn, LogOut, User, RefreshCcw, ClipboardCheck, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useTaxContext } from '@/context/TaxContext';
import { useAuth } from '@/hooks/use-auth';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Header: React.FC = () => {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const { saveTaxReturn, resetToZero, updateTaxData } = useTaxContext();
  const { user, logoutMutation } = useAuth();
  const [isResetting, setIsResetting] = useState(false);

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
  
  // 모든 필드 초기화 함수
  const handleReset = async () => {
    try {
      setIsResetting(true);
      await resetToZero();
      // 홈페이지로 리디렉션
      navigate('/');
    } catch (error) {
      toast({
        title: "초기화 오류", 
        description: "데이터 초기화 중 문제가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Only show buttons on tax form pages
  const showButtons = location !== '/' && location !== '/not-found' && location !== '/auth';

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate('/');
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="cursor-pointer" onClick={() => navigate('/')}>
          <Logo />
        </div>
        
        <div className="flex items-center space-x-4">
          {showButtons && (
            <>
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
                onClick={async () => {
                  // TaxContext에서 현재 personalInfo 가져오기 (더 안정적)
                  try {
                    const currentPersonalInfo = taxData.personalInfo;
                    console.log("Filing Status 확인 전 TaxContext 데이터:", currentPersonalInfo);
                    
                    if (currentPersonalInfo && (currentPersonalInfo.firstName || currentPersonalInfo.lastName || currentPersonalInfo.ssn)) {
                      // localStorage에 저장 (강제 덮어쓰기)
                      localStorage.setItem('tempPersonalInfo', JSON.stringify(currentPersonalInfo));
                      console.log("tempPersonalInfo localStorage에 저장됨:", currentPersonalInfo);
                      
                      // 서버에 저장
                      await saveTaxReturn();
                      console.log("Filing Status 확인 전 자동 저장 완료");
                    } else {
                      console.log("TaxContext에 개인정보 없음, localStorage 확인 없이 진행");
                    }
                    
                    navigate('/filing-status-checker');
                  } catch (error) {
                    console.error("자동 저장 실패:", error);
                    // 저장 실패해도 페이지 이동은 허용
                    navigate('/filing-status-checker');
                  }
                }}
              >
                <ClipboardCheck className="h-4 w-4 mr-1" />
                Filing Status 확인
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
            </>
          )}
          
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center text-sm font-medium">
                <User className="h-4 w-4 mr-1" />
                {user.username}
              </div>
              {user.username === 'admin' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-primary-dark hover:text-primary flex items-center text-sm"
                  onClick={() => navigate('/admin')}
                >
                  <Shield className="h-4 w-4 mr-1" />
                  관리자
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                className="text-primary-dark hover:text-primary flex items-center text-sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span>로그아웃(Logout)</span>
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              className="text-primary-dark hover:text-primary flex items-center text-sm"
              onClick={handleLogin}
            >
              <LogIn className="h-4 w-4 mr-1" />
              <span>로그인(Login)</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
