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
    { id: 1, name: 'Personal Info', path: '/personal-info', completed: currentStep > 1 },
    { id: 2, name: 'Income', path: '/income', completed: currentStep > 2 },
    { id: 3, name: 'Deductions', path: '/deductions', completed: currentStep > 3 },
    { id: 4, name: 'Tax Credits', path: '/tax-credits', completed: currentStep > 4 },
    { id: 5, name: 'Additional Tax', path: '/additional-tax', completed: currentStep > 5 },
    { id: 6, name: 'Review', path: '/review', completed: currentStep > 6 },
  ];

  const handleStepClick = (step: Step) => {
    // Only allow clicking on completed steps or the current step
    if (step.completed || step.id === currentStep) {
      navigate(step.path);
    }
  };

  return (
    <div className="progress-indicator flex justify-between mb-10">
      {steps.map((step) => (
        <div 
          key={step.id} 
          className={`step flex-1 text-center 
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
