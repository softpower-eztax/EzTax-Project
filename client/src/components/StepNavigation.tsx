import React from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

interface StepNavigationProps {
  prevStep: string;
  nextStep: string;
  onNext?: () => boolean; // Return true to proceed, false to prevent navigation
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

  const handleNext = () => {
    if (onNext) {
      const canProceed = onNext();
      if (canProceed) {
        navigate(nextStep);
      }
    } else {
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
        Previous
      </Button>
      
      <Button
        className="px-6 py-2 bg-primary text-white font-semibold rounded hover:bg-primary-dark transition duration-200"
        onClick={handleNext}
      >
        {isLastStep ? 'Submit Tax Return' : `Next: ${submitText}`}
      </Button>
    </div>
  );
};

export default StepNavigation;
