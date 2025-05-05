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
        // Return a new empty tax return if none exists
        const newTaxReturn = {
          taxYear: new Date().getFullYear() - 1, // Default to previous year
          status: "in_progress",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          calculatedResults: {
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
          }
        };
        
        res.json(newTaxReturn);
      } else {
        res.json(taxReturn);
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
