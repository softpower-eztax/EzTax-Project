import { useState, useRef } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

      setUploadProgress(30);

      const response = await fetch('/api/parse-1099b', {
        method: 'POST',
        body: formData
      });

      setUploadProgress(60);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'PDF 파싱 실패');
      }

      const result = await response.json();
      console.log('서버 PDF 파싱 결과:', result);

      setUploadProgress(90);

      if (!result.success || !result.data) {
        throw new Error('서버에서 유효한 데이터를 반환하지 않았습니다');
      }

      const parsedData = result.data;

      // 날짜 형식 변환 헬퍼
      const formatDate = (dateStr: string): string => {
        if (!dateStr) return '';
        if (dateStr.includes('/')) {
          const [month, day, year] = dateStr.split('/');
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        return dateStr;
      };

      // 파싱된 데이터를 Transaction 형식으로 변환
      const newTransactions: Transaction[] = parsedData.transactions.map((tx: any, index: number) => ({
        id: Date.now() + index,
        description: tx.description || 'Unknown Security',
        buyPrice: tx.costBasis / (tx.quantity || 1),
        sellPrice: tx.proceeds / (tx.quantity || 1),
        quantity: tx.quantity || 1,
        profit: tx.netGainLoss || (tx.proceeds - tx.costBasis),
        purchaseDate: formatDate(tx.dateAcquired),
        saleDate: formatDate(tx.dateSold),
        isLongTerm: tx.isLongTerm || false,
        washSaleLoss: tx.washSaleLoss || 0
      }));

      console.log('파싱된 거래 데이터:', newTransactions);
      setTransactions(newTransactions);
      setUploadProgress(100);

      toast({
        title: "실제 PDF 파싱 완료",
        description: `계좌에서 ${newTransactions.length}개의 거래를 추출했습니다. 총 손익: $${parsedData.summary.totalNetGainLoss.toFixed(2)}`,
        duration: 5000
      });

    } catch (error) {
      console.error('PDF 파싱 오류:', error);
      toast({
        title: "PDF 파싱 실패",
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const totalGainLoss = transactions.reduce((total, tx) => total + tx.profit, 0);
  const longTermGains = transactions.filter(tx => tx.isLongTerm).reduce((total, tx) => total + tx.profit, 0);
  const shortTermGains = transactions.filter(tx => !tx.isLongTerm).reduce((total, tx) => total + tx.profit, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-6 w-6" />
              양도소득세 계산기 (실제 1099-B 문서 파싱)
            </CardTitle>
            <CardDescription>
              실제 브로커 1099-B PDF 문서를 업로드하여 자동으로 거래 데이터를 추출하고 양도소득세를 계산합니다.
              Robinhood, TD Ameritrade, Charles Schwab 등의 문서를 지원합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* PDF 업로드 섹션 */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">실제 1099-B PDF 문서 업로드</h3>
                <p className="text-gray-600 mb-4">
                  브로커에서 받은 실제 1099-B 세금 문서를 업로드하세요
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  disabled={isUploading}
                  className="hidden"
                />
                
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
              {transactions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    추출된 거래 데이터 ({transactions.length}개)
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left border-b">종목명</th>
                          <th className="px-4 py-2 text-left border-b">수량</th>
                          <th className="px-4 py-2 text-left border-b">매수일</th>
                          <th className="px-4 py-2 text-left border-b">매도일</th>
                          <th className="px-4 py-2 text-right border-b">매수가</th>
                          <th className="px-4 py-2 text-right border-b">매도가</th>
                          <th className="px-4 py-2 text-right border-b">손익</th>
                          <th className="px-4 py-2 text-center border-b">보유기간</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx) => (
                          <tr key={tx.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2">{tx.description}</td>
                            <td className="px-4 py-2">{tx.quantity}</td>
                            <td className="px-4 py-2">{tx.purchaseDate}</td>
                            <td className="px-4 py-2">{tx.saleDate}</td>
                            <td className="px-4 py-2 text-right">${tx.buyPrice.toFixed(2)}</td>
                            <td className="px-4 py-2 text-right">${tx.sellPrice.toFixed(2)}</td>
                            <td className={`px-4 py-2 text-right font-medium ${tx.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ${tx.profit.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <span className={`px-2 py-1 rounded text-xs ${tx.isLongTerm ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                {tx.isLongTerm ? '장기' : '단기'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 요약 정보 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm font-medium text-gray-600">총 손익</div>
                        <div className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${totalGainLoss.toFixed(2)}
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
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}