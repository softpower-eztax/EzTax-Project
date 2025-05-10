import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTaxContext } from '@/context/TaxContext';
import { lowIncomeMarriedTestData, mediumIncomeSingleTestData } from '@/testData';
import { toast } from '@/hooks/use-toast';
import { Link } from 'wouter';

export default function DataTester() {
  const { updateTaxData, saveTaxReturn, recalculateTaxes } = useTaxContext();

  const loadLowIncomeMarriedData = async () => {
    try {
      // 테스트 데이터 로드
      updateTaxData(lowIncomeMarriedTestData);
      
      // 세금 재계산
      recalculateTaxes();
      
      // 서버에 저장
      await saveTaxReturn();
      
      toast({
        title: "테스트 데이터 로드 완료",
        description: "저소득 부부 공동 신고 데이터가 로드되었습니다.",
      });
    } catch (error) {
      console.error('Error loading test data:', error);
      toast({
        title: "데이터 로드 오류",
        description: "테스트 데이터 로드 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const loadMediumIncomeSingleData = async () => {
    try {
      // 테스트 데이터 로드
      updateTaxData(mediumIncomeSingleTestData);
      
      // 세금 재계산
      recalculateTaxes();
      
      // 서버에 저장
      await saveTaxReturn();
      
      toast({
        title: "테스트 데이터 로드 완료",
        description: "중간소득 독신 신고 데이터가 로드되었습니다.",
      });
    } catch (error) {
      console.error('Error loading test data:', error);
      toast({
        title: "데이터 로드 오류",
        description: "테스트 데이터 로드 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container max-w-5xl mx-auto py-12">
      <h1 className="text-3xl font-bold mb-6">테스트 데이터 로더</h1>
      <p className="mb-8 text-gray-700">
        은퇴저축공제 자동 계산 테스트를 위한 샘플 데이터를 로드할 수 있습니다.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>저소득 부부 공동 신고</CardTitle>
            <CardDescription>AGI: $34,800 (은퇴저축공제 50% 대상)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              <strong>인적 정보:</strong> Robert & Sarah Johnson 부부, 자녀 2명
            </p>
            <p className="mb-4">
              <strong>소득 정보:</strong> 급여 $35,000, 총소득 $38,300, 조정총소득 $34,800
            </p>
            <p>
              <strong>은퇴 기여금:</strong> 총 $5,500 (IRA: $2,000, Roth IRA: $1,500, 401(k): $2,000)
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={loadLowIncomeMarriedData} className="w-full">이 데이터 로드</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>중간소득 독신 신고</CardTitle>
            <CardDescription>AGI: $38,970 (은퇴저축공제 10% 대상)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              <strong>인적 정보:</strong> Jennifer Wilson, 자녀 없음
            </p>
            <p className="mb-4">
              <strong>소득 정보:</strong> 급여 $42,000, 총소득 $43,970, 조정총소득 $38,970
            </p>
            <p>
              <strong>은퇴 기여금:</strong> 총 $6,000 (IRA: $2,000, Roth IRA: $1,000, 401(k): $3,000)
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={loadMediumIncomeSingleData} className="w-full">이 데이터 로드</Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="mt-8 flex justify-center">
        <Link href="/tax-credits">
          <Button variant="outline">세액공제 페이지로 이동</Button>
        </Link>
      </div>
    </div>
  );
}