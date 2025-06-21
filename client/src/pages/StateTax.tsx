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
import { StepNavigation } from '@/components/StepNavigation';
import { calculateStateTax, getAllStates, getStateTaxSummary } from '@shared/stateTaxCalculator';
import type { StateTaxCalculationInput, StateIncomeTax } from '@shared/stateTaxCalculator';

const STATES = getAllStates().sort((a, b) => a.name.localeCompare(b.name));

export default function StateTax() {
  const { taxData, updateTaxData } = useTaxContext();
  const [stateWithholding, setStateWithholding] = useState(0);
  const [calculatedStateTax, setCalculatedStateTax] = useState<StateIncomeTax | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const selectedState = taxData.personalInfo?.state || '';
  const filingStatus = taxData.personalInfo?.filingStatus || 'single';
  const dependentsCount = taxData.personalInfo?.dependents?.length || 0;

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
      setCalculatedStateTax(result);
      
      // Update tax data with state tax results
      updateTaxData({
        calculatedResults: {
          ...taxData.calculatedResults,
          stateIncomeTax: result,
        },
      });
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
          {/* State Selection - Read from personal info */}
          <div>
            <Label className="text-sm font-medium">거주 주</Label>
            <div className="mt-1 p-3 bg-gray-50 rounded-md">
              <p className="text-sm">
                {selectedState ? 
                  STATES.find(s => s.code === selectedState)?.name || selectedState :
                  '개인정보에서 거주 주를 먼저 설정해주세요'
                }
              </p>
            </div>
          </div>

          {/* State Tax Information */}
          {selectedState && (
            <Alert>
              <AlertDescription>
                {getStateTaxInfo()}
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
                    ${calculatedStateTax.stateWithholding.toLocaleString()}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">
                    {calculatedStateTax.stateRefundAmount > 0 ? '환급액' : '납부액'}
                  </Label>
                  <p className={`text-lg font-semibold ${
                    calculatedStateTax.stateRefundAmount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${calculatedStateTax.stateRefundAmount > 0 ? 
                      calculatedStateTax.stateRefundAmount.toLocaleString() :
                      calculatedStateTax.stateAmountOwed.toLocaleString()
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
        currentStep="/state-tax"
        onNext={async () => {
          // Auto-save current state tax data
          if (calculatedStateTax) {
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