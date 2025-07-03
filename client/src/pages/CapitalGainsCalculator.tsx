import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTaxContext } from '@/context/TaxContext';
import { Income } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileText, Calculator, ArrowLeft, Save, Lock, Download, Crown, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

// 거래 항목 인터페이스 정의
interface Transaction {
  id: number;
  description: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  profit: number;
  purchaseDate: string; // 구매 날짜
  saleDate: string;     // 판매 날짜
  isLongTerm: boolean;  // 장기투자 여부
}

export default function CapitalGainsCalculator() {
  const [, setLocation] = useLocation();
  const { taxData, updateTaxData } = useTaxContext();
  const { toast } = useToast();
  
  // 거래 목록 상태 관리 (빈 배열로 시작)
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // 거래 목록 상태 변화 추적
  useEffect(() => {
    console.log('거래 목록 상태 업데이트됨:', transactions);
  }, [transactions]);
  
  // 새로운 거래 입력을 위한 상태
  const [newTransaction, setNewTransaction] = useState<Omit<Transaction, 'id' | 'profit' | 'isLongTerm'>>({
    description: '',
    buyPrice: 0,
    sellPrice: 0,
    quantity: 0,
    purchaseDate: '',
    saleDate: ''
  });
  
  // 업로드 상태 관리
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  // 프리미엄 상태 관리 (모든 기능 오픈)
  const [isPremium, setIsPremium] = useState<boolean>(true);
  
  // 프리미엄 기능 안내 다이얼로그 관리
  const [premiumDialogOpen, setPremiumDialogOpen] = useState<boolean>(false);
  
  // 장기/단기 자본 이득 및 세금 계산
  const longTermGains = transactions
    .filter(t => t.isLongTerm && t.profit > 0)
    .reduce((sum, t) => sum + t.profit, 0);
    
  const shortTermGains = transactions
    .filter(t => !t.isLongTerm && t.profit > 0)
    .reduce((sum, t) => sum + t.profit, 0);
    
  const totalCapitalGains = longTermGains + shortTermGains;
  
  // 장기/단기 자본 손실 계산
  const longTermLosses = transactions
    .filter(t => t.isLongTerm && t.profit < 0)
    .reduce((sum, t) => sum + Math.abs(t.profit), 0);
    
  const shortTermLosses = transactions
    .filter(t => !t.isLongTerm && t.profit < 0)
    .reduce((sum, t) => sum + Math.abs(t.profit), 0);
    
  // 추정 세금 계산 (예상 세율: 장기 15%, 단기 24%)
  const estimatedLongTermTax = longTermGains * 0.15;
  const estimatedShortTermTax = shortTermGains * 0.24;
  const totalEstimatedTax = estimatedLongTermTax + estimatedShortTermTax;
  
  // 입력 필드 변경 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    let processedValue: string | number = value;
    
    // 문자열 필드들
    if (name === 'description' || name === 'purchaseDate' || name === 'saleDate') {
      processedValue = value;
    } else {
      // 숫자 필드들 (buyPrice, sellPrice, quantity)
      processedValue = value === '' ? 0 : Number(value);
    }
    
    setNewTransaction(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };
  
  // 날짜 문자열을 Date 객체로 변환하는 헬퍼 함수
  const parseDate = (dateStr: string): Date => {
    return new Date(dateStr);
  };
  
  // 두 날짜 사이의 차이가 1년 이상인지 확인하는 함수
  const isLongTermInvestment = (purchaseDate: string, saleDate: string): boolean => {
    if (!purchaseDate || !saleDate) return false;
    
    const purchase = parseDate(purchaseDate);
    const sale = parseDate(saleDate);
    
    // 유효한 날짜인지 확인
    if (isNaN(purchase.getTime()) || isNaN(sale.getTime())) return false;
    
    // 구매일이 판매일보다 미래인 경우
    if (purchase > sale) return false;
    
    // 1년(365일)을 밀리초로 변환
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    
    // 구매일과 판매일의 차이가 1년 이상인지 확인
    return (sale.getTime() - purchase.getTime()) >= oneYearInMs;
  };
  
  // 새 거래 추가
  const addTransaction = () => {
    console.log('거래 추가 시도:', newTransaction);
    
    if (!newTransaction.description || 
        newTransaction.buyPrice <= 0 || 
        newTransaction.sellPrice <= 0 || 
        newTransaction.quantity <= 0 ||
        !newTransaction.purchaseDate || 
        !newTransaction.saleDate) {
      console.log('입력 검증 실패:', {
        description: newTransaction.description,
        buyPrice: newTransaction.buyPrice,
        sellPrice: newTransaction.sellPrice,
        quantity: newTransaction.quantity,
        purchaseDate: newTransaction.purchaseDate,
        saleDate: newTransaction.saleDate
      });
      toast({
        title: "입력 오류",
        description: "모든 필드를 올바르게 입력해주세요.",
        variant: "destructive"
      });
      return;
    }
    
    // 이익 계산
    const profit = (newTransaction.sellPrice - newTransaction.buyPrice) * newTransaction.quantity;
    
    // 장기/단기 투자 여부 판단
    const isLongTerm = isLongTermInvestment(newTransaction.purchaseDate, newTransaction.saleDate);
    
    console.log('계산된 값들:', { profit, isLongTerm });
    
    // 새 거래 추가
    const newId = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1;
    const newTransactionWithId = { 
      ...newTransaction, 
      id: newId, 
      profit,
      isLongTerm 
    };
    
    console.log('추가할 거래:', newTransactionWithId);
    console.log('기존 거래 목록:', transactions);
    
    const updatedTransactions = [...transactions, newTransactionWithId];
    console.log('업데이트된 거래 목록:', updatedTransactions);
    setTransactions(updatedTransactions);
    
    // 입력 필드 초기화
    setNewTransaction({
      description: '',
      buyPrice: 0,
      sellPrice: 0,
      quantity: 0,
      purchaseDate: '',
      saleDate: ''
    });
    
    toast({
      title: "거래 추가됨",
      description: "새 거래가 목록에 추가되었습니다."
    });
  };
  
  // 거래 삭제
  const removeTransaction = (id: number) => {
    setTransactions(transactions.filter(transaction => transaction.id !== id));
    toast({
      title: "거래 삭제됨",
      description: "선택한 거래가 목록에서 제거되었습니다."
    });
  };
  
  // 프리미엄 기능 페이지로 이동
  const goToPremiumPage = () => {
    setLocation('/premium-features');
  };
  
  // 프리미엄 기능 접근 체크 (모든 기능 오픈)
  const checkPremiumAccess = (featureName: string) => {
    return true; // 모든 기능 접근 가능
  };

  // 1099-B 파일 업로드 시뮬레이션
  const simulateFileUpload = () => {
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // 업로드 진행 상황 시뮬레이션
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          
          // 업로드 완료 후 예시 데이터 추가
          const sampleTransactions: Transaction[] = [
            { 
              id: transactions.length + 1, 
              description: '아마존 주식', 
              buyPrice: 130, 
              sellPrice: 145, 
              quantity: 20, 
              profit: 300,
              purchaseDate: '2023-08-12',
              saleDate: '2024-03-25',
              isLongTerm: false
            },
            { 
              id: transactions.length + 2, 
              description: '구글 주식', 
              buyPrice: 2200, 
              sellPrice: 2350, 
              quantity: 5, 
              profit: 750,
              purchaseDate: '2022-05-18',
              saleDate: '2024-02-10',
              isLongTerm: true
            },
            { 
              id: transactions.length + 3, 
              description: '페이스북 주식', 
              buyPrice: 320, 
              sellPrice: 340, 
              quantity: 15, 
              profit: 300,
              purchaseDate: '2023-04-01',
              saleDate: '2024-05-01',
              isLongTerm: true
            }
          ];
          
          setTransactions(prev => [...prev, ...sampleTransactions]);
          
          toast({
            title: "1099-B 파일 처리 완료",
            description: "파일에서 3개의 거래가 추출되었습니다.",
            duration: 5000
          });
        }
        return newProgress;
      });
    }, 200);
  };
  
  // 자본 이득 저장 및 수입 페이지로 이동
  const saveAndReturn = () => {
    // 기존 소득 데이터가 없으면 실행하지 않음
    if (!taxData.income) return;
    
    // 기존 소득 데이터를 기반으로 새 소득 객체 생성
    const newIncome: Income = {
      ...taxData.income,
      // 자본 이득 업데이트
      capitalGains: totalCapitalGains,
      // 총소득 재계산
      totalIncome: (
        Number(taxData.income.wages) +
        Number(taxData.income.otherEarnedIncome) +
        Number(taxData.income.interestIncome) +
        Number(taxData.income.dividends) +
        Number(taxData.income.businessIncome) +
        totalCapitalGains +
        Number(taxData.income.rentalIncome) +
        Number(taxData.income.retirementIncome) +
        Number(taxData.income.unemploymentIncome) +
        Number(taxData.income.otherIncome)
      )
    };
    
    // 세금 데이터 업데이트
    updateTaxData({ income: newIncome });
    
    // 성공 메시지
    toast({
      title: "자본 이득 저장 완료",
      description: `자본 이득 $${totalCapitalGains.toLocaleString()}이(가) 소득에 추가되었습니다.`,
      duration: 3000
    });
    
    // 소득 페이지로 이동
    setLocation('/income');
  };
  
  return (
    <div className="container mx-auto py-6">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">자본 이득 계산기 (Capital Gains Calculator)</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation('/income')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>소득 페이지로 돌아가기</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              자본 이득을 계산하려면 아래에 거래 정보를 입력하세요.
              계산된 총 자본 이득은 소득 페이지의 자본 이득(Capital Gains) 필드에 자동으로 반영됩니다.
            </p>
          </div>
          

          
          {/* 거래 목록 테이블 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">거래 목록</h3>
            <Table>
              <TableCaption>자본 이득 거래 내역</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">종목/자산 설명</TableHead>
                  <TableHead className="text-right">매수가 ($)</TableHead>
                  <TableHead className="text-right">매도가 ($)</TableHead>
                  <TableHead className="text-right">수량</TableHead>
                  <TableHead className="text-center">구매일</TableHead>
                  <TableHead className="text-center">판매일</TableHead>
                  <TableHead className="text-center">유형</TableHead>
                  <TableHead className="text-right">이익/손실 ($)</TableHead>
                  <TableHead className="w-[80px]">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.description}</TableCell>
                    <TableCell className="text-right">${transaction.buyPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${transaction.sellPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{transaction.quantity}</TableCell>
                    <TableCell className="text-center">{transaction.purchaseDate}</TableCell>
                    <TableCell className="text-center">{transaction.saleDate}</TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        transaction.isLongTerm 
                          ? "bg-green-100 text-green-800" 
                          : "bg-amber-100 text-amber-800"
                      )}>
                        {transaction.isLongTerm ? '장기' : '단기'}
                      </span>
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-medium",
                      transaction.profit > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      ${transaction.profit.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTransaction(transaction.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        삭제
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* 새 거래 추가 폼 */}
          <div className="mb-6 p-4 border rounded-md">
            <h3 className="text-lg font-medium mb-3">새 거래 추가</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="description">종목/자산 설명</Label>
                <Input
                  id="description"
                  name="description"
                  value={newTransaction.description}
                  onChange={handleInputChange}
                  placeholder="예: 테슬라 주식"
                />
              </div>
              <div>
                <Label htmlFor="buyPrice">매수가 ($)</Label>
                <Input
                  id="buyPrice"
                  name="buyPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newTransaction.buyPrice || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="sellPrice">매도가 ($)</Label>
                <Input
                  id="sellPrice"
                  name="sellPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newTransaction.sellPrice || ''}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <Label htmlFor="quantity">수량</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={newTransaction.quantity || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="purchaseDate">구매일</Label>
                <Input
                  id="purchaseDate"
                  name="purchaseDate"
                  type="date"
                  value={newTransaction.purchaseDate}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="saleDate">판매일</Label>
                <Input
                  id="saleDate"
                  name="saleDate"
                  type="date"
                  value={newTransaction.saleDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button onClick={addTransaction} className="w-auto px-6">
                거래 추가
              </Button>
            </div>
          </div>
          
          {/* 요약 및 결과 */}
          <div className="bg-gray-50 p-6 rounded-md">
            <h3 className="text-xl font-bold mb-4">자본 이득 및 예상 세금 요약</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* 장기 투자 요약 */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="text-lg font-medium flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">장기</span>
                  장기 투자 (1년 이상)
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">이익 총액:</span>
                    <span className="font-medium text-green-600">${longTermGains.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">손실 총액:</span>
                    <span className="font-medium text-red-600">${longTermLosses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">예상 세율:</span>
                    <span className="font-medium">15%</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-medium">예상 세금:</span>
                    <span className="font-bold">${estimatedLongTermTax.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              {/* 단기 투자 요약 */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="text-lg font-medium flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">단기</span>
                  단기 투자 (1년 미만)
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">이익 총액:</span>
                    <span className="font-medium text-green-600">${shortTermGains.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">손실 총액:</span>
                    <span className="font-medium text-red-600">${shortTermLosses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">예상 세율:</span>
                    <span className="font-medium">24%</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-medium">예상 세금:</span>
                    <span className="font-bold">${estimatedShortTermTax.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 총 자본 이득 및 세금 */}
            <div className="bg-white p-4 rounded-lg border border-green-200 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">총 자본 이득 (Total Capital Gains)</h3>
                  <p className="text-gray-600 text-sm">
                    모든 거래의 이익을 합산한 금액입니다.
                  </p>
                </div>
                <div className="text-2xl font-bold text-green-600 mt-2 md:mt-0">
                  ${totalCapitalGains.toLocaleString()}
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">예상 총 세금 (Estimated Tax)</h3>
                  <p className="text-gray-600 text-sm">
                    장기 및 단기 자본 이득에 부과되는 예상 세금 합계입니다.
                  </p>
                </div>
                <div className="text-2xl font-bold text-blue-600 mt-2 md:mt-0">
                  ${totalEstimatedTax.toLocaleString()}
                </div>
              </div>
            </div>
            

            
            <div className="flex justify-end">
              <Button
                onClick={saveAndReturn}
                size="lg"
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                <span>자본 이득 저장 및 돌아가기</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      

    </div>
  );
}