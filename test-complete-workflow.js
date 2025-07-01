// Test complete tax workflow with realistic data
const testData = {
  personalInfo: {
    firstName: "Sarah",
    lastName: "Johnson", 
    state: "CA",
    filingStatus: "single"
  },
  income: {
    wages: 85000,
    interestIncome: 500,
    dividends: 1200,
    totalIncome: 86700,
    adjustments: {
      studentLoanInterest: 1500,
      retirementContributions: 6000
    },
    adjustedGrossIncome: 79200
  },
  deductions: {
    useStandardDeduction: true,
    standardDeductionAmount: 13850
  },
  taxableIncome: 65350,
  stateWithholding: 3200
};

console.log("Testing Complete Tax Workflow:");
console.log("Personal Info:", testData.personalInfo);
console.log("Income Summary:", {
  totalIncome: testData.income.totalIncome,
  adjustedGrossIncome: testData.income.adjustedGrossIncome,
  taxableIncome: testData.taxableIncome
});
console.log("State Withholding:", testData.stateWithholding);

// Expected results for California:
// - State taxable income should be close to federal AGI minus state deductions
// - CA tax rates: 1% on first $10,099, 2% on next bracket, etc.
// - Should calculate refund or amount owed based on withholding vs calculated tax