import { users, type User, type InsertUser, taxReturns, type TaxReturn, type InsertTaxReturn } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(userId: number): Promise<void>;
  updateUser(userId: number, updates: Partial<User>): Promise<User>;
  updateUserPassword(userId: number, newPassword: string): Promise<void>;
  
  // Tax return methods
  getTaxReturn(id: number): Promise<TaxReturn | undefined>;
  getAllTaxReturns(): Promise<TaxReturn[]>;
  getCurrentTaxReturn(userId: number): Promise<TaxReturn | undefined>;
  createTaxReturn(taxReturn: InsertTaxReturn): Promise<TaxReturn>;
  updateTaxReturn(id: number, taxReturn: Partial<TaxReturn>): Promise<TaxReturn>;
  deleteTaxReturn(id: number): Promise<void>;
  deleteUserTaxReturns(userId: number): Promise<void>;
}

export class DbStorage implements IStorage {
  constructor() {
    // Initialize default data if database is empty
    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    try {
      const existingUsers = await db.select().from(users);
      if (existingUsers.length === 0) {
        // Create default user
        await db.insert(users).values({
          username: "default",
          password: "password",
          email: null,
          googleId: null,
          displayName: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to initialize default data:', error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.googleId, googleId));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      ...insertUser,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  // Tax return methods
  async getTaxReturn(id: number): Promise<TaxReturn | undefined> {
    const result = await db.select().from(taxReturns).where(eq(taxReturns.id, id));
    return result[0];
  }
  
  async getAllTaxReturns(): Promise<TaxReturn[]> {
    return await db.select().from(taxReturns);
  }
  
  async getCurrentTaxReturn(userId: number): Promise<TaxReturn | undefined> {
    const result = await db.select().from(taxReturns)
      .where(eq(taxReturns.userId, userId))
      .orderBy(desc(taxReturns.updatedAt))
      .limit(1);
    return result[0];
  }
  
  async createTaxReturn(insertTaxReturn: InsertTaxReturn): Promise<TaxReturn> {
    const result = await db.insert(taxReturns).values({
      ...insertTaxReturn,
      createdAt: insertTaxReturn.createdAt || new Date().toISOString(),
      updatedAt: insertTaxReturn.updatedAt || new Date().toISOString()
    }).returning();
    return result[0];
  }
  
  async updateTaxReturn(id: number, taxReturnUpdate: Partial<TaxReturn>): Promise<TaxReturn> {
    const result = await db.update(taxReturns)
      .set({
        ...taxReturnUpdate,
        updatedAt: new Date().toISOString()
      })
      .where(eq(taxReturns.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error(`Tax return with ID ${id} not found`);
    }
    
    return result[0];
  }
  
  async deleteTaxReturn(id: number): Promise<void> {
    await db.delete(taxReturns).where(eq(taxReturns.id, id));
  }

  // 관리자 전용 메서드들
  async deleteUser(userId: number): Promise<void> {
    const result = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning({ id: users.id });
    
    if (!result || result.length === 0) {
      throw new Error(`사용자 ID ${userId}를 찾을 수 없습니다`);
    }
  }

  async updateUser(userId: number, updates: Partial<User>): Promise<User> {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`사용자 ID ${userId}를 찾을 수 없습니다`);
    }
    
    return updatedUser;
  }

  async updateUserPassword(userId: number, newPassword: string): Promise<void> {
    const crypto = await import('crypto');
    const hashedPassword = crypto.scryptSync(newPassword, 'salt', 64).toString('hex');
    
    const result = await db
      .update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date().toISOString()
      })
      .where(eq(users.id, userId))
      .returning({ id: users.id });
    
    if (!result || result.length === 0) {
      throw new Error(`사용자 ID ${userId}를 찾을 수 없습니다`);
    }
  }

  async deleteUserTaxReturns(userId: number): Promise<void> {
    await db
      .delete(taxReturns)
      .where(eq(taxReturns.userId, userId));
  }
}

// 데이터베이스 기반 저장소 구현
export class DatabaseStorage implements IStorage {
  // 사용자 메서드
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
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
    // 먼저 기존 데이터를 가져옴
    const existingTaxReturn = await this.getTaxReturn(id);
    if (!existingTaxReturn) {
      throw new Error(`세금 신고서 ID ${id}를 찾을 수 없습니다`);
    }
    
    // 중첩 객체들을 위한 깊은 병합을 수행
    const updateData: Partial<TaxReturn> = {
      ...taxReturnUpdate, 
      updatedAt: new Date().toISOString()
    };
    
    // 세금 공제 정보 병합
    if (existingTaxReturn.taxCredits && taxReturnUpdate.taxCredits) {
      updateData.taxCredits = {
        ...existingTaxReturn.taxCredits,
        ...taxReturnUpdate.taxCredits
      };
    }
    
    // 공제 정보 병합
    if (existingTaxReturn.deductions && taxReturnUpdate.deductions) {
      // 표준 공제 사용 여부는 덮어쓰기
      const useStandardDeduction = taxReturnUpdate.deductions.useStandardDeduction !== undefined
        ? taxReturnUpdate.deductions.useStandardDeduction
        : existingTaxReturn.deductions.useStandardDeduction;
        
      updateData.deductions = {
        ...existingTaxReturn.deductions,
        ...taxReturnUpdate.deductions,
        useStandardDeduction
      };
      
      // 항목별 공제 데이터 병합 (있는 경우)
      if (existingTaxReturn.deductions.itemizedDeductions && 
          taxReturnUpdate.deductions.itemizedDeductions) {
        updateData.deductions.itemizedDeductions = {
          ...existingTaxReturn.deductions.itemizedDeductions,
          ...taxReturnUpdate.deductions.itemizedDeductions
        };
      }
    }
    
    // 수입 정보 병합
    if (existingTaxReturn.income && taxReturnUpdate.income) {
      updateData.income = {
        ...existingTaxReturn.income,
        ...taxReturnUpdate.income
      };
      
      // 수입 조정 정보 병합 (있는 경우)
      if (existingTaxReturn.income.adjustments && 
          taxReturnUpdate.income.adjustments) {
        updateData.income.adjustments = {
          ...existingTaxReturn.income.adjustments,
          ...taxReturnUpdate.income.adjustments
        };
      }
    }
    
    // 추가 세금 정보 병합
    if (existingTaxReturn.additionalTax && taxReturnUpdate.additionalTax) {
      updateData.additionalTax = {
        ...existingTaxReturn.additionalTax,
        ...taxReturnUpdate.additionalTax
      };
    }
    
    // 계산 결과 병합
    if (existingTaxReturn.calculatedResults && taxReturnUpdate.calculatedResults) {
      updateData.calculatedResults = {
        ...existingTaxReturn.calculatedResults,
        ...taxReturnUpdate.calculatedResults
      };
    }
    
    // 업데이트 실행
    const [updatedTaxReturn] = await db
      .update(taxReturns)
      .set(updateData)
      .where(eq(taxReturns.id, id))
      .returning();
    
    if (!updatedTaxReturn) {
      throw new Error(`업데이트 후 세금 신고서 ID ${id}를 찾을 수 없습니다`);
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

  // 관리자 전용 메서드들
  async deleteUser(userId: number): Promise<void> {
    const result = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning({ id: users.id });
    
    if (!result || result.length === 0) {
      throw new Error(`사용자 ID ${userId}를 찾을 수 없습니다`);
    }
  }

  async updateUser(userId: number, updates: Partial<User>): Promise<User> {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`사용자 ID ${userId}를 찾을 수 없습니다`);
    }
    
    return updatedUser;
  }

  async updateUserPassword(userId: number, newPassword: string): Promise<void> {
    const crypto = await import('crypto');
    const hashedPassword = crypto.scryptSync(newPassword, 'salt', 64).toString('hex');
    
    const result = await db
      .update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date().toISOString()
      })
      .where(eq(users.id, userId))
      .returning({ id: users.id });
    
    if (!result || result.length === 0) {
      throw new Error(`사용자 ID ${userId}를 찾을 수 없습니다`);
    }
  }

  async deleteUserTaxReturns(userId: number): Promise<void> {
    await db
      .delete(taxReturns)
      .where(eq(taxReturns.userId, userId));
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
          firstName: "John",
          middleInitial: "A",
          lastName: "Smith",
          ssn: "123-45-6789",
          dateOfBirth: "1980-01-15",
          email: "john.smith@example.com",
          phone: "123-456-7890",
          address1: "123 Main Street",
          address2: "Apt 4B",
          city: "Springfield",
          state: "IL",
          zipCode: "62704",
          filingStatus: "married_joint",
          spouseInfo: {
            firstName: "Jane",
            middleInitial: "B",
            lastName: "Smith",
            ssn: "987-65-4321",
            dateOfBirth: "1982-05-20"
          },
          dependents: [
            {
              firstName: "Tommy",
              lastName: "Smith",
              ssn: "111-22-3333",
              relationship: "Son",
              dateOfBirth: "2010-03-12"
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
      });
    }
  }
}

// 데이터베이스 스토리지 사용
// 데이터베이스 연결 문제로 인해 메모리 스토리지 사용
export const storage = new DbStorage();
