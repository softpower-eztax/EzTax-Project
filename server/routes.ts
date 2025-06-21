import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTaxReturnSchema } from "@shared/schema";
import { z } from "zod";
import nodemailer from "nodemailer";

// Configure email transporter for Gmail with better error handling
const createEmailTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email credentials not configured - emails will be logged only');
    return null;
  }

  console.log(`Configuring email for: ${process.env.EMAIL_USER}`);
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    debug: true,
    logger: true
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/ping", (req, res) => {
    res.json({ ok: true });
  });
  
  // Get current tax return (always gets the most recent one)
  app.get("/api/tax-return", async (req, res) => {
    try {
      const taxReturn = await storage.getCurrentTaxReturn();
      if (!taxReturn) {
        // Return valid test tax return data with all required fields
        const testTaxReturn = {
          id: 1,
          userId: 1,
          taxYear: new Date().getFullYear() - 1,
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
            isDisabled: false,
            isNonresidentAlien: false,
            spouseInfo: {
              firstName: 'Jane',
              middleInitial: 'B',
              lastName: 'Smith',
              ssn: '987-65-4321',
              dateOfBirth: '1982-05-20',
              isDisabled: false,
              isNonresidentAlien: false
            },
            dependents: [
              {
                firstName: 'Tommy',
                lastName: 'Smith',
                ssn: '111-22-3333',
                relationship: 'Son',
                dateOfBirth: '2010-03-12',
                isDisabled: false,
                isNonresidentAlien: false,
                isQualifyingChild: true
              }
            ]
          },
          income: {
            wages: 75000,
            otherEarnedIncome: 0,
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
              otherAdjustments: 4500
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
            aotcCredit: 0,
            llcCredit: 0,
            retirementSavingsCredit: 500,
            foreignTaxCredit: 0,
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
        res.json(taxReturn);
      }
    } catch (error) {
      console.error("Error fetching tax return:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create or update tax return
  app.post("/api/tax-return", async (req, res) => {
    try {
      const validationResult = insertTaxReturnSchema.safeParse(req.body);
      
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
      const id = parseInt(req.params.id);
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
          console.log('Email sent successfully to eztax88@gmail.com');
          console.log('Message ID:', info.messageId);
        } catch (emailError) {
          console.error('Failed to send email:', emailError);
          console.log('Application Email Content (fallback):');
          console.log('To: eztax88@gmail.com');
          console.log('Subject: [EzTax] 새로운 유료검토 서비스 신청');
          console.log('Content:', emailContent);
        }
      } else {
        console.log('Email credentials not configured - logging application:');
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