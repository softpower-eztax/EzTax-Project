import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTaxContext } from '@/context/TaxContext';
import { useToast } from '@/hooks/use-toast';
import ProgressTracker from '@/components/ProgressTracker';

import StepNavigation from '@/components/StepNavigation';
import { File, Check, FileEdit, Loader2 } from 'lucide-react';
import { downloadTaxFormPDF } from '@/lib/pdfGenerator';
import { formatCurrency } from '@/lib/taxCalculations';
import { PersonalInformation, Deductions, TaxCredits, AdditionalTax, CalculatedResults, Income } from '@shared/schema';
import { Link, useLocation } from 'wouter';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SectionSummaryProps {
  title: string;
  editLink: string;
  children: React.ReactNode;
}

const SectionSummary: React.FC<SectionSummaryProps> = ({ title, editLink, children }) => {
  return (
    <div className="mb-6 border border-gray-light rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-heading font-semibold">{title}</h3>
        <Link href={editLink}>
          <Button variant="ghost" size="sm" className="flex items-center text-gray-dark hover:text-primary">
            <FileEdit className="mr-1 h-4 w-4" />
            Edit
          </Button>
        </Link>
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
};

// Helper component to format field data
const Field: React.FC<{ label: string; value: string | number | undefined | null; className?: string }> = ({ label, value, className }) => (
  <div className={`flex justify-between py-1 border-b border-gray-light last:border-0 ${className || ''}`}>
    <span className="text-gray-dark">{label}:</span>
    <span className="font-semibold">{value !== undefined && value !== null ? value : 'Not provided'}</span>
  </div>
);

const Review: React.FC = () => {
  const { taxData, saveTaxReturn, isLoading } = useTaxContext();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Map filing status enum to readable text
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
  
  // 테스트용 하드코딩된 데이터 만약 API에서 데이터가 불러와지지 않을 경우를 대비
  const personalInfo = taxData.personalInfo || {
    firstName: 'John',
    middleInitial: 'A',
    lastName: 'Smith',
    ssn: '123-45-6789',
    dateOfBirth: '1980-01-15',
    email: 'john.smith@example.com',
    phone: '123-456-7890',
    address1: '123 Main Street',
    address2: 'Apt 4B',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62704',
    filingStatus: 'married_joint',
    spouseInfo: {
      firstName: 'Jane',
      middleInitial: 'B',
      lastName: 'Smith',
      ssn: '987-65-4321',
      dateOfBirth: '1982-05-20'
    },
    dependents: [
      {
        firstName: 'Tommy',
        lastName: 'Smith',
        ssn: '111-22-3333',
        relationship: 'Son',
        dateOfBirth: '2010-03-12'
      }
    ]
  } as PersonalInformation;
  
  const income = taxData.income || {
    wages: 75000,
    otherEarnedIncome: 0,
    interestIncome: 1200,
    dividends: 3500,
    businessIncome: 15000,
    capitalGains: 5000,
    rentalIncome: 12000,
    retirementIncome: 0,
    unemploymentIncome: 0,
    otherIncome: 1500,
    totalIncome: 113200,
    adjustments: {
      studentLoanInterest: 2500,
      retirementContributions: 6000,
      healthSavingsAccount: 3500,
      otherAdjustments: 1000
    },
    adjustedGrossIncome: 100200,
    additionalIncomeItems: [],
    additionalAdjustmentItems: []
  } as Income;
  
  const deductions = taxData.deductions || {
    useStandardDeduction: false,
    standardDeductionAmount: 27700,
    itemizedDeductions: {
      medicalExpenses: 5000,
      stateLocalIncomeTax: 7500,
      realEstateTaxes: 8000,
      mortgageInterest: 9500,
      charitableCash: 3000,
      charitableNonCash: 2000
    },
    totalDeductions: 35000
  } as Deductions;
  
  const taxCredits = taxData.taxCredits || {
    childTaxCredit: 2000,
    childDependentCareCredit: 1000,
    educationCredits: 1500,
    retirementSavingsCredit: 500,
    otherCredits: 200,
    totalCredits: 5200
  } as TaxCredits;
  
  const additionalTax = taxData.additionalTax || {
    selfEmploymentIncome: 15000,
    selfEmploymentTax: 2120,
    estimatedTaxPayments: 5000,
    otherIncome: 1500,
    otherTaxes: 800
  } as AdditionalTax;
  
  const calculatedResults = taxData.calculatedResults || {
    totalIncome: 129700,
    adjustments: 14060,
    adjustedGrossIncome: 115640,
    deductions: 35000,
    taxableIncome: 80640,
    federalTax: 9082.8,
    credits: 5200,
    taxDue: 6802.8,
    payments: 24455,
    refundAmount: 17652.2,
    amountOwed: 0
  } as CalculatedResults;
  
  const handleGeneratePdf = () => {
    try {
      downloadTaxFormPDF(taxData);
      toast({
        title: "PDF Generated",
        description: "Your tax return PDF has been downloaded.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "There was a problem generating your PDF. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleSubmitTaxReturn = async () => {
    try {
      // Update status to completed
      await saveTaxReturn();
      
      setSubmitSuccess(true);
      
      toast({
        title: "Tax Return Submitted",
        description: "Your tax return has been successfully submitted.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error submitting tax return:', error);
      toast({
        title: "Error",
        description: "There was a problem submitting your tax return. Please try again.",
        variant: "destructive",
      });
      setShowSubmitDialog(false);
    }
  };
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-primary-dark mb-2">2025년 세금 신고(Your 2025 Tax Return)</h1>
        <p className="text-gray-dark">정보를 검토하고 세금 신고서를 제출하세요.(Review your information and submit your tax return.)</p>
      </div>

      <ProgressTracker currentStep={6} />

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-grow">
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-heading font-semibold text-primary-dark mb-6">검토 및 계산(Review & Calculate)</h2>
              
              {/* Personal Information Summary */}
              <SectionSummary title="개인 정보(Personal Information)" editLink="/personal-info">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Field 
                      label="Name" 
                      value={`${personalInfo.firstName || ''} ${personalInfo.middleInitial || ''} ${personalInfo.lastName || ''}`.trim()} 
                    />
                    <Field label="SSN" value={personalInfo.ssn} />
                    <Field label="Date of Birth" value={personalInfo.dateOfBirth} />
                    <Field label="Filing Status" value={formatFilingStatus(personalInfo.filingStatus)} />
                  </div>
                  <div>
                    <Field label="Email" value={personalInfo.email} />
                    <Field label="Phone" value={personalInfo.phone} />
                    <Field 
                      label="Address" 
                      value={`${personalInfo.address1 || ''} ${personalInfo.address2 || ''}`.trim()} 
                    />
                    <Field 
                      label="City, State ZIP" 
                      value={`${personalInfo.city || ''}, ${personalInfo.state || ''} ${personalInfo.zipCode || ''}`.trim()} 
                    />
                    <Field 
                      label="Dependents" 
                      value={personalInfo.dependents?.length ? `${personalInfo.dependents.length} dependent(s)` : 'None'} 
                    />
                  </div>
                </div>
              </SectionSummary>
              
              {/* Income Summary */}
              <SectionSummary title="소득(Income)" editLink="/income">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Field label="Wages" value={formatCurrency(income.wages)} />
                    <Field label="Interest Income" value={formatCurrency(income.interestIncome)} />
                    <Field label="Dividend Income" value={formatCurrency(income.dividends)} />
                    <Field label="Business Income" value={formatCurrency(income.businessIncome)} />
                    <Field label="Capital Gains" value={formatCurrency(income.capitalGains)} />
                    <Field label="Rental Income" value={formatCurrency(income.rentalIncome)} />
                  </div>
                  <div>
                    <Field label="Retirement Income" value={formatCurrency(income.retirementIncome)} />
                    <Field label="Unemployment Income" value={formatCurrency(income.unemploymentIncome)} />
                    <Field label="Other Income" value={formatCurrency(income.otherIncome)} />
                    <Field label="Total Income" value={formatCurrency(income.totalIncome)} />
                    <Field label="Adjustments" value={formatCurrency(income.adjustments.studentLoanInterest + income.adjustments.retirementContributions + income.adjustments.otherAdjustments)} />
                    <Field label="Adjusted Gross Income" value={formatCurrency(income.adjustedGrossIncome)} className="font-semibold" />
                  </div>
                </div>
              </SectionSummary>
              
              {/* Deductions Summary */}
              <SectionSummary title="공제(Deductions)" editLink="/deductions">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Field 
                      label="Deduction Type" 
                      value={deductions.useStandardDeduction ? 'Standard Deduction' : 'Itemized Deductions'} 
                    />
                    {deductions.useStandardDeduction ? (
                      <Field label="Standard Deduction Amount" value={formatCurrency(deductions.standardDeductionAmount)} />
                    ) : (
                      <>
                        <Field label="Medical Expenses" value={formatCurrency(deductions.itemizedDeductions?.medicalExpenses || 0)} />
                        <Field label="State & Local Income Tax" value={formatCurrency(deductions.itemizedDeductions?.stateLocalIncomeTax || 0)} />
                        <Field label="Real Estate Taxes" value={formatCurrency(deductions.itemizedDeductions?.realEstateTaxes || 0)} />
                      </>
                    )}
                  </div>
                  <div>
                    {!deductions.useStandardDeduction && (
                      <>
                        <Field label="Mortgage Interest" value={formatCurrency(deductions.itemizedDeductions?.mortgageInterest || 0)} />
                        <Field label="Charitable Contributions (Cash)" value={formatCurrency(deductions.itemizedDeductions?.charitableCash || 0)} />
                        <Field label="Charitable Contributions (Non-Cash)" value={formatCurrency(deductions.itemizedDeductions?.charitableNonCash || 0)} />
                      </>
                    )}
                    <Field label="Total Deductions" value={formatCurrency(deductions.totalDeductions)} />
                  </div>
                </div>
              </SectionSummary>
              
              {/* Tax Credits Summary */}
              <SectionSummary title="세액공제(Tax Credits)" editLink="/tax-credits">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Field label="Child Tax Credit" value={formatCurrency(taxCredits.childTaxCredit)} />
                    <Field label="Child & Dependent Care Credit" value={formatCurrency(taxCredits.childDependentCareCredit)} />
                    <Field label="Education Credits" value={formatCurrency(taxCredits.educationCredits)} />
                  </div>
                  <div>
                    <Field label="Retirement Savings Credit" value={formatCurrency(taxCredits.retirementSavingsCredit)} />
                    <Field label="Other Credits" value={formatCurrency(taxCredits.otherCredits)} />
                    <Field label="Total Credits" value={formatCurrency(taxCredits.totalCredits)} />
                  </div>
                </div>
              </SectionSummary>
              
              {/* Additional Tax Summary */}
              <SectionSummary title="추가 세금(Additional Tax)" editLink="/additional-tax">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Field label="Self-Employment Income" value={formatCurrency(additionalTax.selfEmploymentIncome)} />
                    <Field label="Self-Employment Tax" value={formatCurrency(additionalTax.selfEmploymentTax)} />
                    <Field label="Other Income" value={formatCurrency(additionalTax.otherIncome)} />
                  </div>
                  <div>
                    <Field label="Other Taxes" value={formatCurrency(additionalTax.otherTaxes)} />
                    <Field label="Estimated Tax Payments" value={formatCurrency(additionalTax.estimatedTaxPayments)} />
                  </div>
                </div>
              </SectionSummary>
              
              {/* Tax Calculation Summary */}
              <div className="border border-primary rounded-lg p-6 bg-primary/5 mb-6">
                <h3 className="text-lg font-heading font-semibold text-primary-dark mb-4">세금 계산 요약(Tax Calculation Summary)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Field label="Total Income" value={formatCurrency(calculatedResults.totalIncome)} />
                    <Field label="Adjustments" value={formatCurrency(calculatedResults.adjustments)} />
                    <Field label="Adjusted Gross Income" value={formatCurrency(calculatedResults.adjustedGrossIncome)} />
                    <Field label="Deductions" value={formatCurrency(calculatedResults.deductions)} />
                    <Field label="Taxable Income" value={formatCurrency(calculatedResults.taxableIncome)} />
                  </div>
                  <div>
                    <Field label="Federal Tax" value={formatCurrency(calculatedResults.federalTax)} />
                    <Field label="Tax Credits" value={formatCurrency(calculatedResults.credits)} />
                    <Field label="Tax Due" value={formatCurrency(calculatedResults.taxDue)} />
                    <Field label="Payments & Withholding" value={formatCurrency(calculatedResults.payments)} />
                    {calculatedResults.refundAmount > 0 ? (
                      <div className="flex justify-between py-2 font-bold bg-success/10 rounded px-2 text-success">
                        <span>Refund Amount:</span>
                        <span>{formatCurrency(calculatedResults.refundAmount)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between py-2 font-bold bg-destructive/10 rounded px-2 text-destructive">
                        <span>Amount You Owe:</span>
                        <span>{formatCurrency(calculatedResults.amountOwed)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Tax Saving Advice Button */}
              <div className="border border-primary-light rounded-lg p-6 bg-primary/5 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="mb-4 md:mb-0">
                    <h3 className="text-lg font-heading font-semibold text-primary-dark mb-2">세금 절세 제안을 해드릴까요?</h3>
                    <p className="text-gray-600">
                      입력하신 정보를 분석하여 추가 공제 가능성과 세금 절약 방안을 알려드립니다.
                    </p>
                  </div>
                  <Link href="/tax-saving-advice">
                    <Button className="bg-primary text-white font-semibold rounded hover:bg-primary-dark transition duration-200 w-full md:w-auto">
                      절세 제안 보기(View Tax Saving Advice)
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between mt-10 gap-4">
                <Button
                  variant="outline"
                  className="flex items-center w-[240px] justify-center"
                  onClick={handleGeneratePdf}
                >
                  <File className="mr-2 h-4 w-4" />
                  신고서 PDF 다운로드
                </Button>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="outline"
                    className="border-primary text-primary font-semibold rounded hover:bg-primary-light hover:text-white transition duration-200 w-[240px] justify-center"
                    onClick={() => navigate('/additional-tax')}
                  >
                    이전페이지로 이동
                  </Button>
                  
                  <Button
                    className="bg-primary text-white font-semibold rounded hover:bg-primary-dark transition duration-200 w-[240px] justify-center"
                    onClick={() => setShowSubmitDialog(true)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        처리 중...(Processing...)
                      </>
                    ) : (
                      '신고서제출(Submit Tax Return)'
                    )}
                  </Button>
                  
                  <Button
                    className="bg-success text-white font-semibold rounded hover:bg-success/80 transition duration-200 w-[240px] justify-center"
                    onClick={() => navigate('/pricing')}
                  >
                    유료검토 서비스(Paid Review)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          {submitSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-success flex items-center">
                  <Check className="mr-2 h-5 w-5" />
                  세금 신고서 제출 완료(Tax Return Submitted Successfully)
                </DialogTitle>
              </DialogHeader>
              
              <Alert className="bg-success/10 border-success mt-4">
                <Check className="h-4 w-4 text-success" />
                <AlertTitle className="text-success">성공!(Success!)</AlertTitle>
                <AlertDescription>
                  2025년 세금 신고서가 성공적으로 제출되었습니다. 기록을 위해 PDF 사본을 다운로드할 수 있습니다.(Your tax return for 2025 has been submitted successfully. You can download a PDF copy for your records.)
                </AlertDescription>
              </Alert>
              
              <DialogFooter className="mt-4">
                <Button
                  variant="outline"
                  className="flex items-center"
                  onClick={handleGeneratePdf}
                >
                  <File className="mr-2 h-4 w-4" />
                  신고서 PDF 다운로드
                </Button>
                <Button onClick={() => {
                  setShowSubmitDialog(false);
                  navigate('/');
                }}>
                  홈으로 돌아가기(Return to Home)
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>세금 신고서 제출(Submit Tax Return)</DialogTitle>
                <DialogDescription>
                  2025년 세금 신고서를 제출하시겠습니까? 모든 정보가 정확한지 확인해 주세요.(Are you sure you want to submit your 2025 tax return? Please make sure all the information is correct.)
                </DialogDescription>
              </DialogHeader>
              
              <div className="bg-primary/5 p-4 rounded-md mt-4">
                <h4 className="font-semibold mb-2">요약(Summary)</h4>
                <ul className="space-y-1">
                  <li className="flex justify-between">
                    <span>조정된 총소득(Adjusted Gross Income):</span>
                    <span>{formatCurrency(calculatedResults.adjustedGrossIncome)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>과세 소득(Taxable Income):</span>
                    <span>{formatCurrency(calculatedResults.taxableIncome)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>납부할 세금(Tax Due):</span>
                    <span>{formatCurrency(calculatedResults.taxDue)}</span>
                  </li>
                  <li className="flex justify-between font-bold">
                    {calculatedResults.refundAmount > 0 ? (
                      <>
                        <span className="text-success">환급액(Refund Amount):</span>
                        <span className="text-success">{formatCurrency(calculatedResults.refundAmount)}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-destructive">납부해야 할 금액(Amount You Owe):</span>
                        <span className="text-destructive">{formatCurrency(calculatedResults.amountOwed)}</span>
                      </>
                    )}
                  </li>
                </ul>
              </div>
              
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
                  취소(Cancel)
                </Button>
                <Button onClick={handleSubmitTaxReturn} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      처리 중...(Processing...)
                    </>
                  ) : (
                    '확인 및 제출(Confirm & Submit)'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Review;
