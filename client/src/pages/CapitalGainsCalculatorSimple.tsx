import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Calculator, TrendingUp, ArrowRight } from 'lucide-react';
import { useTaxContext } from '@/context/TaxContext';
import { Income } from '@shared/schema';

interface Transaction {
  id: number;
  description: string;
  dateAcquired: string;
  dateSold: string;
  proceeds: number;
  costBasis: number;
  washSaleLoss: number;
  netGainLoss: number;
  quantity: number;
  isLongTerm: boolean;
  formType: string;
}

interface ScheduleDSummary {
  shortTerm: {
    proceeds: number;
    costBasis: number;
    washSaleLoss: number;
    netGainLoss: number;
  };
  longTerm: {
    proceeds: number;
    costBasis: number;
    washSaleLoss: number;
    netGainLoss: number;
  };
  grandTotal: {
    proceeds: number;
    costBasis: number;
    washSaleLoss: number;
    netGainLoss: number;
  };
}

// 전역 상태를 사용하여 React 상태 관리 문제 우회
let globalTransactions: Transaction[] = [];

export default function CapitalGainsCalculatorSimple() {
  const [, setLocation] = useLocation();
  const [transactions, setTransactions] = useState<Transaction[]>(globalTransactions);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [updateCounter, setUpdateCounter] = useState(0);
  const [showIndividualTransactions, setShowIndividualTransactions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { taxData, updateTaxData } = useTaxContext();

  // 디버깅용 로그
  console.log('컴포넌트 렌더링 - transactions.length:', transactions.length, 'globalTransactions.length:', globalTransactions.length);

  // 전역 상태와 로컬 상태 동기화
  useEffect(() => {
    if (globalTransactions.length !== transactions.length) {
      setTransactions([...globalTransactions]);
    }
  }, [updateCounter, globalTransactions.length]);

  // Schedule D Summary 계산 (현재 거래 배열 사용)
  const calculateScheduleDSummary = (): ScheduleDSummary => {
    return calculateScheduleDSummaryFromTransactions(transactions);
  };

  // Schedule D Summary 계산 (지정된 거래 배열 사용)
  const calculateScheduleDSummaryFromTransactions = (transactionsList: Transaction[]): ScheduleDSummary => {
    const shortTerm = { proceeds: 0, costBasis: 0, washSaleLoss: 0, netGainLoss: 0 };
    const longTerm = { proceeds: 0, costBasis: 0, washSaleLoss: 0, netGainLoss: 0 };

    transactionsList.forEach(transaction => {
      if (transaction.isLongTerm) {
        longTerm.proceeds += transaction.proceeds || 0;
        longTerm.costBasis += transaction.costBasis || 0;
        longTerm.washSaleLoss += transaction.washSaleLoss || 0;
        longTerm.netGainLoss += transaction.netGainLoss || 0;
      } else {
        shortTerm.proceeds += transaction.proceeds || 0;
        shortTerm.costBasis += transaction.costBasis || 0;
        shortTerm.washSaleLoss += transaction.washSaleLoss || 0;
        shortTerm.netGainLoss += transaction.netGainLoss || 0;
      }
    });

    const grandTotal = {
      proceeds: shortTerm.proceeds + longTerm.proceeds,
      costBasis: shortTerm.costBasis + longTerm.costBasis,
      washSaleLoss: shortTerm.washSaleLoss + longTerm.washSaleLoss,
      netGainLoss: shortTerm.netGainLoss + longTerm.netGainLoss
    };

    return { shortTerm, longTerm, grandTotal };
  };

  const scheduleDSummary = calculateScheduleDSummary();

  // 실제 PDF 파싱 함수
  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('PDF 파일 업로드 시작:', file.name);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/parse-1099b', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('PDF 파싱 결과:', result);

      if (result.success && result.data && result.data.transactions) {
        const newTransactions = result.data.transactions.map((t: any, index: number) => ({
          id: Date.now() + index,
          description: t.description || 'Unknown',
          dateAcquired: t.dateAcquired || '',
          dateSold: t.dateSold || '',
          proceeds: t.proceeds || 0,
          costBasis: t.costBasis || 0,
          washSaleLoss: t.washSaleLoss || 0,
          netGainLoss: t.netGainLoss || 0,
          quantity: t.quantity || 1,
          isLongTerm: t.isLongTerm || false,
          formType: t.formType || 'A'
        }));

        // 전역 상태 업데이트
        globalTransactions = [...globalTransactions, ...newTransactions];
        setTransactions([...globalTransactions]);
        setUpdateCounter(prev => prev + 1);

        // Capital Gains 계산 및 Income 페이지 자동 업데이트
        const updatedSummary = calculateScheduleDSummaryFromTransactions([...globalTransactions]);
        const totalCapitalGains = updatedSummary.grandTotal.netGainLoss;
        
        // Income 페이지의 Capital Gains 필드 업데이트
        const currentIncome = taxData.income as Income || {
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
          totalIncome: 0,
          adjustments: {
            studentLoanInterest: 0,
            retirementContributions: 0,
            otherAdjustments: 0
          },
          adjustedGrossIncome: 0,
          additionalIncomeItems: []
        };
        
        const newTotalIncome = currentIncome.wages + 
                              currentIncome.otherEarnedIncome + 
                              currentIncome.interestIncome + 
                              currentIncome.dividends + 
                              currentIncome.businessIncome + 
                              totalCapitalGains + 
                              currentIncome.rentalIncome + 
                              currentIncome.retirementIncome + 
                              currentIncome.unemploymentIncome + 
                              currentIncome.otherIncome;

        updateTaxData({
          income: {
            wages: currentIncome.wages,
            otherEarnedIncome: currentIncome.otherEarnedIncome,
            interestIncome: currentIncome.interestIncome,
            dividends: currentIncome.dividends,
            businessIncome: currentIncome.businessIncome,
            capitalGains: totalCapitalGains,
            rentalIncome: currentIncome.rentalIncome,
            retirementIncome: currentIncome.retirementIncome,
            unemploymentIncome: currentIncome.unemploymentIncome,
            otherIncome: currentIncome.otherIncome,
            totalIncome: newTotalIncome,
            adjustments: currentIncome.adjustments,
            adjustedGrossIncome: newTotalIncome - (currentIncome.adjustments.studentLoanInterest + 
                                                  currentIncome.adjustments.retirementContributions + 
                                                  currentIncome.adjustments.otherAdjustments),
            additionalIncomeItems: currentIncome.additionalIncomeItems
          }
        });

        toast({
          title: "PDF 파싱 완료!",
          description: `${newTransactions.length}개의 거래가 추가되고 Capital Gains ($${totalCapitalGains.toLocaleString()})이 Income 페이지에 반영되었습니다.`,
        });
      } else {
        throw new Error(result.message || 'PDF 파싱에 실패했습니다.');
      }
    } catch (error) {
      console.error('PDF 업로드 오류:', error);
      toast({
        title: "업로드 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const deleteTransaction = (index: number) => {
    globalTransactions.splice(index, 1);
    setTransactions([...globalTransactions]);
    setUpdateCounter(prev => prev + 1);

    toast({
      title: "거래 삭제됨",
      description: "선택한 거래가 삭제되었습니다.",
    });
  };

  const clearAllTransactions = () => {
    globalTransactions.length = 0;
    setTransactions([]);
    setUpdateCounter(prev => prev + 1);

    toast({
      title: "모든 거래 삭제됨",
      description: "모든 거래가 삭제되었습니다.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Capital Gains Calculator - Schedule D Summary
          </h1>
          <p className="text-lg text-gray-600">
            1099-B PDF를 업로드하여 IRS Form 8949 Schedule D Summary를 생성하세요
          </p>
        </div>

        {/* PDF Upload Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              1099-B PDF 업로드
            </CardTitle>
            <CardDescription>
              Robinhood, TD Ameritrade, Charles Schwab 등의 1099-B PDF 파일을 업로드하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 cursor-pointer">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      {isUploading ? '업로드 중...' : 'PDF 파일을 선택하거나 드래그하세요'}
                    </p>
                  </div>
                </label>
              </div>

              {isUploading && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}

              {transactions.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    onClick={clearAllTransactions}
                    variant="outline"
                    size="sm"
                  >
                    모든 거래 삭제
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Schedule D Summary Section */}
        {transactions.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Schedule D Summary (IRS Form 8949 형식)
              </CardTitle>
              <CardDescription>
                세금 신고용 요약 정보 - 실제 Form 8949에 입력할 데이터입니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2 text-left">Term</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Form 8949 type</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Proceeds</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Cost basis</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Market discount</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Wash sale loss disallowed</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Net gain or (loss)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Short-term totals */}
                    <tr className="bg-blue-50">
                      <td className="border border-gray-300 px-4 py-2 font-semibold">Short</td>
                      <td className="border border-gray-300 px-4 py-2">A (basis reported to the IRS)</td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                        ${scheduleDSummary.shortTerm.proceeds.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                        ${scheduleDSummary.shortTerm.costBasis.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">0.00</td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                        ${scheduleDSummary.shortTerm.washSaleLoss.toLocaleString()}
                      </td>
                      <td className={`border border-gray-300 px-4 py-2 text-right font-semibold ${scheduleDSummary.shortTerm.netGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${scheduleDSummary.shortTerm.netGainLoss.toLocaleString()}
                      </td>
                    </tr>
                    
                    {/* Long-term totals */}
                    <tr className="bg-green-50">
                      <td className="border border-gray-300 px-4 py-2 font-semibold">Long</td>
                      <td className="border border-gray-300 px-4 py-2">D (basis reported to the IRS)</td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                        ${scheduleDSummary.longTerm.proceeds.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                        ${scheduleDSummary.longTerm.costBasis.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">0.00</td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                        ${scheduleDSummary.longTerm.washSaleLoss.toLocaleString()}
                      </td>
                      <td className={`border border-gray-300 px-4 py-2 text-right font-semibold ${scheduleDSummary.longTerm.netGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${scheduleDSummary.longTerm.netGainLoss.toLocaleString()}
                      </td>
                    </tr>
                    
                    {/* Grand Total */}
                    <tr className="bg-yellow-100 font-bold">
                      <td className="border border-gray-300 px-4 py-2 font-bold">Grand total</td>
                      <td className="border border-gray-300 px-4 py-2"></td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-bold">
                        ${scheduleDSummary.grandTotal.proceeds.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-bold">
                        ${scheduleDSummary.grandTotal.costBasis.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">0.00</td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-bold">
                        ${scheduleDSummary.grandTotal.washSaleLoss.toLocaleString()}
                      </td>
                      <td className={`border border-gray-300 px-4 py-2 text-right font-bold ${scheduleDSummary.grandTotal.netGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${scheduleDSummary.grandTotal.netGainLoss.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Income 페이지 반영 버튼 */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">
                      총 Capital Gains: ${scheduleDSummary.grandTotal.netGainLoss.toLocaleString()}
                    </h4>
                    <p className="text-blue-700 text-sm">
                      이 값을 Income 페이지의 Capital Gains 필드에 자동으로 반영됩니다.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      // Income 페이지로 이동
                      setLocation('/income');
                      toast({
                        title: "Income 페이지로 이동",
                        description: `Capital Gains $${scheduleDSummary.grandTotal.netGainLoss.toLocaleString()}이 반영되었습니다.`,
                      });
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Income 페이지 확인
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Individual Transactions (Collapsible) */}
        {transactions.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  개별 거래 내역 ({transactions.length}건)
                </CardTitle>
                <Button
                  onClick={() => setShowIndividualTransactions(!showIndividualTransactions)}
                  variant="outline"
                  size="sm"
                >
                  {showIndividualTransactions ? '숨기기' : '보기'}
                </Button>
              </div>
              <CardDescription>
                상세한 개별 거래 내역 (참고용)
              </CardDescription>
            </CardHeader>
            
            {showIndividualTransactions && (
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left">종목명</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">취득일</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">매도일</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">매각금액</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">취득가</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Wash Sale Loss</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">순손익</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">기간</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">삭제</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction, index) => (
                        <tr key={`${transaction.description}-${index}-${updateCounter}`} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">{transaction.description}</td>
                          <td className="border border-gray-300 px-4 py-2">{transaction.dateAcquired}</td>
                          <td className="border border-gray-300 px-4 py-2">{transaction.dateSold}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">${transaction.proceeds?.toLocaleString() || '0'}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">${transaction.costBasis?.toLocaleString() || '0'}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">${transaction.washSaleLoss?.toLocaleString() || '0'}</td>
                          <td className={`border border-gray-300 px-4 py-2 text-right ${transaction.netGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${transaction.netGainLoss?.toLocaleString() || '0'}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            {transaction.isLongTerm ? 'Long' : 'Short'}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <button
                              onClick={() => deleteTransaction(index)}
                              className="text-red-600 hover:text-red-800 font-bold"
                              title="거래 삭제"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* No Data State */}
        {transactions.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                아직 업로드된 거래 내역이 없습니다
              </h3>
              <p className="text-gray-600">
                1099-B PDF 파일을 업로드하여 Schedule D Summary를 생성하세요
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}