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
- June 20, 2025: Comprehensive retirement score calculation system integrated
- June 20, 2025: Homepage messaging hierarchy optimized for better user flow
- June 20, 2025: Brand positioning updated to "세상쉬운 세금계산 세상귀한 노후준비"
- June 20, 2025: Retirement planning naturally integrated into tax workflow
- June 19, 2025: Initial setup