import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Income } from '@shared/schema';
import { useTaxContext } from '@/context/TaxContext';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info as InfoIcon, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// 추가 조정 항목 타입 정의
interface AdjustmentItem {
  type: string;
  amount: number;
  description?: string;
}

// 폼 스키마 정의
const adjustmentItemSchema = z.object({
  type: z.string(),
  amount: z.number().min(0),
  description: z.string().optional(),
});

const formSchema = z.object({
  adjustmentItems: z.array(adjustmentItemSchema),
});

type FormData = z.infer<typeof formSchema>;

const ADJUSTMENT_TYPES = [
  { id: 'educator_expenses', label: '교육자 비용 (Educator Expenses)', info: '교육자로서 지불한 적격 경비에 대한 공제' },
  { id: 'hsa_deduction', label: 'HSA건강 저축 계좌 공제 (Health Savings Account Deduction)', info: '건강 저축 계좌에 대한 납입금 공제' },
  { id: 'moving_expenses', label: '군인 이사 경비 (Moving Expenses for Armed Forces)', info: '현역 군인으로서 명령에 따른 이사 비용' },
  { id: 'self_employment_tax', label: '자영업자 세금의 50% 공제 (Deductible part of Self-Employment Tax)', info: '자영업자 세금의 50%를 조정합니다' },
  { id: 'self_employed_health_insurance', label: '자영업자 건강보험료 (Self-Employed Health Insurance Deduction)', info: '자영업자가 납부한 건강보험료 공제' },
  { id: 'self_employed_retirement', label: '자영업자 퇴직금 불입액 (Self-Employed SEP, SIMPLE, and Qualified Plans)', info: '자영업자 은퇴 계좌 기여금 공제' },
  { id: 'traditional_ira', label: '전통 IRA 납입 공제 (Traditional IRA Deduction)', info: '전통적 개인 은퇴 계좌 기여금 공제' },
  { id: 'student_loan_interest', label: '학생론 이자 공제 (Student Loan Interest Deduction)', info: '학자금 대출 이자에 대한 공제, 최대 $2,500' },
  { id: 'disaster_losses', label: '연방 피해지역 피해 손실 (Certain Business Losses or Casualty Losses from Federally Declared Disaster)', info: '연방 재난 지역으로 선언된 지역에서의 피해 손실' },
  { id: 'unreimbursed_expenses', label: '예술가/공직자 등 업무 관련 비용 (Unreimbursed Expenses for Armed Forces, Performing Artists, Fee-Basis Government Officials)', info: '특정 직업군의 상환되지 않은 업무 관련 비용' },
  { id: 'archer_msa', label: 'HSA 외출금 상환 (Archer MSA Deduction)', info: 'Archer 의료 저축 계좌 납입금 공제' },
  { id: 'scholarship_adjustments', label: '장학금 수입 환급 (Scholarship and Fellowship Adjustments)', info: '장학금 및 연구비 관련 조정' },
];

export default function AdditionalAdjustmentsPage() {
  const [, navigate] = useLocation();
  const { taxData, updateTaxData } = useTaxContext();
  const { toast } = useToast();
  const [addedItems, setAddedItems] = useState<AdjustmentItem[]>(
    taxData.income?.additionalAdjustmentItems || []
  );
  const [selectedType, setSelectedType] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>('');

  const addAdjustmentItem = () => {
    if (!selectedType || amount <= 0) {
      toast({
        title: "입력 오류",
        description: "항목과 금액을 정확히 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    // 선택된 항목의 라벨 찾기
    const selectedTypeLabel = ADJUSTMENT_TYPES.find(type => type.id === selectedType)?.label || selectedType;

    const newItem: AdjustmentItem = {
      type: selectedTypeLabel,
      amount,
      description: description || undefined,
    };

    const updatedItems = [...addedItems, newItem];
    setAddedItems(updatedItems);

    // 폼 초기화
    setSelectedType('');
    setAmount(0);
    setDescription('');

    toast({
      title: "항목 추가 성공",
      description: "조정 항목이 추가되었습니다.",
    });
  };

  const removeItem = (index: number) => {
    const updatedItems = [...addedItems];
    updatedItems.splice(index, 1);
    setAddedItems(updatedItems);
  };

  const saveAndReturn = () => {
    try {
      // 추가 조정 항목의 총액 계산
      const totalAmount = addedItems.reduce((sum, item) => sum + item.amount, 0);

      // 기존 소득 데이터 가져오기
      const currentIncome = taxData.income || {
        wages: 0,
        otherEarnedIncome: 0,
        interestIncome: 0,
        dividends: 0,
        businessIncome: 0,
        capitalGains: 0,
        rentalIncome: 0,
        retirementIncome: 0,
        unemploymentIncome: 0,
        otherIncome: 0,
        additionalIncomeItems: [],
        totalIncome: 0,
        adjustments: {
          studentLoanInterest: 0,
          retirementContributions: 0,
          healthSavingsAccount: 0,
          otherAdjustments: 0,
        },
        adjustedGrossIncome: 0,
      };

      // 기타 조정 항목에 추가 조정 항목의 총액 할당
      const updatedIncome = {
        ...currentIncome,
        additionalAdjustmentItems: addedItems,
        adjustments: {
          ...currentIncome.adjustments,
          otherAdjustments: totalAmount
        }
      };

      // AGI 재계산
      updatedIncome.adjustedGrossIncome = 
        updatedIncome.totalIncome - 
        (updatedIncome.adjustments.studentLoanInterest + 
         updatedIncome.adjustments.retirementContributions + 
         updatedIncome.adjustments.healthSavingsAccount + 
         updatedIncome.adjustments.otherAdjustments);

      // 컨텍스트 업데이트
      updateTaxData({ income: updatedIncome });

      // 메인 소득 페이지로 돌아가기
      navigate('/income');

      toast({
        title: "저장 성공",
        description: "추가 조정 항목이 저장되었습니다.",
      });
    } catch (error) {
      console.error('Error saving additional adjustment items:', error);
      toast({
        title: "저장 오류",
        description: "추가 조정 항목을 저장하는 중에 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <Button 
        variant="ghost" 
        className="mb-4 flex items-center" 
        onClick={() => navigate('/income')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        소득정보로 돌아가기
      </Button>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl font-heading text-primary-dark">기타 조정 항목 (Additional Adjustments to Income)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-8">
            <p className="text-sm text-gray-dark mb-4">
              다음은 조정 총소득(AGI)을 계산할 때 소득에서 차감되는 추가 항목입니다. 해당하는 항목이 있으면 선택하여 금액을 입력하세요.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="text-sm font-medium">항목 (Item)</label>
                <select 
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full p-2 border rounded mt-1"
                >
                  <option value="">선택하세요</option>
                  {ADJUSTMENT_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">금액 (Amount)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium">설명 (Description) - 선택사항</label>
                <Input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="추가 정보를 입력하세요 (선택사항)"
                  className="mt-1"
                />
              </div>
            </div>

            <Button 
              onClick={addAdjustmentItem} 
              className="w-full md:w-auto"
            >
              항목 추가
            </Button>
          </div>

          {addedItems.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">추가된 조정 항목</h3>
              <div className="space-y-3">
                {addedItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded bg-gray-50">
                    <div>
                      <p className="font-medium">{item.type}</p>
                      {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.amount)}
                      </span>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => removeItem(index)}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between items-center p-3 border-t pt-3 font-bold">
                  <span>총계 (Total)</span>
                  <span>
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                      addedItems.reduce((sum, item) => sum + item.amount, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <Button onClick={saveAndReturn}>
              저장 및 돌아가기
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 p-4 border rounded bg-blue-50">
        <h3 className="text-lg font-semibold mb-2">조정 항목 정보</h3>
        <div className="space-y-2">
          {ADJUSTMENT_TYPES.map((type) => (
            <div key={type.id} className="flex gap-2">
              <InfoIcon className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{type.label}</p>
                <p className="text-sm text-gray-600">{type.info}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}