import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FilingStatus } from '@shared/schema';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { HelpCircle } from 'lucide-react';

// 컴포넌트 속성 정의
interface FilingStatusWizardProps {
  currentStatus: FilingStatus;
  onStatusChange: (status: FilingStatus) => void;
}

// 신고 상태별 정보 정의
const FILING_STATUS_INFO = {
  single: {
    title: '미혼 (Single)',
    description: '미혼이거나 이혼/별거 상태이며 다른 신고 상태에 해당하지 않는 경우',
    questions: [
      '미혼, 이혼, 또는 별거 상태인가요?',
      '다른 신고 상태 조건에 해당되지 않나요?'
    ]
  },
  married_joint: {
    title: '부부 공동 신고 (Married Filing Jointly)',
    description: '기혼이며 배우자와 공동으로 세금 신고를 하는 경우 (일반적으로 세금 혜택이 큼)',
    questions: [
      '현재 기혼 상태인가요?',
      '배우자와 함께 세금을 신고하실 건가요?'
    ]
  },
  married_separate: {
    title: '부부 개별 신고 (Married Filing Separately)',
    description: '기혼이지만 배우자와 별도로 세금 신고를 하는 경우 (특정 상황에서 유리할 수 있음)',
    questions: [
      '현재 기혼 상태인가요?',
      '배우자와 별도로 세금을 신고하고 싶으신가요?'
    ]
  },
  head_of_household: {
    title: '세대주 (Head of Household)',
    description: '미혼이며 부양가족이 있고 가정 유지 비용의 절반 이상을 부담하는 경우',
    questions: [
      '미혼, 이혼, 또는 별거 상태인가요?',
      '부양가족이 있나요?',
      '가정 유지 비용의 절반 이상을 부담하시나요?'
    ]
  },
  qualifying_widow: {
    title: '적격 미망인 (Qualifying Widow/er)',
    description: '배우자가 최근 2년 내에 사망했으며 부양 자녀가 있는 경우',
    questions: [
      '배우자가 최근 2년 내에 사망했나요?',
      '부양 자녀가 있나요?'
    ]
  }
};

export default function FilingStatusWizard({ currentStatus, onStatusChange }: FilingStatusWizardProps) {
  const [wizardOpen, setWizardOpen] = useState(false);

  // 신고 상태 변경 핸들러
  const handleStatusChange = (status: FilingStatus) => {
    onStatusChange(status);
    setWizardOpen(false);
  };

  return (
    <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          <HelpCircle className="h-3 w-3 mr-1" />
          신고 상태 도우미
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>신고 상태 결정 도우미</DialogTitle>
          <DialogDescription>
            세금 신고 시 가장 적합한 신고 상태(Filing Status)를 선택하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {Object.entries(FILING_STATUS_INFO).map(([status, info]) => (
            <Card 
              key={status}
              className={`p-4 cursor-pointer hover:bg-slate-50 ${currentStatus === status ? 'border-primary border-2' : ''}`}
              onClick={() => handleStatusChange(status as FilingStatus)}
            >
              <h3 className="font-bold text-lg mb-2">{info.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{info.description}</p>
              
              <div className="text-xs space-y-1 mt-2">
                <p className="font-semibold">해당되는 질문:</p>
                <ul className="list-disc pl-5">
                  {info.questions.map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-3 text-right">
                <Button 
                  variant={currentStatus === status ? "default" : "outline"} 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(status as FilingStatus);
                  }}
                >
                  {currentStatus === status ? '현재 선택됨' : '이 상태 선택하기'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setWizardOpen(false)}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}