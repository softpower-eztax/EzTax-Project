import { users, type User, type InsertUser, taxReturns, type TaxReturn, type InsertTaxReturn } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

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

// 데이터베이스 기반 저장소 구현
export class DatabaseStorage implements IStorage {
  // 사용자 메서드
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        // These will use the default values from the schema
      })
      .returning();
    return user;
  }

  // 세금 신고서 메서드
  async getTaxReturn(id: number): Promise<TaxReturn | undefined> {
    const [taxReturn] = await db.select().from(taxReturns).where(eq(taxReturns.id, id));
    return taxReturn || undefined;
  }

  async getAllTaxReturns(): Promise<TaxReturn[]> {
    return await db.select().from(taxReturns);
  }

  async getCurrentTaxReturn(): Promise<TaxReturn | undefined> {
    const [taxReturn] = await db
      .select()
      .from(taxReturns)
      .orderBy(desc(taxReturns.updatedAt))
      .limit(1);
    return taxReturn || undefined;
  }

  async createTaxReturn(insertTaxReturn: InsertTaxReturn): Promise<TaxReturn> {
    // Make sure status is specified
    const valuesWithStatus = {
      ...insertTaxReturn,
      status: insertTaxReturn.status || "in_progress",
      createdAt: insertTaxReturn.createdAt || new Date().toISOString(),
      updatedAt: insertTaxReturn.updatedAt || new Date().toISOString()
    };
    
    const [taxReturn] = await db
      .insert(taxReturns)
      .values(valuesWithStatus)
      .returning();
    return taxReturn;
  }

  async updateTaxReturn(id: number, taxReturnUpdate: Partial<TaxReturn>): Promise<TaxReturn> {
    const [updatedTaxReturn] = await db
      .update(taxReturns)
      .set({
        ...taxReturnUpdate,
        updatedAt: new Date().toISOString()
      })
      .where(eq(taxReturns.id, id))
      .returning();
    
    if (!updatedTaxReturn) {
      throw new Error(`세금 신고서 ID ${id}를 찾을 수 없습니다`);
    }
    
    return updatedTaxReturn;
  }

  async deleteTaxReturn(id: number): Promise<void> {
    const result = await db
      .delete(taxReturns)
      .where(eq(taxReturns.id, id))
      .returning({ id: taxReturns.id });
    
    if (!result || result.length === 0) {
      throw new Error(`세금 신고서 ID ${id}를 찾을 수 없습니다`);
    }
  }

  // 데이터베이스 초기화 메서드
  async initialize(): Promise<void> {
    // 사용자 테이블이 비어있는지 확인
    const userCount = await db.select().from(users).limit(1);
    
    if (userCount.length === 0) {
      console.log("데이터베이스 초기화: 기본 사용자 및 샘플 세금 신고서 생성");
      
      // 기본 사용자 생성
      const user = await this.createUser({
        username: "default",
        password: "password",
        email: "default@example.com"
      });
      
      // 기본 세금 신고서 생성
      await this.createTaxReturn({
        userId: user.id,
        taxYear: new Date().getFullYear() - 1,
        status: "in_progress",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        personalInfo: {
          firstName: "",
          lastName: "",
          ssn: "",
          dateOfBirth: "",
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
  }
}

// 데이터베이스 스토리지 사용
export const storage = new DatabaseStorage();
