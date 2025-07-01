// Test State Tax Calculations with Sample Data
import { calculateStateTax } from './shared/stateTaxCalculator.js';

// Test case 1: New York (high-tax state) with realistic income
const nyTestInput = {
  state: 'NY',
  filingStatus: 'married_joint',
  federalAGI: 120000,
  federalTaxableIncome: 85000,
  federalItemizedDeductions: 25000,
  dependentsCount: 1,
  stateSpecificIncome: {
    stateWithholding: 3500
  }
};

console.log('=== New York State Tax Test ===');
const nyResult = calculateStateTax(nyTestInput);
console.log('Input:', nyTestInput);
console.log('Result:', JSON.stringify(nyResult, null, 2));

// Test case 2: Texas (no income tax state)
const txTestInput = {
  state: 'TX',
  filingStatus: 'single',
  federalAGI: 75000,
  federalTaxableIncome: 60000,
  dependentsCount: 0,
  stateSpecificIncome: {
    stateWithholding: 0
  }
};

console.log('\n=== Texas State Tax Test ===');
const txResult = calculateStateTax(txTestInput);
console.log('Input:', txTestInput);
console.log('Result:', JSON.stringify(txResult, null, 2));

// Test case 3: California (progressive tax state)
const caTestInput = {
  state: 'CA',
  filingStatus: 'head_of_household',
  federalAGI: 95000,
  federalTaxableIncome: 75000,
  dependentsCount: 2,
  stateSpecificIncome: {
    stateWithholding: 4200
  }
};

console.log('\n=== California State Tax Test ===');
const caResult = calculateStateTax(caTestInput);
console.log('Input:', caTestInput);
console.log('Result:', JSON.stringify(caResult, null, 2));