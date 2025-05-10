import { TaxData } from '@/context/TaxContext';

// 테스트 데이터 - 낮은 소득의 결혼 공동 신고자 (은퇴저축공제 50% 해당)
export const lowIncomeMarriedTestData: TaxData = {
  taxYear: 2025,
  status: 'in_progress',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  personalInfo: {
    firstName: "Robert",
    middleInitial: "J",
    lastName: "Johnson",
    ssn: "555-44-3333",
    dateOfBirth: "1985-06-15",
    email: "robert.johnson@example.com",
    phone: "555-123-4567",
    address1: "789 Oak Street",
    address2: "",
    city: "Riverside",
    state: "CA",
    zipCode: "92501",
    filingStatus: "married_joint",
    isDisabled: false,
    isNonresidentAlien: false,
    spouseInfo: {
      firstName: "Sarah",
      middleInitial: "L",
      lastName: "Johnson",
      ssn: "555-44-6666",
      dateOfBirth: "1987-08-22",
      isDisabled: false,
      isNonresidentAlien: false
    },
    dependents: [
      {
        firstName: "Emily",
        lastName: "Johnson",
        ssn: "555-77-8888",
        relationship: "Daughter",
        dateOfBirth: "2019-03-10",
        isDisabled: false,
        isNonresidentAlien: false,
        isQualifyingChild: true
      },
      {
        firstName: "Michael",
        lastName: "Johnson",
        ssn: "555-77-9999",
        relationship: "Son",
        dateOfBirth: "2021-09-05",
        isDisabled: false,
        isNonresidentAlien: false,
        isQualifyingChild: true
      }
    ]
  },
  income: {
    wages: 35000,
    otherEarnedIncome: 0,
    interestIncome: 250,
    dividends: 150,
    businessIncome: 2000,
    capitalGains: 600,
    rentalIncome: 0,
    retirementIncome: 0,
    unemploymentIncome: 0,
    otherIncome: 300,
    totalIncome: 38300,
    adjustments: {
      studentLoanInterest: 1100,
      retirementContributions: 2000,
      otherAdjustments: 400
    },
    adjustedGrossIncome: 34800
  },
  deductions: {
    useStandardDeduction: true,
    standardDeductionAmount: 27700,
    itemizedDeductions: {
      medicalExpenses: 1200,
      stateLocalIncomeTax: 1800,
      realEstateTaxes: 0,
      mortgageInterest: 0,
      charitableCash: 800,
      charitableNonCash: 200
    },
    totalDeductions: 27700
  },
  taxCredits: {
    childTaxCredit: 4000,
    childDependentCareCredit: 1200,
    educationCredits: 0,
    aotcCredit: 0,
    llcCredit: 0,
    retirementSavingsCredit: 0, // 이 값이 자동으로 계산되어야 함
    otherCredits: 0,
    otherCreditItems: [],
    totalCredits: 5200
  },
  retirementContributions: {
    traditionalIRA: 2000,
    rothIRA: 1500,
    plan401k: 2000,
    plan403b: 0,
    plan457: 0,
    simpleIRA: 0,
    sepIRA: 0,
    able: 0,
    tsp: 0,
    otherRetirementPlans: 0,
    totalContributions: 5500
  },
  additionalTax: {
    selfEmploymentIncome: 2000,
    selfEmploymentTax: 282,
    estimatedTaxPayments: 1200,
    otherIncome: 300,
    otherTaxes: 0
  }
};

// 테스트 데이터 - 중간 소득의 단독 신고자 (은퇴저축공제 20% 해당)
export const mediumIncomeSingleTestData: TaxData = {
  taxYear: 2025,
  status: 'in_progress',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  personalInfo: {
    firstName: "Jennifer",
    middleInitial: "M",
    lastName: "Wilson",
    ssn: "444-33-2222",
    dateOfBirth: "1990-11-30",
    email: "jennifer.wilson@example.com",
    phone: "444-555-6666",
    address1: "456 Elm Avenue",
    address2: "Unit 7C",
    city: "Boston",
    state: "MA",
    zipCode: "02110",
    filingStatus: "single",
    isDisabled: false,
    isNonresidentAlien: false,
    dependents: []
  },
  income: {
    wages: 42000,
    otherEarnedIncome: 0,
    interestIncome: 350,
    dividends: 420,
    businessIncome: 0,
    capitalGains: 1200,
    rentalIncome: 0,
    retirementIncome: 0,
    unemploymentIncome: 0,
    otherIncome: 0,
    totalIncome: 43970,
    adjustments: {
      studentLoanInterest: 2000,
      retirementContributions: 3000,
      otherAdjustments: 0
    },
    adjustedGrossIncome: 38970
  },
  deductions: {
    useStandardDeduction: true,
    standardDeductionAmount: 13850,
    itemizedDeductions: {
      medicalExpenses: 0,
      stateLocalIncomeTax: 2500,
      realEstateTaxes: 0,
      mortgageInterest: 0,
      charitableCash: 600,
      charitableNonCash: 400
    },
    totalDeductions: 13850
  },
  taxCredits: {
    childTaxCredit: 0,
    childDependentCareCredit: 0,
    educationCredits: 1500,
    aotcCredit: 1500,
    llcCredit: 0,
    retirementSavingsCredit: 0, // 이 값이 자동으로 계산되어야 함
    otherCredits: 150,
    otherCreditItems: [
      {
        type: "에너지 효율 세액공제",
        amount: 150,
        description: "에너지 효율 창문 설치"
      }
    ],
    totalCredits: 1650
  },
  retirementContributions: {
    traditionalIRA: 2000,
    rothIRA: 1000,
    plan401k: 3000,
    plan403b: 0,
    plan457: 0,
    simpleIRA: 0,
    sepIRA: 0,
    able: 0,
    tsp: 0,
    otherRetirementPlans: 0,
    totalContributions: 6000
  },
  additionalTax: {
    selfEmploymentIncome: 0,
    selfEmploymentTax: 0,
    estimatedTaxPayments: 1800,
    otherIncome: 0,
    otherTaxes: 0
  }
};