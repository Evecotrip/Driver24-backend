# Frontend Integration Example

## Updated Authentication Flow with ClerkId

### 1. User Signs Up/In with Clerk

```typescript
import { useAuth, useUser } from '@clerk/clerk-react';

function App() {
  const { isSignedIn, user } = useUser();
  const [customToken, setCustomToken] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    if (isSignedIn && user && !customToken) {
      // Check if user has already selected a role
      checkUserRole(user.id);
    }
  }, [isSignedIn, user]);

  return (
    <>
      {showRoleModal && <RoleSelectionModal userId={user.id} />}
      {/* Your app content */}
    </>
  );
}
```

### 2. Role Selection Component

```typescript
interface RoleSelectionModalProps {
  userId: string; // This is the Clerk user ID
}

function RoleSelectionModal({ userId }: RoleSelectionModalProps) {
  const [role, setRole] = useState<'USER' | 'DRIVER'>('USER');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelectRole = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/select-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId: userId,  // ← Just send the Clerk user ID!
          role,
          city
        })
      });

      const data = await response.json();

      if (data.success) {
        // Store the custom JWT token
        localStorage.setItem('customToken', data.data.token);
        
        // Store user data
        localStorage.setItem('userData', JSON.stringify(data.data.user));
        
        console.log('✅ Role selected successfully!');
        console.log('Token:', data.data.token);
        
        // Redirect or close modal
        window.location.reload();
      } else {
        console.error('❌ Error:', data.error);
        alert(data.error);
      }
    } catch (error) {
      console.error('❌ Request failed:', error);
      alert('Failed to select role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <h2>Select Your Role</h2>
      
      <div>
        <label>
          <input
            type="radio"
            value="USER"
            checked={role === 'USER'}
            onChange={(e) => setRole(e.target.value as 'USER')}
          />
          User (Find Drivers)
        </label>
        
        <label>
          <input
            type="radio"
            value="DRIVER"
            checked={role === 'DRIVER'}
            onChange={(e) => setRole(e.target.value as 'DRIVER')}
          />
          Driver (Offer Services)
        </label>
      </div>

      <input
        type="text"
        placeholder="Enter your city"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        required
      />

      <button onClick={handleSelectRole} disabled={loading || !city}>
        {loading ? 'Selecting...' : 'Continue'}
      </button>
    </div>
  );
}
```

### 3. Making API Requests with Custom JWT

```typescript
// Helper function to get custom token
function getCustomToken(): string | null {
  return localStorage.getItem('customToken');
}

// Example: Get drivers in a city (USER role)
async function getDriversByCity(city: string) {
  const token = getCustomToken();
  
  if (!token) {
    throw new Error('Please select your role first');
  }

  const response = await fetch(`http://localhost:3000/api/drivers/city/${city}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });

  return response.json();
}

// Example: Create driver profile (DRIVER role)
async function createDriverProfile(driverData: any) {
  const token = getCustomToken();
  
  if (!token) {
    throw new Error('Please select your role first');
  }

  const response = await fetch('http://localhost:3000/api/drivers/profile', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(driverData)
  });

  return response.json();
}

// Example: Update driver availability
async function updateAvailability(available: boolean) {
  const token = getCustomToken();
  
  if (!token) {
    throw new Error('Please select your role first');
  }

  const response = await fetch('http://localhost:3000/api/drivers/availability', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ availability: available })
  });

  return response.json();
}
```

### 4. Check if User Has Selected Role

```typescript
async function checkUserRole(clerkId: string) {
  try {
    // Try to get user profile from backend
    const response = await fetch(`http://localhost:3000/api/users/${clerkId}`);
    const data = await response.json();

    if (data.success && data.data.role) {
      // User has already selected a role
      console.log('User role:', data.data.role);
      return true;
    } else {
      // User needs to select a role
      setShowRoleModal(true);
      return false;
    }
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
}
```

### 5. Complete React Hook Example

```typescript
import { useAuth, useUser } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';

export function useCustomAuth() {
  const { isSignedIn, user } = useUser();
  const [customToken, setCustomToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'USER' | 'DRIVER' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('customToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      setCustomToken(token);
      const parsed = JSON.parse(userData);
      setUserRole(parsed.role);
    }
    
    setLoading(false);
  }, []);

  const selectRole = async (role: 'USER' | 'DRIVER', city: string) => {
    if (!user) throw new Error('Not signed in');

    const response = await fetch('http://localhost:3000/api/auth/select-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clerkId: user.id,
        role,
        city
      })
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem('customToken', data.data.token);
      localStorage.setItem('userData', JSON.stringify(data.data.user));
      setCustomToken(data.data.token);
      setUserRole(data.data.user.role);
    }

    return data;
  };

  const logout = () => {
    localStorage.removeItem('customToken');
    localStorage.removeItem('userData');
    setCustomToken(null);
    setUserRole(null);
  };

  return {
    isSignedIn,
    user,
    customToken,
    userRole,
    loading,
    selectRole,
    logout,
    needsRoleSelection: isSignedIn && !userRole
  };
}
```

### 6. Usage in Components

```typescript
function Dashboard() {
  const { needsRoleSelection, userRole, customToken } = useCustomAuth();

  if (needsRoleSelection) {
    return <RoleSelectionModal />;
  }

  if (userRole === 'DRIVER') {
    return <DriverDashboard />;
  }

  if (userRole === 'USER') {
    return <UserDashboard />;
  }

  return <div>Loading...</div>;
}
```

## Key Points

1. ✅ **No Clerk token needed** for role selection - just send `clerkId`
2. ✅ **Simpler frontend** - no need to get Clerk session token
3. ✅ **Custom JWT** contains internal UUID, not Clerk ID
4. ✅ **Store token** in localStorage or secure storage
5. ✅ **Use custom JWT** for all API requests after role selection

## Security Note

The `clerkId` is public information (it's in the Clerk user object), so it's safe to send it in the request body. The backend validates that the user exists before creating the JWT token.
