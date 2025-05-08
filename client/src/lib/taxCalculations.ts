import { 
  PersonalInformation, 
  Income,
  Deductions, 
  TaxCredits, 
  AdditionalTax, 
  CalculatedResults,
  FilingStatus,
  Dependent
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

// Child Tax Credit constants
const CHILD_TAX_CREDIT = {
  BASE_CREDIT_PER_CHILD: 2000,
  REFUNDABLE_LIMIT_PER_CHILD: 1500,
  MINIMUM_EARNED_INCOME: 2500,
  PHASE_OUT_THRESHOLD: {
    single: 200000,
    married_joint: 400000,
    married_separate: 200000,
    head_of_household: 200000,
    qualifying_widow: 400000
  },
  PHASE_OUT_RATE: 50, // $50 reduction per $1000 above threshold
  PHASE_OUT_INCREMENT: 1000
};

// Credit for Other Dependents constants
const CREDIT_FOR_OTHER_DEPENDENTS = {
  BASE_CREDIT_PER_DEPENDENT: 500,
  // Using same phase-out thresholds as the Child Tax Credit
  PHASE_OUT_THRESHOLD: {
    single: 200000,
    married_joint: 400000,
    married_separate: 200000,
    head_of_household: 200000,
    qualifying_widow: 400000
  },
  PHASE_OUT_RATE: 50, // $50 reduction per $1000 above threshold
  PHASE_OUT_INCREMENT: 1000
};

// Retirement Savings Credit constants (2023 tax year)
const RETIREMENT_SAVINGS_CREDIT = {
  // Income thresholds by filing status
  INCOME_THRESHOLDS: {
    single: [21750, 23750, 36500], // 50%, 20%, 10% thresholds
    head_of_household: [32625, 35625, 54750],
    married_joint: [43500, 47500, 73000],
    married_separate: [21750, 23750, 36500],
    qualifying_widow: [43500, 47500, 73000]
  },
  // Credit rates based on income (50%, 20%, 10%, 0%)
  CREDIT_RATES: [0.5, 0.2, 0.1, 0], 
  // Maximum eligible contribution
  MAX_CONTRIBUTION_PER_PERSON: 2000
};

// Child and Dependent Care Credit constants (2023 tax year)
const CHILD_DEPENDENT_CARE_CREDIT = {
  // Maximum eligible expenses
  MAX_EXPENSES: {
    ONE_DEPENDENT: 3000,
    MULTIPLE_DEPENDENTS: 6000
  },
  // Credit rate starts at 35% for AGI <= $15,000
  BASE_CREDIT_RATE: 0.35,
  // Credit rate decreases by 1% for each $2,000 AGI increment above $15,000
  AGI_BASE_THRESHOLD: 15000,
  AGI_PHASE_OUT_INCREMENT: 2000,
  RATE_DECREMENT: 0.01,
  // Minimum credit rate is 20%
  MIN_CREDIT_RATE: 0.20
};

// Check if a dependent is eligible for the Child Tax Credit
function isEligibleForChildTaxCredit(dependent: Dependent): boolean {
  // Must be under 17 at the end of the tax year
  const birthDate = new Date(dependent.dateOfBirth);
  const taxYearEnd = new Date('2025-12-31'); // Use the appropriate tax year
  const age = taxYearEnd.getFullYear() - birthDate.getFullYear();
  
  // Basic age check
  if (age >= 17) return false;
  
  // For now, assume all dependents under 17 are eligible
  // In the future, we can add more criteria when isQualifyingChild is properly implemented in all dependents
  return dependent.isQualifyingChild !== undefined ? dependent.isQualifyingChild : true;
}

// Check if a dependent is eligible for the Credit for Other Dependents
function isEligibleForCreditForOtherDependents(dependent: Dependent): boolean {
  // Must NOT be eligible for Child Tax Credit
  if (isEligibleForChildTaxCredit(dependent)) return false;
  
  // Must be a qualifying dependent
  // For now, we'll assume all dependents who aren't eligible for Child Tax Credit are eligible for COD
  // This can be expanded with additional criteria as needed
  return true;
}

// Calculate the Credit for Other Dependents based on dependents and income
export function calculateCreditForOtherDependents(
  dependents: Dependent[] = [], 
  adjustedGrossIncome: number, 
  filingStatus: FilingStatus
): number {
  // If no dependents, return 0 credit
  if (!dependents || dependents.length === 0) return 0;
  
  // Count eligible dependents
  const eligibleDependents = dependents.filter(isEligibleForCreditForOtherDependents);
  if (eligibleDependents.length === 0) return 0;
  
  // Calculate initial credit
  let creditAmount = eligibleDependents.length * CREDIT_FOR_OTHER_DEPENDENTS.BASE_CREDIT_PER_DEPENDENT;
  
  // Apply income phase-out
  const threshold = CREDIT_FOR_OTHER_DEPENDENTS.PHASE_OUT_THRESHOLD[filingStatus];
  if (adjustedGrossIncome > threshold) {
    // Calculate excess income
    const excessIncome = adjustedGrossIncome - threshold;
    
    // Calculate number of phase-out increments (round up)
    const phaseOutIncrements = Math.ceil(excessIncome / CREDIT_FOR_OTHER_DEPENDENTS.PHASE_OUT_INCREMENT);
    
    // Calculate phase-out amount
    const phaseOutAmount = phaseOutIncrements * CREDIT_FOR_OTHER_DEPENDENTS.PHASE_OUT_RATE;
    
    // Apply phase-out
    creditAmount = Math.max(0, creditAmount - phaseOutAmount);
  }
  
  // Round to nearest cent
  return Math.round(creditAmount * 100) / 100;
}

// Calculate the Child Tax Credit based on dependents and income
export function calculateChildTaxCredit(
  dependents: Dependent[] = [], 
  adjustedGrossIncome: number, 
  filingStatus: FilingStatus
): number {
  // If no dependents, return 0 credit
  if (!dependents || dependents.length === 0) return 0;
  
  // Count eligible children
  const eligibleChildren = dependents.filter(isEligibleForChildTaxCredit);
  if (eligibleChildren.length === 0) return 0;
  
  // Calculate initial credit
  let creditAmount = eligibleChildren.length * CHILD_TAX_CREDIT.BASE_CREDIT_PER_CHILD;
  
  // Apply income phase-out
  const threshold = CHILD_TAX_CREDIT.PHASE_OUT_THRESHOLD[filingStatus];
  if (adjustedGrossIncome > threshold) {
    // Calculate excess income
    const excessIncome = adjustedGrossIncome - threshold;
    
    // Calculate number of phase-out increments (round up)
    const phaseOutIncrements = Math.ceil(excessIncome / CHILD_TAX_CREDIT.PHASE_OUT_INCREMENT);
    
    // Calculate phase-out amount
    const phaseOutAmount = phaseOutIncrements * CHILD_TAX_CREDIT.PHASE_OUT_RATE;
    
    // Apply phase-out
    creditAmount = Math.max(0, creditAmount - phaseOutAmount);
  }
  
  // Round to nearest cent
  return Math.round(creditAmount * 100) / 100;
}

// Calculate the Retirement Savings Credit based on contributions and income
export function calculateRetirementSavingsCredit(
  retirementContributions: number,
  adjustedGrossIncome: number,
  filingStatus: FilingStatus,
  isMarried: boolean = filingStatus === 'married_joint' || filingStatus === 'qualifying_widow'
): number {
  // If no retirement contributions, return 0 credit
  if (!retirementContributions || retirementContributions <= 0) return 0;
  
  // Cap contributions at the maximum eligible amount
  // For married filing jointly, consider contributions from both spouses (up to $2,000 each)
  const maxEligibleContribution = isMarried 
    ? RETIREMENT_SAVINGS_CREDIT.MAX_CONTRIBUTION_PER_PERSON * 2
    : RETIREMENT_SAVINGS_CREDIT.MAX_CONTRIBUTION_PER_PERSON;
    
  const eligibleContribution = Math.min(retirementContributions, maxEligibleContribution);
  
  // Get income thresholds for the filing status
  const thresholds = RETIREMENT_SAVINGS_CREDIT.INCOME_THRESHOLDS[filingStatus];
  
  // Determine credit rate based on income
  let creditRate = RETIREMENT_SAVINGS_CREDIT.CREDIT_RATES[3]; // Default to 0%
  
  if (adjustedGrossIncome <= thresholds[0]) {
    // 50% credit rate
    creditRate = RETIREMENT_SAVINGS_CREDIT.CREDIT_RATES[0];
  } else if (adjustedGrossIncome <= thresholds[1]) {
    // 20% credit rate
    creditRate = RETIREMENT_SAVINGS_CREDIT.CREDIT_RATES[1];
  } else if (adjustedGrossIncome <= thresholds[2]) {
    // 10% credit rate
    creditRate = RETIREMENT_SAVINGS_CREDIT.CREDIT_RATES[2];
  }
  
  // Calculate credit amount
  const creditAmount = eligibleContribution * creditRate;
  
  // Round to nearest cent
  return Math.round(creditAmount * 100) / 100;
}

// Calculate the Child and Dependent Care Credit based on expenses and income
export function calculateChildDependentCareCredit(
  careExpenses: number,
  adjustedGrossIncome: number,
  numberOfQualifyingDependents: number
): number {
  // If no care expenses or no qualifying dependents, return 0 credit
  if (!careExpenses || careExpenses <= 0 || numberOfQualifyingDependents <= 0) return 0;
  
  // Determine maximum eligible expenses based on number of qualifying dependents
  const maxEligibleExpenses = numberOfQualifyingDependents > 1 
    ? CHILD_DEPENDENT_CARE_CREDIT.MAX_EXPENSES.MULTIPLE_DEPENDENTS 
    : CHILD_DEPENDENT_CARE_CREDIT.MAX_EXPENSES.ONE_DEPENDENT;
    
  // Cap expenses at the maximum eligible amount
  const eligibleExpenses = Math.min(careExpenses, maxEligibleExpenses);
  
  // Determine credit rate based on AGI
  // Start with base rate (35% for AGI <= $15,000)
  let creditRate = CHILD_DEPENDENT_CARE_CREDIT.BASE_CREDIT_RATE;
  
  // If AGI is above threshold, reduce credit rate by 1% for each $2,000 increment
  if (adjustedGrossIncome > CHILD_DEPENDENT_CARE_CREDIT.AGI_BASE_THRESHOLD) {
    // Calculate how many $2,000 increments above threshold
    const excessAGIIncrements = Math.floor(
      (adjustedGrossIncome - CHILD_DEPENDENT_CARE_CREDIT.AGI_BASE_THRESHOLD) / 
      CHILD_DEPENDENT_CARE_CREDIT.AGI_PHASE_OUT_INCREMENT
    );
    
    // Reduce credit rate by 1% for each increment (but not below minimum rate of 20%)
    creditRate = Math.max(
      CHILD_DEPENDENT_CARE_CREDIT.MIN_CREDIT_RATE,
      creditRate - (excessAGIIncrements * CHILD_DEPENDENT_CARE_CREDIT.RATE_DECREMENT)
    );
  }
  
  // Calculate credit amount
  const creditAmount = eligibleExpenses * creditRate;
  
  // Round to nearest cent
  return Math.round(creditAmount * 100) / 100;
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
  
  // Calculate Child Tax Credit automatically if enabled
  let calculatedChildTaxCredit = 0;
  
  // Only auto-calculate if there are dependents
  if (taxData.personalInfo?.dependents && taxData.personalInfo.dependents.length > 0) {
    calculatedChildTaxCredit = calculateChildTaxCredit(
      taxData.personalInfo.dependents,
      result.adjustedGrossIncome,
      filingStatus
    );
  }
  
  // Auto-calculate Retirement Savings Credit if applicable
  let calculatedRetirementSavingsCredit = 0;
  
  // Only auto-calculate if there are retirement contributions
  if (income.adjustments && income.adjustments.retirementContributions > 0) {
    const isMarriedJointFiling = filingStatus === 'married_joint' || filingStatus === 'qualifying_widow';
    calculatedRetirementSavingsCredit = calculateRetirementSavingsCredit(
      income.adjustments.retirementContributions,
      result.adjustedGrossIncome,
      filingStatus,
      isMarriedJointFiling
    );
  }
  
  // Auto-calculate Child and Dependent Care Credit if applicable
  let calculatedChildDependentCareCredit = 0;
  
  // Only auto-calculate if there are dependents
  // This is a simplified check - in a real system, we'd verify dependent age and qualifying expenses
  if (taxData.personalInfo?.dependents && taxData.personalInfo.dependents.length > 0) {
    // For this prototype, we're assuming all dependents under 13 qualify
    // In a real system, more detailed checks would be needed
    const qualifyingDependents = taxData.personalInfo.dependents.filter(dependent => {
      const birthDate = new Date(dependent.dateOfBirth);
      const taxYearEnd = new Date('2025-12-31');
      const age = taxYearEnd.getFullYear() - birthDate.getFullYear();
      return age < 13;
    });
    
    if (qualifyingDependents.length > 0) {
      // For prototype, we're assuming average care expenses of $2,000 per qualifying dependent
      // In a real system, this would be user-entered data
      const estimatedCareExpenses = qualifyingDependents.length * 2000;
      
      calculatedChildDependentCareCredit = calculateChildDependentCareCredit(
        estimatedCareExpenses,
        result.adjustedGrossIncome,
        qualifyingDependents.length
      );
    }
  }
  
  // If there are tax credits in the data, use those values, otherwise use calculated ones
  const taxCredits = taxData.taxCredits || {
    childTaxCredit: calculatedChildTaxCredit,
    childDependentCareCredit: calculatedChildDependentCareCredit,
    educationCredits: 0,
    retirementSavingsCredit: calculatedRetirementSavingsCredit,
    otherCredits: 0,
    totalCredits: calculatedChildTaxCredit + calculatedRetirementSavingsCredit + calculatedChildDependentCareCredit
  };
  
  // If the user hasn't explicitly set tax credit values, use the calculated ones
  if (!taxData.taxCredits || 
      (taxData.taxCredits.childTaxCredit === 0 && 
       taxData.taxCredits.retirementSavingsCredit === 0 &&
       taxData.taxCredits.childDependentCareCredit === 0)) {
    // Update the total credits with our calculated credits
    result.credits = (
      calculatedChildTaxCredit + 
      calculatedRetirementSavingsCredit +
      calculatedChildDependentCareCredit +
      (taxCredits.educationCredits || 0) + 
      (taxCredits.otherCredits || 0)
    );
  } else {
    // Use the user's manually entered total credits
    result.credits = taxCredits.totalCredits || 0;
  }
  
  // Calculate tax due
  result.taxDue = Math.max(0, result.federalTax - result.credits);
  
  // Add additional taxes
  result.taxDue += additionalTax.otherTaxes;
  
  // Add self-employment tax
  result.taxDue += selfEmploymentTax;
  
  // 선납세금으로는 사용자가 입력한 estimatedTaxPayments만 사용
  const estimatedPayments = additionalTax.estimatedTaxPayments;
  // 원천징수액 계산을 제거하고 사용자 입력값만 사용
  result.payments = estimatedPayments;
  
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

// Format string input to only allow numbers and decimal point
export function formatNumberInput(value: string): string {
  // Allow only digits and decimal point
  return value.replace(/[^\d.]/g, '');
}
