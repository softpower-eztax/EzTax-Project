// State Income Tax Rules and Calculations
export interface StateTaxBracket {
  min: number;
  max: number | null;
  rate: number;
}

export interface StateTaxRule {
  state: string;
  stateName: string;
  hasIncomeTax: boolean;
  taxBrackets: {
    single: StateTaxBracket[];
    marriedJoint: StateTaxBracket[];
    marriedSeparate: StateTaxBracket[];
    headOfHousehold: StateTaxBracket[];
  };
  standardDeduction: {
    single: number;
    marriedJoint: number;
    marriedSeparate: number;
    headOfHousehold: number;
  };
  personalExemption: number;
  dependentExemption: number;
  specialRules?: {
    federalDeductionAllowed?: boolean;
    altMinimumTax?: boolean;
    retirementIncomeExemption?: number;
    socialSecurityExemption?: boolean;
  };
}

// 2024 State Tax Rules - Major States
export const STATE_TAX_RULES: Record<string, StateTaxRule> = {
  // No Income Tax States
  FL: {
    state: 'FL',
    stateName: 'Florida',
    hasIncomeTax: false,
    taxBrackets: { single: [], marriedJoint: [], marriedSeparate: [], headOfHousehold: [] },
    standardDeduction: { single: 0, marriedJoint: 0, marriedSeparate: 0, headOfHousehold: 0 },
    personalExemption: 0,
    dependentExemption: 0,
  },
  TX: {
    state: 'TX',
    stateName: 'Texas',
    hasIncomeTax: false,
    taxBrackets: { single: [], marriedJoint: [], marriedSeparate: [], headOfHousehold: [] },
    standardDeduction: { single: 0, marriedJoint: 0, marriedSeparate: 0, headOfHousehold: 0 },
    personalExemption: 0,
    dependentExemption: 0,
  },
  WA: {
    state: 'WA',
    stateName: 'Washington',
    hasIncomeTax: false,
    taxBrackets: { single: [], marriedJoint: [], marriedSeparate: [], headOfHousehold: [] },
    standardDeduction: { single: 0, marriedJoint: 0, marriedSeparate: 0, headOfHousehold: 0 },
    personalExemption: 0,
    dependentExemption: 0,
  },
  
  // California - 2024 Tax Brackets
  CA: {
    state: 'CA',
    stateName: 'California',
    hasIncomeTax: true,
    taxBrackets: {
      single: [
        { min: 0, max: 10099, rate: 0.01 },
        { min: 10100, max: 23942, rate: 0.02 },
        { min: 23943, max: 37788, rate: 0.04 },
        { min: 37789, max: 52455, rate: 0.06 },
        { min: 52456, max: 66295, rate: 0.08 },
        { min: 66296, max: 338639, rate: 0.093 },
        { min: 338640, max: 406364, rate: 0.103 },
        { min: 406365, max: 677278, rate: 0.113 },
        { min: 677279, max: null, rate: 0.123 },
      ],
      marriedJoint: [
        { min: 0, max: 20198, rate: 0.01 },
        { min: 20199, max: 47884, rate: 0.02 },
        { min: 47885, max: 75576, rate: 0.04 },
        { min: 75577, max: 104910, rate: 0.06 },
        { min: 104911, max: 132590, rate: 0.08 },
        { min: 132591, max: 677278, rate: 0.093 },
        { min: 677279, max: 812728, rate: 0.103 },
        { min: 812729, max: 1354556, rate: 0.113 },
        { min: 1354557, max: null, rate: 0.123 },
      ],
      marriedSeparate: [
        { min: 0, max: 10099, rate: 0.01 },
        { min: 10100, max: 23942, rate: 0.02 },
        { min: 23943, max: 37788, rate: 0.04 },
        { min: 37789, max: 52455, rate: 0.06 },
        { min: 52456, max: 66295, rate: 0.08 },
        { min: 66296, max: 338639, rate: 0.093 },
        { min: 338640, max: 406364, rate: 0.103 },
        { min: 406365, max: 677278, rate: 0.113 },
        { min: 677279, max: null, rate: 0.123 },
      ],
      headOfHousehold: [
        { min: 0, max: 20212, rate: 0.01 },
        { min: 20213, max: 47887, rate: 0.02 },
        { min: 47888, max: 61870, rate: 0.04 },
        { min: 61871, max: 76343, rate: 0.06 },
        { min: 76344, max: 90371, rate: 0.08 },
        { min: 90372, max: 460547, rate: 0.093 },
        { min: 460548, max: 552658, rate: 0.103 },
        { min: 552659, max: 921095, rate: 0.113 },
        { min: 921096, max: null, rate: 0.123 },
      ],
    },
    standardDeduction: {
      single: 5202,
      marriedJoint: 10404,
      marriedSeparate: 5202,
      headOfHousehold: 10404,
    },
    personalExemption: 154,
    dependentExemption: 446,
    specialRules: {
      federalDeductionAllowed: false,
      altMinimumTax: true,
    },
  },

  // New York - 2024 Tax Brackets
  NY: {
    state: 'NY',
    stateName: 'New York',
    hasIncomeTax: true,
    taxBrackets: {
      single: [
        { min: 0, max: 8500, rate: 0.04 },
        { min: 8501, max: 11700, rate: 0.045 },
        { min: 11701, max: 13900, rate: 0.0525 },
        { min: 13901, max: 80650, rate: 0.055 },
        { min: 80651, max: 215400, rate: 0.06 },
        { min: 215401, max: 1077550, rate: 0.0685 },
        { min: 1077551, max: 5000000, rate: 0.0965 },
        { min: 5000001, max: 25000000, rate: 0.103 },
        { min: 25000001, max: null, rate: 0.109 },
      ],
      marriedJoint: [
        { min: 0, max: 17150, rate: 0.04 },
        { min: 17151, max: 23600, rate: 0.045 },
        { min: 23601, max: 27900, rate: 0.0525 },
        { min: 27901, max: 161550, rate: 0.055 },
        { min: 161551, max: 323200, rate: 0.06 },
        { min: 323201, max: 2155350, rate: 0.0685 },
        { min: 2155351, max: 5000000, rate: 0.0965 },
        { min: 5000001, max: 25000000, rate: 0.103 },
        { min: 25000001, max: null, rate: 0.109 },
      ],
      marriedSeparate: [
        { min: 0, max: 8500, rate: 0.04 },
        { min: 8501, max: 11700, rate: 0.045 },
        { min: 11701, max: 13900, rate: 0.0525 },
        { min: 13901, max: 80650, rate: 0.055 },
        { min: 80651, max: 215400, rate: 0.06 },
        { min: 215401, max: 1077550, rate: 0.0685 },
        { min: 1077551, max: 5000000, rate: 0.0965 },
        { min: 5000001, max: 25000000, rate: 0.103 },
        { min: 25000001, max: null, rate: 0.109 },
      ],
      headOfHousehold: [
        { min: 0, max: 12800, rate: 0.04 },
        { min: 12801, max: 17650, rate: 0.045 },
        { min: 17651, max: 20900, rate: 0.0525 },
        { min: 20901, max: 107650, rate: 0.055 },
        { min: 107651, max: 269300, rate: 0.06 },
        { min: 269301, max: 1616450, rate: 0.0685 },
        { min: 1616451, max: 5000000, rate: 0.0965 },
        { min: 5000001, max: 25000000, rate: 0.103 },
        { min: 25000001, max: null, rate: 0.109 },
      ],
    },
    standardDeduction: {
      single: 8000,
      marriedJoint: 16050,
      marriedSeparate: 8000,
      headOfHousehold: 11200,
    },
    personalExemption: 1000,
    dependentExemption: 1000,
  },

  // Illinois - Flat Tax State
  IL: {
    state: 'IL',
    stateName: 'Illinois',
    hasIncomeTax: true,
    taxBrackets: {
      single: [{ min: 0, max: null, rate: 0.0495 }],
      marriedJoint: [{ min: 0, max: null, rate: 0.0495 }],
      marriedSeparate: [{ min: 0, max: null, rate: 0.0495 }],
      headOfHousehold: [{ min: 0, max: null, rate: 0.0495 }],
    },
    standardDeduction: {
      single: 2425,
      marriedJoint: 4850,
      marriedSeparate: 2425,
      headOfHousehold: 2425,
    },
    personalExemption: 2425,
    dependentExemption: 2425,
    specialRules: {
      federalDeductionAllowed: false,
      retirementIncomeExemption: 1000,
    },
  },
};

// Get all states with their tax status
export const getAllStates = (): { code: string; name: string; hasIncomeTax: boolean }[] => {
  return Object.values(STATE_TAX_RULES).map(rule => ({
    code: rule.state,
    name: rule.stateName,
    hasIncomeTax: rule.hasIncomeTax,
  }));
};

// Check if state has income tax
export const stateHasIncomeTax = (stateCode: string): boolean => {
  const rule = STATE_TAX_RULES[stateCode.toUpperCase()];
  return rule ? rule.hasIncomeTax : false;
};

// Get state tax rule
export const getStateTaxRule = (stateCode: string): StateTaxRule | null => {
  return STATE_TAX_RULES[stateCode.toUpperCase()] || null;
};