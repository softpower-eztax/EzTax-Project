import React from 'react';
import { useLocation } from 'wouter';
import { Check } from 'lucide-react';

type Step = {
  id: number;
  name: string;
  path: string;
  completed: boolean;
};

interface ProgressTrackerProps {
  currentStep: number;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ currentStep }) => {
  const [, navigate] = useLocation();

  const steps: Step[] = [
    { id: 1, name: '개인 정보', path: '/personal-info', completed: currentStep > 1 },
    { id: 2, name: '소득', path: '/income', completed: currentStep > 2 },
    { id: 3, name: '공제 항목', path: '/deductions', completed: currentStep > 3 },
    { id: 4, name: '세액 공제', path: '/tax-credits', completed: currentStep > 4 },
    { id: 5, name: '추가 세금', path: '/additional-tax', completed: currentStep > 5 },
    { id: 6, name: '검토', path: '/review', completed: currentStep > 6 },
  ];

  const handleStepClick = (step: Step) => {
    // 모든 단계를 클릭 가능하게 함
    navigate(step.path);
  };

  return (
    <div className="progress-indicator flex justify-between mb-10">
      {steps.map((step) => (
        <div 
          key={step.id} 
          className={`step flex-1 text-center cursor-pointer
            ${step.id === currentStep ? 'active-step' : ''} 
            ${step.completed ? 'completed-step' : ''}`}
          onClick={() => handleStepClick(step)}
        >
          <div 
            className={`step-number h-6 w-6 rounded-full 
              ${step.completed ? 'bg-success' : step.id === currentStep ? 'bg-primary' : 'bg-gray-medium text-gray-dark'} 
              inline-flex items-center justify-center text-sm mb-2 cursor-pointer`}
          >
            {step.completed ? <Check className="h-4 w-4" /> : step.id}
          </div>
          <div className={`step-label text-xs ${step.id === currentStep ? 'font-semibold' : step.completed ? 'font-semibold' : ''}`}>
            {step.name}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProgressTracker;
