import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FilingStatus } from '@shared/schema';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { HelpCircle, CheckCircle2 } from 'lucide-react';

interface FilingStatusWizardProps {
  currentStatus: FilingStatus;
  onStatusChange: (status: FilingStatus) => void;
}

type Question = {
  id: string;
  text: string;
  textKo: string;
  options: {
    id: string;
    text: string;
    textKo: string;
    nextQuestion?: string;
    filingStatus?: FilingStatus;
  }[];
};

const QUESTIONS: Record<string, Question> = {
  maritalStatus: {
    id: 'maritalStatus',
    text: 'What is your marital status as of December 31?',
    textKo: '12월 31일 기준으로 귀하의 결혼 상태는 어떻습니까?',
    options: [
      {
        id: 'single',
        text: 'I am not married',
        textKo: '미혼입니다',
        nextQuestion: 'dependents'
      },
      {
        id: 'married',
        text: 'I am married',
        textKo: '기혼입니다',
        nextQuestion: 'filingWithSpouse'
      },
      {
        id: 'widowed',
        text: 'I am a widow/widower',
        textKo: '배우자가 사망했습니다',
        nextQuestion: 'qualifyingWidow'
      }
    ]
  },
  filingWithSpouse: {
    id: 'filingWithSpouse',
    text: 'Do you want to file taxes with your spouse?',
    textKo: '배우자와 함께 세금을 신고하시겠습니까?',
    options: [
      {
        id: 'together',
        text: 'Yes, we will file together',
        textKo: '예, 함께 신고하겠습니다',
        filingStatus: 'married_joint'
      },
      {
        id: 'separate',
        text: 'No, we will file separately',
        textKo: '아니오, 별도로 신고하겠습니다',
        filingStatus: 'married_separate'
      }
    ]
  },
  dependents: {
    id: 'dependents',
    text: 'Did you pay more than half the cost of keeping up a home for a qualifying person?',
    textKo: '자격을 갖춘 사람을 위해 가정 유지 비용의 절반 이상을 지불했습니까?',
    options: [
      {
        id: 'yes',
        text: 'Yes',
        textKo: '예',
        filingStatus: 'head_of_household'
      },
      {
        id: 'no',
        text: 'No',
        textKo: '아니오',
        filingStatus: 'single'
      }
    ]
  },
  qualifyingWidow: {
    id: 'qualifyingWidow',
    text: 'Did your spouse die within the last two years, and do you have a dependent child?',
    textKo: '배우자가 최근 2년 내에 사망했으며, 부양 자녀가 있습니까?',
    options: [
      {
        id: 'yes',
        text: 'Yes',
        textKo: '예',
        filingStatus: 'qualifying_widow'
      },
      {
        id: 'no',
        text: 'No',
        textKo: '아니오',
        nextQuestion: 'dependents'
      }
    ]
  }
};

const FILING_STATUS_INFO: Record<FilingStatus, { title: string, titleKo: string, description: string, descriptionKo: string }> = {
  single: {
    title: 'Single',
    titleKo: '미혼',
    description: 'You are unmarried or legally separated from your spouse under a divorce or separate maintenance decree and don\'t qualify for another filing status.',
    descriptionKo: '미혼이거나 이혼 또는 별거 상태이며 다른 신고 상태에 해당하지 않습니다.'
  },
  married_joint: {
    title: 'Married Filing Jointly',
    titleKo: '부부 공동 신고',
    description: 'You are married and both you and your spouse agree to file a joint tax return. This often results in a lower tax bill compared to filing separately.',
    descriptionKo: '기혼이며 귀하와 배우자가 공동으로 세금 신고를 하는 경우입니다. 일반적으로 별도 신고보다 세금이 적게 부과됩니다.'
  },
  married_separate: {
    title: 'Married Filing Separately',
    titleKo: '부부 별도 신고',
    description: 'You are married but you and your spouse are filing separate tax returns. This may be beneficial in specific situations, but generally results in higher taxes.',
    descriptionKo: '기혼이지만 귀하와 배우자가 별도로 세금 신고를 하는 경우입니다. 특정 상황에서는 유리할 수 있지만, 일반적으로 세금이 더 많이 부과됩니다.'
  },
  head_of_household: {
    title: 'Head of Household',
    titleKo: '세대주',
    description: 'You are unmarried and pay more than half the cost of keeping up a home for yourself and a qualifying person. This status often provides better tax rates than filing as single.',
    descriptionKo: '미혼이며 자격을 갖춘 사람과 함께 가정을 유지하는 비용의 절반 이상을 지불하는 경우입니다. 일반적으로 미혼 신고보다 유리한 세율이 적용됩니다.'
  },
  qualifying_widow: {
    title: 'Qualifying Widow(er) with Dependent Child',
    titleKo: '부양 자녀가 있는 적격 미망인',
    description: 'Your spouse died within the last two years, you have a dependent child, and you meet certain other conditions. This allows you to use joint return tax rates.',
    descriptionKo: '배우자가 최근 2년 내에 사망했으며, 부양 자녀가 있고 특정 조건을 충족하는 경우입니다. 공동 신고 세율을 적용받을 수 있습니다.'
  }
};

export default function FilingStatusWizard({ currentStatus, onStatusChange }: FilingStatusWizardProps) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('maritalStatus');
  const [statusInfoOpen, setStatusInfoOpen] = useState(false);
  
  const handleOptionSelect = (option: any) => {
    if (option.filingStatus) {
      onStatusChange(option.filingStatus);
      setWizardOpen(false);
    } else if (option.nextQuestion) {
      setCurrentQuestion(option.nextQuestion);
    }
  };
  
  const resetWizard = () => {
    setCurrentQuestion('maritalStatus');
  };
  
  return (
    <div className="flex items-center gap-2">
      <Dialog open={wizardOpen} onOpenChange={(open) => {
        setWizardOpen(open);
        if (open) resetWizard();
      }}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1 text-sm">
            <HelpCircle className="h-4 w-4" />
            <span>신고 상태 결정 도우미</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>신고 상태 결정 (Filing Status Wizard)</DialogTitle>
            <DialogDescription>
              몇 가지 질문에 답하여 적합한 신고 상태를 찾을 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          
          {QUESTIONS[currentQuestion] && (
            <div className="py-4">
              <h3 className="mb-4 text-lg font-medium">
                {QUESTIONS[currentQuestion].textKo}
                <br />
                <span className="text-sm text-muted-foreground">
                  {QUESTIONS[currentQuestion].text}
                </span>
              </h3>
              <RadioGroup defaultValue={QUESTIONS[currentQuestion].options[0].id} className="space-y-3">
                {QUESTIONS[currentQuestion].options.map((option) => (
                  <div key={option.id} className="flex items-start space-x-2 space-y-0">
                    <RadioGroupItem 
                      value={option.id} 
                      id={option.id} 
                      className="mt-1"
                      onClick={() => handleOptionSelect(option)}
                    />
                    <Label htmlFor={option.id} className="font-normal cursor-pointer">
                      <div>{option.textKo}</div>
                      <div className="text-sm text-muted-foreground">{option.text}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}
          
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setWizardOpen(false)}
            >
              취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={statusInfoOpen} onOpenChange={setStatusInfoOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1 text-sm">
            <HelpCircle className="h-4 w-4" />
            <span>신고 상태 정보</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>신고 상태 정보 (Filing Status Information)</DialogTitle>
            <DialogDescription>
              각 신고 상태에 대한 정보와 세금 영향을 확인할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {Object.entries(FILING_STATUS_INFO).map(([status, info]) => (
              <Card key={status} className={status === currentStatus ? 'border-primary' : ''}>
                <CardHeader className="py-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">
                      {info.titleKo} ({info.title})
                    </CardTitle>
                    {status === currentStatus && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-sm">{info.descriptionKo}</p>
                  <p className="text-xs text-muted-foreground mt-2">{info.description}</p>
                </CardContent>
                <CardFooter className="pt-2 pb-4">
                  {status !== currentStatus && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        onStatusChange(status as FilingStatus);
                        setStatusInfoOpen(false);
                      }}
                    >
                      이 상태 선택하기
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}