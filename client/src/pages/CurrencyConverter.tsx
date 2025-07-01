import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowRightLeft, 
  DollarSign, 
  TrendingUp, 
  Calculator,
  RefreshCw,
  Globe,
  Clock,
  Info,
  Star
} from 'lucide-react';

interface ExchangeRates {
  [key: string]: number;
}

interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

interface CountryTaxInfo {
  name: string;
  brackets: TaxBracket[];
  standardDeduction: number;
  currency: string;
}

const CurrencyConverter: React.FC = () => {
  const { toast } = useToast();
  const [amount, setAmount] = useState<string>('1000');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('KRW');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('us');
  const [taxableIncome, setTaxableIncome] = useState<string>('50000');

  // Supported currencies with names
  const currencies = {
    'USD': { name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    'KRW': { name: 'Korean Won', symbol: '₩', flag: '🇰🇷' },
    'EUR': { name: 'Euro', symbol: '€', flag: '🇪🇺' },
    'JPY': { name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
    'GBP': { name: 'British Pound', symbol: '£', flag: '🇬🇧' },
    'CAD': { name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
    'AUD': { name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
    'CHF': { name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
    'CNY': { name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
    'SGD': { name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' }
  };

  // Tax information for different countries
  const countryTaxInfo: { [key: string]: CountryTaxInfo } = {
    'us': {
      name: 'United States',
      currency: 'USD',
      standardDeduction: 13850,
      brackets: [
        { min: 0, max: 10275, rate: 10 },
        { min: 10275, max: 41775, rate: 12 },
        { min: 41775, max: 89450, rate: 22 },
        { min: 89450, max: 190750, rate: 24 },
        { min: 190750, max: 364200, rate: 32 },
        { min: 364200, max: 462500, rate: 35 },
        { min: 462500, max: Infinity, rate: 37 }
      ]
    },
    'kr': {
      name: 'South Korea',
      currency: 'KRW',
      standardDeduction: 1500000,
      brackets: [
        { min: 0, max: 14000000, rate: 6 },
        { min: 14000000, max: 50000000, rate: 15 },
        { min: 50000000, max: 88000000, rate: 24 },
        { min: 88000000, max: 150000000, rate: 35 },
        { min: 150000000, max: 300000000, rate: 38 },
        { min: 300000000, max: 500000000, rate: 40 },
        { min: 500000000, max: Infinity, rate: 42 }
      ]
    },
    'uk': {
      name: 'United Kingdom',
      currency: 'GBP',
      standardDeduction: 12570,
      brackets: [
        { min: 0, max: 37700, rate: 20 },
        { min: 37700, max: 150000, rate: 40 },
        { min: 150000, max: Infinity, rate: 45 }
      ]
    },
    'de': {
      name: 'Germany',
      currency: 'EUR',
      standardDeduction: 10908,
      brackets: [
        { min: 0, max: 10908, rate: 0 },
        { min: 10908, max: 62810, rate: 14 },
        { min: 62810, max: 277826, rate: 42 },
        { min: 277826, max: Infinity, rate: 45 }
      ]
    }
  };

  // Mock exchange rates - in production, this would come from a real API
  const mockExchangeRates: ExchangeRates = {
    'USD': 1,
    'KRW': 1320.50,
    'EUR': 0.85,
    'JPY': 149.20,
    'GBP': 0.73,
    'CAD': 1.35,
    'AUD': 1.48,
    'CHF': 0.92,
    'CNY': 7.15,
    'SGD': 1.34
  };

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  useEffect(() => {
    if (exchangeRates[fromCurrency] && exchangeRates[toCurrency]) {
      calculateConversion();
    }
  }, [amount, fromCurrency, toCurrency, exchangeRates]);

  const fetchExchangeRates = async () => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production, replace with actual API call
      setExchangeRates(mockExchangeRates);
      setLastUpdated(new Date().toLocaleString('ko-KR'));
      
      toast({
        title: "환율 정보 업데이트됨",
        description: "최신 환율 정보를 가져왔습니다.",
      });
    } catch (error) {
      toast({
        title: "환율 정보 오류",
        description: "환율 정보를 가져오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateConversion = () => {
    const numAmount = parseFloat(amount) || 0;
    const fromRate = exchangeRates[fromCurrency] || 1;
    const toRate = exchangeRates[toCurrency] || 1;
    
    // Convert to USD first, then to target currency
    const usdAmount = numAmount / fromRate;
    const converted = usdAmount * toRate;
    
    setConvertedAmount(converted);
  };

  const calculateTax = (income: number, country: string): { tax: number, afterTax: number, effectiveRate: number } => {
    const taxInfo = countryTaxInfo[country];
    if (!taxInfo) return { tax: 0, afterTax: income, effectiveRate: 0 };

    let totalTax = 0;
    let remainingIncome = Math.max(0, income - taxInfo.standardDeduction);

    for (const bracket of taxInfo.brackets) {
      if (remainingIncome <= 0) break;
      
      const taxableInThisBracket = Math.min(remainingIncome, bracket.max - bracket.min);
      totalTax += taxableInThisBracket * (bracket.rate / 100);
      remainingIncome -= taxableInThisBracket;
    }

    const effectiveRate = income > 0 ? (totalTax / income) * 100 : 0;
    return {
      tax: totalTax,
      afterTax: income - totalTax,
      effectiveRate: effectiveRate
    };
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const formatCurrency = (value: number, currencyCode: string): string => {
    const currency = currencies[currencyCode as keyof typeof currencies];
    if (!currency) return value.toFixed(2);
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: currencyCode === 'KRW' || currencyCode === 'JPY' ? 0 : 2,
      maximumFractionDigits: currencyCode === 'KRW' || currencyCode === 'JPY' ? 0 : 2,
    }).format(value);
  };

  const taxCalculation = calculateTax(parseFloat(taxableIncome) || 0, selectedCountry);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          <Globe className="inline-block mr-3 text-blue-600" />
          실시간 환율 & 세율 변환기
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          전 세계 주요 통화의 실시간 환율과 국가별 세율을 한 번에 비교하고 계산하세요
        </p>
      </div>

      <Tabs defaultValue="currency" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="currency" className="text-lg py-3">
            <ArrowRightLeft className="mr-2 h-5 w-5" />
            환율 변환
          </TabsTrigger>
          <TabsTrigger value="tax" className="text-lg py-3">
            <Calculator className="mr-2 h-5 w-5" />
            세율 계산
          </TabsTrigger>
        </TabsList>

        <TabsContent value="currency" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <DollarSign className="mr-2 h-6 w-6 text-green-600" />
                  실시간 환율 변환
                </span>
                <Button 
                  variant="outline" 
                  onClick={fetchExchangeRates}
                  disabled={isLoading}
                  className="flex items-center"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  새로고침
                </Button>
              </CardTitle>
              <CardDescription>
                주요 통화 간 실시간 환율을 확인하고 금액을 변환하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-lg font-medium">변환할 금액</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-xl py-3"
                  placeholder="금액을 입력하세요"
                />
              </div>

              {/* Currency Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <Label className="text-lg font-medium">기준 통화</Label>
                  <Select value={fromCurrency} onValueChange={setFromCurrency}>
                    <SelectTrigger className="text-lg py-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(currencies).map(([code, info]) => (
                        <SelectItem key={code} value={code}>
                          <span className="flex items-center">
                            <span className="mr-2">{info.flag}</span>
                            <span className="font-medium">{code}</span>
                            <span className="ml-2 text-gray-500">{info.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={swapCurrencies}
                    className="rounded-full h-12 w-12"
                  >
                    <ArrowRightLeft className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-lg font-medium">변환 통화</Label>
                  <Select value={toCurrency} onValueChange={setToCurrency}>
                    <SelectTrigger className="text-lg py-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(currencies).map(([code, info]) => (
                        <SelectItem key={code} value={code}>
                          <span className="flex items-center">
                            <span className="mr-2">{info.flag}</span>
                            <span className="font-medium">{code}</span>
                            <span className="ml-2 text-gray-500">{info.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Conversion Result */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(parseFloat(amount) || 0, fromCurrency)}
                    </div>
                    <ArrowRightLeft className="mx-auto h-6 w-6 text-blue-600" />
                    <div className="text-3xl font-bold text-blue-600">
                      {formatCurrency(convertedAmount, toCurrency)}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center justify-center">
                      <Clock className="mr-1 h-4 w-4" />
                      마지막 업데이트: {lastUpdated}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Exchange Rate Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">환율 정보</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(currencies).map(([code, info]) => (
                      <div key={code} className="text-center p-3 border rounded-lg">
                        <div className="text-2xl mb-1">{info.flag}</div>
                        <div className="font-medium">{code}</div>
                        <div className="text-sm text-gray-600">
                          {exchangeRates[code] ? exchangeRates[code].toFixed(2) : '로딩중...'}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-6 w-6 text-purple-600" />
                국가별 세율 계산기
              </CardTitle>
              <CardDescription>
                주요 국가의 소득세율을 비교하고 실제 세금을 계산해보세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Country Selection */}
              <div className="space-y-2">
                <Label className="text-lg font-medium">국가 선택</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="text-lg py-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(countryTaxInfo).map(([code, info]) => (
                      <SelectItem key={code} value={code}>
                        {info.name} ({info.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Income Input */}
              <div className="space-y-2">
                <Label htmlFor="taxableIncome" className="text-lg font-medium">
                  연간 소득 ({countryTaxInfo[selectedCountry]?.currency})
                </Label>
                <Input
                  id="taxableIncome"
                  type="number"
                  value={taxableIncome}
                  onChange={(e) => setTaxableIncome(e.target.value)}
                  className="text-xl py-3"
                  placeholder="연간 소득을 입력하세요"
                />
              </div>

              {/* Tax Calculation Results */}
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">총 소득</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(parseFloat(taxableIncome) || 0, countryTaxInfo[selectedCountry]?.currency || 'USD')}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">세금</div>
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(taxCalculation.tax, countryTaxInfo[selectedCountry]?.currency || 'USD')}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">세후 소득</div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(taxCalculation.afterTax, countryTaxInfo[selectedCountry]?.currency || 'USD')}
                      </div>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="text-center">
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      실효세율: {taxCalculation.effectiveRate.toFixed(2)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Tax Brackets */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {countryTaxInfo[selectedCountry]?.name} 세율 구간
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {countryTaxInfo[selectedCountry]?.brackets.map((bracket, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                        <div className="font-medium">
                          {bracket.max === Infinity ? 
                            `${formatCurrency(bracket.min, countryTaxInfo[selectedCountry].currency)} 이상` :
                            `${formatCurrency(bracket.min, countryTaxInfo[selectedCountry].currency)} - ${formatCurrency(bracket.max, countryTaxInfo[selectedCountry].currency)}`
                          }
                        </div>
                        <Badge variant={bracket.rate === 0 ? "secondary" : "default"}>
                          {bracket.rate}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Alert className="mt-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      표준공제: {formatCurrency(countryTaxInfo[selectedCountry]?.standardDeduction || 0, countryTaxInfo[selectedCountry]?.currency || 'USD')}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CurrencyConverter;