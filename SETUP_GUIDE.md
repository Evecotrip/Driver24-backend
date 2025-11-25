# Setup Guide - Role-Based Driver Save Backend

## Quick Start

### 1. Install Dependencies
```bash
bun install
```

This will install:
- `jsonwebtoken` - For custom JWT tokens
- `multer` - For file uploads (driver documents)
- `@clerk/express` - Clerk authentication
- All other dependencies

### 2. Generate Prisma Client
```bash
bun run prisma:generate
```

This generates the Prisma client with the new `UserRole` enum and `Driver` model.

### 3. Update Database Schema
```bash
bun run prisma:push
```

Or create a migration:
```bash
bun run prisma:migrate
```

### 4. Configure Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
# Supabase
DATABASE_URL="your-supabase-connection-string"

# Clerk
CLERK_PUBLISHABLE_KEY="pk_test_xxxxx"
CLERK_SECRET_KEY="sk_test_xxxxx"
CLERK_WEBHOOK_SECRET="whsec_xxxxx"

# JWT (IMPORTANT: Change in production!)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=development
```

### 5. Start Development Server
```bash
bun run dev
```

---

## System Overview

### Three Roles

1. **USER** - Can view drivers in their city
2. **DRIVER** - Can create/update driver profile, manage availability
3. **ADMIN** - Can view all drivers, verify drivers, full access

### Two-Step Authentication

1. **Clerk Authentication** - Users sign up/in with Clerk
2. **Role Selection** - Users select role and receive custom JWT token

### Custom JWT Token

After selecting a role, users receive a JWT containing:
```json
{
  "userId": "user_xxx",
  "email": "user@example.com",
  "role": "DRIVER",
  "city": "Mumbai"
}
```

This JWT is used for all subsequent API requests.

---

## Testing the System

### 1. Create a User (via Clerk Webhook)
When a user signs up in Clerk, the webhook automatically creates them in Supabase.

### 2. Select Role
```bash
POST /api/auth/select-role
Headers: Authorization: Bearer <clerk_session_token>
Body: {
  "role": "DRIVER",
  "city": "Mumbai"
}
```

Response includes custom JWT token.

### 3. Create Driver Profile
```bash
POST /api/drivers/profile
Headers: Authorization: Bearer <custom_jwt_token>
Body: {
  "name": "John Doe",
  "phoneNumber": "+91-9876543210",
  "rcNumber": "MH01AB1234",
  "dlNumber": "MH0120230001234",
  "permanentAddress": "123 Main St",
  "operatingAddress": "456 Work St",
  "city": "Mumbai",
  "vehicleType": "Car"
}
```

### 4. Search Drivers (as User)
```bash
GET /api/drivers/city/Mumbai
Headers: Authorization: Bearer <user_jwt_token>
```

### 5. Verify Driver (as Admin)
```bash
PATCH /api/drivers/:driverId/verify
Headers: Authorization: Bearer <admin_jwt_token>
```

---

## Important Notes

### TypeScript Errors
The TypeScript errors you see are expected until you run:
1. `bun install` - Installs packages
2. `bun run prisma:generate` - Generates Prisma types including `UserRole` enum

### Clerk Configuration
Make sure to set `CLERK_PUBLISHABLE_KEY` in your environment. The error you saw earlier was because this wasn't set.

### JWT Secret
**CRITICAL:** Change `JWT_SECRET` to a strong, random string in production!

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### File Uploads
For driver documents (RC image, DL image), you'll need to:
1. Set up file storage (e.g., Supabase Storage, AWS S3)
2. Update the driver controller to handle file uploads with multer
3. Store URLs in the database

---

## Next Steps

1. **Run the setup commands** above
2. **Test the authentication flow** with Clerk
3. **Create test users** with different roles
4. **Implement file upload** for driver documents
5. **Add frontend** to consume these APIs

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
