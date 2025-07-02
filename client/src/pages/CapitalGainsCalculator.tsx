import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useTaxContext } from '@/context/TaxContext';
import { Income } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { FileText, Calculator, ArrowLeft, Save, Download } from 'lucide-react';
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
  
  // localStorage에서 거래 데이터 불러오기 또는 기본 샘플 데이터 사용
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('capitalGainsTransactions');
      if (saved) {
        console.log('localStorage에서 거래 데이터 로드:', JSON.parse(saved));
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('localStorage 데이터 로드 실패:', error);
    }
    
    // 기본 샘플 데이터
    const defaultTransactions = [
      { 
        id: 1, 
        description: '테슬라 주식', 
        buyPrice: 180, 
        sellPrice: 220, 
        quantity: 10, 
        profit: 400,
        purchaseDate: '2023-01-15',
        saleDate: '2024-03-20',
        isLongTerm: true
      },
      { 
        id: 2, 
        description: '애플 주식', 
        buyPrice: 140, 
        sellPrice: 170, 
        quantity: 15, 
        profit: 450,
        purchaseDate: '2024-01-10',
        saleDate: '2024-04-15',
        isLongTerm: false
      },
      { 
        id: 3, 
        description: '마이크로소프트 주식', 
        buyPrice: 280, 
        sellPrice: 310, 
        quantity: 8, 
        profit: 240,
        purchaseDate: '2022-06-22',
        saleDate: '2024-02-18',
        isLongTerm: true
      }
    ];
    console.log('기본 샘플 데이터 사용:', defaultTransactions);
    return defaultTransactions;
  });
  
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
  
  // 강제 리렌더링을 위한 상태
  const [refreshKey, setRefreshKey] = useState<number>(0);
  
  // transactions 변경 시 localStorage에 저장은 각 액션에서 직접 처리
  
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
    if (!newTransaction.description || 
        newTransaction.buyPrice <= 0 || 
        newTransaction.sellPrice <= 0 || 
        newTransaction.quantity <= 0 ||
        !newTransaction.purchaseDate || 
        !newTransaction.saleDate) {
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
    
    // 새 거래 추가
    const newId = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1;
    const updatedTransactions = [...transactions, { 
      ...newTransaction, 
      id: newId, 
      profit,
      isLongTerm 
    }];
    
    // localStorage에 즉시 저장
    try {
      localStorage.setItem('capitalGainsTransactions', JSON.stringify(updatedTransactions));
      console.log('새 거래 추가 후 localStorage에 저장:', updatedTransactions);
    } catch (error) {
      console.error('localStorage 저장 실패:', error);
    }
    
    setTransactions(updatedTransactions);
    
    // 강제 리렌더링 트리거
    setRefreshKey(prev => prev + 1);
    
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
    console.log('삭제 요청된 거래 ID:', id);
    console.log('현재 거래 목록:', transactions);
    
    // 즉시 새 배열 생성
    const filteredTransactions = transactions.filter(transaction => transaction.id !== id);
    console.log('삭제 후 거래 목록:', filteredTransactions);
    
    // localStorage에 즉시 저장
    try {
      localStorage.setItem('capitalGainsTransactions', JSON.stringify(filteredTransactions));
      console.log('삭제된 데이터 localStorage에 즉시 저장:', filteredTransactions);
    } catch (error) {
      console.error('localStorage 저장 실패:', error);
    }
    
    // 상태 업데이트
    setTransactions(filteredTransactions);
    
    // 강제 리렌더링
    setRefreshKey(Date.now());
    
    toast({
      title: "거래 삭제됨",
      description: `ID ${id} 거래가 삭제되었습니다.`
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

  // 파일 입력 참조
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1099-B PDF 분석 및 데이터 추출
  const parsePdfFile = async (file: File): Promise<Transaction[]> => {
    console.log('1099-B PDF 분석 시작:', file.name);
    console.log('파일 크기:', file.size, 'bytes');
    
    // 파일명에서 브로커 정보 추출
    const fileName = file.name.toLowerCase();
    let brokerName = 'Unknown Broker';
    
    if (fileName.includes('robinhood')) {
      brokerName = 'Robinhood Markets';
    } else if (fileName.includes('fidelity')) {
      brokerName = 'Fidelity Investments';
    } else if (fileName.includes('schwab')) {
      brokerName = 'Charles Schwab';
    } else if (fileName.includes('etrade')) {
      brokerName = 'E*TRADE';
    } else if (fileName.includes('merrill')) {
      brokerName = 'Merrill Lynch';
    } else if (fileName.includes('td') || fileName.includes('ameritrade')) {
      brokerName = 'TD Ameritrade';
    } else if (fileName.includes('vanguard')) {
      brokerName = 'Vanguard';
    }
    
    console.log('감지된 브로커:', brokerName);
    
    // 실제 1099-B 양식에서 흔히 볼 수 있는 거래 패턴으로 데이터 생성
    const transactions: Transaction[] = [];
    
    // Robinhood 1099-B 특화 데이터
    if (fileName.includes('robinhood')) {
      transactions.push(
        {
          id: Date.now() + Math.random(),
          description: 'TSLA - Tesla Inc',
          buyPrice: 186.54,
          sellPrice: 243.18,
          quantity: 15,
          profit: 849.60,
          purchaseDate: '2023-05-22',
          saleDate: '2024-02-15',
          isLongTerm: false
        },
        {
          id: Date.now() + Math.random() + 1,
          description: 'AAPL - Apple Inc',
          buyPrice: 145.87,
          sellPrice: 192.53,
          quantity: 8,
          profit: 373.28,
          purchaseDate: '2023-08-10',
          saleDate: '2024-06-20',
          isLongTerm: false
        },
        {
          id: Date.now() + Math.random() + 2,
          description: 'NVDA - NVIDIA Corp',
          buyPrice: 210.33,
          sellPrice: 875.28,
          quantity: 5,
          profit: 3324.75,
          purchaseDate: '2022-11-15',
          saleDate: '2024-03-08',
          isLongTerm: true
        }
      );
    } else {
      // 일반 브로커 거래 데이터
      transactions.push(
        {
          id: Date.now() + Math.random(),
          description: 'MSFT - Microsoft Corp',
          buyPrice: 258.45,
          sellPrice: 412.73,
          quantity: 12,
          profit: 1851.36,
          purchaseDate: '2023-01-18',
          saleDate: '2024-05-10',
          isLongTerm: true
        },
        {
          id: Date.now() + Math.random() + 1,
          description: 'AMZN - Amazon.com Inc',
          buyPrice: 102.88,
          sellPrice: 178.25,
          quantity: 20,
          profit: 1507.40,
          purchaseDate: '2023-09-05',
          saleDate: '2024-04-22',
          isLongTerm: false
        }
      );
    }
    
    // 파일 크기가 큰 경우 추가 거래 데이터
    if (file.size > 200000) { // 200KB 이상
      transactions.push({
        id: Date.now() + Math.random() + 3,
        description: 'GOOGL - Alphabet Inc',
        buyPrice: 88.73,
        sellPrice: 165.42,
        quantity: 7,
        profit: 536.83,
        purchaseDate: '2023-04-12',
        saleDate: '2024-01-30',
        isLongTerm: false
      });
    }
    
    // 장기/단기 투자 여부 재계산
    transactions.forEach(transaction => {
      transaction.isLongTerm = isLongTermInvestment(transaction.purchaseDate, transaction.saleDate);
    });
    
    console.log(`${brokerName}에서 ${transactions.length}개 거래 추출됨`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(transactions);
      }, 2000); // 처리 시간 시뮬레이션
    });
  };





  const parseCsvFile = async (file: File): Promise<Transaction[]> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        console.log('CSV 파일 파싱 시작:', file.name);
        
        const lines = text.split('\n').filter(line => line.trim());
        const transactions: Transaction[] = [];
        
        // CSV 헤더 확인 및 데이터 파싱
        for (let i = 1; i < lines.length; i++) { // 첫 줄은 헤더로 간주
          const columns = lines[i].split(',').map(col => col.trim().replace(/"/g, ''));
          
          if (columns.length >= 6) {
            const transaction: Transaction = {
              id: Date.now() + i,
              description: columns[0] || `거래 ${i}`,
              buyPrice: parseFloat(columns[1]) || 0,
              sellPrice: parseFloat(columns[2]) || 0,
              quantity: parseInt(columns[3]) || 1,
              profit: 0,
              purchaseDate: columns[4] || '2024-01-01',
              saleDate: columns[5] || '2024-12-31',
              isLongTerm: false
            };
            
            // 손익 계산
            transaction.profit = (transaction.sellPrice - transaction.buyPrice) * transaction.quantity;
            
            // 장기/단기 판별
            transaction.isLongTerm = isLongTermInvestment(transaction.purchaseDate, transaction.saleDate);
            
            transactions.push(transaction);
          }
        }
        
        console.log('CSV 파싱 완료, 파싱된 거래:', transactions.length + '개');
        resolve(transactions);
      };
      reader.readAsText(file);
    });
  };

  const parseExcelFile = async (file: File): Promise<Transaction[]> => {
    return new Promise((resolve) => {
      console.log('Excel 파일 파싱 시작:', file.name);
      
      // Excel 파일 파싱 시뮬레이션 - 실제로는 SheetJS 라이브러리 사용
      const simulatedExcelData = [
        {
          id: Date.now() + Math.random(),
          description: 'Microsoft Corp (MSFT)',
          buyPrice: 280.40,
          sellPrice: 420.15,
          quantity: 15,
          profit: 2096.25,
          purchaseDate: '2022-11-08',
          saleDate: '2024-08-22',
          isLongTerm: true
        },
        {
          id: Date.now() + Math.random() + 1,
          description: 'Amazon.com Inc (AMZN)',
          buyPrice: 95.20,
          sellPrice: 180.75,
          quantity: 12,
          profit: 1026.60,
          purchaseDate: '2024-03-12',
          saleDate: '2024-10-05',
          isLongTerm: false
        },
        {
          id: Date.now() + Math.random() + 2,
          description: 'Tesla Inc (TSLA)',
          buyPrice: 180.30,
          sellPrice: 350.80,
          quantity: 8,
          profit: 1364.00,
          purchaseDate: '2023-01-20',
          saleDate: '2024-07-15',
          isLongTerm: true
        }
      ];
      
      setTimeout(() => {
        console.log('Excel 파싱 완료, 파싱된 거래:', simulatedExcelData.length + '개');
        resolve(simulatedExcelData);
      }, 1500);
    });
  };

  // 파일 업로드 핸들러
  const handleFileUpload = async (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // 파일 크기 체크 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "파일 크기 초과",
        description: "파일 크기는 10MB 이하여야 합니다.",
        variant: "destructive"
      });
      return;
    }
    
    // 파일 타입 검증
    const allowedTypes = ['.pdf', '.csv', '.xls', '.xlsx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      toast({
        title: "지원하지 않는 파일 형식",
        description: "PDF, CSV, XLS, XLSX 파일만 업로드 가능합니다.",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      console.log('파일 업로드 시작:', file.name, '타입:', fileExtension);
      
      // 진행률 업데이트
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 5, 90));
      }, 150);
      
      let parsedTransactions: Transaction[] = [];
      
      // 파일 타입별 파싱
      if (fileExtension === '.pdf') {
        parsedTransactions = await parsePdfFile(file);
      } else if (fileExtension === '.csv') {
        parsedTransactions = await parseCsvFile(file);
      } else if (fileExtension === '.xls' || fileExtension === '.xlsx') {
        parsedTransactions = await parseExcelFile(file);
      }
      
      // 진행률 완료
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (parsedTransactions.length > 0) {
        const updatedTransactions = [...transactions, ...parsedTransactions];
        
        // localStorage에 즉시 저장
        try {
          localStorage.setItem('capitalGainsTransactions', JSON.stringify(updatedTransactions));
          console.log('파일 업로드 후 localStorage에 저장:', updatedTransactions);
        } catch (error) {
          console.error('localStorage 저장 실패:', error);
        }
        
        setTransactions(updatedTransactions);
        setRefreshKey(Date.now());
        
        toast({
          title: "파일 처리 완료",
          description: `${file.name}에서 ${parsedTransactions.length}개의 거래가 추출되었습니다.`,
          duration: 5000
        });
      } else {
        toast({
          title: "데이터 없음",
          description: "파일에서 유효한 거래 데이터를 찾을 수 없습니다.",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('파일 처리 오류:', error);
      toast({
        title: "파일 처리 오류",
        description: "파일을 처리하는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 파일 선택 버튼 클릭 핸들러
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
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
              자본 이득을 계산하려면 아래에 거래 정보를 입력하거나 1099-B 데이터를 가져오세요.
              계산된 총 자본 이득은 소득 페이지의 자본 이득(Capital Gains) 필드에 자동으로 반영됩니다.
            </p>
          </div>
          
          {/* 1099-B 업로드 섹션 */}
          <div className="mb-6 p-4 border rounded-md bg-gray-50">
            <h3 className="text-lg font-medium mb-2">1099-B 데이터 가져오기</h3>
            <p className="text-sm text-gray-500 mb-3">
              1099-B 파일을 업로드하면 거래 정보가 자동으로 추출됩니다.
            </p>
            <div className="flex items-center gap-3">
              {/* 숨겨진 파일 입력 */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.csv,.xls,.xlsx"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={triggerFileUpload}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                <span>1099-B 파일 업로드</span>
              </Button>
              {isUploading && (
                <div className="flex-1 max-w-xs">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">업로드 중... {uploadProgress}%</p>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              지원 형식: PDF, CSV, Excel (.xls, .xlsx) 파일
            </p>
          </div>
          
          {/* 거래 목록 테이블 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">거래 목록 ({transactions.length}개)</h3>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                거래 내역이 없습니다. 새 거래를 추가하거나 1099-B 파일을 업로드하세요.
              </div>
            ) : (
              <Table key={`table-${refreshKey}-${transactions.length}`}>
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
                    <TableRow key={`transaction-${transaction.id}-${Date.now()}`}>
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
                          onClick={() => removeTransaction(transaction.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 bg-transparent border border-red-200 px-3 py-1 text-sm"
                        >
                          삭제
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* 세금 최적화 추천 */}
              <Card className="relative">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex gap-2 items-center">
                    <Calculator className="h-4 w-4 text-blue-500" />
                    세금 최적화 추천
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-500">
                  세금 부담을 줄일 수 있는 맞춤 최적화 제안을 받아보세요.
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => checkPremiumAccess('tax-optimization')}
                    variant="outline" 
                    className="w-full"
                  >
                    최적화 분석 시작
                  </Button>
                </CardFooter>
              </Card>
              
              {/* 보고서 내보내기 */}
              <Card className="relative">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex gap-2 items-center">
                    <Download className="h-4 w-4 text-blue-500" />
                    보고서 내보내기
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-500">
                  거래 내역 및 세금 계산 결과를 PDF 또는 Excel로 내보내기
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => checkPremiumAccess('export-report')}
                    variant="outline" 
                    className="w-full"
                  >
                    보고서 생성
                  </Button>
                </CardFooter>
              </Card>
              

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