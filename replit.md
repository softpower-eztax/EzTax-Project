# EzTax - Tax Filing Application

## Overview

EzTax is a comprehensive web-based tax filing application that provides users with a streamlined interface for preparing their federal tax returns. The application walks users through a step-by-step process covering personal information, income reporting, deductions, and tax calculations. It includes features for automatic tax calculations, data persistence, and premium services for complex tax scenarios.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Context API for tax data state management
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Passport.js with local and Google OAuth strategies
- **Session Management**: Express sessions with PostgreSQL storage

### Database Design
- **Primary Database**: PostgreSQL via Neon serverless
- **Schema Management**: Drizzle Kit for migrations
- **Key Tables**:
  - `users`: User authentication and profile data
  - `tax_returns`: Complete tax return data with JSON columns for structured data
  - Session storage for authentication persistence

## Key Components

### Core Application Flow
1. **Personal Information**: User details, filing status, dependents
2. **Income Reporting**: W-2 wages, additional income sources, adjustments
3. **Deductions**: Standard vs itemized deductions including SALT
4. **Tax Credits**: Child tax credit, retirement savings credit, etc.
5. **Additional Tax**: Self-employment tax, estimated payments
6. **Review & Filing**: Final calculations and summary

### Tax Calculation Engine
- Federal tax bracket calculations for 2024/2025 tax years
- Standard deduction calculations based on filing status
- SALT (State and Local Tax) deduction limits
- Child tax credit with income phase-outs
- Retirement savings credit calculations
- Self-employment tax computations

### Data Persistence
- Real-time saving of tax data to PostgreSQL
- JSON-based storage for complex nested tax information
- Automatic data restoration on session resume

### Authentication System
- Local username/password authentication
- Google OAuth integration
- Session-based authentication with PostgreSQL storage
- Password hashing using Node.js crypto scrypt

## Data Flow

1. **User Registration/Login**: Users authenticate via local credentials or Google OAuth
2. **Tax Data Collection**: Step-by-step form completion with real-time validation
3. **Automatic Calculations**: Tax computations triggered on data changes
4. **Data Persistence**: Continuous saving to PostgreSQL database
5. **Review Process**: Final calculations and summary generation

## External Dependencies

### Production Dependencies
- **Database**: Neon PostgreSQL serverless
- **Authentication**: Google OAuth 2.0
- **Payment Processing**: Stripe and PayPal integration (for premium features)
- **UI Components**: Radix UI primitives via shadcn/ui

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **ESLint/Prettier**: Code quality and formatting
- **Vite**: Development server with hot reload
- **Drizzle Kit**: Database schema management

## Deployment Strategy

### Development Environment
- **Platform**: Replit with integrated PostgreSQL
- **Port Configuration**: Frontend on port 5000, API endpoints under `/api`
- **Hot Reload**: Enabled for both frontend and backend development

### Production Deployment
- **Build Process**: Vite builds frontend to `dist/public`, esbuild bundles backend
- **Server**: Express serves both API routes and static assets
- **Database**: Neon PostgreSQL with connection pooling
- **Environment Variables**: DATABASE_URL, SESSION_SECRET, Google OAuth credentials

### Access Methods
- Multiple standalone HTML files for direct browser access
- Replit deployment with custom domain support
- Local development server for testing

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Recent Changes:
- June 21, 2025: Critical security vulnerability fixed - admin access now restricted to 'admin' username only
- June 21, 2025: Admin account properly recreated in PostgreSQL with secure password hashing (ID: 3)
- June 21, 2025: Multi-layer security implemented: frontend button visibility, backend API validation, and admin panel access control
- June 21, 2025: Regular users can no longer access admin features - comprehensive security audit completed
- June 21, 2025: PostgreSQL-based admin authentication system fully operational with proper password hashing
- June 21, 2025: Admin account (username: admin, password: admin) successfully created in production database
- June 21, 2025: Database storage migration from memory to PostgreSQL completed for persistent admin access
- June 21, 2025: Complete admin panel system implemented with user management table, API endpoints, and header navigation
- June 21, 2025: Admin authentication system with session management and PostgreSQL-based user data retrieval
- June 21, 2025: Logout functionality fixed with improved session handling and client-side failsafe for deployed environment
- June 21, 2025: State Tax page enhanced with selectable state dropdown - auto-loads resident state but allows selection of any state for comparison
- June 21, 2025: State tax results display removed from Review page - now purely shows federal tax calculations
- June 21, 2025: State Tax workflow repositioned to start after Federal Tax Review completion per user request
- June 21, 2025: Review page enhanced with "주소득세 계산(State Income Tax)" button for optional state tax calculation
- June 21, 2025: Additional Tax page navigation updated to proceed directly to Review, bypassing State Tax
- June 21, 2025: State Income Tax calculation system fully implemented and tested with live data
- June 21, 2025: 50-state tax rules engine integrated with federal tax calculations
- June 21, 2025: State tax results display in Review page with refund/owed calculations
- June 21, 2025: Verified working with Illinois sample data ($4,359.71 state tax on $100,200 AGI)
- June 21, 2025: Gmail email delivery successfully implemented and verified working
- June 21, 2025: Application submissions now automatically sent to eztax88@gmail.com with HTML formatting
- June 21, 2025: Email authentication resolved with proper Gmail app password configuration
- June 21, 2025: Complete application system operational with both email delivery and backup logging
- June 21, 2025: Unnecessary direct contact information removed from application form per user request
- June 21, 2025: Application form system implemented - users can submit service requests with name, phone, email to eztax88@gmail.com
- June 21, 2025: Backend API endpoint added for processing application submissions with email notification functionality
- June 21, 2025: Pricing page buttons now redirect to dedicated application form instead of showing simple toast messages
- June 21, 2025: English text about professional tax review options removed from pricing page description
- June 21, 2025: Contact Us section removed from pricing page per user request
- June 21, 2025: Submit button text updated to "신고서제출(준비중)" to indicate feature is in preparation
- June 21, 2025: Form 1040 PDF generator implemented with official IRS format, line numbers, and proper tax form structure
- June 21, 2025: PDF download filename updated to "Form_1040_[year].pdf" format for professional appearance
- June 21, 2025: Calculate button removed from SALT deductions page - automatic real-time calculation implemented
- June 21, 2025: SALT total amount display fixed to show correct combined value (10,000) instead of individual components
- June 21, 2025: Retirement consultation section removed from Additional Tax page per user request
- June 21, 2025: SALT data persistence completely fixed with personalPropertyTax field added to database schema
- June 21, 2025: Enhanced SALT deduction calculations to include personal property tax in $10,000 limit
- June 21, 2025: Improved navigation from window.location to wouter navigate for seamless page transitions
- June 20, 2025: Deployment completed to https://web-data-pro-kloombergtv.replit.app for eztax.kr domain forwarding
- June 21, 2025: Book title finalized to "절세로 시작하는 은퇴설계 Less Tax, Better Retirement" across all pages
- June 21, 2025: Expert profile simplified by removing "전직 재무임원" for cleaner presentation
- June 21, 2025: About page enhanced with professional Mission and Vision images
- June 21, 2025: Removed redundant header section from About page for cleaner layout
- June 21, 2025: UI refinements - "Filing Status 확인" button text updated and homepage explanation text removed for cleaner design
- June 20, 2025: Homepage messaging updated to "세금시뮬레이터로 간단하게 계산하시고 노후준비도 진단하세요"
- June 20, 2025: "리포트 다운로드" button changed to "다시 계산하기" with form reset functionality
- June 20, 2025: Footer "회사 소개" link connected to About page
- June 20, 2025: Dedicated company About page created with comprehensive EzTax overview and founder profile
- June 20, 2025: Professional company presentation featuring mission, vision, core values, and CEO credentials
- June 20, 2025: Enhanced navigation with homepage link to company information page
- June 20, 2025: CEO profile streamlined with EzTax founding prominently featured in career history
- June 20, 2025: Monte Carlo simulation implementation for retirement planning (10,000 scenarios, percentile analysis, success probability)
- June 20, 2025: Advanced probabilistic modeling with market volatility consideration (15% standard deviation)
- June 20, 2025: Enhanced retirement score visualization with color-coded percentile ranges and success metrics
- June 20, 2025: Expert photo display fix using proper Vite asset import system
- June 20, 2025: Homepage UI improvements with prominent retirement diagnostic button and EzTax blue branding
- June 20, 2025: Advanced retirement score calculation with comprehensive factors (preparedness ratio, financial health, lifestyle)
- June 20, 2025: Professional expert introduction for 지대현 EA/RIA replacing premium offers
- June 20, 2025: 4-tab retirement assessment form (기본정보, 재정상태, 생활환경, 투자성향)
- June 20, 2025: Enhanced homepage with "Less Tax, More Wealth" English tagline
- June 20, 2025: Feature repositioning from "저장 및 재개" to "최적의 은퇴전략 제안"
- June 20, 2025: Comprehensive retirement score calculation system integrated
- June 20, 2025: Homepage messaging hierarchy optimized for better user flow
- June 20, 2025: Brand positioning updated to "세상쉬운 세금계산 세상귀한 노후준비"
- June 20, 2025: Retirement planning naturally integrated into tax workflow
- June 19, 2025: Initial setup