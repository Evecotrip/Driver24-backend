# Migration Guide: Separate ClerkId from Internal UserId

## What Changed

Previously, the `User.id` field stored the Clerk user ID directly. Now:
- **`id`** - Internal UUID (auto-generated)
- **`clerkId`** - Clerk user ID (unique, indexed)

This separation provides better flexibility and follows best practices for external ID management.

## Database Changes

### Before:
```prisma
model User {
  id                String    @id // Clerk user ID
  email             String    @unique
  // ...
}
```

### After:
```prisma
model User {
  id                String    @id @default(uuid()) // Internal UUID
  clerkId           String    @unique // Clerk user ID
  email             String    @unique
  // ...
  @@index([clerkId])
}
```

## Migration Steps

### 1. Generate Prisma Client
```bash
bun run prisma:generate
```

This will generate the new Prisma types with `clerkId` field.

### 2. Create Migration

**Option A: Development (Quick)**
```bash
bun run prisma:push
```

**Option B: Production (Recommended)**
```bash
bun run prisma:migrate dev --name separate-clerk-id
```

### 3. Data Migration (If you have existing data)

If you already have users in your database, you need to migrate the data:

```sql
-- Add the new clerkId column
ALTER TABLE users ADD COLUMN "clerkId" TEXT;

-- Copy existing id values to clerkId
UPDATE users SET "clerkId" = id;

-- Add unique constraint
ALTER TABLE users ADD CONSTRAINT users_clerkId_key UNIQUE ("clerkId");

-- Create index
CREATE INDEX users_clerkId_idx ON users("clerkId");

-- Generate new UUIDs for id column
-- WARNING: This will break existing foreign key relationships!
-- Make sure to update related tables accordingly
ALTER TABLE users ALTER COLUMN id DROP DEFAULT;
UPDATE users SET id = gen_random_uuid();
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
```

**IMPORTANT:** If you have existing driver profiles or other related data, you'll need to handle the foreign key updates carefully.

### 4. Restart Server
```bash
bun run dev
```

## Code Changes Summary

All code changes have been made automatically:

### Webhook Handler (`src/webhooks/clerk.ts`)
- ✅ `user.create` - Uses `clerkId` instead of `id`
- ✅ `user.update` - Looks up by `clerkId`
- ✅ `user.delete` - Looks up by `clerkId`

### Auth Controller (`src/controllers/auth.controller.ts`)
- ✅ `selectRole` - Looks up user by `clerkId`, returns internal `id` in JWT
- ✅ `getProfile` - Looks up by `clerkId`
- ✅ `refreshToken` - Looks up by `clerkId`

### User Controller (`src/controllers/user.controller.ts`)
- ✅ `getCurrentUser` - Looks up by `clerkId`
- ℹ️ `getUserById` - Still uses internal `id` (correct behavior)

### JWT Token
The JWT token now contains the **internal UUID** (`user.id`), not the Clerk ID:
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000", // Internal UUID
  "email": "user@example.com",
  "role": "DRIVER",
  "city": "Mumbai"
}
```

## Benefits

1. **Decoupling** - Internal ID independent of external auth provider
2. **Flexibility** - Can switch auth providers without changing primary keys
3. **Security** - Internal IDs not exposed to external systems
4. **Best Practice** - Follows standard database design patterns

## Testing

After migration, test these flows:

1. **New User Signup** (via Clerk webhook)
   - User created with auto-generated UUID `id`
   - Clerk ID stored in `clerkId`

2. **Role Selection**
   - User looked up by `clerkId`
   - JWT contains internal `id`

3. **API Requests**
   - JWT verified with internal `id`
   - Works seamlessly with driver profiles

4. **User Updates** (via Clerk webhook)
   - User found by `clerkId`
   - Updates applied correctly

## Rollback (If Needed)

If you need to rollback:

```bash
# Revert the schema changes
git checkout HEAD~1 prisma/schema.prisma

# Regenerate Prisma client
bun run prisma:generate

# Revert code changes
git checkout HEAD~1 src/
```

Then recreate the database or run migrations in reverse.
