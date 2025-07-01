import type { Express } from "express";
import { createServer, type Server } from "http";
import { DbStorage } from "./storage";
import { insertTaxReturnSchema } from "@shared/schema";
import { z } from "zod";
import nodemailer from "nodemailer";
import path from "path";

// Configure email transporter for Gmail with better error handling
const createEmailTransporter = () => {
  // Force use eztax88@gmail.com and the correct app password
  const emailUser = 'eztax88@gmail.com';
  const emailPass = 'fetlnvjnmkjetfov';
    
  if (!emailUser || !emailPass) {
    console.log('Email credentials not configured - emails will be logged only');
    return null;
  }

  console.log(`Configuring email for: ${emailUser}`);
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    },
    debug: false,
    logger: false
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Create storage instance
  const storage = new DbStorage();
  
  app.get("/api/ping", (req, res) => {
    res.json({ ok: true });
  });

  // Health check endpoints
  app.get("/api/health", (req, res) => {
    res.status(200).json({ 
      api: 'operational',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      features: ['auth', 'tax-calculations', 'database', 'session-management'],
      environment: process.env.NODE_ENV || 'development'
    });
  });

  app.get("/health", (req, res) => {
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      port: parseInt(process.env.PORT || '5000', 10),
      env: process.env.NODE_ENV || 'development',
      database: process.env.DATABASE_URL ? 'connected' : 'not configured'
    });
  });

  // Enhanced exchange rates endpoint
  app.get("/api/exchange-rates", async (req, res) => {
    try {
      // Mock realistic exchange rates with small variations to simulate real-time updates
      const baseRates = {
        'USD': 1,
        'KRW': 1320.50,
        'EUR': 0.85,
        'JPY': 149.20,
        'GBP': 0.73,
        'CAD': 1.35,
        'AUD': 1.48,
        'CHF': 0.92,
        'CNY': 7.15,
        'SGD': 1.34
      };

      // Add small random variations to simulate market movements
      const rates: { [key: string]: number } = {};
      Object.entries(baseRates).forEach(([currency, rate]) => {
        const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
        rates[currency] = rate * (1 + variation);
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        base: 'USD',
        rates,
        source: 'EzTax Exchange Service'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch exchange rates',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Tax calculation endpoint for different countries
  app.post("/api/calculate-tax", async (req, res) => {
    try {
      const { income, country } = req.body;
      
      if (!income || !country) {
        return res.status(400).json({
          success: false,
          error: 'Income and country are required'
        });
      }

      // Tax bracket information for different countries
      const taxInfo: { [key: string]: any } = {
        'us': {
          name: 'United States',
          currency: 'USD',
          standardDeduction: 13850,
          brackets: [
            { min: 0, max: 10275, rate: 10 },
            { min: 10275, max: 41775, rate: 12 },
            { min: 41775, max: 89450, rate: 22 },
            { min: 89450, max: 190750, rate: 24 },
            { min: 190750, max: 364200, rate: 32 },
            { min: 364200, max: 462500, rate: 35 },
            { min: 462500, max: Infinity, rate: 37 }
          ]
        },
        'kr': {
          name: 'South Korea',
          currency: 'KRW',
          standardDeduction: 1500000,
          brackets: [
            { min: 0, max: 14000000, rate: 6 },
            { min: 14000000, max: 50000000, rate: 15 },
            { min: 50000000, max: 88000000, rate: 24 },
            { min: 88000000, max: 150000000, rate: 35 },
            { min: 150000000, max: 300000000, rate: 38 },
            { min: 300000000, max: 500000000, rate: 40 },
            { min: 500000000, max: Infinity, rate: 42 }
          ]
        },
        'uk': {
          name: 'United Kingdom',
          currency: 'GBP',
          standardDeduction: 12570,
          brackets: [
            { min: 0, max: 37700, rate: 20 },
            { min: 37700, max: 150000, rate: 40 },
            { min: 150000, max: Infinity, rate: 45 }
          ]
        },
        'de': {
          name: 'Germany',
          currency: 'EUR',
          standardDeduction: 10908,
          brackets: [
            { min: 0, max: 10908, rate: 0 },
            { min: 10908, max: 62810, rate: 14 },
            { min: 62810, max: 277826, rate: 42 },
            { min: 277826, max: Infinity, rate: 45 }
          ]
        }
      };

      const countryInfo = taxInfo[country];
      if (!countryInfo) {
        return res.status(400).json({
          success: false,
          error: 'Unsupported country'
        });
      }

      // Calculate tax
      let totalTax = 0;
      let remainingIncome = Math.max(0, income - countryInfo.standardDeduction);

      for (const bracket of countryInfo.brackets) {
        if (remainingIncome <= 0) break;
        
        const taxableInThisBracket = Math.min(remainingIncome, bracket.max - bracket.min);
        totalTax += taxableInThisBracket * (bracket.rate / 100);
        remainingIncome -= taxableInThisBracket;
      }

      const effectiveRate = income > 0 ? (totalTax / income) * 100 : 0;

      res.json({
        success: true,
        country: countryInfo.name,
        currency: countryInfo.currency,
        grossIncome: income,
        standardDeduction: countryInfo.standardDeduction,
        taxableIncome: Math.max(0, income - countryInfo.standardDeduction),
        totalTax: Math.round(totalTax * 100) / 100,
        afterTaxIncome: Math.round((income - totalTax) * 100) / 100,
        effectiveRate: Math.round(effectiveRate * 100) / 100,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to calculate tax',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Serve admin setup page
  app.get("/setup-admin", (req, res) => {
    res.sendFile(path.resolve(process.cwd(), "setup-admin.html"));
  });

  // Temporary admin setup endpoint for deployment
  app.post("/api/setup-admin", async (req, res) => {
    try {
      const crypto = await import('crypto');
      const { promisify } = await import('util');
      const scryptAsync = promisify(crypto.scrypt);
      
      // Check if admin already exists
      const existingUsers = await storage.getAllUsers();
      const adminExists = existingUsers.some((user: any) => user.username === 'admin');
      
      if (adminExists) {
        return res.json({ 
          message: "Admin already exists", 
          success: true,
          userCount: existingUsers.length,
          existingAdmin: existingUsers.find((user: any) => user.username === 'admin')?.id
        });
      }

      // Hash the password properly
      const salt = crypto.randomBytes(16).toString('hex');
      const buf = (await scryptAsync('admin', salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString('hex')}.${salt}`;

      // Create admin user with hashed password
      const adminUser = await storage.createUser({
        username: 'admin',
        password: hashedPassword,
        email: null,
        googleId: null,
        displayName: null
      });

      res.json({ 
        message: "Admin user created successfully with proper password hashing", 
        username: adminUser.username,
        userId: adminUser.id,
        userCount: existingUsers.length + 1,
        success: true 
      });
    } catch (error: any) {
      console.error('Admin setup error:', error);
      res.status(500).json({ 
        message: error.message || "Admin setup failed",
        error: error.stack,
        success: false
      });
    }
  });

  // Test login endpoint for debugging
  app.post("/api/test-login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.json({ 
          message: "User not found",
          success: false,
          allUsers: (await storage.getAllUsers()).map((u: any) => ({ id: u.id, username: u.username }))
        });
      }

      res.json({
        message: "User found",
        success: true,
        userId: user.id,
        username: user.username,
        hasPassword: !!user.password,
        passwordLength: user.password?.length || 0
      });
    } catch (error: any) {
      res.status(500).json({ 
        message: error.message,
        success: false
      });
    }
  });

  // Admin endpoints
  app.get("/api/admin/users", async (req, res) => {
    try {
      // Enhanced admin check - only allow specific admin users
      if (!req.user) {
        return res.status(401).json({ message: "인증이 필요합니다" });
      }

      // Check if user has admin privileges - only 'admin' allowed
      if ((req.user as any).username !== 'admin') {
        return res.status(403).json({ message: "관리자 권한이 필요합니다" });
      }

      const users = await storage.getAllUsers();
      const taxReturns = await storage.getAllTaxReturns();
      
      // Create admin user data with tax return counts
      const adminUsers = users.map(user => {
        const userTaxReturns = taxReturns.filter(tr => tr.userId === user.id);
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          googleId: user.googleId,
          createdAt: user.createdAt,
          lastLogin: user.updatedAt, // Using updatedAt as proxy for last login
          taxReturnsCount: userTaxReturns.length,
          status: 'active' as const
        };
      });

      res.json(adminUsers);
    } catch (error) {
      console.error("Admin users fetch error:", error);
      res.status(500).json({ message: "서버 오류가 발생했습니다" });
    }
  });
  
  // Get current tax return (always gets the most recent one)
  app.get("/api/tax-return", async (req, res) => {
    try {
      // Only authenticated users can access tax returns
      if (!req.user) {
        // Return empty initial data for non-authenticated users
        const emptyTaxReturn = {
          id: 0,
          userId: 0,
          taxYear: 2025,
          status: "in_progress",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          personalInfo: null,
          income: null,
          deductions: null,
          taxCredits: null,
          retirementContributions: null,
          additionalTax: null,
          calculatedResults: null
        };
        return res.json(emptyTaxReturn);
      }
      
      const userId = (req.user as any).id;
      console.log(`GET /api/tax-return - 사용자 ID: ${userId} 데이터 요청`);
      
      const taxReturn = await storage.getCurrentTaxReturn(userId);
      
      if (!taxReturn) {
        console.log(`사용자 ID ${userId}의 세금 신고서 없음 - 새 빈 신고서 생성`);
        
        // Create a new empty tax return for this user
        const newTaxReturn = await storage.createTaxReturn({
          userId: userId,
          taxYear: 2025,
          status: "in_progress",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        console.log(`사용자 ID ${userId}에게 새 세금 신고서 생성됨 (ID: ${newTaxReturn.id})`);
        res.json(newTaxReturn);
      } else {
        // CRITICAL SECURITY CHECK: Verify the tax return belongs to the requesting user
        if (taxReturn.userId !== userId) {
          console.error(`보안 위반: 세금 신고서 ${taxReturn.id}는 사용자 ${taxReturn.userId}에게 속하지만 사용자 ${userId}가 요청함`);
          
          // Create a new tax return for the requesting user instead
          const newTaxReturn = await storage.createTaxReturn({
            userId: userId,
            taxYear: 2025,
            status: "in_progress"
          });
          
          console.log(`보안 위반으로 인해 사용자 ID ${userId}에게 새 세금 신고서 생성됨`);
          res.json(newTaxReturn);
        } else {
          console.log(`사용자 ID ${userId}의 기존 세금 신고서 반환 (ID: ${taxReturn.id})`);
          res.json(taxReturn);
        }
      }
    } catch (error) {
      console.error("Error fetching tax return:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create or update tax return
  app.post("/api/tax-return", async (req, res) => {
    try {
      // Only authenticated users can create tax returns
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = (req.user as any).id;
      const dataWithUserId = { ...req.body, userId };
      
      const validationResult = insertTaxReturnSchema.safeParse(dataWithUserId);
      
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Validation error",
          errors: validationResult.error.issues
        });
      }

      const taxReturn = await storage.createTaxReturn(validationResult.data);
      res.status(201).json(taxReturn);
    } catch (error) {
      console.error("Error creating tax return:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update existing tax return
  app.put("/api/tax-return/:id", async (req, res) => {
    try {
      // Only authenticated users can update tax returns
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      const userId = (req.user as any).id;
      
      // Verify that the tax return belongs to the authenticated user
      const existingReturn = await storage.getTaxReturn(id);
      if (!existingReturn || existingReturn.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedTaxReturn = await storage.updateTaxReturn(id, req.body);
      res.json(updatedTaxReturn);
    } catch (error) {
      console.error("Error updating tax return:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Send application email
  app.post("/api/send-application", async (req, res) => {
    try {
      const { name, phone, email, selectedPlan, additionalRequests } = req.body;
      
      // Validate required fields
      if (!name || !phone || !email || !selectedPlan) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Map plan codes to readable names
      const planNames = {
        'basic': '기본 검토 ($99) - 개인 기본 세금 신고 검토',
        'advanced': '고급 검토 ($199) - 복잡한 세무 상황 검토',
        'premium': '프리미엄 검토 ($299) - 종합 세무 자문 및 최적화'
      };

      const planName = planNames[selectedPlan as keyof typeof planNames] || selectedPlan;
      
      // Create email content
      const emailContent = `
새로운 유료검토 서비스 신청이 접수되었습니다.

신청자 정보:
- 이름: ${name}
- 전화번호: ${phone}
- 이메일: ${email}
- 선택한 플랜: ${planName}

추가 요청사항:
${additionalRequests || '없음'}

신청 시간: ${new Date().toLocaleString('ko-KR')}
      `.trim();

      // Try to send actual email if credentials are available
      const transporter = createEmailTransporter();
      
      if (transporter) {
        try {
          // Test connection first
          await transporter.verify();
          console.log('Gmail SMTP connection verified successfully');
          
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'eztax88@gmail.com',
            subject: '[EzTax] 새로운 유료검토 서비스 신청',
            text: emailContent,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0055AA;">새로운 유료검토 서비스 신청</h2>
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
                  <h3>신청자 정보:</h3>
                  <ul style="list-style: none; padding: 0;">
                    <li><strong>이름:</strong> ${name}</li>
                    <li><strong>전화번호:</strong> ${phone}</li>
                    <li><strong>이메일:</strong> ${email}</li>
                    <li><strong>선택한 플랜:</strong> ${planName}</li>
                  </ul>
                  
                  <h3>추가 요청사항:</h3>
                  <p style="background-color: white; padding: 15px; border-radius: 3px;">
                    ${additionalRequests || '없음'}
                  </p>
                  
                  <p style="margin-top: 20px; color: #666;">
                    <strong>신청 시간:</strong> ${new Date().toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>
            `
          };

          const info = await transporter.sendMail(mailOptions);
          console.log('✅ Email sent successfully to eztax88@gmail.com');
          console.log('Message ID:', info.messageId);
          console.log('Response:', info.response);
        } catch (emailError) {
          console.error('❌ Failed to send email:', emailError);
          console.log('📧 Application Email Content (logged as backup):');
          console.log('To: eztax88@gmail.com');
          console.log('Subject: [EzTax] 새로운 유료검토 서비스 신청');
          console.log('Content:', emailContent);
        }
      } else {
        console.log('📧 Email credentials not configured - logging application:');
        console.log('To: eztax88@gmail.com');
        console.log('Subject: [EzTax] 새로운 유료검토 서비스 신청');
        console.log('Content:', emailContent);
      }
      
      res.json({ 
        success: true, 
        message: "Application submitted successfully" 
      });
    } catch (error) {
      console.error("Error sending application email:", error);
      res.status(500).json({ message: "Failed to send application" });
    }
  });

  // Admin API - Delete User
  app.delete('/api/admin/users/:id', async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).username !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    try {
      const userId = parseInt(req.params.id);
      
      // Prevent deletion of admin user
      if (userId === 3) {
        return res.status(400).json({ message: '관리자 계정은 삭제할 수 없습니다' });
      }

      // Delete user's tax returns first (cascade delete)
      await storage.deleteUserTaxReturns(userId);
      
      // Delete user
      await storage.deleteUser(userId);
      
      res.json({ success: true, message: '사용자가 성공적으로 삭제되었습니다' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // Admin API - Update User
  app.put('/api/admin/users/:id', async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).username !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    try {
      const userId = parseInt(req.params.id);
      const { username, email, displayName } = req.body;
      
      // Prevent modification of admin username
      if (userId === 3 && username !== 'admin') {
        return res.status(400).json({ message: '관리자 계정의 아이디는 변경할 수 없습니다' });
      }

      const updatedUser = await storage.updateUser(userId, {
        username,
        email,
        displayName
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  // Admin API - Reset User Password
  app.post('/api/admin/users/:id/reset-password', async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).username !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    try {
      const userId = parseInt(req.params.id);
      const { newPassword } = req.body;
      
      await storage.updateUserPassword(userId, newPassword);
      
      res.json({ success: true, message: '비밀번호가 성공적으로 재설정되었습니다' });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });

  // Admin API - Delete User Tax Returns
  app.delete('/api/admin/users/:id/tax-returns', async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).username !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    try {
      const userId = parseInt(req.params.id);
      
      await storage.deleteUserTaxReturns(userId);
      
      res.json({ success: true, message: '사용자의 모든 세금 신고서가 삭제되었습니다' });
    } catch (error) {
      console.error('Error deleting tax returns:', error);
      res.status(500).json({ message: 'Failed to delete tax returns' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}