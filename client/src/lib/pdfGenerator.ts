import { jsPDF } from 'jspdf';
import { 
  PersonalInformation, 
  Deductions, 
  TaxCredits, 
  AdditionalTax, 
  CalculatedResults 
} from '@shared/schema';
import { formatCurrency } from './taxCalculations';

interface TaxData {
  id?: number;
  taxYear: number;
  status: string;
  personalInfo?: PersonalInformation;
  deductions?: Deductions;
  taxCredits?: TaxCredits;
  additionalTax?: AdditionalTax;
  calculatedResults?: CalculatedResults;
}

// Helper function to format dates
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'Not provided';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
};

// Helper function to map filing status to readable text
const formatFilingStatus = (status: string | undefined): string => {
  if (!status) return 'Not selected';
  
  const statusMap: Record<string, string> = {
    single: 'Single',
    married_joint: 'Married Filing Jointly',
    married_separate: 'Married Filing Separately',
    head_of_household: 'Head of Household',
    qualifying_widow: 'Qualifying Widow(er)'
  };
  
  return statusMap[status] || status;
};

// Function to add Form 1040 header
const add1040Header = (doc: jsPDF, taxYear: number): void => {
  // Form 1040 Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Form 1040', 15, 20);
  doc.setFontSize(12);
  doc.text(`U.S. Individual Income Tax Return`, 15, 27);
  
  // Tax Year
  doc.setFontSize(14);
  doc.text(`For the year ${taxYear}, or tax year beginning _____, ${taxYear}, ending _____, ${taxYear + 1}`, 15, 35);
  
  // OMB and Form info (right side)
  doc.setFontSize(10);
  doc.text('OMB No. 1545-0074', 150, 20);
  doc.text('Department of the Treasury', 150, 25);
  doc.text('Internal Revenue Service', 150, 30);
  
  // Form border
  doc.setDrawColor(0, 0, 0);
  doc.rect(10, 10, 190, 277);
  
  // Section divider
  doc.setDrawColor(0, 0, 0);
  doc.line(10, 40, 200, 40);
};

// Generate Form 1040 filing information section
const add1040FilingInfo = (doc: jsPDF, personalInfo: PersonalInformation | undefined, yPosition: number): number => {
  if (!personalInfo) return yPosition;
  
  // Filing Status Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Filing Status', 15, yPosition);
  yPosition += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Filing status checkboxes
  const filingStatuses = [
    { key: 'single', label: 'Single' },
    { key: 'married_joint', label: 'Married filing jointly' },
    { key: 'married_separate', label: 'Married filing separately' },
    { key: 'head_of_household', label: 'Head of household' },
    { key: 'qualifying_widow', label: 'Qualifying widow(er)' }
  ];
  
  filingStatuses.forEach((status, index) => {
    const isChecked = personalInfo.filingStatus === status.key;
    // Checkbox
    doc.rect(15, yPosition - 3, 3, 3);
    if (isChecked) {
      doc.text('X', 16, yPosition - 1);
    }
    doc.text(status.label, 20, yPosition);
    yPosition += 5;
  });
  
  yPosition += 5;
  
  // Name and address section
  doc.setFont('helvetica', 'bold');
  doc.text('Your first name and middle initial', 15, yPosition);
  doc.text('Last name', 100, yPosition);
  doc.text('Your social security number', 150, yPosition);
  yPosition += 5;
  
  doc.setFont('helvetica', 'normal');
  const firstName = `${personalInfo.firstName || ''} ${personalInfo.middleInitial || ''}`.trim();
  doc.text(firstName, 15, yPosition);
  doc.text(personalInfo.lastName || '', 100, yPosition);
  doc.text(personalInfo.ssn || '', 150, yPosition);
  yPosition += 8;
  
  // Spouse information (if married)
  if (personalInfo.filingStatus === 'married_joint' && personalInfo.spouseInfo) {
    doc.setFont('helvetica', 'bold');
    doc.text("If joint return, spouse's first name and middle initial", 15, yPosition);
    doc.text('Last name', 100, yPosition);
    doc.text("Spouse's social security number", 150, yPosition);
    yPosition += 5;
    
    doc.setFont('helvetica', 'normal');
    const spouseFirstName = `${personalInfo.spouseInfo.firstName || ''} ${personalInfo.spouseInfo.middleInitial || ''}`.trim();
    doc.text(spouseFirstName, 15, yPosition);
    doc.text(personalInfo.spouseInfo.lastName || '', 100, yPosition);
    doc.text(personalInfo.spouseInfo.ssn || '', 150, yPosition);
    yPosition += 8;
  }
  
  // Address
  doc.setFont('helvetica', 'bold');
  doc.text('Home address (number and street)', 15, yPosition);
  yPosition += 5;
  doc.setFont('helvetica', 'normal');
  const address = `${personalInfo.address1 || ''} ${personalInfo.address2 || ''}`.trim();
  doc.text(address, 15, yPosition);
  yPosition += 8;
  
  doc.setFont('helvetica', 'bold');
  doc.text('City, town, or post office', 15, yPosition);
  doc.text('State', 100, yPosition);
  doc.text('ZIP code', 150, yPosition);
  yPosition += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(personalInfo.city || '', 15, yPosition);
  doc.text(personalInfo.state || '', 100, yPosition);
  doc.text(personalInfo.zipCode || '', 150, yPosition);
  yPosition += 10;
  
  return yPosition;
};

// Generate Form 1040 Income section (Lines 1-9)
const add1040IncomeSection = (doc: jsPDF, income: any, yPosition: number): number => {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Income', 15, yPosition);
  yPosition += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Income lines with form structure
  const addIncomeLine = (lineNum: string, description: string, amount: number) => {
    doc.text(`${lineNum}`, 15, yPosition);
    doc.text(description, 25, yPosition);
    doc.text(formatCurrency(amount), 160, yPosition);
    yPosition += 6;
  };
  
  if (income) {
    addIncomeLine('1a', 'Wages, salaries, tips, etc.', income.wages || 0);
    addIncomeLine('2a', 'Tax-exempt interest', 0);
    addIncomeLine('2b', 'Taxable interest', income.interestIncome || 0);
    addIncomeLine('3a', 'Qualified dividends', income.dividends || 0);
    addIncomeLine('4a', 'IRA distributions', 0);
    addIncomeLine('4b', 'Taxable amount', income.retirementIncome || 0);
    addIncomeLine('5a', 'Pensions and annuities', 0);
    addIncomeLine('6', 'Social security benefits', 0);
    addIncomeLine('7', 'Capital gain or (loss)', income.capitalGains || 0);
    addIncomeLine('8', 'Other income from Schedule 1, line 10', income.otherIncome || 0);
  }
  
  yPosition += 5;
  doc.setFont('helvetica', 'bold');
  const totalIncome = income ? (income.totalIncome || 0) : 0;
  doc.text('9', 15, yPosition);
  doc.text('Add lines 1a, 2b, 3a, 4b, 5b, 6, 7, and 8. This is your total income', 25, yPosition);
  doc.text(formatCurrency(totalIncome), 160, yPosition);
  yPosition += 10;
  
  return yPosition;
};

// Generate Form 1040 Adjusted Gross Income section (Lines 10-11)
const add1040AGISection = (doc: jsPDF, income: any, yPosition: number): number => {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Adjusted Gross Income', 15, yPosition);
  yPosition += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const totalIncome = income ? (income.totalIncome || 0) : 0;
  const adjustments = income && income.adjustments ? 
    (income.adjustments.studentLoanInterest || 0) + 
    (income.adjustments.retirementContributions || 0) + 
    (income.adjustments.otherAdjustments || 0) : 0;
  const agi = totalIncome - adjustments;
  
  doc.text('10', 15, yPosition);
  doc.text('Adjustments to income from Schedule 1, line 26', 25, yPosition);
  doc.text(formatCurrency(adjustments), 160, yPosition);
  yPosition += 6;
  
  doc.setFont('helvetica', 'bold');
  doc.text('11', 15, yPosition);
  doc.text('Adjusted gross income. Subtract line 10 from line 9', 25, yPosition);
  doc.text(formatCurrency(agi), 160, yPosition);
  yPosition += 10;
  
  return yPosition;
};

// Generate Form 1040 Tax and Credits section (Lines 12-19)
const add1040TaxSection = (doc: jsPDF, calculatedResults: CalculatedResults | undefined, deductions: Deductions | undefined, yPosition: number): number => {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Tax and Credits', 15, yPosition);
  yPosition += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  if (calculatedResults) {
    // Standard/Itemized deduction
    const deductionType = deductions?.useStandardDeduction ? 'Standard deduction' : 'Itemized deductions';
    doc.text('12', 15, yPosition);
    doc.text(`${deductionType}`, 25, yPosition);
    doc.text(formatCurrency(calculatedResults.deductions || 0), 160, yPosition);
    yPosition += 6;
    
    // Taxable income
    doc.setFont('helvetica', 'bold');
    doc.text('15', 15, yPosition);
    doc.text('Taxable income. Subtract line 12 from line 11', 25, yPosition);
    doc.text(formatCurrency(calculatedResults.taxableIncome || 0), 160, yPosition);
    yPosition += 6;
    
    doc.setFont('helvetica', 'normal');
    // Tax
    doc.text('16', 15, yPosition);
    doc.text('Tax (see instructions)', 25, yPosition);
    doc.text(formatCurrency(calculatedResults.federalTax || 0), 160, yPosition);
    yPosition += 6;
    
    // Credits
    doc.text('19', 15, yPosition);
    doc.text('Child tax credit and credit for other dependents', 25, yPosition);
    doc.text(formatCurrency(calculatedResults.credits || 0), 160, yPosition);
    yPosition += 6;
    
    // Tax after credits
    doc.setFont('helvetica', 'bold');
    doc.text('22', 15, yPosition);
    doc.text('Subtract line 19 from line 16', 25, yPosition);
    doc.text(formatCurrency(calculatedResults.taxDue || 0), 160, yPosition);
    yPosition += 10;
  }
  
  return yPosition;
};

// Generate Form 1040 Payments section (Lines 25-33)
const add1040PaymentsSection = (doc: jsPDF, calculatedResults: CalculatedResults | undefined, additionalTax: AdditionalTax | undefined, yPosition: number): number => {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Payments', 15, yPosition);
  yPosition += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  if (calculatedResults) {
    // Federal income tax withheld
    doc.text('25a', 15, yPosition);
    doc.text('Federal income tax withheld', 25, yPosition);
    doc.text(formatCurrency(calculatedResults.payments || 0), 160, yPosition);
    yPosition += 6;
    
    // Estimated tax payments
    const estimatedPayments = additionalTax?.estimatedTaxPayments || 0;
    doc.text('26', 15, yPosition);
    doc.text('Estimated tax payments and amount applied from prior year', 25, yPosition);
    doc.text(formatCurrency(estimatedPayments), 160, yPosition);
    yPosition += 6;
    
    // Total payments
    const totalPayments = (calculatedResults.payments || 0) + estimatedPayments;
    doc.setFont('helvetica', 'bold');
    doc.text('33', 15, yPosition);
    doc.text('Add lines 25a through 32. These are your total payments', 25, yPosition);
    doc.text(formatCurrency(totalPayments), 160, yPosition);
    yPosition += 10;
  }
  
  return yPosition;
};

// Generate Form 1040 Refund or Amount Owed section (Lines 34-37)
const add1040RefundOwedSection = (doc: jsPDF, calculatedResults: CalculatedResults | undefined, yPosition: number): number => {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Refund', 15, yPosition);
  yPosition += 8;
  
  doc.setFontSize(10);
  
  if (calculatedResults) {
    if (calculatedResults.refundAmount && calculatedResults.refundAmount > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('34', 15, yPosition);
      doc.text('If line 33 is more than line 22, subtract line 22 from line 33. This is the amount you overpaid', 25, yPosition);
      doc.text(formatCurrency(calculatedResults.refundAmount), 160, yPosition);
      yPosition += 6;
      
      doc.text('35a', 15, yPosition);
      doc.text('Amount of line 34 you want refunded to you', 25, yPosition);
      doc.text(formatCurrency(calculatedResults.refundAmount), 160, yPosition);
      yPosition += 10;
    } else if (calculatedResults.amountOwed && calculatedResults.amountOwed > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('37', 15, yPosition);
      doc.text('Amount you owe. Subtract line 33 from line 22', 25, yPosition);
      doc.text(formatCurrency(calculatedResults.amountOwed), 160, yPosition);
      yPosition += 10;
    }
  }
  
  return yPosition;
};

// Generate section for tax credits
const addTaxCreditsSection = (doc: jsPDF, taxCredits: TaxCredits | undefined, yPosition: number): number => {
  if (!taxCredits) return yPosition;
  
  doc.setFontSize(14);
  doc.setTextColor(0, 85, 170);
  doc.setFont('helvetica', 'bold');
  doc.text('Tax Credits', 15, yPosition);
  yPosition += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  doc.text(`Child Tax Credit: ${formatCurrency(taxCredits.childTaxCredit)}`, 15, yPosition);
  yPosition += 5;
  doc.text(`Child & Dependent Care Credit: ${formatCurrency(taxCredits.childDependentCareCredit)}`, 15, yPosition);
  yPosition += 5;
  doc.text(`Education Credits: ${formatCurrency(taxCredits.educationCredits)}`, 15, yPosition);
  yPosition += 5;
  doc.text(`Retirement Savings Credit: ${formatCurrency(taxCredits.retirementSavingsCredit)}`, 15, yPosition);
  yPosition += 5;
  doc.text(`Other Credits: ${formatCurrency(taxCredits.otherCredits)}`, 15, yPosition);
  yPosition += 6;
  
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Credits: ${formatCurrency(taxCredits.totalCredits)}`, 15, yPosition);
  yPosition += 8;
  
  // Add a horizontal line to separate sections
  doc.setDrawColor(200, 200, 200);
  doc.line(15, yPosition, 195, yPosition);
  yPosition += 10;
  
  return yPosition;
};

// Generate section for additional tax
const addAdditionalTaxSection = (doc: jsPDF, additionalTax: AdditionalTax | undefined, yPosition: number): number => {
  if (!additionalTax) return yPosition;
  
  doc.setFontSize(14);
  doc.setTextColor(0, 85, 170);
  doc.setFont('helvetica', 'bold');
  doc.text('Additional Tax Information', 15, yPosition);
  yPosition += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  doc.text(`Self-Employment Income: ${formatCurrency(additionalTax.selfEmploymentIncome)}`, 15, yPosition);
  yPosition += 5;
  doc.text(`Self-Employment Tax: ${formatCurrency(additionalTax.selfEmploymentTax)}`, 15, yPosition);
  yPosition += 5;
  doc.text(`Other Income: ${formatCurrency(additionalTax.otherIncome)}`, 15, yPosition);
  yPosition += 5;
  doc.text(`Other Taxes: ${formatCurrency(additionalTax.otherTaxes)}`, 15, yPosition);
  yPosition += 5;
  doc.text(`Estimated Tax Payments: ${formatCurrency(additionalTax.estimatedTaxPayments)}`, 15, yPosition);
  yPosition += 8;
  
  // Add a horizontal line to separate sections
  doc.setDrawColor(200, 200, 200);
  doc.line(15, yPosition, 195, yPosition);
  yPosition += 10;
  
  return yPosition;
};

// Generate section for final tax calculation
const addCalculationSection = (doc: jsPDF, calculatedResults: CalculatedResults | undefined, yPosition: number): number => {
  if (!calculatedResults) return yPosition;
  
  doc.setFontSize(14);
  doc.setTextColor(0, 85, 170);
  doc.setFont('helvetica', 'bold');
  doc.text('Tax Calculation Summary', 15, yPosition);
  yPosition += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  // Income section
  doc.text(`Total Income: ${formatCurrency(calculatedResults.totalIncome)}`, 15, yPosition);
  yPosition += 5;
  doc.text(`Adjustments: ${formatCurrency(calculatedResults.adjustments)}`, 15, yPosition);
  yPosition += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(`Adjusted Gross Income: ${formatCurrency(calculatedResults.adjustedGrossIncome)}`, 15, yPosition);
  doc.setFont('helvetica', 'normal');
  yPosition += 8;
  
  // Deductions and taxable income
  doc.text(`Deductions: ${formatCurrency(calculatedResults.deductions)}`, 15, yPosition);
  yPosition += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(`Taxable Income: ${formatCurrency(calculatedResults.taxableIncome)}`, 15, yPosition);
  doc.setFont('helvetica', 'normal');
  yPosition += 8;
  
  // Tax calculation
  doc.text(`Federal Tax: ${formatCurrency(calculatedResults.federalTax)}`, 15, yPosition);
  yPosition += 5;
  doc.text(`Tax Credits: ${formatCurrency(calculatedResults.credits)}`, 15, yPosition);
  yPosition += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(`Tax Due: ${formatCurrency(calculatedResults.taxDue)}`, 15, yPosition);
  doc.setFont('helvetica', 'normal');
  yPosition += 8;
  
  // Payments and final result
  doc.text(`Payments & Withholding: ${formatCurrency(calculatedResults.payments)}`, 15, yPosition);
  yPosition += 5;
  
  // Show either refund or amount owed, not both
  if (calculatedResults.refundAmount > 0) {
    doc.setFillColor(40, 167, 69); // Success green
    doc.rect(15, yPosition - 4, 180, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(`Refund Amount: ${formatCurrency(calculatedResults.refundAmount)}`, 15, yPosition + 2);
  } else {
    doc.setFillColor(220, 53, 69); // Danger red
    doc.rect(15, yPosition - 4, 180, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(`Amount You Owe: ${formatCurrency(calculatedResults.amountOwed)}`, 15, yPosition + 2);
  }
  
  yPosition += 14;
  
  return yPosition;
};

// Add Form 1040 footer
const add1040Footer = (doc: jsPDF): void => {
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Form 1040 footer information
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text('Form 1040 (2025)', 15, 280);
    
    // Page number
    doc.text(`Page ${i}`, 180, 280);
    
    // Disclaimer
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'italic');
    doc.text('Generated by EzTax - For informational purposes only', 15, 285);
  }
};

// Main function to generate Form 1040 PDF
export const generateTaxFormPDF = (taxData: TaxData): jsPDF => {
  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Add Form 1040 header
  add1040Header(doc, taxData.taxYear);
  
  // Starting y position after header
  let yPosition = 50;
  
  // Add filing information and personal details
  yPosition = add1040FilingInfo(doc, taxData.personalInfo, yPosition);
  
  // Check if we need a new page
  if (yPosition > 240) {
    doc.addPage();
    add1040Header(doc, taxData.taxYear);
    yPosition = 50;
  }
  
  // Add income section
  yPosition = add1040IncomeSection(doc, (taxData as any).income, yPosition);
  
  // Check if we need a new page
  if (yPosition > 240) {
    doc.addPage();
    add1040Header(doc, taxData.taxYear);
    yPosition = 50;
  }
  
  // Add AGI section
  yPosition = add1040AGISection(doc, (taxData as any).income, yPosition);
  
  // Check if we need a new page
  if (yPosition > 240) {
    doc.addPage();
    add1040Header(doc, taxData.taxYear);
    yPosition = 50;
  }
  
  // Add tax and credits section
  yPosition = add1040TaxSection(doc, taxData.calculatedResults, taxData.deductions, yPosition);
  
  // Check if we need a new page
  if (yPosition > 240) {
    doc.addPage();
    add1040Header(doc, taxData.taxYear);
    yPosition = 50;
  }
  
  // Add payments section
  yPosition = add1040PaymentsSection(doc, taxData.calculatedResults, taxData.additionalTax, yPosition);
  
  // Check if we need a new page
  if (yPosition > 240) {
    doc.addPage();
    add1040Header(doc, taxData.taxYear);
    yPosition = 50;
  }
  
  // Add refund/owed section
  yPosition = add1040RefundOwedSection(doc, taxData.calculatedResults, yPosition);
  
  // Add signature section
  yPosition += 15;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Sign Here', 15, yPosition);
  yPosition += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Your signature', 15, yPosition);
  doc.text('Date', 100, yPosition);
  doc.text('Your occupation', 150, yPosition);
  yPosition += 8;
  
  // Draw signature lines
  doc.setDrawColor(0, 0, 0);
  doc.line(15, yPosition, 90, yPosition);
  doc.line(100, yPosition, 140, yPosition);
  doc.line(150, yPosition, 195, yPosition);
  
  // Add footer with form info
  add1040Footer(doc);
  
  return doc;
};

// Function to generate and download the PDF
export const downloadTaxFormPDF = (taxData: TaxData): void => {
  const doc = generateTaxFormPDF(taxData);
  doc.save(`Form_1040_${taxData.taxYear}.pdf`);
};
