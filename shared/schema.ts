import { pgTable, text, serial, integer, boolean, numeric, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  googleId: text("google_id").unique(),
  displayName: text("display_name"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  googleId: true,
  displayName: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Tax Data Schema
export const taxReturns = pgTable("tax_returns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  taxYear: integer("tax_year").notNull(),
  status: text("status").notNull().default("in_progress"), // in_progress, completed, filed
  createdAt: text("created_at").notNull(), // ISO date string
  updatedAt: text("updated_at").notNull(), // ISO date string
  // Personal Information
  personalInfo: json("personal_info").$type<PersonalInformation>(),
  // Income
  income: json("income").$type<Income>(),
  // Deductions
  deductions: json("deductions").$type<Deductions>(),
  // Tax Credits
  taxCredits: json("tax_credits").$type<TaxCredits>(),
  // Additional Tax
  additionalTax: json("additional_tax").$type<AdditionalTax>(),
  // Calculated Results
  calculatedResults: json("calculated_results").$type<CalculatedResults>(),
});

export const insertTaxReturnSchema = createInsertSchema(taxReturns).omit({
  id: true,
});

export type InsertTaxReturn = z.infer<typeof insertTaxReturnSchema>;
export type TaxReturn = typeof taxReturns.$inferSelect;

// Type definitions for each section
export type FilingStatus = "single" | "married_joint" | "married_separate" | "head_of_household" | "qualifying_widow";

export interface Dependent {
  firstName: string;
  lastName: string;
  ssn: string;
  relationship: string;
  dateOfBirth: string;
  isDisabled: boolean;
  isNonresidentAlien: boolean;
}

export interface SpouseInformation {
  firstName: string;
  middleInitial?: string;
  lastName: string;
  ssn: string;
  dateOfBirth: string;
  isDisabled: boolean;
  isNonresidentAlien: boolean;
}

export interface PersonalInformation {
  firstName: string;
  middleInitial?: string;
  lastName: string;
  ssn: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  filingStatus: FilingStatus;
  isDisabled: boolean;
  isNonresidentAlien: boolean;
  spouseInfo?: SpouseInformation;
  dependents: Dependent[];
}

export interface AdditionalIncomeItem {
  type: string;
  amount: number;
  description?: string;
}

export interface AdditionalAdjustmentItem {
  type: string;
  amount: number;
  description?: string;
}

export interface Income {
  wages: number;
  otherEarnedIncome: number;
  interestIncome: number;
  dividends: number;
  businessIncome: number;
  capitalGains: number;
  rentalIncome: number;
  retirementIncome: number;
  unemploymentIncome: number;
  otherIncome: number;
  additionalIncomeItems?: AdditionalIncomeItem[];
  additionalAdjustmentItems?: AdditionalAdjustmentItem[];
  totalIncome: number;
  adjustments: {
    studentLoanInterest: number;
    retirementContributions: number;
    otherAdjustments: number;
  };
  adjustedGrossIncome: number;
}

export interface Deductions {
  useStandardDeduction: boolean;
  standardDeductionAmount: number;
  itemizedDeductions?: {
    medicalExpenses: number;
    stateLocalIncomeTax: number;
    realEstateTaxes: number;
    mortgageInterest: number;
    charitableCash: number;
    charitableNonCash: number;
  };
  totalDeductions: number;
}

export interface TaxCredits {
  childTaxCredit: number;
  childDependentCareCredit: number;
  educationCredits: number;
  retirementSavingsCredit: number;
  otherCredits: number;
  totalCredits: number;
}

export interface AdditionalTax {
  selfEmploymentIncome: number;
  selfEmploymentTax: number;
  estimatedTaxPayments: number;
  otherIncome: number;
  otherTaxes: number;
}

export interface CalculatedResults {
  totalIncome: number;
  adjustments: number;
  adjustedGrossIncome: number;
  deductions: number;
  taxableIncome: number;
  federalTax: number;
  credits: number;
  taxDue: number;
  payments: number;
  refundAmount: number;
  amountOwed: number;
}

// Zod schemas for validation
export const dependentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, "SSN must be in format XXX-XX-XXXX"),
  relationship: z.string().min(1, "Relationship is required"),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  isDisabled: z.boolean().default(false),
  isNonresidentAlien: z.boolean().default(false),
});

export const spouseInfoSchema = z.object({
  firstName: z.string().min(1, "Spouse's first name is required"),
  middleInitial: z.string().max(1).optional(),
  lastName: z.string().min(1, "Spouse's last name is required"),
  ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, "SSN must be in format XXX-XX-XXXX"),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  isDisabled: z.boolean().default(false),
  isNonresidentAlien: z.boolean().default(false),
});

export const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleInitial: z.string().max(1).optional(),
  lastName: z.string().min(1, "Last name is required"),
  ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, "SSN must be in format XXX-XX-XXXX"),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\d{3}-\d{3}-\d{4}$/, "Phone must be in format XXX-XXX-XXXX"),
  address1: z.string().min(1, "Address is required"),
  address2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().length(2, "State must be a 2-letter code"),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "ZIP code must be in format XXXXX or XXXXX-XXXX"),
  filingStatus: z.enum(["single", "married_joint", "married_separate", "head_of_household", "qualifying_widow"]),
  isDisabled: z.boolean().default(false),
  isNonresidentAlien: z.boolean().default(false),
  spouseInfo: spouseInfoSchema.optional(),
  dependents: z.array(dependentSchema).optional(),
});

export const additionalIncomeItemSchema = z.object({
  type: z.string(),
  amount: z.number().min(0),
  description: z.string().optional(),
});

export const additionalAdjustmentItemSchema = z.object({
  type: z.string(),
  amount: z.number().min(0),
  description: z.string().optional(),
});

export const incomeSchema = z.object({
  wages: z.number().min(0),
  otherEarnedIncome: z.number().min(0),
  interestIncome: z.number().min(0),
  dividends: z.number().min(0),
  businessIncome: z.number().min(0),
  capitalGains: z.number().min(0),
  rentalIncome: z.number().min(0),
  retirementIncome: z.number().min(0),
  unemploymentIncome: z.number().min(0),
  otherIncome: z.number().min(0),
  additionalIncomeItems: z.array(additionalIncomeItemSchema).optional(),
  additionalAdjustmentItems: z.array(additionalAdjustmentItemSchema).optional(),
  totalIncome: z.number().min(0),
  adjustments: z.object({
    studentLoanInterest: z.number().min(0),
    retirementContributions: z.number().min(0),
    otherAdjustments: z.number().min(0),
  }),
  adjustedGrossIncome: z.number().min(0),
});

export const deductionsSchema = z.object({
  useStandardDeduction: z.boolean(),
  standardDeductionAmount: z.number(),
  itemizedDeductions: z.object({
    medicalExpenses: z.number().min(0),
    stateLocalIncomeTax: z.number().min(0),
    realEstateTaxes: z.number().min(0), 
    mortgageInterest: z.number().min(0),
    charitableCash: z.number().min(0),
    charitableNonCash: z.number().min(0),
  }).optional(),
  totalDeductions: z.number().min(0),
});

export const taxCreditsSchema = z.object({
  childTaxCredit: z.number().min(0),
  childDependentCareCredit: z.number().min(0),
  educationCredits: z.number().min(0),
  retirementSavingsCredit: z.number().min(0),
  otherCredits: z.number().min(0),
  totalCredits: z.number().min(0),
});

export const additionalTaxSchema = z.object({
  selfEmploymentIncome: z.number().min(0),
  selfEmploymentTax: z.number().min(0),
  estimatedTaxPayments: z.number().min(0),
  otherIncome: z.number().min(0),
  otherTaxes: z.number().min(0),
});

export const calculatedResultsSchema = z.object({
  totalIncome: z.number(),
  adjustments: z.number(),
  adjustedGrossIncome: z.number(),
  deductions: z.number(),
  taxableIncome: z.number(),
  federalTax: z.number(),
  credits: z.number(),
  taxDue: z.number(),
  payments: z.number(),
  refundAmount: z.number(),
  amountOwed: z.number(),
});
