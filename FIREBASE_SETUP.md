# Firebase Setup Guide

This project now uses **Firebase** instead of Supabase for authentication and database functionality.

## Firebase Configuration

Your Firebase project is already configured with:
- **Project ID**: vj-oneflex
- **Auth Domain**: vj-oneflex.firebaseapp.com
- **Database URL**: https://vj-oneflex-default-rtdb.firebaseio.com
- **Storage Bucket**: vj-oneflex.firebasestorage.app

The configuration is in `/lib/firebase.ts`

## Authentication Features

### ✅ Implemented
- **Google OAuth Login**: One-click sign-in with Google
- **Email/Password Login**: Traditional email login
- **Floating Login Modal**: Click "Sign In" button in sidebar to open the login modal
- **Admin Access**: Two admin accounts have full access to the admin panel:
  - `okotstephen57@gmail.com`
  - `vjpilesugbt@gmail.com`
- **Session Management**: Persistent login using Firebase Auth

## Database Collections

Set up these Firestore collections for full functionality:

### 1. **movies** Collection
Create a collection named `movies` with these fields:
```
{
  id: string (auto)
  title: string
  year: number
  genre: string
  rating: number (0-5)
  poster_url: string
  description: string (optional)
  duration: number (minutes, optional)
  created_at: timestamp
}
```

### 2. **series** Collection
Create a collection named `series` with these fields:
```
{
  id: string (auto)
  title: string
  year: number
  genre: string
  rating: number (0-5)
  poster_url: string
  description: string (optional)
  episodes: number (optional)
  created_at: timestamp
}
```

### 3. **users** Collection
Create a collection named `users` with these fields:
```
{
  uid: string (Firebase Auth UID)
  email: string
  displayName: string (optional)
  photoURL: string (optional)
  created_at: timestamp
  updated_at: timestamp
}
```

### 4. **carousel** Collection (Optional)
For featured/carousel items:
```
{
  id: string (auto)
  title: string
  image_url: string
  link: string (optional)
  order: number
  created_at: timestamp
}
```

## API Utilities

Use the utilities in `/lib/firebase-utils.ts` for database operations:

```typescript
import { addMovie, getMovies, updateMovie, deleteMovie } from '@/lib/firebase-utils'

// Add a movie
const movieId = await addMovie({
  title: 'Example Movie',
  year: 2025,
  genre: 'Action',
  rating: 4.5,
  poster_url: '/path/to/poster.jpg'
})

// Get all movies
const movies = await getMovies()

// Update a movie
await updateMovie(movieId, { title: 'Updated Title' })

// Delete a movie
await deleteMovie(movieId)
```

## Admin Panel

### Access
Only admin users can access `/admin`:
1. Sign in with `okotstephen57@gmail.com` or `vjpilesugbt@gmail.com`
2. Click "Admin Panel" in the sidebar

### Admin Features
- **Dashboard**: View overview
- **Movies**: Add, edit, delete movies
- **Series**: Add, edit, delete series
- **Carousel**: Manage featured items
- **Music**: Manage music content
- **Animation**: Manage animation content
- **Originals**: Manage original content
- **Users**: View and manage users
- **Wallet**: View wallet/payment info

## Login Flow

1. **User clicks "Sign In"** → Login modal opens
2. **User chooses login method**:
   - **Google**: Redirects to Google OAuth → Auto-creates user in Firebase
   - **Email**: Enter email & password
3. **Auth status saved** in Firebase Auth
4. **User info available** via `useAuth()` hook

## Logout

Click **"Log Out"** in the sidebar to sign out.

## Components

### `LoginModal` (`/components/login-modal.tsx`)
Floating modal for authentication with:
- Google OAuth button
- Email/password form
- Error handling
- Loading states

### `AuthProvider` (`/lib/auth-context.tsx`)
Context provider for authentication state management.

### `useAuth()` Hook
```typescript
import { useAuth } from '@/lib/auth-context'

export function MyComponent() {
  const { user, loading, isAdmin } = useAuth()
  
  if (loading) return <p>Loading...</p>
  if (!user) return <p>Not signed in</p>
  
  return <p>Welcome {user.email}</p>
}
```

## Environment Variables

No additional environment variables needed! Firebase config is already set up in `/lib/firebase.ts`

## Testing

1. Sign in with Google (recommended for testing)
2. Sign in with email (requires email in Firebase Auth)
3. Access admin panel with admin email
4. Try CRUD operations in admin pages

## Troubleshooting

### Firebase errors
- Check browser console for detailed error messages
- Ensure Firebase project is active in Firebase Console
- Verify Firestore database is in "production mode" (not test mode)

### Auth issues
- Clear browser cookies and try again
- Check Firebase Console > Authentication for user list
- Verify email/password credentials in Firebase Auth

### Database errors
- Create collections in Firestore if missing
- Check collection names match exactly (case-sensitive)
- Verify security rules allow read/write for authenticated users

## Firebase Security Rules

Recommended Firestore security rules (set in Firebase Console):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read, authenticated write
    match /movies/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && isAdmin();
    }
    match /series/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && isAdmin();
    }
    match /carousel/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && isAdmin();
    }
    
    // User data
    match /users/{uid} {
      allow read: if request.auth.uid == uid;
      allow write: if request.auth.uid == uid;
    }
    
    function isAdmin() {
      return request.auth.token.email in ['okotstephen57@gmail.com', 'vjpilesugbt@gmail.com'];
    }
  }
}
```

## Next Steps

1. ✅ Firebase auth is integrated
2. ⏳ Create Firestore collections
3. ⏳ Update admin pages to use Firebase database
4. ⏳ Add more content via admin panel
