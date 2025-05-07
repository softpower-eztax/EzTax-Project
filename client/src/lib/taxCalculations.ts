import { 
  PersonalInformation, 
  Income,
  Deductions, 
  TaxCredits, 
  AdditionalTax, 
  CalculatedResults,
  FilingStatus 
} from '@shared/schema';

interface TaxData {
  personalInfo?: PersonalInformation;
  income?: Income;
  deductions?: Deductions;
  taxCredits?: TaxCredits;
  additionalTax?: AdditionalTax;
  calculatedResults?: CalculatedResults;
}

// 2023 tax brackets (approximate for example)
const TAX_BRACKETS_2023 = {
  single: [
    { rate: 0.10, upTo: 11000 },
    { rate: 0.12, upTo: 44725 },
    { rate: 0.22, upTo: 95375 },
    { rate: 0.24, upTo: 182100 },
    { rate: 0.32, upTo: 231250 },
    { rate: 0.35, upTo: 578125 },
    { rate: 0.37, upTo: Infinity }
  ],
  married_joint: [
    { rate: 0.10, upTo: 22000 },
    { rate: 0.12, upTo: 89450 },
    { rate: 0.22, upTo: 190750 },
    { rate: 0.24, upTo: 364200 },
    { rate: 0.32, upTo: 462500 },
    { rate: 0.35, upTo: 693750 },
    { rate: 0.37, upTo: Infinity }
  ],
  married_separate: [
    { rate: 0.10, upTo: 11000 },
    { rate: 0.12, upTo: 44725 },
    { rate: 0.22, upTo: 95375 },
    { rate: 0.24, upTo: 182100 },
    { rate: 0.32, upTo: 231250 },
    { rate: 0.35, upTo: 346875 },
    { rate: 0.37, upTo: Infinity }
  ],
  head_of_household: [
    { rate: 0.10, upTo: 15700 },
    { rate: 0.12, upTo: 59850 },
    { rate: 0.22, upTo: 95350 },
    { rate: 0.24, upTo: 182100 },
    { rate: 0.32, upTo: 231250 },
    { rate: 0.35, upTo: 578100 },
    { rate: 0.37, upTo: Infinity }
  ],
  qualifying_widow: [
    { rate: 0.10, upTo: 22000 },
    { rate: 0.12, upTo: 89450 },
    { rate: 0.22, upTo: 190750 },
    { rate: 0.24, upTo: 364200 },
    { rate: 0.32, upTo: 462500 },
    { rate: 0.35, upTo: 693750 },
    { rate: 0.37, upTo: Infinity }
  ]
};

// 2023 standard deduction amounts
const STANDARD_DEDUCTION_2023 = {
  single: 13850,
  married_joint: 27700,
  married_separate: 13850,
  head_of_household: 20800,
  qualifying_widow: 27700
};

// Calculate standard deduction based on filing status
export function calculateStandardDeduction(filingStatus: FilingStatus): number {
  return STANDARD_DEDUCTION_2023[filingStatus] || STANDARD_DEDUCTION_2023.single;
}

// Calculate federal income tax based on taxable income and filing status
export function calculateFederalTax(taxableIncome: number, filingStatus: FilingStatus): number {
  // Default to single if filing status is not provided
  const brackets = TAX_BRACKETS_2023[filingStatus] || TAX_BRACKETS_2023.single;
  
  let tax = 0;
  let remainingIncome = taxableIncome;
  let previousBracketCap = 0;
  
  for (const bracket of brackets) {
    const incomeInThisBracket = Math.min(bracket.upTo - previousBracketCap, remainingIncome);
    
    if (incomeInThisBracket <= 0) break;
    
    tax += incomeInThisBracket * bracket.rate;
    remainingIncome -= incomeInThisBracket;
    previousBracketCap = bracket.upTo;
    
    if (remainingIncome <= 0) break;
  }
  
  return Math.round(tax * 100) / 100; // Round to nearest cent
}

// Main function to calculate taxes based on all data
export function calculateTaxes(taxData: TaxData): CalculatedResults {
  // Initialize result
  const result: CalculatedResults = {
    totalIncome: 0,
    adjustments: 0,
    adjustedGrossIncome: 0,
    deductions: 0,
    taxableIncome: 0,
    federalTax: 0,
    credits: 0,
    taxDue: 0,
    payments: 0,
    refundAmount: 0,
    amountOwed: 0
  };
  
  // Get filing status or default to single
  const filingStatus: FilingStatus = taxData.personalInfo?.filingStatus || 'single';
  
  // 추가 정보 미리 가져오기
  const additionalTax = taxData.additionalTax || {
    selfEmploymentIncome: 0,
    selfEmploymentTax: 0,
    estimatedTaxPayments: 0,
    otherIncome: 0,
    otherTaxes: 0
  };
  
  // 자영업 세금 정보
  const selfEmploymentTax = additionalTax.selfEmploymentTax;
  const halfSETax = Math.round((selfEmploymentTax / 2) * 100) / 100;
  
  // Calculate total income
  const income = taxData.income || {
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
      healthSavingsAccount: 0,
      otherAdjustments: 0
    },
    adjustedGrossIncome: 0,
    additionalIncomeItems: [],
    additionalAdjustmentItems: []
  };
  
  // 이미 income.totalIncome이 설정되어 있다면 그 값을 사용
  if (income.totalIncome > 0) {
    result.totalIncome = income.totalIncome;
  } else {
    // 그렇지 않으면 개별 항목들을 합산
    const selfEmploymentIncome = additionalTax.selfEmploymentIncome;
    const additionalOtherIncome = additionalTax.otherIncome;
    
    // additionalIncomeItems 합계
    const additionalIncomeTotal = (income.additionalIncomeItems || [])
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    // Calculate total income from all sources
    result.totalIncome = (
      income.wages +
      income.otherEarnedIncome +
      income.interestIncome +
      income.dividends +
      income.businessIncome +
      income.capitalGains +
      income.rentalIncome + 
      income.retirementIncome +
      income.unemploymentIncome +
      income.otherIncome +
      selfEmploymentIncome +
      additionalOtherIncome +
      additionalIncomeTotal
    );
  }

  // 이미 income.adjustedGrossIncome이 설정되어 있고 income.totalIncome도 설정되어 있다면,
  // 역계산으로 조정액을 계산
  if (income.adjustedGrossIncome > 0 && income.totalIncome > 0) {
    result.adjustments = income.totalIncome - income.adjustedGrossIncome;
    // 역계산한 조정액으로 AGI 계산
    result.adjustedGrossIncome = income.adjustedGrossIncome;
  } else {
    // Get adjustments from income section if available
    const incomeAdjustments = income.adjustments || {
      studentLoanInterest: 0,
      retirementContributions: 0,
      healthSavingsAccount: 0,
      otherAdjustments: 0
    };
    
    // additionalAdjustmentItems 합계
    const additionalAdjustmentsTotal = (income.additionalAdjustmentItems || [])
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    // Sum all adjustments
    result.adjustments = (
      incomeAdjustments.studentLoanInterest +
      incomeAdjustments.retirementContributions +
      incomeAdjustments.healthSavingsAccount +
      incomeAdjustments.otherAdjustments +
      halfSETax +
      additionalAdjustmentsTotal
    );
    
    // Calculate adjusted gross income (AGI)
    result.adjustedGrossIncome = result.totalIncome - result.adjustments;
  }
  
  // Calculate deductions
  if (taxData.deductions?.useStandardDeduction) {
    result.deductions = calculateStandardDeduction(filingStatus);
  } else {
    result.deductions = taxData.deductions?.totalDeductions || 0;
  }
  
  // Calculate taxable income
  result.taxableIncome = Math.max(0, result.adjustedGrossIncome - result.deductions);
  
  // Calculate federal tax
  result.federalTax = calculateFederalTax(result.taxableIncome, filingStatus);
  
  // Apply tax credits
  result.credits = taxData.taxCredits?.totalCredits || 0;
  
  // Calculate tax due
  result.taxDue = Math.max(0, result.federalTax - result.credits);
  
  // Add additional taxes
  result.taxDue += additionalTax.otherTaxes;
  
  // Add self-employment tax
  result.taxDue += selfEmploymentTax;
  
  // Calculate payments (estimated tax payments and an assumed withholding)
  const estimatedPayments = additionalTax.estimatedTaxPayments;
  const assumedWithholding = Math.round(result.totalIncome * 0.15 * 100) / 100; // Assuming 15% withholding on base income
  result.payments = estimatedPayments + assumedWithholding;
  
  // Calculate refund or amount owed
  if (result.payments > result.taxDue) {
    result.refundAmount = Math.round((result.payments - result.taxDue) * 100) / 100;
    result.amountOwed = 0;
  } else {
    result.amountOwed = Math.round((result.taxDue - result.payments) * 100) / 100;
    result.refundAmount = 0;
  }
  
  return result;
}

// Format currency for display
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}
