// Internationalization messages for EzTax application

export type Language = 'ko' | 'en';

export interface Messages {
  // Common
  common: {
    save: string;
    cancel: string;
    next: string;
    previous: string;
    loading: string;
    error: string;
    success: string;
    login: string;
    logout: string;
    register: string;
    email: string;
    password: string;
    username: string;
    submit: string;
    calculate: string;
    reset: string;
    continue: string;
    back: string;
    close: string;
    edit: string;
    delete: string;
    confirm: string;
    yes: string;
    no: string;
  };

  // Navigation
  navigation: {
    home: string;
    personalInfo: string;
    income: string;
    deductions: string;
    taxCredits: string;
    additionalTax: string;
    review: string;
    stateTax: string;
    about: string;
    pricing: string;
    admin: string;
  };

  // Home page
  home: {
    title: string;
    subtitle: string;
    tagline: string;
    startNowButton: string;
    taxSimulatorButton: string;
    retirementDiagnosisButton: string;
    description: string;
    features: {
      easyCalculation: string;
      expertConsultation: string;
      retirementPlanning: string;
    };
  };

  // Personal Information
  personalInfo: {
    title: string;
    firstName: string;
    middleInitial: string;
    lastName: string;
    ssn: string;
    dateOfBirth: string;
    email: string;
    phone: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    zipCode: string;
    filingStatus: string;
    filingStatusOptions: {
      single: string;
      marriedJoint: string;
      marriedSeparate: string;
      headOfHousehold: string;
      qualifyingWidow: string;
    };
    isDisabled: string;
    isNonresidentAlien: string;
    spouseInfo: string;
    dependents: string;
    addDependent: string;
    saveProgress: string;
    filingStatusChecker: string;
  };

  // Income
  income: {
    title: string;
    wages: string;
    otherEarnedIncome: string;
    interestIncome: string;
    dividends: string;
    businessIncome: string;
    capitalGains: string;
    rentalIncome: string;
    retirementIncome: string;
    unemploymentIncome: string;
    otherIncome: string;
    additionalIncome: string;
    totalIncome: string;
    adjustments: string;
    studentLoanInterest: string;
    retirementContributions: string;
    otherAdjustments: string;
    adjustedGrossIncome: string;
    businessNetIncomeCalculator: string;
    qbiCalculator: string;
  };

  // Deductions
  deductions: {
    title: string;
    useStandardDeduction: string;
    standardDeductionAmount: string;
    itemizedDeductions: string;
    medicalExpenses: string;
    stateLocalIncomeTax: string;
    realEstateTaxes: string;
    personalPropertyTax: string;
    mortgageInterest: string;
    charitableCash: string;
    charitableNonCash: string;
    totalDeductions: string;
    saltLimit: string;
    medicalCalculator: string;
  };

  // Tax Credits
  taxCredits: {
    title: string;
    childTaxCredit: string;
    childDependentCareCredit: string;
    educationCredits: string;
    retirementSavingsCredit: string;
    foreignTaxCredit: string;
    earnedIncomeCredit: string;
    otherCredits: string;
    totalCredits: string;
    autoCalculate: string;
    creditForOtherDependents: string;
    additionalChildTaxCredit: string;
  };

  // Additional Tax
  additionalTax: {
    title: string;
    selfEmploymentIncome: string;
    selfEmploymentTax: string;
    estimatedTaxPayments: string;
    otherTaxes: string;
  };

  // Review
  review: {
    title: string;
    totalIncome: string;
    adjustments: string;
    adjustedGrossIncome: string;
    deductions: string;
    taxableIncome: string;
    federalTax: string;
    credits: string;
    taxDue: string;
    payments: string;
    refundAmount: string;
    amountOwed: string;
    downloadPDF: string;
    submitReturn: string;
    stateTaxCalculation: string;
  };

  // State Tax
  stateTax: {
    title: string;
    selectState: string;
    stateTaxableIncome: string;
    stateTax: string;
    stateCredits: string;
    stateWithholding: string;
    stateRefund: string;
    stateAmountOwed: string;
  };

  // Retirement Score
  retirementScore: {
    title: string;
    basicInfo: string;
    financialStatus: string;
    livingEnvironment: string;
    investmentStyle: string;
    currentAge: string;
    retirementAge: string;
    marriageStatus: string;
    dependents: string;
    currentSavings: string;
    monthlyIncome: string;
    emergencyFund: string;
    retirementExpenses: string;
    socialSecurityBenefit: string;
    riskTolerance: string;
    investmentExperience: string;
    calculateScore: string;
    yourScore: string;
    recommendations: string;
  };

  // About
  about: {
    title: string;
    companyName: string;
    mission: string;
    vision: string;
    founderTitle: string;
    founderName: string;
    founderCredentials: string;
    bookTitle: string;
    consultationButton: string;
  };

  // Authentication
  auth: {
    loginTitle: string;
    registerTitle: string;
    loginButton: string;
    registerButton: string;
    forgotPassword: string;
    noAccount: string;
    haveAccount: string;
    googleLogin: string;
    guestAccess: string;
    loginError: string;
    registerError: string;
    passwordRequirements: string;
  };

  // Errors and Validation
  errors: {
    required: string;
    invalidEmail: string;
    invalidSSN: string;
    invalidDate: string;
    invalidNumber: string;
    networkError: string;
    serverError: string;
    sessionExpired: string;
  };

  // Footer
  footer: {
    companyInfo: string;
    privacyPolicy: string;
    termsOfService: string;
    contactUs: string;
    socialSecurityCalculator: string;
    copyright: string;
  };
}

export const koMessages: Messages = {
  common: {
    save: '저장',
    cancel: '취소',
    next: '다음',
    previous: '이전',
    loading: '로딩중...',
    error: '오류',
    success: '성공',
    login: '로그인',
    logout: '로그아웃',
    register: '회원가입',
    email: '이메일',
    password: '비밀번호',
    username: '사용자명',
    submit: '제출',
    calculate: '계산',
    reset: '초기화',
    continue: '계속',
    back: '뒤로',
    close: '닫기',
    edit: '수정',
    delete: '삭제',
    confirm: '확인',
    yes: '예',
    no: '아니오',
  },

  navigation: {
    home: '홈',
    personalInfo: '개인정보',
    income: '소득',
    deductions: '공제',
    taxCredits: '세액공제',
    additionalTax: '추가세금',
    review: '검토',
    stateTax: '주소득세',
    about: '회사소개',
    pricing: '요금안내',
    admin: '관리자',
  },

  home: {
    title: 'EzTax - 세상쉬운 세금계산 세상귀한 노후준비',
    subtitle: 'Less Tax, More Wealth',
    tagline: '세금시뮬레이터로 간단하게 계산하시고 노후준비도 진단하세요',
    startNowButton: '지금 시작하기',
    taxSimulatorButton: '세금시뮬레이터',
    retirementDiagnosisButton: '은퇴준비상태진단',
    description: '전문적이고 정확한 세금 계산과 은퇴 준비 진단 서비스',
    features: {
      easyCalculation: '간단한 세금 계산',
      expertConsultation: '전문가 상담',
      retirementPlanning: '최적의 은퇴전략 제안',
    },
  },

  personalInfo: {
    title: '개인정보',
    firstName: '이름',
    middleInitial: '중간이름',
    lastName: '성',
    ssn: 'SSN',
    dateOfBirth: '생년월일',
    email: '이메일',
    phone: '전화번호',
    address1: '주소1',
    address2: '주소2',
    city: '도시',
    state: '주',
    zipCode: '우편번호',
    filingStatus: '신고상태',
    filingStatusOptions: {
      single: '미혼(Single)',
      marriedJoint: '합산신고(Married Filing Jointly)',
      marriedSeparate: '별도신고(Married Filing Separately)',
      headOfHousehold: '세대주(Head of Household)',
      qualifyingWidow: '적격과부(Qualifying Widow)',
    },
    isDisabled: '장애여부',
    isNonresidentAlien: '비거주외국인',
    spouseInfo: '배우자정보',
    dependents: '부양가족',
    addDependent: '부양가족 추가',
    saveProgress: '진행상황저장',
    filingStatusChecker: 'Filing Status 확인',
  },

  income: {
    title: '소득',
    wages: '급여소득',
    otherEarnedIncome: '기타근로소득',
    interestIncome: '이자소득',
    dividends: '배당소득',
    businessIncome: '사업소득',
    capitalGains: '자본이득',
    rentalIncome: '임대소득',
    retirementIncome: '연금소득',
    unemploymentIncome: '실업급여',
    otherIncome: '기타소득',
    additionalIncome: '추가소득',
    totalIncome: '총소득',
    adjustments: '조정',
    studentLoanInterest: '학자금대출이자',
    retirementContributions: '은퇴연금기여',
    otherAdjustments: '기타조정',
    adjustedGrossIncome: '조정총소득(AGI)',
    businessNetIncomeCalculator: '순소득 계산기',
    qbiCalculator: 'QBI 계산기',
  },

  deductions: {
    title: '공제',
    useStandardDeduction: '표준공제 사용',
    standardDeductionAmount: '표준공제액',
    itemizedDeductions: '항목별공제',
    medicalExpenses: '의료비',
    stateLocalIncomeTax: '주/지방소득세',
    realEstateTaxes: '부동산세',
    personalPropertyTax: '개인재산세',
    mortgageInterest: '주택담보대출이자',
    charitableCash: '현금기부',
    charitableNonCash: '현물기부',
    totalDeductions: '총공제액',
    saltLimit: 'SALT 한도 $10,000',
    medicalCalculator: '의료비 계산기',
  },

  taxCredits: {
    title: '세액공제',
    childTaxCredit: '자녀세액공제',
    childDependentCareCredit: '자녀보육비공제',
    educationCredits: '교육비공제',
    retirementSavingsCredit: '은퇴저축공제',
    foreignTaxCredit: '외국납부세액공제',
    earnedIncomeCredit: '근로소득공제(EIC)',
    otherCredits: '기타공제',
    totalCredits: '총세액공제',
    autoCalculate: '자동 계산',
    creditForOtherDependents: '기타부양가족공제',
    additionalChildTaxCredit: '추가자녀세액공제',
  },

  additionalTax: {
    title: '추가세금',
    selfEmploymentIncome: '자영업소득',
    selfEmploymentTax: '자영업세',
    estimatedTaxPayments: '예상세금납부',
    otherTaxes: '기타세금',
  },

  review: {
    title: '검토',
    totalIncome: '총소득',
    adjustments: '조정액',
    adjustedGrossIncome: '조정총소득',
    deductions: '공제액',
    taxableIncome: '과세소득',
    federalTax: '연방세',
    credits: '세액공제',
    taxDue: '납부할세액',
    payments: '기납부세액',
    refundAmount: '환급액',
    amountOwed: '추가납부액',
    downloadPDF: 'PDF 다운로드',
    submitReturn: '신고서제출(준비중)',
    stateTaxCalculation: '주소득세 계산(State Income Tax)',
  },

  stateTax: {
    title: '주소득세',
    selectState: '주 선택',
    stateTaxableIncome: '주 과세소득',
    stateTax: '주소득세',
    stateCredits: '주 세액공제',
    stateWithholding: '주 원천징수',
    stateRefund: '주 환급액',
    stateAmountOwed: '주 추가납부액',
  },

  retirementScore: {
    title: '종합 은퇴 준비 진단',
    basicInfo: '기본정보',
    financialStatus: '재정상태',
    livingEnvironment: '생활환경',
    investmentStyle: '투자성향',
    currentAge: '현재나이',
    retirementAge: '은퇴희망나이',
    marriageStatus: '결혼상태',
    dependents: '현재 부양가족 수',
    currentSavings: '현재 은퇴저축액',
    monthlyIncome: '월소득',
    emergencyFund: '현재 보유 비상 자금',
    retirementExpenses: '은퇴 후 예상 생활비 (주거비 포함 월비용 $)',
    socialSecurityBenefit: 'Social Security 예상 수령액',
    riskTolerance: '위험감수성향',
    investmentExperience: '투자경험',
    calculateScore: '점수 계산',
    yourScore: '귀하의 점수',
    recommendations: '맞춤 추천사항',
  },

  about: {
    title: '회사소개',
    companyName: 'EzTax',
    mission: '사명',
    vision: '비전',
    founderTitle: '대표이사',
    founderName: '지대현 EA/RIA',
    founderCredentials: '미 Midwest 대학 회계학 교수, University of Pennsylvania Economics, Yonsei University MBA',
    bookTitle: '절세로 시작하는 은퇴설계 Less Tax, Better Retirement',
    consultationButton: '상담 예약하기',
  },

  auth: {
    loginTitle: '로그인',
    registerTitle: '회원가입',
    loginButton: '로그인',
    registerButton: '회원가입',
    forgotPassword: '비밀번호 찾기',
    noAccount: '계정이 없으신가요?',
    haveAccount: '이미 계정이 있으신가요?',
    googleLogin: 'Google로 로그인',
    guestAccess: '게스트로 이용하기',
    loginError: '로그인에 실패했습니다',
    registerError: '회원가입에 실패했습니다',
    passwordRequirements: '비밀번호는 8자 이상, 대문자, 특수문자 포함',
  },

  errors: {
    required: '필수 입력사항입니다',
    invalidEmail: '올바른 이메일 주소를 입력하세요',
    invalidSSN: '올바른 SSN을 입력하세요',
    invalidDate: '올바른 날짜를 입력하세요',
    invalidNumber: '올바른 숫자를 입력하세요',
    networkError: '네트워크 연결을 확인하세요',
    serverError: '서버 오류가 발생했습니다',
    sessionExpired: '세션이 만료되었습니다',
  },

  footer: {
    companyInfo: '회사 소개',
    privacyPolicy: '개인정보처리방침',
    termsOfService: '이용약관',
    contactUs: '연락처',
    socialSecurityCalculator: 'Social Security 계산기',
    copyright: '© 2025 EzTax. All rights reserved.',
  },
};

export const enMessages: Messages = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    next: 'Next',
    previous: 'Previous',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    login: 'Login',
    logout: 'Logout',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    username: 'Username',
    submit: 'Submit',
    calculate: 'Calculate',
    reset: 'Reset',
    continue: 'Continue',
    back: 'Back',
    close: 'Close',
    edit: 'Edit',
    delete: 'Delete',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
  },

  navigation: {
    home: 'Home',
    personalInfo: 'Personal Info',
    income: 'Income',
    deductions: 'Deductions',
    taxCredits: 'Tax Credits',
    additionalTax: 'Additional Tax',
    review: 'Review',
    stateTax: 'State Tax',
    about: 'About',
    pricing: 'Pricing',
    admin: 'Admin',
  },

  home: {
    title: 'EzTax - Easy Tax Calculation & Precious Retirement Planning',
    subtitle: 'Less Tax, More Wealth',
    tagline: 'Calculate taxes easily with our simulator and diagnose your retirement readiness',
    startNowButton: 'Get Started',
    taxSimulatorButton: 'Tax Simulator',
    retirementDiagnosisButton: 'Retirement Readiness Assessment',
    description: 'Professional and accurate tax calculation and retirement planning services',
    features: {
      easyCalculation: 'Simple Tax Calculation',
      expertConsultation: 'Expert Consultation',
      retirementPlanning: 'Optimal Retirement Strategy',
    },
  },

  personalInfo: {
    title: 'Personal Information',
    firstName: 'First Name',
    middleInitial: 'Middle Initial',
    lastName: 'Last Name',
    ssn: 'SSN',
    dateOfBirth: 'Date of Birth',
    email: 'Email',
    phone: 'Phone',
    address1: 'Address 1',
    address2: 'Address 2',
    city: 'City',
    state: 'State',
    zipCode: 'ZIP Code',
    filingStatus: 'Filing Status',
    filingStatusOptions: {
      single: 'Single',
      marriedJoint: 'Married Filing Jointly',
      marriedSeparate: 'Married Filing Separately',
      headOfHousehold: 'Head of Household',
      qualifyingWidow: 'Qualifying Widow(er)',
    },
    isDisabled: 'Disabled',
    isNonresidentAlien: 'Nonresident Alien',
    spouseInfo: 'Spouse Information',
    dependents: 'Dependents',
    addDependent: 'Add Dependent',
    saveProgress: 'Save Progress',
    filingStatusChecker: 'Filing Status Checker',
  },

  income: {
    title: 'Income',
    wages: 'Wages',
    otherEarnedIncome: 'Other Earned Income',
    interestIncome: 'Interest Income',
    dividends: 'Dividends',
    businessIncome: 'Business Income',
    capitalGains: 'Capital Gains',
    rentalIncome: 'Rental Income',
    retirementIncome: 'Retirement Income',
    unemploymentIncome: 'Unemployment Income',
    otherIncome: 'Other Income',
    additionalIncome: 'Additional Income',
    totalIncome: 'Total Income',
    adjustments: 'Adjustments',
    studentLoanInterest: 'Student Loan Interest',
    retirementContributions: 'Retirement Contributions',
    otherAdjustments: 'Other Adjustments',
    adjustedGrossIncome: 'Adjusted Gross Income (AGI)',
    businessNetIncomeCalculator: 'Business Net Income Calculator',
    qbiCalculator: 'QBI Calculator',
  },

  deductions: {
    title: 'Deductions',
    useStandardDeduction: 'Use Standard Deduction',
    standardDeductionAmount: 'Standard Deduction Amount',
    itemizedDeductions: 'Itemized Deductions',
    medicalExpenses: 'Medical Expenses',
    stateLocalIncomeTax: 'State and Local Income Tax',
    realEstateTaxes: 'Real Estate Taxes',
    personalPropertyTax: 'Personal Property Tax',
    mortgageInterest: 'Mortgage Interest',
    charitableCash: 'Charitable Contributions (Cash)',
    charitableNonCash: 'Charitable Contributions (Non-Cash)',
    totalDeductions: 'Total Deductions',
    saltLimit: 'SALT Limit $10,000',
    medicalCalculator: 'Medical Expense Calculator',
  },

  taxCredits: {
    title: 'Tax Credits',
    childTaxCredit: 'Child Tax Credit',
    childDependentCareCredit: 'Child and Dependent Care Credit',
    educationCredits: 'Education Credits',
    retirementSavingsCredit: 'Retirement Savings Credit',
    foreignTaxCredit: 'Foreign Tax Credit',
    earnedIncomeCredit: 'Earned Income Credit (EIC)',
    otherCredits: 'Other Credits',
    totalCredits: 'Total Credits',
    autoCalculate: 'Auto Calculate',
    creditForOtherDependents: 'Credit for Other Dependents',
    additionalChildTaxCredit: 'Additional Child Tax Credit',
  },

  additionalTax: {
    title: 'Additional Tax',
    selfEmploymentIncome: 'Self-Employment Income',
    selfEmploymentTax: 'Self-Employment Tax',
    estimatedTaxPayments: 'Estimated Tax Payments',
    otherTaxes: 'Other Taxes',
  },

  review: {
    title: 'Review',
    totalIncome: 'Total Income',
    adjustments: 'Adjustments',
    adjustedGrossIncome: 'Adjusted Gross Income',
    deductions: 'Deductions',
    taxableIncome: 'Taxable Income',
    federalTax: 'Federal Tax',
    credits: 'Credits',
    taxDue: 'Tax Due',
    payments: 'Payments',
    refundAmount: 'Refund Amount',
    amountOwed: 'Amount Owed',
    downloadPDF: 'Download PDF',
    submitReturn: 'Submit Return (Coming Soon)',
    stateTaxCalculation: 'State Income Tax Calculation',
  },

  stateTax: {
    title: 'State Income Tax',
    selectState: 'Select State',
    stateTaxableIncome: 'State Taxable Income',
    stateTax: 'State Tax',
    stateCredits: 'State Credits',
    stateWithholding: 'State Withholding',
    stateRefund: 'State Refund',
    stateAmountOwed: 'State Amount Owed',
  },

  retirementScore: {
    title: 'Comprehensive Retirement Readiness Assessment',
    basicInfo: 'Basic Information',
    financialStatus: 'Financial Status',
    livingEnvironment: 'Living Environment',
    investmentStyle: 'Investment Style',
    currentAge: 'Current Age',
    retirementAge: 'Desired Retirement Age',
    marriageStatus: 'Marital Status',
    dependents: 'Number of Current Dependents',
    currentSavings: 'Current Retirement Savings',
    monthlyIncome: 'Monthly Income',
    emergencyFund: 'Current Emergency Fund',
    retirementExpenses: 'Expected Retirement Living Expenses (Monthly including housing $)',
    socialSecurityBenefit: 'Expected Social Security Benefit',
    riskTolerance: 'Risk Tolerance',
    investmentExperience: 'Investment Experience',
    calculateScore: 'Calculate Score',
    yourScore: 'Your Score',
    recommendations: 'Personalized Recommendations',
  },

  about: {
    title: 'About Us',
    companyName: 'EzTax',
    mission: 'Mission',
    vision: 'Vision',
    founderTitle: 'CEO',
    founderName: 'Daehyun Ji EA/RIA',
    founderCredentials: 'Professor of Accounting at Midwest University, University of Pennsylvania Economics, Yonsei University MBA',
    bookTitle: 'Tax-Efficient Retirement Planning: Less Tax, Better Retirement',
    consultationButton: 'Book Consultation',
  },

  auth: {
    loginTitle: 'Login',
    registerTitle: 'Register',
    loginButton: 'Login',
    registerButton: 'Register',
    forgotPassword: 'Forgot Password',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    googleLogin: 'Login with Google',
    guestAccess: 'Continue as Guest',
    loginError: 'Login failed',
    registerError: 'Registration failed',
    passwordRequirements: 'Password must be 8+ characters with uppercase and special characters',
  },

  errors: {
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    invalidSSN: 'Please enter a valid SSN',
    invalidDate: 'Please enter a valid date',
    invalidNumber: 'Please enter a valid number',
    networkError: 'Please check your network connection',
    serverError: 'Server error occurred',
    sessionExpired: 'Session has expired',
  },

  footer: {
    companyInfo: 'About Company',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    contactUs: 'Contact Us',
    socialSecurityCalculator: 'Social Security Calculator',
    copyright: '© 2025 EzTax. All rights reserved.',
  },
};

export const getMessages = (language: Language): Messages => {
  return language === 'ko' ? koMessages : enMessages;
};