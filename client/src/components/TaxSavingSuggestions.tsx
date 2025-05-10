import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, AlertCircle, Lightbulb, TrendingUp, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TaxSavingSuggestion, generateTaxSavingSuggestions } from '@/lib/taxSavingSuggestions';
import { useTaxContext } from '@/context/TaxContext';
import { formatCurrency } from '@/lib/taxCalculations';

const TaxSavingSuggestions: React.FC = () => {
  const { taxData } = useTaxContext();
  const [expanded, setExpanded] = useState(true);
  
  // Generate tax-saving suggestions based on tax data
  const suggestions = generateTaxSavingSuggestions(taxData);
  
  // Calculate total potential savings
  const totalPotentialSavings = suggestions.reduce((sum, suggestion) => {
    return sum + (suggestion.potentialSavings || 0);
  }, 0);
  
  // Sort suggestions by priority (high to low)
  const sortedSuggestions = [...suggestions].sort((a, b) => {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-2 border-primary">
      <CardHeader className="bg-primary-light/10 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-primary" />
            <CardTitle className="text-lg font-heading font-semibold text-primary-dark">
              세금 절세 제안 (Tax-Saving Suggestions)
            </CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        <CardDescription>
          입력하신 정보를 분석하여 잠재적인 세금 절세 방안을 제안해 드립니다.
          추가 공제 가능성이 있는 항목들을 확인해 보세요.
          {totalPotentialSavings > 0 && (
            <span className="font-semibold block mt-1 text-primary">
              예상 절세 가능 금액: {formatCurrency(totalPotentialSavings)}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      {expanded && (
        <CardContent className="pt-4">
          <Alert variant="default" className="mb-4 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            <AlertTitle className="text-blue-700">참고 사항</AlertTitle>
            <AlertDescription className="text-blue-600 text-sm">
              아래 제안은 입력하신 정보를 기반으로 한 일반적인 세금 절세 방안입니다. 
              실제 세금 상황은 개인마다 다를 수 있으므로, 최종 결정 전에 세무 전문가와 상담하시기 바랍니다.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            {sortedSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="border rounded-lg p-4 bg-background">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                    <h4 className="font-semibold text-primary-dark">{suggestion.title}</h4>
                  </div>
                  <Badge 
                    variant={
                      suggestion.priority === 'high' ? 'default' : 
                      suggestion.priority === 'medium' ? 'secondary' : 'outline'
                    }
                    className={
                      suggestion.priority === 'high' ? 'bg-primary text-white' : 
                      suggestion.priority === 'medium' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' : 
                      'bg-gray-100 text-gray-800 hover:bg-gray-100'
                    }
                  >
                    {suggestion.priority === 'high' ? '높은 우선순위' : 
                     suggestion.priority === 'medium' ? '중간 우선순위' : '낮은 우선순위'}
                  </Badge>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">{suggestion.description}</p>
                
                {suggestion.potentialSavings && suggestion.potentialSavings > 0 && (
                  <div className="flex items-center text-sm text-success font-medium">
                    <ArrowRight className="h-4 w-4 mr-1" />
                    예상 절세 가능 금액: {formatCurrency(suggestion.potentialSavings)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default TaxSavingSuggestions;
`