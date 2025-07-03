import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Calculator, TrendingUp } from 'lucide-react';

interface Transaction {
  id: number;
  description: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  profit: number;
  purchaseDate: string;
  saleDate: string;
  isLongTerm: boolean;
  washSaleLoss?: number;
}

export default function CapitalGainsCalculatorSimple() {
  const [, setLocation] = useLocation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [forceRender, setForceRender] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // 디버깅용 로그
  console.log('컴포넌트 렌더링 - transactions.length:', transactions.length, 'forceRender:', forceRender);

  // 렌더링 조건 체크 로그
  useEffect(() => {
    console.log('useEffect - transactions 변경됨:', transactions.length);
  }, [transactions]);

  // 실제 PDF 파싱 함수
  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('PDF 파일 업로드 시작:', file.name);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-1099b', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status}`);
      }

      const result = await response.json();
      console.log('서버 PDF 파싱 결과:', result);

      if (result.success && result.data.transactions) {
        const newTransactions = result.data.transactions.map((t: any, index: number) => ({
          id: Date.now() + index,
          description: t.description || `거래 ${index + 1}`,
          buyPrice: t.costBasis || 0,
          sellPrice: t.proceeds || 0,
          quantity: t.quantity || 1,
          profit: t.netGainLoss || 0,
          purchaseDate: t.dateAcquired || '',
          saleDate: t.dateSold || '',
          isLongTerm: t.isLongTerm || false,
          washSaleLoss: t.washSaleLoss || 0,
        }));

        console.log('파싱된 거래 데이터:', newTransactions);
        console.log('현재 transactions 상태:', transactions.length);
        
        // 직접적인 상태 업데이트
        console.log('상태 업데이트 시작 - 기존:', transactions.length, '새로운:', newTransactions.length);
        
        // 즉시 상태 업데이트
        setTransactions(newTransactions);
        setForceRender(Date.now());
        
        // 추가 업데이트 강제 실행
        setTimeout(() => {
          setTransactions([...newTransactions]);
          setForceRender(Date.now());
          console.log('상태 업데이트 완료:', newTransactions.length);
        }, 100);
        
        setUploadProgress(100);

        toast({
          title: "PDF 파싱 완료",
          description: `${newTransactions.length}개의 거래 데이터가 추출되었습니다.`,
        });
      } else {
        throw new Error(result.message || '파싱 실패');
      }
    } catch (error) {
      console.error('PDF 업로드 오류:', error);
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "파일 업로드에 실패했습니다.",
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

  // 계산 함수들
  const longTermGains = transactions
    .filter(t => t.isLongTerm)
    .reduce((sum, t) => sum + t.profit, 0);

  const shortTermGains = transactions
    .filter(t => !t.isLongTerm)
    .reduce((sum, t) => sum + t.profit, 0);

  const totalGains = longTermGains + shortTermGains;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-6 w-6" />
              양도소득세 계산기 (실제 1099-B 문서 파싱)
            </CardTitle>
            <CardDescription>
              실제 브로커 1099-B PDF 문서를 업로드하여 자동으로 거래 데이터를 추출하고 양도소득세를 계산합니다. Robinhood, TD Ameritrade, Charles Schwab 등의 문서를 지원합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* PDF 업로드 섹션 */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  className="hidden"
                />
                
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">실제 1099-B PDF 문서 업로드</h3>
                <p className="text-gray-600 mb-4">
                  브로커에서 받은 실제 1099-B 세금 문서를 업로드하여 자동으로 거래 데이터를 추출하세요
                </p>
                
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="mb-4"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {isUploading ? `업로드 중... ${uploadProgress}%` : 'PDF 파일 선택'}
                </Button>
                
                {isUploading && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
                
                <p className="text-sm text-gray-500">
                  지원 형식: PDF (최대 10MB) | 지원 브로커: Robinhood, TD Ameritrade, Charles Schwab
                </p>
              </div>

              {/* 거래 데이터 표시 */}
              <div key={`transactions-${forceRender}`} className="space-y-4">
                {transactions.length > 0 ? (
                  <>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      추출된 거래 데이터 ({transactions.length}개)
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left border-b">Stock Name</th>
                            <th className="px-4 py-2 text-left border-b">수량</th>
                            <th className="px-4 py-2 text-left border-b">Date Acquired</th>
                            <th className="px-4 py-2 text-left border-b">Date Sold</th>
                            <th className="px-4 py-2 text-right border-b">Proceeds</th>
                            <th className="px-4 py-2 text-right border-b">Cost Basis</th>
                            <th className="px-4 py-2 text-right border-b">Wash Sales Loss Disallowed</th>
                            <th className="px-4 py-2 text-right border-b">Net Gain/Loss</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((transaction) => (
                            <tr key={transaction.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 border-b font-medium">
                                {transaction.description.split(' / ')[0] || 'N/A'}
                              </td>
                              <td className="px-4 py-2 border-b">{transaction.quantity}</td>
                              <td className="px-4 py-2 border-b">{transaction.purchaseDate}</td>
                              <td className="px-4 py-2 border-b">{transaction.saleDate}</td>
                              <td className="px-4 py-2 border-b text-right">${transaction.sellPrice.toFixed(2)}</td>
                              <td className="px-4 py-2 border-b text-right">${transaction.buyPrice.toFixed(2)}</td>
                              <td className="px-4 py-2 border-b text-right">${(transaction.washSaleLoss || 0).toFixed(2)}</td>
                              <td className={`px-4 py-2 border-b text-right font-semibold ${
                                transaction.profit >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                ${transaction.profit.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* 요약 정보 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm font-medium text-gray-600">총 자본이득</div>
                          <div className={`text-2xl font-bold ${totalGains >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${totalGains.toFixed(2)}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm font-medium text-gray-600">장기 자본이득</div>
                          <div className={`text-2xl font-bold ${longTermGains >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${longTermGains.toFixed(2)}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm font-medium text-gray-600">단기 자본이득</div>
                          <div className={`text-2xl font-bold ${shortTermGains >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${shortTermGains.toFixed(2)}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="flex gap-4">
                      <Button onClick={() => setLocation('/income')} className="flex-1">
                        세금 신고서에 추가
                      </Button>
                      <Button onClick={() => setTransactions([])} className="flex-1">
                        데이터 초기화
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    PDF를 업로드하여 1099-B 거래 데이터를 추출하세요.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}