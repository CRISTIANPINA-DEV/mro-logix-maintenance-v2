# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MRO Logix is an aviation maintenance, repair, and operations (MRO) management system built with Next.js 15, TypeScript, Prisma, and PostgreSQL. It's a multi-tenant application serving aviation companies with comprehensive maintenance tracking, compliance management, and operational oversight.

## Development Commands

```bash
# Development server with Turbopack
npm run dev

# Production build and start
npm run build
npm start

# Code quality
npm run lint

# Database
npx prisma generate    # Generate Prisma client
npx prisma db push     # Push schema changes
npx prisma studio      # Database GUI

# Note: Project uses postinstall script to auto-generate Prisma client
```

## Architecture

### Database Architecture
- **Multi-tenant PostgreSQL** with company-based data isolation
- **Prisma ORM** with comprehensive schema (43+ models)
- Every data model includes `companyId` for tenant isolation
- **Audit trails** and user activity logging throughout
- **File attachments** stored in AWS S3 with metadata in database

### Authentication & Authorization
- **NextAuth.js** with JWT strategy and credentials provider
- **Middleware-based route protection** in `middleware.ts`
- **Company-scoped sessions** with user context in request headers
- **Granular permissions system** via `UserPermission` model
- **Multi-level user privileges** (admin, manager, technician)

### API Architecture
- **Next.js App Router** with RESTful API routes under `/api`
- **Company-scoped data access** enforced in all endpoints  
- **Consistent error handling** with structured JSON responses
- **Activity logging** for all CRUD operations via `logUserActivity()`
- **File upload handling** with 250MB limits and S3 integration

### Frontend Architecture
- **Server Components** for data fetching and SEO
- **Client Components** with `"use client"` for interactivity
- **Feature-based organization** under `/dashboard` with module-specific components
- **shadcn/ui components** with Radix UI primitives
- **Permission-based UI rendering** using `useUserPermissions` hook

## Key Modules

### Core Aviation Features
- **Flight Records** - Flight operations and part replacements
- **Stock Inventory** - Parts management with expiry tracking
- **Incoming Inspections** - Part inspection workflows
- **Temperature Control** - Environmental monitoring with trends
- **Oil Consumption** - Service record tracking
- **Wheel Rotation** - Maintenance scheduling
- **Technician Training** - Training records and certifications

### Compliance & Safety
- **Audits Management** - Full audit lifecycle with findings/corrective actions
- **SMS Reports** - Safety Management System reporting
- **SDR Reports** - Service Difficulty Reports
- **Technical Publications** - Manual management with revisions

### Business Intelligence
- **Technical Queries** - Q&A system with voting mechanisms
- **Notification Center** - System-wide communications
- **User Activity** - Comprehensive audit trails
- **Data Analytics** - Defect trend analysis and predictive analytics
- **Fleet Analytics** - Fleet-specific defect and system analysis
- **Weather Integration** - Real-time weather data and monitoring

### Additional Features
- **Anonymous Reporting** - Anonymous safety and compliance reports
- **Log Pages** - Digital maintenance logs and record keeping
- **Manage Data Records** - Bulk data operations and record management
- **Account Settings** - User profile and preference management
- **Organization Management** - Company settings and configuration
- **Useful Links** - Quick access to important resources

## Development Patterns

### Database Patterns
```typescript
// All models include company scoping
const records = await prisma.flightRecord.findMany({
  where: { companyId: user.companyId }
})

// Activity logging pattern
await logUserActivity({
  userId: user.id,
  companyId: user.companyId,
  action: 'CREATE_FLIGHT_RECORD',
  resourceType: 'FLIGHT_RECORD',
  resourceId: record.id
})
```

### Authentication Patterns
```typescript
// Server-side auth check
const { user } = await requireAuth(request)
if ('error' in user) {
  return NextResponse.json(user.error, { status: user.status })
}

// Permission check
const hasPermission = await checkUserPermission(
  user.id, 
  'canCreateFlightRecords'
)
```

### File Upload Pattern
```typescript
// S3 upload with company folder structure
const fileKey = `${companyId}/flight-records/${recordId}/${fileName}`
await uploadToS3(file, fileKey)

// Store metadata in database
await prisma.attachment.create({
  data: { companyId, fileName, fileKey, fileSize, fileType }
})
```

## Important Conventions

### Security Requirements
- **Never bypass company scoping** - all queries must filter by `companyId`
- **Always validate user permissions** before sensitive operations
- **Log all user activities** for audit compliance
- **Sanitize file uploads** and enforce size limits
- **Use Zod schemas** for input validation

### Code Organization
- **Feature colocation** - keep related components together in module folders
- **Shared UI components** go in `/components/ui/`
- **Business logic** in `/lib/` utilities
- **Type definitions** in dedicated `.ts` files
- **API routes** follow RESTful patterns with proper HTTP methods

### Component Patterns
- Use **Server Components by default** for better performance
- Add **"use client"** only when interactivity is needed
- **Permission-based rendering** using the `useUserPermissions()` hook
- **Error boundaries** and loading states for better UX
- **Consistent prop interfaces** with TypeScript

### Dashboard Layout Standards
- **Main dashboard** (`src/app/dashboard/page.tsx`) uses a 4-column grid layout for business operations cards
- **Fixed card heights** - Business operations cards use `h-[220px]` for consistency
- **Time cards** use `h-[165px]` with grey gradient backgrounds and blue text for uniformity
- **Card styling patterns**:
  - `rounded-none` for consistent sharp edges
  - `hover:shadow-md group` for interactive cards with smooth transitions
  - `space-y-3` for internal card content spacing
  - `ArrowRight` icons with `group-hover:translate-x-0.5` for subtle hover animations
- **Color themes** - Each card type has dedicated color schemes (green for flights, blue for monthly, red for inventory, cyan for maintenance)
- **Responsive design** - `md:grid-cols-2 lg:grid-cols-4` for proper scaling across devices

### Database Conventions
- **UUID primary keys** for all models
- **createdAt/updatedAt timestamps** on all models
- **Proper foreign key relationships** with cascade deletes
- **Database indexes** on frequently queried fields (especially `companyId`)

## Environment Setup

Required environment variables:
- `DATABASE_URL` and `DIRECT_URL` for PostgreSQL
- `NEXTAUTH_SECRET` and `NEXTAUTH_URL` for authentication
- AWS S3 credentials for file storage
- Email service credentials (Nodemailer/Resend)
- Optional: OpenAI API key for AI features, Pusher for real-time updates
- Weather API credentials for weather data integration

## Key Dependencies

### Core Framework
- **Next.js 15.3.2** with App Router and React 19
- **TypeScript 5** for type safety
- **Tailwind CSS 4** for styling
- **Prisma 6.8+** for database ORM

### UI Components
- **Radix UI** primitives for accessible components
- **shadcn/ui** component library
- **Lucide React** for icons
- **Framer Motion** for animations

### Data & API
- **Zod** for schema validation
- **React Hook Form** with resolvers
- **Date-fns** for date manipulation
- **Recharts** for data visualization
- **jsPDF** for PDF generation

### Real-time & Communication
- **Pusher** for real-time updates
- **Nodemailer/Resend** for email services
- **Sonner** for toast notifications

### Development Tools
- **ESLint 9** with Next.js config
- **TypeScript** with strict mode
- **Prisma Studio** for database management