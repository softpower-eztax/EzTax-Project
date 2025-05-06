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

// Function to add a header with EzTax branding
const addHeader = (doc: jsPDF, pageTitle: string): void => {
  // Add EzTax logo/branding
  doc.setFillColor(0, 85, 170); // EzTax primary blue
  doc.rect(15, 15, 30, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('EzTax', 22, 22);
  
  // Add page title
  doc.setTextColor(0, 85, 170);
  doc.setFontSize(12);
  doc.text('Simple Tax Preparation', 48, 22);
  
  // Add document title
  doc.setFontSize(18);
  doc.text(pageTitle, 15, 40);
  
  // Add horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 45, 195, 45);
};

// Generate section for personal information
const addPersonalInfoSection = (doc: jsPDF, personalInfo: PersonalInformation | undefined, yPosition: number): number => {
  if (!personalInfo) return yPosition;
  
  doc.setFontSize(14);
  doc.setTextColor(0, 85, 170);
  doc.setFont('helvetica', 'bold');
  doc.text('Personal Information', 15, yPosition);
  yPosition += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  // Name and basic info
  const name = `${personalInfo.firstName || ''} ${personalInfo.middleInitial || ''} ${personalInfo.lastName || ''}`.trim();
  doc.text(`Name: ${name}`, 15, yPosition);
  doc.text(`SSN: ${personalInfo.ssn || 'Not provided'}`, 100, yPosition);
  yPosition += 6;
  
  doc.text(`Date of Birth: ${formatDate(personalInfo.dateOfBirth)}`, 15, yPosition);
  yPosition += 6;
  
  doc.text(`Filing Status: ${formatFilingStatus(personalInfo.filingStatus)}`, 15, yPosition);
  yPosition += 10;
  
  // Contact information
  doc.text(`Email: ${personalInfo.email || 'Not provided'}`, 15, yPosition);
  doc.text(`Phone: ${personalInfo.phone || 'Not provided'}`, 100, yPosition);
  yPosition += 6;
  
  // Address
  const address = `${personalInfo.address1 || ''} ${personalInfo.address2 || ''}`.trim();
  doc.text(`Address: ${address}`, 15, yPosition);
  yPosition += 6;
  
  doc.text(`City: ${personalInfo.city || 'Not provided'}`, 15, yPosition);
  doc.text(`State: ${personalInfo.state || 'Not provided'}`, 100, yPosition);
  doc.text(`Zip: ${personalInfo.zipCode || 'Not provided'}`, 150, yPosition);
  yPosition += 10;
  
  // Dependents
  if (personalInfo.dependents && personalInfo.dependents.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Dependents:', 15, yPosition);
    yPosition += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    personalInfo.dependents.forEach((dependent, index) => {
      doc.text(`${index + 1}. ${dependent.firstName} ${dependent.lastName}`, 15, yPosition);
      doc.text(`SSN: ${dependent.ssn}`, 100, yPosition);
      yPosition += 5;
      doc.text(`Relationship: ${dependent.relationship}`, 15, yPosition);
      doc.text(`DOB: ${formatDate(dependent.dateOfBirth)}`, 100, yPosition);
      yPosition += 8;
    });
  } else {
    doc.text('No dependents reported.', 15, yPosition);
    yPosition += 6;
  }
  
  // Add a horizontal line to separate sections
  doc.setDrawColor(200, 200, 200);
  doc.line(15, yPosition, 195, yPosition);
  yPosition += 10;
  
  return yPosition;
};

// Generate section for deductions
const addDeductionsSection = (doc: jsPDF, deductions: Deductions | undefined, yPosition: number): number => {
  if (!deductions) return yPosition;
  
  doc.setFontSize(14);
  doc.setTextColor(0, 85, 170);
  doc.setFont('helvetica', 'bold');
  doc.text('Deductions', 15, yPosition);
  yPosition += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  if (deductions.useStandardDeduction) {
    doc.text('Deduction Type: Standard Deduction', 15, yPosition);
    yPosition += 6;
    doc.text(`Amount: ${formatCurrency(deductions.standardDeductionAmount)}`, 15, yPosition);
    yPosition += 6;
  } else {
    doc.text('Deduction Type: Itemized Deductions', 15, yPosition);
    yPosition += 6;
    
    if (deductions.itemizedDeductions) {
      doc.text(`Medical Expenses: ${formatCurrency(deductions.itemizedDeductions.medicalExpenses)}`, 15, yPosition);
      yPosition += 5;
      doc.text(`State & Local Income Tax: ${formatCurrency(deductions.itemizedDeductions.stateLocalIncomeTax)}`, 15, yPosition);
      yPosition += 5;
      doc.text(`Real Estate Taxes: ${formatCurrency(deductions.itemizedDeductions.realEstateTaxes)}`, 15, yPosition);
      yPosition += 5;
      doc.text(`Mortgage Interest: ${formatCurrency(deductions.itemizedDeductions.mortgageInterest)}`, 15, yPosition);
      yPosition += 5;
      doc.text(`Charitable Contributions (Cash): ${formatCurrency(deductions.itemizedDeductions.charitableCash)}`, 15, yPosition);
      yPosition += 5;
      doc.text(`Charitable Contributions (Non-Cash): ${formatCurrency(deductions.itemizedDeductions.charitableNonCash)}`, 15, yPosition);
      yPosition += 6;
    }
  }
  
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Deductions: ${formatCurrency(deductions.totalDeductions)}`, 15, yPosition);
  yPosition += 8;
  
  // Add a horizontal line to separate sections
  doc.setDrawColor(200, 200, 200);
  doc.line(15, yPosition, 195, yPosition);
  yPosition += 10;
  
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

// Add footer with disclaimer and page number
const addFooter = (doc: jsPDF): void => {
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Add disclaimer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'italic');
    doc.text('This document is for informational purposes only and does not constitute official tax filing.', 15, 280);
    
    // Add page number
    doc.text(`Page ${i} of ${pageCount}`, 180, 280);
    
    // Add EzTax branding
    doc.setFont('helvetica', 'normal');
    doc.text('Generated by EzTax - Simple Tax Preparation', 15, 285);
  }
};

// Main function to generate tax form PDF
export const generateTaxFormPDF = (taxData: TaxData): jsPDF => {
  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Add header
  addHeader(doc, `${taxData.taxYear} Tax Return Summary`);
  
  // Starting y position after header
  let yPosition = 60;
  
  // Add personal information section
  yPosition = addPersonalInfoSection(doc, taxData.personalInfo, yPosition);
  
  // Check if we need a new page
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }
  
  // Add deductions section
  yPosition = addDeductionsSection(doc, taxData.deductions, yPosition);
  
  // Check if we need a new page
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }
  
  // Add tax credits section
  yPosition = addTaxCreditsSection(doc, taxData.taxCredits, yPosition);
  
  // Check if we need a new page
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }
  
  // Add additional tax section
  yPosition = addAdditionalTaxSection(doc, taxData.additionalTax, yPosition);
  
  // Check if we need a new page
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }
  
  // Add calculation section
  yPosition = addCalculationSection(doc, taxData.calculatedResults, yPosition);
  
  // Add footer
  addFooter(doc);
  
  return doc;
};

// Function to generate and download the PDF
export const downloadTaxFormPDF = (taxData: TaxData): void => {
  const doc = generateTaxFormPDF(taxData);
  doc.save(`EzTax_Return_${taxData.taxYear}.pdf`);
};
