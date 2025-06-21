// State Income Tax Rules and Calculations
export interface StateTaxBracket {
  min: number;
  max: number | null;
  rate: number;
}

export interface StateSpecificDeduction {
  id: string;
  name: string;
  nameKorean: string;
  description: string;
  descriptionKorean: string;
  maxAmount?: number;
  percentage?: number;
  requirements?: string[];
  requirementsKorean?: string[];
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
  // 확장된 주별 공제 항목들
  stateSpecificDeductions?: StateSpecificDeduction[];
  specialRules?: {
    federalDeductionAllowed?: boolean;
    altMinimumTax?: boolean;
    retirementIncomeExemption?: number;
    socialSecurityExemption?: boolean;
    // 추가 특별 규정들
    municipalBondInterestExempt?: boolean;
    militaryRetirementExemption?: number;
    teacherExpenseDeduction?: number;
    studentLoanInterestDeduction?: boolean;
    healthSavingsAccountDeduction?: boolean;
    elderlyExemption?: {
      ageThreshold: number;
      exemptionAmount: number;
    };
    disabilityExemption?: number;
  };
  // 주별 세금 크레딧들
  stateCredits?: {
    id: string;
    name: string;
    nameKorean: string;
    maxAmount: number;
    incomeLimit?: number;
    description: string;
    descriptionKorean: string;
  }[];
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
    // 캘리포니아 주별 공제 항목들
    stateSpecificDeductions: [
      {
        id: 'ca_disability_income',
        name: 'Disability Income Exclusion',
        nameKorean: '장애소득 제외',
        description: 'Exclude disability income from state taxes',
        descriptionKorean: '장애소득을 주세에서 제외',
        maxAmount: 100000,
        requirements: ['Permanent and total disability', 'Under age 65'],
        requirementsKorean: ['영구적 완전 장애', '65세 미만']
      },
      {
        id: 'ca_teacher_expense',
        name: 'Educator Expense Deduction',
        nameKorean: '교육자 비용 공제',
        description: 'Deduction for qualified educator expenses',
        descriptionKorean: '교육자 자격 비용에 대한 공제',
        maxAmount: 300,
        requirements: ['K-12 educator', 'Qualified expenses for classroom'],
        requirementsKorean: ['K-12 교육자', '교실용 자격 비용']
      },
      {
        id: 'ca_student_loan_interest',
        name: 'Student Loan Interest Deduction',
        nameKorean: '학자금 대출 이자 공제',
        description: 'Deduction for student loan interest paid',
        descriptionKorean: '학자금 대출 이자 지급에 대한 공제',
        maxAmount: 2500,
        requirements: ['Qualified student loan interest', 'Income limits apply'],
        requirementsKorean: ['자격 학자금 대출 이자', '소득 제한 적용']
      }
    ],
    stateCredits: [
      {
        id: 'ca_renters_credit',
        name: 'Renters Credit',
        nameKorean: '임차인 크레딧',
        maxAmount: 120,
        incomeLimit: 43533,
        description: 'Credit for qualified renters',
        descriptionKorean: '자격을 갖춘 임차인을 위한 크레딧'
      },
      {
        id: 'ca_senior_exemption',
        name: 'Senior Exemption Credit',
        nameKorean: '고령자 면제 크레딧',
        maxAmount: 140,
        incomeLimit: 50000,
        description: 'Additional exemption for seniors 65+',
        descriptionKorean: '65세 이상 고령자를 위한 추가 면제'
      }
    ],
    specialRules: {
      federalDeductionAllowed: false,
      altMinimumTax: true,
      municipalBondInterestExempt: true,
      militaryRetirementExemption: 0,
      teacherExpenseDeduction: 300,
      studentLoanInterestDeduction: true,
      healthSavingsAccountDeduction: true,
      elderlyExemption: {
        ageThreshold: 65,
        exemptionAmount: 140
      }
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
    // 뉴욕주 주별 공제 항목들
    stateSpecificDeductions: [
      {
        id: 'ny_pension_income',
        name: 'Pension and Annuity Income Exclusion',
        nameKorean: '연금 및 연금소득 제외',
        description: 'Exclude up to $20,000 of pension/annuity income',
        descriptionKorean: '연금/연금소득 최대 $20,000 제외',
        maxAmount: 20000,
        requirements: ['Age 59.5 or older', 'Qualified pension/annuity'],
        requirementsKorean: ['59.5세 이상', '자격 연금/연금']
      },
      {
        id: 'ny_college_tuition',
        name: 'College Tuition Credit/Deduction',
        nameKorean: '대학 등록금 크레딧/공제',
        description: 'Credit or deduction for college tuition paid',
        descriptionKorean: '대학 등록금 지급에 대한 크레딧 또는 공제',
        maxAmount: 10000,
        requirements: ['NY resident', 'Qualified higher education expenses'],
        requirementsKorean: ['NY 거주자', '자격 고등교육 비용']
      },
      {
        id: 'ny_volunteer_firefighter',
        name: 'Volunteer Firefighter/Ambulance Credit',
        nameKorean: '자원소방관/구급차 크레딧',
        description: 'Credit for volunteer firefighters and ambulance workers',
        descriptionKorean: '자원소방관 및 구급차 직원을 위한 크레딧',
        maxAmount: 200,
        requirements: ['Active volunteer service', 'Minimum service hours'],
        requirementsKorean: ['활동적인 자원봉사', '최소 서비스 시간']
      }
    ],
    stateCredits: [
      {
        id: 'ny_household_credit',
        name: 'Household Credit',
        nameKorean: '가계 크레딧',
        maxAmount: 75,
        incomeLimit: 28000,
        description: 'Credit for low-income households',
        descriptionKorean: '저소득 가정을 위한 크레딧'
      },
      {
        id: 'ny_real_property_tax',
        name: 'Real Property Tax Credit',
        nameKorean: '부동산세 크레딧',
        maxAmount: 375,
        incomeLimit: 18000,
        description: 'Credit for real property taxes paid',
        descriptionKorean: '부동산세 지급에 대한 크레딧'
      }
    ],
    specialRules: {
      federalDeductionAllowed: true,
      municipalBondInterestExempt: true,
      militaryRetirementExemption: 0,
      studentLoanInterestDeduction: true,
      healthSavingsAccountDeduction: true,
      elderlyExemption: {
        ageThreshold: 65,
        exemptionAmount: 0
      }
    },
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