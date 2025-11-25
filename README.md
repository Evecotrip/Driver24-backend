# Driver Save Backend

Express backend with role-based authentication (USER, DRIVER, ADMIN) built with Bun, TypeScript, Prisma ORM, Supabase PostgreSQL database, Clerk authentication, and custom JWT tokens.

## Features

- **Role-Based Access Control:** Three roles - USER, DRIVER, and ADMIN
- **Custom JWT Tokens:** After Clerk auth, users select role and get custom JWT
- **Driver Profiles:** Drivers can create detailed profiles with documents
- **City-Based Search:** Users can find drivers in their city
- **Admin Verification:** Admins can verify driver profiles
- **Webhook Sync:** Automatic user sync between Clerk and Supabase

## Prerequisites

- [Bun](https://bun.sh/) installed
- [Supabase](https://supabase.com/) account and project
- [Clerk](https://clerk.com/) account and application

## Setup Instructions

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
# Supabase Database
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Clerk Authentication
CLERK_PUBLISHABLE_KEY="pk_test_xxxxxxxxxxxxx"
CLERK_SECRET_KEY="sk_test_xxxxxxxxxxxxx"
CLERK_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxx"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=development
```

**To get your Supabase connection string:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → Database
3. Copy the connection string under "Connection string" (URI format)
4. Replace `[YOUR-PASSWORD]` with your database password

**To get your Clerk credentials:**
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your application
3. Navigate to API Keys
4. Copy the Publishable Key and Secret Key

### 3. Set Up Clerk Webhook

**Configure the webhook in Clerk Dashboard:**

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/) → Webhooks
2. Click "Add Endpoint"
3. Enter your webhook URL: `https://your-domain.com/api/webhooks/clerk`
   - For local development, use a tool like [ngrok](https://ngrok.com/) to expose your local server
4. Subscribe to these events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Copy the "Signing Secret" and add it to your `.env` as `CLERK_WEBHOOK_SECRET`

**For local development with ngrok:**
```bash
# In a separate terminal
ngrok http 3000

# Use the ngrok URL in Clerk webhook settings
# Example: https://abc123.ngrok.io/api/webhooks/clerk
```

### 4. Set Up Prisma

Generate Prisma Client:

```bash
bun run prisma:generate
```

Push the schema to your database:

```bash
bun run prisma:push
```

Or create a migration:

```bash
bun run prisma:migrate
```

### 5. Start the Development Server

```bash
bun run dev
```

The server will start on `http://localhost:3000`

## Available Scripts

- `bun run dev` - Start development server with hot reload
- `bun run start` - Start production server
- `bun run prisma:generate` - Generate Prisma Client
- `bun run prisma:migrate` - Create and apply migrations
- `bun run prisma:push` - Push schema changes to database
- `bun run prisma:studio` - Open Prisma Studio (database GUI)

## Authentication Flow

1. **User signs up/in with Clerk** → Webhook creates user in database
2. **Select role (USER/DRIVER)** → `POST /api/auth/select-role` with clerkId from Clerk user object
3. **Receive custom JWT token** → Use this JWT for all subsequent API calls
4. **Make API requests** → Include JWT in Authorization header

## API Endpoints

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### Quick Reference

**Auth Endpoints**:
- `POST /api/auth/select-role` - Select role and get custom JWT (no auth required, send clerkId)
- `GET /api/auth/profile` - Get user profile (Clerk token required)
- `POST /api/auth/refresh-token` - Refresh JWT token (Clerk token required)

**Driver Endpoints** (Require JWT with appropriate role):
- `POST /api/drivers/profile` - Create/update driver profile (DRIVER)
- `GET /api/drivers/profile/me` - Get my driver profile (DRIVER)
- `GET /api/drivers/city/:city` - Get drivers by city (USER, ADMIN)
- `GET /api/drivers/all` - Get all drivers (ADMIN)
- `PATCH /api/drivers/:id/verify` - Verify driver (ADMIN)

**User Endpoints** (Require JWT):
- `GET /api/users` - Get all users
- `GET /api/users/me` - Get current user
- `GET /api/users/:id` - Get user by ID

**Webhooks**:
- `POST /api/webhooks/clerk` - Clerk webhook for user sync

## Project Structure

```
driver-save-backend/
├── prisma/
│   └── schema.prisma          # Prisma schema with User, Driver models
├── src/
│   ├── index.ts               # Express server entry point
│   ├── controllers/
│   │   ├── auth.controller.ts # Role selection & JWT generation
│   │   ├── driver.controller.ts # Driver profile management
│   │   ├── user.controller.ts # User management
│   │   └── webhook.controller.ts # Webhook handlers
│   ├── routes/
│   │   ├── auth.routes.ts     # Auth route definitions
│   │   ├── driver.routes.ts   # Driver route definitions
│   │   ├── user.routes.ts     # User route definitions
│   │   └── webhook.routes.ts  # Webhook route definitions
│   ├── middleware/
│   │   ├── clerk.ts           # Clerk authentication middleware
│   │   └── jwt.ts             # Custom JWT verification middleware
│   ├── services/
│   │   └── jwt.service.ts     # JWT token generation/verification
│   └── webhooks/
│       └── clerk.ts           # Clerk webhook handlers
├── .env                       # Environment variables (not in git)
├── .env.example               # Example environment variables
├── .gitignore                 # Git ignore rules
├── package.json               # Project dependencies
├── tsconfig.json              # TypeScript configuration
├── API_DOCUMENTATION.md       # Detailed API documentation
└── README.md                  # This file
```

## Database Schema

### User Model (synced with Clerk)
```prisma
model User {
  id                String    @id // Clerk user ID
  email             String    @unique
  firstName         String?
  lastName          String?
  username          String?   @unique
  profileImageUrl   String?
  role              UserRole? // USER, DRIVER, or ADMIN
  city              String?   // User's city
  driverProfile     Driver?   // One-to-one relation
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```

### Driver Model
```prisma
model Driver {
  id                String   @id @default(uuid())
  userId            String   @unique
  name              String
  phoneNumber       String
  rcNumber          String   @unique
  rcImage           String?
  dlNumber          String   @unique
  dlImage           String?
  permanentAddress  String
  operatingAddress  String
  city              String
  vehicleType       String?
  vehicleNumber     String?  @unique
  isVerified        Boolean  @default(false)
  availability      Boolean  @default(true)
  // ... more fields
}
```

Users are automatically created, updated, and deleted in Supabase when changes occur in Clerk via webhooks.

## Development Tips

- Use `bun run prisma:studio` to view and edit your database with a GUI
- After changing the schema, run `bun run prisma:generate` to update the Prisma Client
- Use `bun run prisma:migrate` for production or `bun run prisma:push` for quick prototyping

## How It Works

### User Sync Flow

1. **User signs up/updates/deletes in Clerk** → Clerk sends webhook to `/api/webhooks/clerk`
2. **Webhook is verified** using Svix signature verification
3. **User data is synced** to Supabase via Prisma
4. **Frontend uses Clerk** for authentication and gets session tokens
5. **Backend validates tokens** and uses Clerk user ID to query Supabase

### Role-Based Authentication Flow

1. **User authenticates with Clerk** → Gets Clerk session token
2. **User selects role** → Sends Clerk token to `/api/auth/select-role`
3. **Backend generates custom JWT** → Contains userId, role, and city
4. **User receives JWT token** → Uses this for all API requests
5. **API requests verified** → JWT middleware checks token and role
6. **Role-based access** → Different endpoints require different roles

## Tech Stack

- **Runtime:** Bun
- **Language:** TypeScript
- **Framework:** Express.js
- **ORM:** Prisma
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Clerk (`@clerk/express`)
- **Webhook Security:** Svix
- **Architecture:** MVC (Controllers, Routes, Middleware)

## Notes

- This project uses the new `@clerk/express` SDK (recommended as of October 2024)
- The deprecated `@clerk/clerk-sdk-node` has been replaced with `@clerk/express`
- Authentication is handled via `clerkMiddleware()` and `getAuth()` from `@clerk/express`
