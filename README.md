# 🏠 Roomzy Backend

**Production-ready NestJS + PostgreSQL backend for Pakistan's trusted student accommodation marketplace platform.**

> Version 1.0 | February 2026 | Hazara University FYP Project

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Completed Work](#completed-work)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Features & Roadmap](#features--roadmap)
- [Database Schema](#database-schema)
- [Security](#security)

---

## 🎯 Project Overview

**Roomzy** is a comprehensive three-sided marketplace platform connecting:

- **Students (Demand Side)** - Find verified hostels, book rooms, manage stays, leave reviews
- **Hostel Owners/Managers (Supply Side)** - List properties, manage rooms, approve bookings, track revenue
- **Administrators (Control Tower)** - Verify entities, monitor platform health, manage commissions

### Core Differentiators

✅ **Physical Inspection Required** - Every hostel undergoes verification before going live  
✅ **Request-to-Book Model** - Owners must approve before students pay  
✅ **Commission-Based Revenue** - 10% deducted from first-month payments  
✅ **Digital Stay Lifecycle** - Platform engagement throughout entire stay  
✅ **Chat Security** - Pre-booking messages limited to 5, phone masking enforced  

---

## 🔧 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | NestJS | 10.x | Backend framework |
| **Language** | TypeScript | 5.x | Type-safe development |
| **Database** | PostgreSQL | 15+ | Relational data storage |
| **ORM** | TypeORM | 0.3.x | Database abstraction |
| **Auth** | JWT (via Passport) | Latest | Stateless authentication |
| **Validation** | class-validator | Latest | DTO validation |
| **Password Hashing** | bcrypt | Latest | Secure password storage |
| **API Documentation** | Swagger/OpenAPI | Latest | Interactive API docs |
| **CORS** | Built-in | - | Cross-origin requests |
| **Environment Config** | @nestjs/config | Latest | Environment variables |

---

## ✅ Completed Work

### 1. **Project Infrastructure** ✓

- [x] NestJS application bootstrap with Swagger integration
- [x] Environment-based configuration system
- [x] PostgreSQL + TypeORM database configuration
- [x] CORS setup for frontend integration (localhost:5173)
- [x] Global API prefix `/api/v1` 
- [x] `.env` file configured with database credentials

**Files:**
- [main.ts](src/main.ts) - Application bootstrap with CORS, validation pipe, Swagger docs
- [app.module.ts](src/app.module.ts) - Root module with ConfigModule, TypeOrmModule
- [config/database.config.ts](src/config/database.config.ts) - TypeORM PostgreSQL configuration
- [.env](.env) - Environment variables (DB connection, JWT secret, SMTP settings)

---

### 2. **Authentication & Authorization Layer** ✓

Fully implemented security infrastructure ready for auth module development:

**Custom Decorators:**
- [current-user.decorator.ts](src/common/decorators/current-user.decorator.ts) - `@CurrentUser()` extracts JWT payload
- [roles.decorator.ts](src/common/decorators/roles.decorator.ts) - `@Roles()` specifies required roles

**Guards (Route Protection):**
- [jwt-auth.guard.ts](src/common/guards/jwt-auth.guard.ts) - Validates JWT tokens and extracts user data
- [roles.guard.ts](src/common/guards/roles.guard.ts) - Enforces role-based access control (RBAC)

**Enums (Type Safety):**
- [user-role.enum.ts](src/common/enums/user-role.enum.ts) - `STUDENT | OWNER | ADMIN`
- [booking-status.enum.ts](src/common/enums/booking-status.enum.ts) - 9 booking lifecycle statuses
- [payment-status.enum.ts](src/common/enums/payment-status.enum.ts) - `PENDING | COMPLETED | FAILED | REFUNDED`
- [hostel-status.enum.ts](src/common/enums/hostel-status.enum.ts) - 6 hostel verification statuses

---

### 3. **API Standardization & Error Handling** ✓

Global middleware ensuring consistent API responses:

**Exception Filter:**
- [http-exception.filter.ts](src/common/filters/http-exception.filter.ts) - Global error handling, returns standardized error responses

**Response Interceptor:**
- [response.interceptor.ts](src/common/interceptors/response.interceptor.ts) - Wraps all responses in consistent format:
  ```json
  {
    "success": true,
    "data": { /* payload */ },
    "message": "Operation successful",
    "timestamp": "2026-05-13T17:59:25.000Z"
  }
  ```

---

### 4. **Application Endpoints** ✓

- [x] Health check endpoint: `GET /api/v1`
- [x] Swagger UI: `GET /api/docs`

---

## 📁 Project Structure

```
roomzy-backend/
├── .env                              # Environment variables
├── src/
│   ├── main.ts                       # App bootstrap
│   ├── app.module.ts                 # Root module
│   ├── app.controller.ts             # Health check endpoint
│   ├── app.service.ts                # Basic service
│   │
│   ├── config/
│   │   └── database.config.ts        # TypeORM PostgreSQL config
│   │
│   ├── common/                       # Shared utilities
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── enums/
│   │   │   ├── user-role.enum.ts
│   │   │   ├── booking-status.enum.ts
│   │   │   ├── payment-status.enum.ts
│   │   │   └── hostel-status.enum.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   └── interceptors/
│   │       └── response.interceptor.ts
│   │
│   ├── auth/                         # ⭕ TODO: Authentication module
│   ├── users/                        # ⭕ TODO: User profiles
│   ├── owners/                       # ⭕ TODO: Owner profiles
│   ├── students/                     # ⭕ TODO: Student profiles
│   ├── hostels/                      # ⭕ TODO: Hostel management
│   ├── rooms/                        # ⭕ TODO: Room management
│   ├── bookings/                     # ⭕ TODO: Booking system
│   ├── payments/                     # ⭕ TODO: Payment processing
│   ├── reviews/                      # ⭕ TODO: Review system
│   ├── chat/                         # ⭕ TODO: Real-time messaging
│   ├── notifications/                # ⭕ TODO: Notifications
│   ├── complaints/                   # ⭕ TODO: Complaint management
│   ├── admin/                        # ⭕ TODO: Admin dashboard
│   ├── analytics/                    # ⭕ TODO: Analytics & reporting
│   ├── cities/                       # ⭕ TODO: City management
│   └── institutes/                   # ⭕ TODO: Institute management
│
├── test/
│   ├── app.e2e-spec.ts              # E2E test template
│   └── jest-e2e.json                # Jest E2E config
│
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── tsconfig.build.json               # Build config
├── nest-cli.json                     # NestJS CLI config
├── eslint.config.mjs                 # ESLint rules
└── README.md                         # This file
```

---

## 🚀 Setup & Installation

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- **PostgreSQL** 14+ (local or Supabase)
- **Git**

### Installation Steps

1. **Clone and navigate to backend:**
   ```bash
   cd roomzy/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables** (see [Configuration](#configuration) section)

4. **Start development server:**
   ```bash
   npm run start:dev
   ```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the backend root with these variables:

```env
# Application
NODE_ENV=development
PORT=3000

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=roomzy_db

# Frontend Integration
FRONTEND_URL=http://localhost:5173

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Password Hashing
BCRYPT_SALT_ROUNDS=10

# Email Configuration (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-gmail-app-password

# Optional: Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Environment Variable Resolution

The application automatically connects to PostgreSQL using environment variables defined in `.env`. TypeORM reads these through `@nestjs/config` and constructs the database connection string.

**Important:** The `.env` file must be in the **project root** (not in `src/`), or environment variables won't load.

---

## ▶️ Running the Application

### Development Mode (with auto-reload)
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

### Watch Mode (compile without running)
```bash
npm run start:debug
```

### Health Check
Once the server is running, verify connectivity:
```bash
curl http://localhost:3000/api/v1
```

Expected response:
```json
{
  "success": true,
  "data": { "message": "Hello from Roomzy Backend! 🚀" },
  "message": "Health check successful",
  "timestamp": "2026-05-13T17:59:25.000Z"
}
```

---

## 📚 API Documentation

### Swagger UI

Access interactive API documentation at:
```
http://localhost:3000/api/docs
```

All endpoints are automatically documented with request/response schemas.

### API Structure

- **Base URL:** `http://localhost:3000/api/v1`
- **Response Format:** All responses wrapped in `{ success, data, message, timestamp }`
- **Error Handling:** Global error handler returns standardized error responses

---

## 🗺️ Features & Roadmap

### ✅ Completed
- [x] NestJS framework setup
- [x] PostgreSQL + TypeORM integration
- [x] Authentication guards and decorators
- [x] Role-based access control (RBAC) infrastructure
- [x] Standardized API responses
- [x] Global error handling
- [x] Swagger documentation
- [x] Environment configuration

### ⭕ In Progress / Next Steps (Priority Order)

1. **Auth Module** - User registration, login, JWT generation, password reset
2. **Users Module** - User profile management, role assignment
3. **Owners Module** - Owner profile, hostel ownership assignment
4. **Students Module** - Student profile, preference settings
5. **Hostels Module** - Create, update, list, verify hostels; manage amenities
6. **Rooms Module** - Room creation, pricing, availability management
7. **Bookings Module** - Request-to-book workflow, status management
8. **Payments Module** - Payment processing, invoice generation, commission calculation
9. **Reviews Module** - Student reviews, owner ratings, review management
10. **Chat Module** - Real-time messaging with Socket.io, message limiting
11. **Notifications Module** - Email/SMS/in-app notifications
12. **Complaints Module** - Complaint filing and resolution workflow
13. **Admin Module** - Verification dashboard, platform statistics
14. **Analytics Module** - Revenue reports, user analytics, platform insights
15. **Cities & Institutes** - Reference data management

---

## 🗄️ Database Schema

### Enums / Status Types

The following enums are defined and ready for entity usage:

**User Roles:**
```typescript
enum UserRole {
  STUDENT = 'student',
  OWNER = 'owner',
  ADMIN = 'admin',
}
```

**Booking Status Lifecycle:**
```typescript
REQUESTED → APPROVED → PAYMENT_PENDING → CONFIRMED → CHECKED_IN → 
CHECKED_OUT → COMPLETED / CANCELLED / REJECTED
```

**Payment Status:**
```typescript
PENDING | COMPLETED | FAILED | REFUNDED
```

**Hostel Verification Status:**
```typescript
PENDING | VERIFIED | REJECTED | SUSPENDED | ARCHIVED | DRAFT
```

### Database Connection

- **ORM:** TypeORM with auto-entity discovery
- **Pattern:** All entities must be named `*.entity.ts` and placed in module directories
- **Migrations:** Auto-sync disabled; use TypeORM CLI for manual migrations in production
- **SSL:** Disabled for local development (enable for production)

---

## 🔐 Security

### Implemented Security Measures

1. **JWT Authentication** - Stateless token-based auth via JwtAuthGuard
2. **Role-Based Access Control** - RolesGuard enforces permission checks
3. **Password Hashing** - bcrypt configured with 10 salt rounds
4. **Input Validation** - class-validator middleware validates all DTOs
5. **CORS Protection** - Whitelist frontend domains in main.ts
6. **Error Handling** - Global filter prevents information leakage

### Best Practices to Follow

- ✅ Never commit `.env` file with real credentials
- ✅ Use strong JWT_SECRET in production (32+ characters)
- ✅ Rotate JWT_SECRET periodically
- ✅ Enable SSL for production database connections
- ✅ Use environment-specific configurations
- ✅ Validate and sanitize all user inputs
- ✅ Implement rate limiting on public endpoints
- ✅ Use HTTPS in production

---

## 📦 Available npm Scripts

```bash
npm run start           # Start production server
npm run start:dev       # Start with hot-reload
npm run start:debug     # Debug mode
npm run build           # Compile TypeScript to JavaScript
npm run test            # Run unit tests
npm run test:watch      # Watch mode for tests
npm run test:e2e        # Run E2E tests
npm run lint            # Run ESLint
npm run format          # Format code with Prettier
```

---

## 🐛 Troubleshooting

### Issue: Database Connection Error
**Solution:** Verify PostgreSQL is running, credentials in `.env` are correct, and database exists:
```bash
psql -h localhost -U postgres -d roomzy_db
```

### Issue: Environment Variables Not Loading
**Solution:** Ensure `.env` is in the project root (`/backend/.env`), not in `src/`.

### Issue: Port 3000 Already in Use
**Solution:** Change `PORT` in `.env` or kill the process:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

### Issue: TypeScript Compilation Errors
**Solution:** Ensure TypeScript and dependencies are installed:
```bash
npm install
npm run build
```

---

## 📞 Support & Development

### Useful NestJS Resources
- [NestJS Docs](https://docs.nestjs.com)
- [TypeORM Docs](https://typeorm.io)
- [Passport.js](http://www.passportjs.org)
- [JWT Introduction](https://jwt.io/introduction)

### Development Tips
- Use NestJS CLI to generate boilerplate: `nest g resource auth`
- Keep entities and DTOs in separate files
- Use services for business logic, controllers for routing
- Write guards and interceptors as decorators

---

## 📄 License

This project is part of Hazara University FYP and follows institutional guidelines.

---

**Last Updated:** May 13, 2026  
**Version:** 1.0 | Scaffolding Phase Complete  
**Next Focus:** Auth Module Implementation
