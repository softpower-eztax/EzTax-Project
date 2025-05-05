import { users, type User, type InsertUser, taxReturns, type TaxReturn, type InsertTaxReturn } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Tax return methods
  getTaxReturn(id: number): Promise<TaxReturn | undefined>;
  getAllTaxReturns(): Promise<TaxReturn[]>;
  getCurrentTaxReturn(): Promise<TaxReturn | undefined>;
  createTaxReturn(taxReturn: InsertTaxReturn): Promise<TaxReturn>;
  updateTaxReturn(id: number, taxReturn: Partial<TaxReturn>): Promise<TaxReturn>;
  deleteTaxReturn(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private taxReturns: Map<number, TaxReturn>;
  private userIdCounter: number;
  private taxReturnIdCounter: number;

  constructor() {
    this.users = new Map();
    this.taxReturns = new Map();
    this.userIdCounter = 1;
    this.taxReturnIdCounter = 1;
    
    // Create default user
    this.createUser({
      username: "default",
      password: "password"
    });
    
    // Create a sample tax return
    this.createTaxReturn({
      userId: 1,
      taxYear: new Date().getFullYear() - 1,
      status: "in_progress",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      personalInfo: {
        firstName: "",
        lastName: "",
        ssn: "",
        dateOfBirth: "",
        occupation: "",
        email: "",
        phone: "",
        address1: "",
        city: "",
        state: "",
        zipCode: "",
        filingStatus: "single",
        dependents: []
      },
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
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Tax return methods
  async getTaxReturn(id: number): Promise<TaxReturn | undefined> {
    return this.taxReturns.get(id);
  }
  
  async getAllTaxReturns(): Promise<TaxReturn[]> {
    return Array.from(this.taxReturns.values());
  }
  
  async getCurrentTaxReturn(): Promise<TaxReturn | undefined> {
    // Get the most recent tax return
    const allReturns = Array.from(this.taxReturns.values());
    return allReturns.sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    })[0];
  }
  
  async createTaxReturn(insertTaxReturn: InsertTaxReturn): Promise<TaxReturn> {
    const id = this.taxReturnIdCounter++;
    const taxReturn: TaxReturn = { 
      ...insertTaxReturn, 
      id,
      // Ensure the date strings are properly formatted
      createdAt: insertTaxReturn.createdAt || new Date().toISOString(),
      updatedAt: insertTaxReturn.updatedAt || new Date().toISOString()
    };
    this.taxReturns.set(id, taxReturn);
    return taxReturn;
  }
  
  async updateTaxReturn(id: number, taxReturnUpdate: Partial<TaxReturn>): Promise<TaxReturn> {
    const existingTaxReturn = this.taxReturns.get(id);
    if (!existingTaxReturn) {
      throw new Error(`Tax return with ID ${id} not found`);
    }
    
    const updatedTaxReturn: TaxReturn = {
      ...existingTaxReturn,
      ...taxReturnUpdate,
      updatedAt: new Date().toISOString()
    };
    
    this.taxReturns.set(id, updatedTaxReturn);
    return updatedTaxReturn;
  }
  
  async deleteTaxReturn(id: number): Promise<void> {
    this.taxReturns.delete(id);
  }
}

export const storage = new MemStorage();
