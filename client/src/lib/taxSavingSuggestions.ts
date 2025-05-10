import { TaxData } from '@/context/TaxContext';
import { formatCurrency } from './taxCalculations';

// Define the structure for tax-saving suggestions
export interface TaxSavingSuggestion {
  id: string;
  title: string;
  description: string;
  potentialSavings: number | null;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Analyzes tax data to generate personalized tax-saving suggestions
 * Focuses on finding additional deduction opportunities
 */
export function generateTaxSavingSuggestions(taxData: TaxData): TaxSavingSuggestion[] {
  const suggestions: TaxSavingSuggestion[] = [];
  
  // Skip if essential data is missing
  if (!taxData || !taxData.income || !taxData.deductions || !taxData.taxCredits || !taxData.personalInfo) {
    return [];
  }
  
  // Check retirement contributions
  if (!taxData.retirementContributions?.traditionalIRA || taxData.retirementContributions.traditionalIRA < 6500) {
    const currentContribution = taxData.retirementContributions?.traditionalIRA || 0;
    const maxContribution = 6500;
    const additionalContribution = maxContribution - currentContribution;
    
    if (additionalContribution > 0) {
      suggestions.push({
        id: 'retirement-ira',
        title: '전통적 IRA 기여금 최대화 (Maximize Traditional IRA Contributions)',
        description: `현재 IRA 기여금은 ${formatCurrency(currentContribution)}입니다. 추가로 ${formatCurrency(additionalContribution)}을 기여하면 연간 한도인 ${formatCurrency(maxContribution)}까지 채울 수 있습니다. 이를 통해 세금 공제를 극대화하고 은퇴 저축을 늘릴 수 있습니다.`,
        potentialSavings: Math.round(additionalContribution * 0.22), // Assuming 22% tax bracket
        priority: additionalContribution > 3000 ? 'high' : 'medium'
      });
    }
  }
  
  // Check health savings account (HSA) contributions
  const hsaContribution = taxData.income.adjustments.healthSavingsAccount || 0;
  const hsaMaxIndividual = 3850;
  const hsaMaxFamily = 7750;
  const isFamily = taxData.personalInfo.filingStatus === 'married_joint' || 
                  (taxData.personalInfo.dependents && taxData.personalInfo.dependents.length > 0);
  const hsaMax = isFamily ? hsaMaxFamily : hsaMaxIndividual;
  
  if (hsaContribution < hsaMax) {
    const additionalHsaContribution = hsaMax - hsaContribution;
    suggestions.push({
      id: 'hsa-contribution',
      title: '건강 저축 계좌(HSA) 기여금 최대화 (Maximize HSA Contributions)',
      description: `현재 HSA 기여금은 ${formatCurrency(hsaContribution)}입니다. 추가로 ${formatCurrency(additionalHsaContribution)}을 기여하면 연간 한도인 ${formatCurrency(hsaMax)}까지 채울 수 있습니다. HSA 기여금은 세전 금액이며, 건강 관련 비용에 사용될 때 세금이 면제됩니다.`,
      potentialSavings: Math.round(additionalHsaContribution * 0.22), // Assuming 22% tax bracket
      priority: additionalHsaContribution > 1000 ? 'high' : 'medium'
    });
  }
  
  // Check student loan interest deduction
  const studentLoanInterest = taxData.income.adjustments.studentLoanInterest || 0;
  if (studentLoanInterest < 2500 && studentLoanInterest > 0) {
    const potentialAdditionalDeduction = 2500 - studentLoanInterest;
    suggestions.push({
      id: 'student-loan-interest',
      title: '학자금 대출 이자 공제 최대화 (Maximize Student Loan Interest Deduction)',
      description: `현재 학자금 대출 이자 공제액은 ${formatCurrency(studentLoanInterest)}입니다. 최대 ${formatCurrency(2500)}까지 공제 가능합니다. 올해 학자금 대출 이자 지불 내역을 검토하여 추가 공제 기회를 확인해보세요.`,
      potentialSavings: Math.round(potentialAdditionalDeduction * 0.22), // Assuming 22% tax bracket
      priority: 'medium'
    });
  }
  
  // Check itemized deductions vs standard deduction
  if (taxData.deductions.useStandardDeduction) {
    const standardDeduction = taxData.deductions.standardDeductionAmount;
    const itemizedDeductions = taxData.deductions.itemizedDeductions || {};
    
    // Calculate potential itemized deduction amount
    const potentialItemizedAmount = (itemizedDeductions.medicalExpenses || 0) +
                                   (itemizedDeductions.stateLocalIncomeTax || 0) +
                                   (itemizedDeductions.realEstateTaxes || 0) +
                                   (itemizedDeductions.mortgageInterest || 0) +
                                   (itemizedDeductions.charitableCash || 0) +
                                   (itemizedDeductions.charitableNonCash || 0);
    
    // If potential itemized amount is close to standard deduction
    const itemizedGap = standardDeduction - potentialItemizedAmount;
    if (itemizedGap > 0 && itemizedGap < 5000) {
      suggestions.push({
        id: 'itemized-deduction',
        title: '항목별 공제 고려 (Consider Itemized Deductions)',
        description: `현재 표준 공제($${standardDeduction})를 선택하셨습니다. 하지만 항목별 공제 총액이 $${Math.round(potentialItemizedAmount)}로, 표준 공제액보다 $${Math.round(itemizedGap)} 적습니다. 추가 자선 기부, 의료비, 주택 이자 등을 통해 항목별 공제를 늘려 표준 공제액을 초과하면 세금 절약이 가능합니다.`,
        potentialSavings: Math.round(itemizedGap * 0.22), // Assuming 22% tax bracket
        priority: itemizedGap < 2000 ? 'high' : 'medium'
      });
    }
  }
  
  // Check for child and dependent care credit maximization
  if (taxData.personalInfo.dependents && taxData.personalInfo.dependents.length > 0) {
    const childDependentCareCredit = taxData.taxCredits.childDependentCareCredit || 0;
    
    // Check if there are qualifying children under 13
    const hasQualifyingChildren = taxData.personalInfo.dependents.some(dependent => {
      if (!dependent.dateOfBirth) return false;
      const birthYear = new Date(dependent.dateOfBirth).getFullYear();
      return (2025 - birthYear) < 13; // Assuming tax year 2025
    });
    
    if (hasQualifyingChildren && childDependentCareCredit < 2000) {
      suggestions.push({
        id: 'child-care-credit',
        title: '자녀 및 부양가족 돌봄 세액공제 극대화 (Maximize Child and Dependent Care Credit)',
        description: `13세 미만의 자녀가 있는 경우, 보육 비용에 대해 최대 $4,000(한 명) 또는 $8,000(두 명 이상)까지 세액공제를 받을 수 있습니다. 현재 공제액은 ${formatCurrency(childDependentCareCredit)}입니다. 보육, 방과후 프로그램, 여름 캠프 등의 비용을 충분히 반영했는지 확인해보세요.`,
        potentialSavings: 2000 - childDependentCareCredit,
        priority: 'high'
      });
    }
  }
  
  // Check for education credits
  const educationCredits = taxData.taxCredits.educationCredits || 0;
  const aotcCredit = taxData.taxCredits.aotcCredit || 0;
  const llcCredit = taxData.taxCredits.llcCredit || 0;
  
  if (educationCredits < 2500) {
    suggestions.push({
      id: 'education-credits',
      title: '교육 세액공제 극대화 (Maximize Education Credits)',
      description: `미국인 기회 세액공제(AOTC)는 적격 학생당 최대 $2,500까지, 평생 학습 세액공제(LLC)는 최대 $2,000까지 받을 수 있습니다. 현재 교육 세액공제는 ${formatCurrency(educationCredits)}입니다. 학비, 교재비 등 교육 관련 지출을 모두 반영했는지 확인해보세요.`,
      potentialSavings: 2500 - educationCredits,
      priority: 'medium'
    });
  }
  
  // Check for retirement savings credit
  const retirementSavingsCredit = taxData.taxCredits.retirementSavingsCredit || 0;
  const income = taxData.income.adjustedGrossIncome;
  
  // Retirement savings credit is available for lower to middle income taxpayers
  if (income < 75000 && retirementSavingsCredit < 1000) {
    suggestions.push({
      id: 'retirement-savings-credit',
      title: '은퇴 저축 세액공제 활용 (Utilize Retirement Savings Credit)',
      description: `조정총소득(AGI)이 $75,000 미만인 경우, IRA나 401(k)와 같은 은퇴 계좌에 기여할 때 은퇴 저축 세액공제를 받을 수 있습니다. 현재 공제액은 ${formatCurrency(retirementSavingsCredit)}입니다. 은퇴 계좌 기여금을 늘려 추가 세액공제를 받을 수 있습니다.`,
      potentialSavings: 1000 - retirementSavingsCredit,
      priority: 'medium'
    });
  }
  
  // Check for charitable contributions
  if (taxData.deductions.itemizedDeductions) {
    const charitableCash = taxData.deductions.itemizedDeductions.charitableCash || 0;
    const charitableNonCash = taxData.deductions.itemizedDeductions.charitableNonCash || 0;
    const totalCharitable = charitableCash + charitableNonCash;
    const income = taxData.income.adjustedGrossIncome;
    
    // If charitable contributions are less than 2% of AGI, suggest increasing
    if (totalCharitable < income * 0.02) {
      const suggestedIncrease = Math.round(income * 0.02) - totalCharitable;
      suggestions.push({
        id: 'charitable-contributions',
        title: '자선 기부금 증액 고려 (Consider Increasing Charitable Contributions)',
        description: `현재 자선 기부금은 ${formatCurrency(totalCharitable)}로, 조정총소득(AGI)의 ${(totalCharitable/income*100).toFixed(1)}%입니다. 기부금을 ${formatCurrency(suggestedIncrease)} 증액하면 세금 공제 혜택을 더 받을 수 있습니다. 현금 기부 외에도 의류, 가구, 전자제품 등의 물품 기부도 공제 가능합니다.`,
        potentialSavings: Math.round(suggestedIncrease * 0.22), // Assuming 22% tax bracket
        priority: 'low'
      });
    }
  }
  
  return suggestions;
}
`