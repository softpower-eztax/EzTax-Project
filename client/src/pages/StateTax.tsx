import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Calculator, MapPin, DollarSign } from 'lucide-react';
import { useTaxContext } from '@/context/TaxContext';
import StepNavigation from '@/components/StepNavigation';
import { calculateStateTax, getAllStates, getStateTaxSummary } from '@shared/stateTaxCalculator';
import type { StateTaxCalculationInput } from '@shared/stateTaxCalculator';
import type { StateIncomeTax } from '@shared/schema';

const STATES = getAllStates().sort((a, b) => a.name.localeCompare(b.name));

export default function StateTax() {
  const { taxData, updateTaxData } = useTaxContext();
  const [stateWithholding, setStateWithholding] = useState(0);
  const [calculatedStateTax, setCalculatedStateTax] = useState<StateIncomeTax | undefined>(undefined);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedState, setSelectedState] = useState('');

  const filingStatus = taxData.personalInfo?.filingStatus || 'single';
  const dependentsCount = taxData.personalInfo?.dependents?.length || 0;

  // Initialize with resident state from personal info
  useEffect(() => {
    if (taxData.personalInfo?.state) {
      setSelectedState(taxData.personalInfo.state);
    }
  }, [taxData.personalInfo?.state]);

  // Auto-calculate when data changes
  useEffect(() => {
    if (selectedState && taxData.calculatedResults?.adjustedGrossIncome) {
      calculateStateIncomeTax();
    }
  }, [selectedState, taxData.calculatedResults, stateWithholding]);

  const calculateStateIncomeTax = async () => {
    if (!selectedState || !taxData.calculatedResults) return;

    setIsCalculating(true);
    
    const input: StateTaxCalculationInput = {
      state: selectedState,
      filingStatus: filingStatus as any,
      federalAGI: taxData.calculatedResults.adjustedGrossIncome,
      federalTaxableIncome: taxData.calculatedResults.taxableIncome,
      federalItemizedDeductions: taxData.deductions?.useStandardDeduction ? 
        undefined : taxData.deductions?.totalDeductions,
      dependentsCount,
      stateSpecificIncome: {
        stateWithholding,
      },
    };

    try {
      const result = calculateStateTax(input);
      setCalculatedStateTax(result ?? undefined);
      
      // Update tax data with state tax results
      if (result && taxData.calculatedResults) {
        updateTaxData({
          calculatedResults: {
            ...taxData.calculatedResults,
            stateIncomeTax: result,
          },
        });
      }
    } catch (error) {
      console.error('State tax calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleStateWithholdingChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    setStateWithholding(amount);
  };

  const getStateTaxInfo = () => {
    if (!selectedState) return null;
    return getStateTaxSummary(selectedState);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">주정부 소득세 계산</h1>
        <p className="text-gray-600">거주하는 주의 소득세를 계산합니다</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            주정부 세금 정보
          </CardTitle>
          <CardDescription>
            거주하는 주의 세금 규정에 따라 주정부 소득세를 계산합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* State Selection - Can override resident state */}
          <div>
            <Label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              세금 계산할 주 선택
            </Label>
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="주를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {STATES.map((state) => (
                  <SelectItem key={state.code} value={state.code}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {taxData.personalInfo?.state && taxData.personalInfo.state !== selectedState && (
              <p className="text-xs text-blue-600 mt-1">
                거주주: {STATES.find(s => s.code === taxData.personalInfo?.state)?.name} 
                (현재 {STATES.find(s => s.code === selectedState)?.name} 세금을 계산 중)
              </p>
            )}
          </div>

          {/* State Tax Information */}
          {selectedState && (
            <Alert>
              <AlertDescription>
                {getStateTaxInfo()}
              </AlertDescription>
            </Alert>
          )}

          {/* Enhanced State Tax Features Notice */}
          {selectedState && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium text-blue-900">
                    📋 주별 세부 공제 및 크레딧 항목 안내
                  </p>
                  <p className="text-blue-800 text-sm">
                    {STATES.find(s => s.code === selectedState)?.name}주에는 다음과 같은 추가 공제 및 크레딧이 있을 수 있습니다:
                  </p>
                  <ul className="text-blue-700 text-xs space-y-1 ml-4 list-disc">
                    <li>교육자 비용 공제 (K-12 교사용 교실 자료비)</li>
                    <li>고령자 및 장애인 면제 (연령 및 소득 조건 적용)</li>
                    <li>학자금 대출 이자 공제 (주별 소득 한도 적용)</li>
                    <li>임차인 크레딧 (저소득 임차인 대상)</li>
                    <li>군인 연금 소득 제외</li>
                    <li>자원소방관/구급요원 크레딧</li>
                    <li>대학 등록금 크레딧/공제</li>
                  </ul>
                  <p className="text-blue-800 text-sm mt-2">
                    <strong>중요:</strong> 실제 신고 시에는 {STATES.find(s => s.code === selectedState)?.name}주의 
                    최신 세법 규정과 자격 요건을 확인하시고, 전문 세무사의 상담을 받으시기 바랍니다.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* State Withholding Input */}
          {selectedState && (
            <div>
              <Label htmlFor="stateWithholding" className="text-sm font-medium">
                주정부 원천징수세액
              </Label>
              <div className="mt-1">
                <Input
                  id="stateWithholding"
                  type="number"
                  min="0"
                  step="0.01"
                  value={stateWithholding}
                  onChange={(e) => handleStateWithholdingChange(e.target.value)}
                  placeholder="0.00"
                  className="text-right"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                W-2나 1099에서 주정부 원천징수 금액을 입력하세요
              </p>
            </div>
          )}

          {/* Calculate Button */}
          {selectedState && (
            <Button 
              onClick={calculateStateIncomeTax}
              disabled={isCalculating}
              className="w-full"
            >
              <Calculator className="h-4 w-4 mr-2" />
              {isCalculating ? '계산 중...' : '주정부 세금 계산'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* State Tax Results */}
      {calculatedStateTax && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              주정부 세금 계산 결과
            </CardTitle>
            <CardDescription>
              {STATES.find(s => s.code === calculatedStateTax.state)?.name} 주정부 소득세
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {calculatedStateTax.stateTax === 0 ? (
              <Alert>
                <AlertDescription>
                  {STATES.find(s => s.code === calculatedStateTax.state)?.name}는 주정부 소득세가 없습니다.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">주정부 과세소득</Label>
                  <p className="text-lg font-semibold">
                    ${calculatedStateTax.stateTaxableIncome.toLocaleString()}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">주정부 소득세</Label>
                  <p className="text-lg font-semibold">
                    ${calculatedStateTax.stateTax.toLocaleString()}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">원천징수세액</Label>
                  <p className="text-lg">
                    ${(calculatedStateTax.stateWithholding || 0).toLocaleString()}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">
                    {(calculatedStateTax.stateRefund || 0) > 0 ? '환급액' : '납부액'}
                  </Label>
                  <p className={`text-lg font-semibold ${
                    (calculatedStateTax.stateRefund || 0) > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${(calculatedStateTax.stateRefund || 0) > 0 ? 
                      (calculatedStateTax.stateRefund || 0).toLocaleString() :
                      (calculatedStateTax.stateAmountOwed || 0).toLocaleString()
                    }
                  </p>
                </div>
              </div>
            )}

            <Separator />
            
            <div className="text-sm text-gray-600">
              <p className="mb-2"><strong>참고사항:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>주정부 세금 계산은 기본적인 규정에 따라 계산됩니다</li>
                <li>실제 신고시에는 주정부별 세부 규정과 공제를 확인하세요</li>
                <li>지방세(local tax)는 별도로 계산이 필요할 수 있습니다</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No State Selected */}
      {!selectedState && (
        <Card>
          <CardContent className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">거주 주를 설정해주세요</h3>
            <p className="text-gray-600">
              개인정보 페이지에서 거주하는 주를 먼저 입력해주세요.
            </p>
          </CardContent>
        </Card>
      )}

      <StepNavigation 
        prevStep="/review"
        nextStep="/review"
        submitText="연방세 검토로 돌아가기 (Return to Federal Tax Review)"
        onNext={async () => {
          // Auto-save current state tax data
          if (calculatedStateTax && taxData.calculatedResults) {
            updateTaxData({
              calculatedResults: {
                ...taxData.calculatedResults,
                stateIncomeTax: calculatedStateTax,
              },
            });
          }
          return true;
        }}
      />
    </div>
  );
}