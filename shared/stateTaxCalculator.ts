import { STATE_TAX_RULES, StateTaxBracket, StateTaxRule } from './stateTaxRules';
import { StateIncomeTax } from './schema';

export interface StateTaxCalculationInput {
  state: string;
  filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_of_household' | 'qualifying_widow';
  federalAGI: number;
  federalTaxableIncome: number;
  federalItemizedDeductions?: number;
  dependentsCount: number;
  stateSpecificIncome?: {
    stateWages?: number;
    stateWithholding?: number;
    municipalBondInterest?: number;
    otherStateAdjustments?: number;
  };
  // Enhanced state-specific deductions and credits
  stateSpecificDeductions?: StateSpecificDeductionInput[];
  appliedStateCredits?: StateSpecificDeductionInput[];
}

export interface StateSpecificDeductionInput {
  id: string;
  amount: number;
  qualified: boolean;
}

// Calculate tax from brackets
function calculateTaxFromBrackets(income: number, brackets: StateTaxBracket[]): number {
  let tax = 0;
  let remainingIncome = income;

  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;

    const bracketMin = bracket.min;
    const bracketMax = bracket.max || Infinity;
    const bracketWidth = bracketMax - bracketMin;
    const taxableInThisBracket = Math.min(remainingIncome, bracketWidth);

    if (income > bracketMin) {
      const actualTaxableInBracket = Math.min(taxableInThisBracket, income - bracketMin);
      if (actualTaxableInBracket > 0) {
        tax += actualTaxableInBracket * bracket.rate;
      }
    }

    remainingIncome -= taxableInThisBracket;
  }

  return Math.round(tax * 100) / 100; // Round to 2 decimal places
}

// Get filing status key for tax brackets
function getFilingStatusKey(filingStatus: string): keyof StateTaxRule['taxBrackets'] {
  switch (filingStatus) {
    case 'married_joint':
    case 'qualifying_widow':
      return 'marriedJoint';
    case 'married_separate':
      return 'marriedSeparate';
    case 'head_of_household':
      return 'headOfHousehold';
    default:
      return 'single';
  }
}

// Calculate state standard deduction
function calculateStateStandardDeduction(rule: StateTaxRule, filingStatus: string): number {
  const statusKey = getFilingStatusKey(filingStatus);
  switch (statusKey) {
    case 'marriedJoint':
      return rule.standardDeduction.marriedJoint;
    case 'marriedSeparate':
      return rule.standardDeduction.marriedSeparate;
    case 'headOfHousehold':
      return rule.standardDeduction.headOfHousehold;
    default:
      return rule.standardDeduction.single;
  }
}

// Calculate state exemptions
function calculateStateExemptions(rule: StateTaxRule, filingStatus: string, dependentsCount: number): number {
  let exemptions = rule.personalExemption;
  
  // Add spouse exemption for joint filers
  if (filingStatus === 'married_joint') {
    exemptions += rule.personalExemption;
  }
  
  // Add dependent exemptions
  exemptions += dependentsCount * rule.dependentExemption;
  
  return exemptions;
}

// Main state tax calculation function
export function calculateStateTax(input: StateTaxCalculationInput): StateIncomeTax | null {
  const stateCode = input.state.toUpperCase();
  const rule = STATE_TAX_RULES[stateCode];
  
  if (!rule) {
    console.warn(`No tax rule found for state: ${stateCode}`);
    return null;
  }

  // No income tax states
  if (!rule.hasIncomeTax) {
    return {
      state: stateCode,
      stateTaxableIncome: 0,
      stateTax: 0,
      stateCredits: 0,
      stateWithholding: input.stateSpecificIncome?.stateWithholding || 0,
      stateRefund: input.stateSpecificIncome?.stateWithholding || 0,
      stateAmountOwed: 0,
    };
  }

  // Calculate state adjusted gross income (usually starts with federal AGI)
  let stateAGI = input.federalAGI;
  
  // Apply state-specific adjustments
  if (input.stateSpecificIncome?.otherStateAdjustments) {
    stateAGI += input.stateSpecificIncome.otherStateAdjustments;
  }

  // Calculate state deductions
  const stateStandardDeduction = calculateStateStandardDeduction(rule, input.filingStatus);
  let stateDeductions = stateStandardDeduction;
  
  // Some states allow federal itemized deductions
  if (rule.specialRules?.federalDeductionAllowed && input.federalItemizedDeductions) {
    stateDeductions = Math.max(stateStandardDeduction, input.federalItemizedDeductions);
  }

  // Apply state-specific deductions if provided
  let additionalStateDeductions = 0;
  if (input.stateSpecificDeductions && rule.stateSpecificDeductions) {
    for (const deductionInput of input.stateSpecificDeductions) {
      if (deductionInput.qualified && deductionInput.amount > 0) {
        const ruleDeduction = rule.stateSpecificDeductions.find(d => d.id === deductionInput.id);
        if (ruleDeduction) {
          // Apply maximum limits if specified
          const allowedAmount = ruleDeduction.maxAmount 
            ? Math.min(deductionInput.amount, ruleDeduction.maxAmount)
            : deductionInput.amount;
          additionalStateDeductions += allowedAmount;
        }
      }
    }
  }
  
  stateDeductions += additionalStateDeductions;

  // Calculate state exemptions
  const stateExemptions = calculateStateExemptions(rule, input.filingStatus, input.dependentsCount);

  // Calculate state taxable income
  let stateTaxableIncome = Math.max(0, stateAGI - stateDeductions - stateExemptions);

  // Apply special rules for retirement income exemption
  if (rule.specialRules?.retirementIncomeExemption) {
    // This would need more detailed implementation based on specific state rules
    // For now, we'll skip this complex calculation
  }

  // Calculate state tax using brackets
  const filingStatusKey = getFilingStatusKey(input.filingStatus);
  const taxBrackets = rule.taxBrackets[filingStatusKey];
  const stateTax = calculateTaxFromBrackets(stateTaxableIncome, taxBrackets);

  // Calculate state withholding and refund/owed
  const stateWithholding = input.stateSpecificIncome?.stateWithholding || 0;
  
  // Calculate state credits
  let totalStateCredits = 0;
  if (input.appliedStateCredits && rule.stateCredits) {
    for (const creditInput of input.appliedStateCredits) {
      if (creditInput.qualified && creditInput.amount > 0) {
        const ruleCredit = rule.stateCredits.find(c => c.id === creditInput.id);
        if (ruleCredit) {
          // Apply maximum limits and income limits if specified
          let allowedAmount = Math.min(creditInput.amount, ruleCredit.maxAmount);
          
          // Check income limits if specified
          if (ruleCredit.incomeLimit && stateAGI > ruleCredit.incomeLimit) {
            allowedAmount = 0; // Credit phases out completely above income limit
          }
          
          totalStateCredits += allowedAmount;
        }
      }
    }
  }
  
  const finalStateTax = Math.max(0, stateTax - totalStateCredits);
  const stateRefundAmount = Math.max(0, stateWithholding - finalStateTax);
  const stateAmountOwed = Math.max(0, finalStateTax - stateWithholding);

  return {
    state: stateCode,
    stateTaxableIncome: Math.round(stateTaxableIncome * 100) / 100,
    stateTax: Math.round(finalStateTax * 100) / 100,
    stateCredits: Math.round(totalStateCredits * 100) / 100,
    stateWithholding: Math.round(stateWithholding * 100) / 100,
    stateRefund: Math.round(stateRefundAmount * 100) / 100,
    stateAmountOwed: Math.round(stateAmountOwed * 100) / 100,
  };
}

// Utility function to get state tax summary
export function getStateTaxSummary(stateCode: string): string {
  const rule = STATE_TAX_RULES[stateCode.toUpperCase()];
  if (!rule) return 'Unknown state';
  
  if (!rule.hasIncomeTax) {
    return `${rule.stateName} has no state income tax`;
  }
  
  const singleBrackets = rule.taxBrackets.single;
  const minRate = Math.min(...singleBrackets.map(b => b.rate)) * 100;
  const maxRate = Math.max(...singleBrackets.map(b => b.rate)) * 100;
  
  if (minRate === maxRate) {
    return `${rule.stateName} has a flat ${minRate}% income tax rate`;
  } else {
    return `${rule.stateName} has progressive income tax rates from ${minRate}% to ${maxRate}%`;
  }
}

// Export available states for UI
export { getAllStates, stateHasIncomeTax } from './stateTaxRules';