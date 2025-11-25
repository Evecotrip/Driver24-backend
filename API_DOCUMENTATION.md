# API Documentation

## Authentication Flow

### 1. User Signs Up/In with Clerk
Users authenticate using Clerk on the frontend and receive a Clerk session token.

### 2. Select Role and Get Custom JWT
After Clerk authentication, users must select their role (USER or DRIVER) to receive a custom JWT token.

**Endpoint:** `POST /api/auth/select-role`

**No authentication required** - Just send the clerkId from Clerk user object.

**Body:**
```json
{
  "clerkId": "user_35jYe2uGOwvWymEg2LfxipWkODx",  // From Clerk user.id
  "role": "DRIVER",  // USER or DRIVER (ADMIN not allowed)
  "city": "Mumbai"   // Required for USER and DRIVER roles
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",  // Internal UUID
      "email": "driver@example.com",
      "role": "DRIVER",
      "city": "Mumbai"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Role selected successfully. Use this token for API requests."
}
```

### 3. Use Custom JWT for All Subsequent Requests
Use the custom JWT token (not Clerk token) for all API requests.

**Headers:**
```
Authorization: Bearer <custom_jwt_token>
```

---

## API Endpoints

### Auth Endpoints

#### Get Profile
`GET /api/auth/profile`
- **Auth:** Clerk session token required
- **Returns:** User profile with role and driver profile (if applicable)

#### Refresh Token
`POST /api/auth/refresh-token`
- **Auth:** Clerk session token required
- **Returns:** New custom JWT token

---

### Driver Endpoints

#### Create/Update Driver Profile
`POST /api/drivers/profile`
- **Auth:** JWT token with DRIVER role required
- **Body:**
```json
{
  "name": "John Doe",
  "phoneNumber": "+91-9876543210",
  "rcNumber": "MH01AB1234",
  "rcImage": "https://example.com/rc.jpg",
  "dlNumber": "MH0120230001234",
  "dlImage": "https://example.com/dl.jpg",
  "permanentAddress": "123 Main St, Mumbai",
  "operatingAddress": "456 Work St, Mumbai",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "vehicleType": "Car",
  "vehicleModel": "Honda City",
  "vehicleNumber": "MH01AB1234",
  "experience": 5,
  "availability": true
}
```

#### Get My Driver Profile
`GET /api/drivers/profile/me`
- **Auth:** JWT token with DRIVER role required
- **Returns:** Driver's own profile

#### Update Availability
`PATCH /api/drivers/availability`
- **Auth:** JWT token with DRIVER role required
- **Body:**
```json
{
  "availability": false
}
```

#### Get Drivers by City
`GET /api/drivers/city/:city`
- **Auth:** JWT token with USER or ADMIN role required
- **Example:** `/api/drivers/city/Mumbai`
- **Returns:** List of verified, available drivers in the specified city

#### Get All Drivers (Admin)
`GET /api/drivers/all`
- **Auth:** JWT token with ADMIN role required
- **Query params:**
  - `verified=true/false` - Filter by verification status
  - `city=Mumbai` - Filter by city
- **Returns:** List of all drivers with filters

#### Verify Driver (Admin)
`PATCH /api/drivers/:driverId/verify`
- **Auth:** JWT token with ADMIN role required
- **Returns:** Updated driver with verification status

---

### User Endpoints

#### Get All Users
`GET /api/users`
- **Auth:** JWT token required
- **Returns:** List of all users

#### Get Current User
`GET /api/users/me`
- **Auth:** JWT token required
- **Returns:** Current user profile

#### Get User by ID
`GET /api/users/:id`
- **Auth:** JWT token required
- **Returns:** User profile by ID

---

### Webhook Endpoints

#### Clerk Webhook
`POST /api/webhooks/clerk`
- **Auth:** Clerk webhook signature verification
- **Purpose:** Syncs user data from Clerk to Supabase
- **Events:** user.created, user.updated, user.deleted

---

## Role-Based Access Control

### USER Role
- Can view drivers in their city
- Cannot create driver profiles
- Cannot access admin functions

### DRIVER Role
- Can create and update their own driver profile
- Can update their availability status
- Cannot view other drivers
- Cannot access admin functions

### ADMIN Role
- Can view all drivers
- Can verify drivers
- Can view all users
- Full access to all endpoints

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid role. Must be USER, DRIVER, or ADMIN"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Access denied. Required role: ADMIN"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Driver profile not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to create driver profile"
}
```

---

## Example Usage Flow

### For Drivers:
1. Sign up/in with Clerk → Get Clerk token
2. Select DRIVER role → Get custom JWT
3. Create driver profile with all details
4. Update availability as needed

### For Users:
1. Sign up/in with Clerk → Get Clerk token
2. Select USER role with their city → Get custom JWT
3. Search for drivers in their city
4. View driver details (verified drivers only)

### For Admins:
1. Sign up/in with Clerk → Get Clerk token
2. Select ADMIN role → Get custom JWT
3. View all drivers
4. Verify driver profiles
5. Manage users and drivers
