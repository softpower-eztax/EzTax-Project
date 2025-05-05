import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useTaxContext } from '@/context/TaxContext';
import { formatCurrency } from '@/lib/taxCalculations';

interface TaxSummaryProps {
  recalculate?: () => void;
}

const TaxSummary: React.FC<TaxSummaryProps> = ({ recalculate }) => {
  const { taxData, recalculateTaxes } = useTaxContext();
  
  const handleRecalculate = () => {
    if (recalculate) {
      recalculate();
    } else {
      recalculateTaxes();
    }
  };

  // Map filing status enum to readable text
  const filingStatusMap: Record<string, string> = {
    single: "Single",
    married_joint: "Married Filing Jointly",
    married_separate: "Married Filing Separately",
    head_of_household: "Head of Household",
    qualifying_widow: "Qualifying Widow(er)"
  };

  const results = taxData.calculatedResults || {
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

  return (
    <div className="md:w-72">
      <Card className="sticky top-6">
        <CardContent className="p-4">
          <h3 className="text-lg font-heading font-semibold text-primary-dark mb-3">Tax Summary</h3>
          
          <div className="mb-4 border-b border-gray-light pb-4">
            <p className="text-sm text-gray-dark mb-1">Filing Status</p>
            <p className="font-semibold">
              {taxData.personalInfo?.filingStatus ? 
                filingStatusMap[taxData.personalInfo.filingStatus] : 
                "Not Selected"}
            </p>
          </div>
          
          <div className="mb-4 border-b border-gray-light pb-4">
            <div className="flex justify-between mb-2">
              <p className="text-sm">Income</p>
              <p className="font-semibold">{formatCurrency(results.totalIncome)}</p>
            </div>
            <div className="flex justify-between mb-2">
              <p className="text-sm">Adjustments</p>
              <p className="font-semibold text-destructive">- {formatCurrency(results.adjustments)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-sm">Adjusted Gross Income</p>
              <p className="font-semibold">{formatCurrency(results.adjustedGrossIncome)}</p>
            </div>
          </div>
          
          <div className="mb-4 border-b border-gray-light pb-4">
            <div className="flex justify-between mb-2">
              <p className="text-sm">
                {taxData.deductions?.useStandardDeduction ? 'Standard Deduction' : 'Itemized Deductions'}
              </p>
              <p className="font-semibold text-destructive">- {formatCurrency(results.deductions)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-sm">Taxable Income</p>
              <p className="font-semibold">{formatCurrency(results.taxableIncome)}</p>
            </div>
          </div>
          
          <div className="mb-4 border-b border-gray-light pb-4">
            <div className="flex justify-between mb-2">
              <p className="text-sm">Federal Tax</p>
              <p className="font-semibold">{formatCurrency(results.federalTax)}</p>
            </div>
            <div className="flex justify-between mb-2">
              <p className="text-sm">Credits</p>
              <p className="font-semibold text-destructive">- {formatCurrency(results.credits)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-sm">Tax Due</p>
              <p className="font-semibold">{formatCurrency(results.taxDue)}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <p className="text-sm">Payments & Withholding</p>
              <p className="font-semibold text-destructive">- {formatCurrency(results.payments)}</p>
            </div>
            {results.refundAmount > 0 ? (
              <div className="flex justify-between items-center bg-gray-bg p-2 rounded">
                <p className="font-semibold">Refund Amount</p>
                <p className="font-bold text-success text-xl">{formatCurrency(results.refundAmount)}</p>
              </div>
            ) : (
              <div className="flex justify-between items-center bg-gray-bg p-2 rounded">
                <p className="font-semibold">Amount You Owe</p>
                <p className="font-bold text-destructive text-xl">{formatCurrency(results.amountOwed)}</p>
              </div>
            )}
          </div>
          
          <p className="text-xs text-gray-dark italic mt-4">
            This is an estimate based on information provided so far. Final calculations may differ.
          </p>
          
          <Button
            variant="outline"
            className="w-full mt-4 text-sm border border-primary text-primary font-semibold rounded hover:bg-primary-light hover:text-white transition duration-200"
            onClick={handleRecalculate}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Recalculate
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaxSummary;
