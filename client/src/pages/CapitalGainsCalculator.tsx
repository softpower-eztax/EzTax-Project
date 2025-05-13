import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useTaxContext } from '@/context/TaxContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileText, Calculator, ArrowLeft, Save } from 'lucide-react';
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
}

export default function CapitalGainsCalculator() {
  const [, navigate] = useLocation();
  const { taxData, updateTaxData } = useTaxContext();
  const { toast } = useToast();
  
  // 초기 상태: 일부 예시 거래 데이터
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: 1, description: '테슬라 주식', buyPrice: 180, sellPrice: 220, quantity: 10, profit: 400 },
    { id: 2, description: '애플 주식', buyPrice: 140, sellPrice: 170, quantity: 15, profit: 450 },
    { id: 3, description: '마이크로소프트 주식', buyPrice: 280, sellPrice: 310, quantity: 8, profit: 240 },
  ]);
  
  // 새로운 거래 입력을 위한 상태
  const [newTransaction, setNewTransaction] = useState<Omit<Transaction, 'id' | 'profit'>>({
    description: '',
    buyPrice: 0,
    sellPrice: 0,
    quantity: 0
  });
  
  // 업로드 상태 관리
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  // 총 자본 이득 계산
  const totalCapitalGains = transactions.reduce((sum, transaction) => sum + transaction.profit, 0);
  
  // 입력 필드 변경 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTransaction(prev => ({
      ...prev,
      [name]: name === 'description' ? value : Number(value)
    }));
  };
  
  // 새 거래 추가
  const addTransaction = () => {
    if (!newTransaction.description || newTransaction.buyPrice <= 0 || newTransaction.sellPrice <= 0 || newTransaction.quantity <= 0) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 올바르게 입력해주세요.",
        variant: "destructive"
      });
      return;
    }
    
    // 이익 계산
    const profit = (newTransaction.sellPrice - newTransaction.buyPrice) * newTransaction.quantity;
    
    // 새 거래 추가
    const newId = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1;
    setTransactions([...transactions, { ...newTransaction, id: newId, profit }]);
    
    // 입력 필드 초기화
    setNewTransaction({
      description: '',
      buyPrice: 0,
      sellPrice: 0,
      quantity: 0
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
            { id: transactions.length + 1, description: '아마존 주식', buyPrice: 130, sellPrice: 145, quantity: 20, profit: 300 },
            { id: transactions.length + 2, description: '구글 주식', buyPrice: 2200, sellPrice: 2350, quantity: 5, profit: 750 },
            { id: transactions.length + 3, description: '페이스북 주식', buyPrice: 320, sellPrice: 340, quantity: 15, profit: 300 }
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
    // 현재 소득 데이터 복사
    const updatedIncome = {...taxData.income};
    
    // 자본 이득 업데이트
    updatedIncome.capitalGains = totalCapitalGains;
    
    // 총소득 재계산
    updatedIncome.totalIncome = (
      Number(updatedIncome.wages || 0) +
      Number(updatedIncome.otherEarnedIncome || 0) +
      Number(updatedIncome.interestIncome || 0) +
      Number(updatedIncome.dividends || 0) +
      Number(updatedIncome.businessIncome || 0) +
      Number(totalCapitalGains || 0) +
      Number(updatedIncome.rentalIncome || 0) +
      Number(updatedIncome.retirementIncome || 0) +
      Number(updatedIncome.unemploymentIncome || 0) +
      Number(updatedIncome.otherIncome || 0)
    );
    
    // 세금 데이터 업데이트
    updateTaxData({ income: updatedIncome });
    
    // 성공 메시지
    toast({
      title: "자본 이득 저장 완료",
      description: `자본 이득 $${totalCapitalGains.toLocaleString()}이(가) 소득에 추가되었습니다.`,
      duration: 3000
    });
    
    // 소득 페이지로 이동
    navigate('/income');
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
              onClick={() => navigate('/income')}
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
              <Button
                variant="outline"
                size="sm"
                onClick={simulateFileUpload}
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
          </div>
          
          {/* 거래 목록 테이블 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">거래 목록</h3>
            <Table>
              <TableCaption>자본 이득 거래 내역</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">종목/자산 설명</TableHead>
                  <TableHead className="text-right">매수가 ($)</TableHead>
                  <TableHead className="text-right">매도가 ($)</TableHead>
                  <TableHead className="text-right">수량</TableHead>
                  <TableHead className="text-right">이익/손실 ($)</TableHead>
                  <TableHead className="w-[100px]">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.description}</TableCell>
                    <TableCell className="text-right">${transaction.buyPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${transaction.sellPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{transaction.quantity}</TableCell>
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-1">
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
              <div className="flex items-end">
                <Button onClick={addTransaction} className="w-full">
                  거래 추가
                </Button>
              </div>
            </div>
          </div>
          
          {/* 요약 및 결과 */}
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-medium">총 자본 이득 (Total Capital Gains)</h3>
                <p className="text-gray-600 text-sm">
                  모든 거래의 이익과 손실을 합산한 금액입니다.
                </p>
              </div>
              <div className="text-3xl font-bold text-green-600 mt-2 md:mt-0">
                ${totalCapitalGains.toLocaleString()}
              </div>
            </div>
            <Separator className="my-4" />
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