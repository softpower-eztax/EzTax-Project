import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
  app.get("/api/ping", (req, res) => {
    res.json({ ok: true });
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

  const httpServer = createServer(app);
  return httpServer;
}