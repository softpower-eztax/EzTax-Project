import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  personalInfoSchema, 
  deductionsSchema, 
  taxCreditsSchema, 
  additionalTaxSchema, 
  calculatedResultsSchema,
  insertTaxReturnSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get current tax return (always gets the most recent one)
  app.get("/api/tax-return", async (req, res) => {
    try {
      const taxReturn = await storage.getCurrentTaxReturn();
      if (!taxReturn) {
        // Return a test tax return with dummy data
        const testTaxReturn = {
          id: 1,
          userId: 1,
          taxYear: new Date().getFullYear() - 1, // Default to previous year
          status: "in_progress",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          personalInfo: {
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
          },
          income: {
            wages: 75000,
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
            adjustedGrossIncome: 100200
          },
          deductions: {
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
          },
          taxCredits: {
            childTaxCredit: 2000,
            childDependentCareCredit: 1000,
            educationCredits: 1500,
            retirementSavingsCredit: 500,
            otherCredits: 200,
            totalCredits: 5200
          },
          additionalTax: {
            selfEmploymentIncome: 15000,
            selfEmploymentTax: 2120,
            estimatedTaxPayments: 5000,
            otherIncome: 1500,
            otherTaxes: 800
          },
          calculatedResults: {
            totalIncome: 129700,
            adjustments: 14060,
            adjustedGrossIncome: 115640,
            deductions: 35000,
            taxableIncome: 80640,
            federalTax: 9082.80,
            credits: 5200,
            taxDue: 6802.80,
            payments: 24455,
            refundAmount: 17652.20,
            amountOwed: 0
          }
        };
        
        res.json(testTaxReturn);
      } else {
        // Return test data instead of actual data for testing
        const testTaxReturn = {
          ...taxReturn,
          personalInfo: {
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
          },
          income: {
            wages: 75000,
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
            adjustedGrossIncome: 100200
          },
          deductions: {
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
          },
          taxCredits: {
            childTaxCredit: 2000,
            childDependentCareCredit: 1000,
            educationCredits: 1500,
            retirementSavingsCredit: 500,
            otherCredits: 200,
            totalCredits: 5200
          },
          additionalTax: {
            selfEmploymentIncome: 15000,
            selfEmploymentTax: 2120,
            estimatedTaxPayments: 5000,
            otherIncome: 1500,
            otherTaxes: 800
          },
          calculatedResults: {
            totalIncome: 129700,
            adjustments: 14060,
            adjustedGrossIncome: 115640,
            deductions: 35000,
            taxableIncome: 80640,
            federalTax: 9082.80,
            credits: 5200,
            taxDue: 6802.80,
            payments: 24455,
            refundAmount: 17652.20,
            amountOwed: 0
          }
        };
        
        res.json(testTaxReturn);
      }
    } catch (error) {
      console.error("Error getting tax return:", error);
      res.status(500).json({ message: "Error retrieving tax return" });
    }
  });

  // Get specific tax return by ID
  app.get("/api/tax-return/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const taxReturn = await storage.getTaxReturn(id);
      if (!taxReturn) {
        return res.status(404).json({ message: "Tax return not found" });
      }

      res.json(taxReturn);
    } catch (error) {
      console.error("Error getting tax return:", error);
      res.status(500).json({ message: "Error retrieving tax return" });
    }
  });

  // Create a new tax return
  app.post("/api/tax-return", async (req, res) => {
    try {
      // Validate the request body against the schema
      const parsedData = insertTaxReturnSchema.parse(req.body);
      
      // Create the tax return
      const newTaxReturn = await storage.createTaxReturn(parsedData);
      
      res.status(201).json(newTaxReturn);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      console.error("Error creating tax return:", error);
      res.status(500).json({ message: "Error creating tax return" });
    }
  });

  // Update an existing tax return
  app.put("/api/tax-return/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      // Validate the request body against the schema
      const parsedData = insertTaxReturnSchema.parse(req.body);
      
      // Check if the tax return exists
      const existingTaxReturn = await storage.getTaxReturn(id);
      if (!existingTaxReturn) {
        return res.status(404).json({ message: "Tax return not found" });
      }

      // Update the tax return
      const updatedTaxReturn = await storage.updateTaxReturn(id, parsedData);
      
      res.json(updatedTaxReturn);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      console.error("Error updating tax return:", error);
      res.status(500).json({ message: "Error updating tax return" });
    }
  });

  // Delete a tax return
  app.delete("/api/tax-return/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      // Check if the tax return exists
      const existingTaxReturn = await storage.getTaxReturn(id);
      if (!existingTaxReturn) {
        return res.status(404).json({ message: "Tax return not found" });
      }

      // Delete the tax return
      await storage.deleteTaxReturn(id);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tax return:", error);
      res.status(500).json({ message: "Error deleting tax return" });
    }
  });

  // Submit a tax return (mark as completed)
  app.post("/api/tax-return/:id/submit", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      // Check if the tax return exists
      const existingTaxReturn = await storage.getTaxReturn(id);
      if (!existingTaxReturn) {
        return res.status(404).json({ message: "Tax return not found" });
      }

      // Update the status to completed
      const updatedTaxReturn = await storage.updateTaxReturn(id, {
        ...existingTaxReturn,
        status: "completed",
        updatedAt: new Date().toISOString()
      });
      
      res.json(updatedTaxReturn);
    } catch (error) {
      console.error("Error submitting tax return:", error);
      res.status(500).json({ message: "Error submitting tax return" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
