import React from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

interface StepNavigationProps {
  prevStep: string;
  nextStep: string;
  onNext?: () => boolean | Promise<boolean>; // Return true to proceed, false to prevent navigation
  onPrev?: () => void;
  submitText?: string;
  isLastStep?: boolean;
}

const StepNavigation: React.FC<StepNavigationProps> = ({
  prevStep,
  nextStep,
  onNext,
  onPrev,
  submitText = 'Next',
  isLastStep = false,
}) => {
  const [, navigate] = useLocation();

  const handleNext = async () => {
    console.log("StepNavigation: handleNext 호출됨");
    if (onNext) {
      try {
        const result = onNext();
        let canProceed;
        
        if (result instanceof Promise) {
          console.log("StepNavigation: Promise 감지됨, Promise 결과 대기중...");
          canProceed = await result;
        } else {
          console.log("StepNavigation: 동기 결과 감지됨:", result);
          canProceed = result;
        }
        
        console.log("StepNavigation: 진행 가능 여부:", canProceed);
        if (canProceed) {
          console.log("StepNavigation: 다음 단계로 이동:", nextStep);
          navigate(nextStep);
        }
      } catch (error) {
        console.error("StepNavigation: 오류 발생", error);
      }
    } else {
      console.log("StepNavigation: onNext 콜백 없음, 바로 다음 단계로 이동");
      navigate(nextStep);
    }
  };

  const handlePrev = () => {
    if (onPrev) {
      onPrev();
    }
    navigate(prevStep);
  };

  return (
    <div className="flex justify-between mt-10">
      <Button
        variant="outline"
        className="px-6 py-2 border border-primary text-primary font-semibold rounded hover:bg-primary-light hover:text-white transition duration-200"
        onClick={handlePrev}
      >
        이전 단계
      </Button>
      
      <Button
        className="px-6 py-2 bg-primary text-white font-semibold rounded hover:bg-primary-dark transition duration-200"
        onClick={handleNext}
      >
        {isLastStep ? '세금 신고서 제출' : `저장 & 다음 단계`}
      </Button>
    </div>
  );
};

export default StepNavigation;
