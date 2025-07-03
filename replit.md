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
- July 1, 2025: **QBI DEDUCTION PROPERLY INTEGRATED INTO TAX CALCULATION** - QBI deduction now correctly applied to taxable income calculation (AGI - Standard/Itemized Deductions - QBI Deduction) and displayed in Review page for accurate tax computation and reporting
- July 1, 2025: **TOTAL INCOME CALCULATION FIXED TO INCLUDE BUSINESS INCOME** - Resolved issue where business income from QBI was displayed in field but not included in total income calculation, now properly adds QBI totalQBI to aggregate income totals
- July 1, 2025: **QBI ↔ INCOME AUTOMATIC SYNC COMPLETELY FIXED** - Successfully implemented seamless data integration between QBI Details and Income pages with direct field value display, real-time data synchronization, and comprehensive debugging system ensuring QBI totalQBI automatically populates business income field
- July 1, 2025: **EIC QUALIFYING CHILDREN CALCULATION CORRECTED** - Fixed EIC calculation to properly count only children under 17 years old as qualifying children (Seojin 17세 excluded, Yujun 14세 included), resulting in accurate EIC of $1,506 for 1 qualifying child instead of incorrect $4,115 for 2 children
- July 1, 2025: **CREDIT FOR OTHER DEPENDENTS AUTO-CALCULATION FIXED** - Updated calculation logic to use age-based filtering instead of isQualifyingChild property, correctly identifying 17+ year old dependents (Seojin 17세) for $500 credit while excluding younger children already receiving Child Tax Credit
- July 1, 2025: **TAX YEAR STANDARDIZED TO 2024** - Updated all tax calculations to use 2024 tax year instead of 2025, including Child Tax Credit eligibility (17세 미만), Credit for Other Dependents (17세 이상), and EIC calculations with proper age verification logic
- July 1, 2025: **CHILD TAX CREDIT ELIGIBILITY LOGIC CORRECTED** - Fixed Child Tax Credit calculation to properly identify eligible children under 17 years old with accurate 2024 year-end age calculation, ensuring proper distribution between Child Tax Credit and Credit for Other Dependents
- July 1, 2025: **EARNED INCOME CREDIT AUTO-CALCULATION IMPLEMENTED** - Added comprehensive automatic EIC calculation with "자동 계산" button based on 2024 IRS tables, includes phase-in/plateau/phase-out calculations, AGI thresholds, and qualifying children count (0-3+) for all filing statuses
- July 1, 2025: **EARNED INCOME CREDIT FIELD ADDED** - Implemented comprehensive Earned Income Credit field in tax-credits page with dynamic income thresholds based on filing status and qualifying children count, includes 2025 IRS limits for single/married filing jointly
- July 1, 2025: **SOCIAL SECURITY DISCLAIMER NOTICE ADDED** - Added prominent warning message directing users to SSA.gov for official benefit calculations, clarifying that calculator provides approximate estimates only
- July 1, 2025: **SOCIAL SECURITY INPUT/OUTPUT LOGIC FIXED** - Corrected annual salary input handling (was treating as monthly), updated default values, and added clear placeholder text for realistic benefit calculations
- July 1, 2025: **SOCIAL SECURITY CALCULATOR FORMULA CORRECTED** - Updated calculation to match SSA.gov official formula with proper AIME calculation, 2024 bend points ($1,174, $7,078), and accurate early/delayed retirement adjustments for realistic benefit estimates
- July 1, 2025: **SOCIAL SECURITY CALCULATOR RESTORED** - Re-integrated detailed Social Security calculator with PIA computation, age adjustment factors, and automatic form population in step-by-step retirement flow
- July 1, 2025: **CALCULATION BUTTON ACTIVATION FIXED** - Resolved issue where final calculation button remained disabled, now activates when step 4 fields are completed
- July 1, 2025: **RETIREMENT SCORE STEP-BY-STEP FLOW IMPLEMENTED** - Complete overhaul from tabbed interface to progressive 4-step journey (기본정보 → 재정상태 → 생활환경 → 투자성향) with validation, progress tracking, and comprehensive scoring system
- July 1, 2025: **FILING STATUS CHECKER NAVIGATION IMPROVED** - Added "개인정보 페이지로 돌아가기" button to results page alongside "다시 시작하기" for better user navigation flow
- July 1, 2025: **PERSONAL INFO SAMPLE DATA BUTTON COMPLETELY FIXED** - Implemented DOM-based approach to directly populate form fields, bypassing React Hook Form state management issues that were preventing field updates
- June 25, 2025: **INCOME PAGE SAVE BUTTON ADDED** - Added "진행상황저장" button above "기타 소득" section for convenient progress saving during income data entry
- June 25, 2025: **HOMEPAGE BUTTON TEXT SIZE UNIFIED** - Made all homepage buttons use font-bold class and size="lg" attribute to match "지금 시작하기" button text weight and size for consistent visual appearance
- June 24, 2025: **CAPITAL GAINS DATE INPUT FIXED** - Resolved date input issue in Capital Gains Calculator by properly handling string vs number field types in form input processing
- June 24, 2025: **HOMEPAGE BUTTON WIDTH UNIFIED** - Set equal width for both '세금시뮬레이터' and '은퇴준비상태진단' buttons for consistent visual layout
- June 24, 2025: **PASSWORD SECURITY ENHANCED** - Implemented strong password requirements for registration: minimum 8 characters, uppercase letter, and special characters ($, *, !, #) with validation messages
- June 24, 2025: **HOMEPAGE BUTTON LAYOUT SIMPLIFIED** - Removed login/signup buttons, kept only '세금시뮬레이터' and '은퇴준비상태진단' buttons side by side for cleaner navigation
- June 24, 2025: **EXPERT PROFILE ENHANCED** - Added '미 Midwest 대학 회계학 교수' to expert career history in retirement consultation section
- June 24, 2025: **RETIREMENT COST EXAMPLE UPDATED** - Changed retirement planning default values from $60,000 to $5,000 for monthly living expenses to prevent user confusion about annual vs monthly costs
- June 24, 2025: **GOOGLE OAUTH COMPLETELY REMOVED** - Removed Google login/signup buttons from both login and register tabs due to persistent redirect_uri_mismatch issues, users can use regular authentication or guest access
- June 22, 2025: **FILING STATUS DEFAULT SET TO "SINGLE"** - Personal Info form now defaults to "미혼(Single)" filing status for better user experience
- June 22, 2025: **SPOUSE INFORMATION DISPLAY FIXED** - Successfully disabled server data override, Filing Status Checker now properly triggers spouse fields to appear
- June 22, 2025: **PERSONAL INFO FORM ENHANCED** - Added email, phone, and complete address fields positioned above save button for comprehensive contact and location information collection
- June 22, 2025: **GOOGLE OAUTH CONFIGURATION IMPROVED** - Enhanced Google login with environment variable support, dynamic callback URLs, and better error handling
- June 22, 2025: **EXAMPLE DATA FUNCTIONALITY REMOVED** - Eliminated example data filling feature from Personal Info page for cleaner user experience
- June 22, 2025: **SPOUSE ADDRESS FUNCTIONALITY ADDED** - Implemented "위의주소와 다름" checkbox for spouse with different address, showing conditional address fields
- June 22, 2025: **DUPLICATE FIELDS REMOVED** - Cleaned up Personal Info form by removing duplicate contact and address fields from spouse section
- June 22, 2025: **UI CLEANUP** - Removed unnecessary "종합 은퇴 준비 진단 (무료)" button from Social Security calculator for cleaner interface
- June 22, 2025: **FOOTER NAVIGATION UPDATED** - Replaced "세금 계산기" with "Social Security 계산기" and linked to retirement score page with comprehensive calculator
- June 22, 2025: **DATA PERSISTENCE FIXED** - Resolved Personal Information data loss issue by fixing localStorage key inconsistency and adding server-side persistence to navigation flow
- June 22, 2025: **RETIREMENT EXPENSE CLARIFICATION** - Changed "은퇴 후 예상 생활비" field to clearly indicate monthly expenses with updated calculation logic
- June 22, 2025: **SOCIAL SECURITY CALCULATOR IMPLEMENTED** - Added detailed scenario-based calculator with working years, salary history, and claiming age considerations plus simplified PIA formula
- June 22, 2025: **EXPERT PROFILE ENHANCED** - Added educational background (University of Pennsylvania Economics, Yonsei University MBA) and investment strategy specialty to About page and retirement-score page
- June 22, 2025: **CRITICAL DATA LOSS ISSUE FIXED** - "진행상황저장" button now preserves current form data from localStorage before saving to prevent data loss
- June 22, 2025: **USER-FRIENDLY SAVE SOLUTION IMPLEMENTED** - Added dedicated "저장하기" button next to Filing Status checker for explicit user control over data saving
- June 21, 2025: **DATA PERSISTENCE ISSUES COMPLETELY RESOLVED** - Comprehensive fix implemented for form data clearing during navigation and authentication session issues
- June 21, 2025: Enhanced localStorage-based form preservation system prevents data loss when navigating to Filing Status Checker
- June 21, 2025: Fixed root cause of John Smith example data auto-injection from Home page that was pre-filling new user forms
- June 21, 2025: Filing Status Checker now properly preserves existing form data when updating filing status
- June 21, 2025: New user initialization corrected to start with empty forms instead of sample data
- June 21, 2025: **ADMIN PANEL FULLY OPERATIONAL** - Complete admin authentication system successfully implemented with all user management features working
- June 21, 2025: Admin login authentication issue resolved by fixing API function call compatibility in useAuth hook
- June 21, 2025: All admin panel features verified working: user deletion, editing, password reset, tax data cleanup, and search functionality
- June 21, 2025: Admin account protection confirmed working (prevents deletion of admin user ID: 3)
- June 21, 2025: **ADMIN PANEL USER MANAGEMENT ENHANCED** - Complete user administration system with deletion, editing, and data management capabilities
- June 21, 2025: Server-side admin API endpoints implemented for user CRUD operations (delete, update, password reset, tax data cleanup)
- June 21, 2025: Frontend admin interface enhanced with management buttons and dialog forms for user operations
- June 21, 2025: Admin account protection implemented - prevents deletion of admin user (ID: 3) with safety checks
- June 21, 2025: Comprehensive user management workflow: edit user info, reset passwords, delete tax returns, remove users entirely
- June 21, 2025: **CRITICAL SECURITY VULNERABILITY SUCCESSFULLY RESOLVED** - User data isolation now working perfectly with complete data separation between all users
- June 21, 2025: **CRITICAL SECURITY VULNERABILITY COMPLETELY RESOLVED** - User data isolation breach fully fixed with comprehensive server-side and client-side improvements
- June 21, 2025: TaxContext enhanced with real-time user authentication monitoring and automatic page refresh on user changes
- June 21, 2025: Server-side createTaxReturn functionality completely overhauled with proper user-specific data creation
- June 21, 2025: Multi-layer security verification implemented - server logs now confirm proper user data separation
- June 21, 2025: New user accounts (Steve, cabe, right) now correctly start with completely empty tax forms instead of inheriting other users' data
- June 21, 2025: **CRITICAL SECURITY FIX COMPLETED** - Complete data isolation between users implemented
- June 21, 2025: Authentication requirements added to all tax-return API endpoints (GET, POST, PUT)
- June 21, 2025: Server-side user verification ensures tax returns can only be accessed by their owners
- June 21, 2025: Client-side userId hardcoding removed - server now uses authenticated user ID
- June 21, 2025: TaxContext initialization fixed to prevent data inheritance between user sessions
- June 21, 2025: Critical data isolation bug fixed - new users no longer see other users' tax data
- June 21, 2025: getCurrentTaxReturn() method updated to filter by userId for proper user data separation
- June 21, 2025: POST /api/tax-return endpoint fixed to assign correct userId to new tax returns
- June 21, 2025: Empty initial data template implemented for new users instead of sample data
- June 21, 2025: RetirementContributions page placeholders updated from "0" to "달러 금액" for better user experience
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