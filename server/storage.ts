import { users, type User, type InsertUser, taxReturns, type TaxReturn, type InsertTaxReturn } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

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
      console.error('Database initialization error:', error);
    }
  }

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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getTaxReturn(id: number): Promise<TaxReturn | undefined> {
    const [taxReturn] = await db.select().from(taxReturns).where(eq(taxReturns.id, id));
    return taxReturn || undefined;
  }

  async getAllTaxReturns(): Promise<TaxReturn[]> {
    return await db.select().from(taxReturns);
  }

  async getCurrentTaxReturn(userId: number): Promise<TaxReturn | undefined> {
    const [taxReturn] = await db
      .select()
      .from(taxReturns)
      .where(eq(taxReturns.userId, userId))
      .orderBy(desc(taxReturns.updatedAt))
      .limit(1);
    return taxReturn || undefined;
  }

  async createTaxReturn(insertTaxReturn: InsertTaxReturn): Promise<TaxReturn> {
    const [taxReturn] = await db
      .insert(taxReturns)
      .values({
        ...insertTaxReturn,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();
    return taxReturn;
  }

  async updateTaxReturn(id: number, updates: Partial<TaxReturn>): Promise<TaxReturn> {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const [result] = await db
      .update(taxReturns)
      .set(updateData)
      .where(eq(taxReturns.id, id))
      .returning();
    
    if (!result) {
      throw new Error(`Tax return with ID ${id} not found`);
    }
    
    return result;
  }
  
  async deleteTaxReturn(id: number): Promise<void> {
    await db.delete(taxReturns).where(eq(taxReturns.id, id));
  }

  // Admin methods
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

// Database storage instance
export const storage = new DbStorage();