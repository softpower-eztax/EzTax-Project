import type { PersonalInformation, Income, Deductions, TaxCredits, AdditionalTax, CalculatedResults } from "@shared/schema";

export interface TaxData {
  taxYear: number;
  status: 'in_progress' | 'completed' | 'filed';
  createdAt: string;
  updatedAt: string;
  personalInfo?: PersonalInformation;
  income?: Income;
  deductions?: Deductions;
  taxCredits?: TaxCredits;
  additionalTax?: AdditionalTax;
  calculatedResults: CalculatedResults;
}

// Re-export types from shared schema for convenience
export type { 
  PersonalInformation, 
  Income, 
  Deductions, 
  TaxCredits, 
  AdditionalTax, 
  CalculatedResults,
  FilingStatus,
  Dependent,
  SpouseInformation
} from "@shared/schema";