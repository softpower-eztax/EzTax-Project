import { TaxData } from '@/types/tax';

export interface TaxSavingSuggestion {
  id: string;
  title: string;
  description: string;
  potentialSavings?: number;
  priority: 'high' | 'medium' | 'low';
  category?: string;
}

/**
 * Format currency values for display
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Analyzes tax data to generate personalized tax-saving suggestions
 * Only suggests strategies that are actually beneficial given the user's current situation
 */
export function generateTaxSavingSuggestions(taxData: TaxData): TaxSavingSuggestion[] {
  const suggestions: TaxSavingSuggestion[] = [];
  
  // Skip if essential data is missing
  if (!taxData || !taxData.income || !taxData.deductions || !taxData.personalInfo) {
    return [{
      id: 'incomplete-data',
      title: '데이터 부족 (Incomplete Data)',
      description: '세무 정보가 완전하지 않아 절세 제안을 생성할 수 없습니다. 모든 필수 정보를 입력해 주세요.',
      potentialSavings: 0,
      priority: 'high',
      category: 'information'
    }];
  }
  
  // Get current tax calculation results
  const results = taxData.calculatedResults;
  const currentTaxDue = results?.taxDue || 0;
  const currentRefund = results?.refundAmount || 0;
  const isUsingStandardDeduction = taxData.deductions?.useStandardDeduction !== false;
  const currentItemizedTotal = taxData.deductions?.itemizedDeductions ? 
    Object.values(taxData.deductions.itemizedDeductions).reduce((sum, val) => sum + (val || 0), 0) : 0;
  const standardDeductionAmount = taxData.deductions?.standardDeductionAmount || 27700; // 2024 MFJ standard deduction
  
  // Explain why standard deduction is optimal if that's the case
  if (isUsingStandardDeduction && currentItemizedTotal < standardDeductionAmount) {
    suggestions.push({
      id: 'standard-deduction-optimal',
      title: '표준공제가 최적입니다 (Standard Deduction is Optimal)',
      description: `현재 항목별 공제 총액(${formatCurrency(currentItemizedTotal)})이 표준공제액(${formatCurrency(standardDeductionAmount)})보다 적어 표준공제 사용이 유리합니다. 자선기부나 의료비 등 추가 항목별 공제는 현재 세액에 영향을 주지 않습니다.`,
      potentialSavings: 0,
      priority: 'high',
      category: 'information'
    });
  }
  
  // Explain why most strategies won't help if user has no tax liability
  if (currentTaxDue <= 0 && currentRefund > 0) {
    suggestions.push({
      id: 'no-tax-liability',
      title: '현재 세금 부담이 없습니다 (No Current Tax Liability)',
      description: `환급 예정액이 ${formatCurrency(currentRefund)}입니다. 추가 공제나 크레딧은 환급액을 늘리지 않으므로 대부분의 절세 전략이 현재 상황에서는 효과가 제한적입니다. 대신 내년도 세무 계획에 집중하세요.`,
      potentialSavings: 0,
      priority: 'high',
      category: 'information'
    });
  }
  
  // Only suggest strategies that would actually save taxes
  if (currentTaxDue > 0) {
    // Traditional IRA contribution suggestion
    const maxIRAContribution = 7000; // 2024 limit for under 50
    const currentIRAContrib = taxData.income?.adjustments?.retirementContributions || 0;
    const additionalIRARoom = maxIRAContribution - currentIRAContrib;
    
    if (additionalIRARoom > 0) {
      const marginalTaxRate = 0.22; // Estimate based on income level
      const potentialSavings = additionalIRARoom * marginalTaxRate;
      
      suggestions.push({
        id: 'retirement-ira',
        title: '전통적 IRA 기여금 최대화 (Maximize Traditional IRA Contributions)',
        description: `현재 IRA 기여금은 ${formatCurrency(currentIRAContrib)}입니다. 최대 ${formatCurrency(additionalIRARoom)}를 추가로 기여하여 과세소득을 줄일 수 있습니다.`,
        potentialSavings: Math.round(potentialSavings),
        priority: additionalIRARoom > 3000 ? 'high' : 'medium',
        category: 'retirement'
      });
    }
    
    // HSA contribution if applicable
    suggestions.push({
      id: 'hsa-contribution',
      title: 'HSA 기여금 최대화 (Maximize HSA Contribution)',
      description: 'HDHP 보험이 있다면 HSA 기여금을 늘려 삼중 세제 혜택을 받으세요. 2024년 한도는 개인 $4,150, 가족 $8,300입니다.',
      potentialSavings: 913, // $4150 * 22%
      priority: 'medium',
      category: 'health'
    });
    
    // Only suggest charitable contributions if itemizing makes sense
    if (!isUsingStandardDeduction || currentItemizedTotal > standardDeductionAmount * 0.9) {
      const currentCharitable = (taxData.deductions?.itemizedDeductions?.charitableCash || 0) + 
                               (taxData.deductions?.itemizedDeductions?.charitableNonCash || 0);
      
      suggestions.push({
        id: 'charitable-deduction',
        title: '자선 기부 공제 활용 (Charitable Contribution Deduction)',
        description: `현재 ${formatCurrency(currentCharitable)} 기부 중입니다. 항목별 공제를 사용하고 있으므로 추가 기부가 세액 절약에 도움이 됩니다.`,
        potentialSavings: Math.round(1000 * 0.22), // Estimate $1000 additional charitable giving
        priority: 'medium',
        category: 'deductions'
      });
    }
    
    // Check student loan interest deduction
    const studentLoanInterest = taxData.income?.adjustments?.studentLoanInterest || 0;
    if (studentLoanInterest < 2500 && studentLoanInterest > 0) {
      const potentialAdditionalDeduction = 2500 - studentLoanInterest;
      suggestions.push({
        id: 'student-loan-interest',
        title: '학자금 대출 이자 공제 최대화 (Maximize Student Loan Interest Deduction)',
        description: `현재 학자금 대출 이자 공제액은 ${formatCurrency(studentLoanInterest)}입니다. 최대 ${formatCurrency(2500)}까지 공제 가능합니다.`,
        potentialSavings: Math.round(potentialAdditionalDeduction * 0.22),
        priority: 'medium',
        category: 'deductions'
      });
    }
  }
  
  // If no actionable suggestions, provide general guidance
  if (suggestions.length === 0 || suggestions.every(s => s.potentialSavings === 0)) {
    suggestions.push({
      id: 'general-planning',
      title: '내년도 세무 계획 (Next Year Tax Planning)',
      description: '현재 상황에서는 즉시 적용 가능한 절세 방안이 제한적입니다. 내년도를 위한 세무 계획을 세우시거나 전문가와 상담하는 것을 고려해보세요.',
      potentialSavings: 0,
      priority: 'medium',
      category: 'planning'
    });
  }
  
  return suggestions;
}