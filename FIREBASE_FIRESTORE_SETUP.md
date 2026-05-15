# Firebase Firestore Setup Guide

Your VJ Piles UG application is now fully integrated with Firebase Firestore. Follow this guide to set up your database collections and start uploading real content.

## Collections Structure

### 1. **movies** Collection
Store all movies in your library.

**Document Fields:**
```
{
  id: auto-generated,
  title: string,
  category: string,
  genre: string,
  stream_url: string,
  rating: number (0-10),
  year: number,
  poster_url: string,
  is_trending: boolean,
  created_at: timestamp,
  updated_at: timestamp
}
```

**Example Document:**
```json
{
  "title": "Bait",
  "category": "Action",
  "genre": "Thriller",
  "stream_url": "https://example.com/bait.mp4",
  "rating": 7.5,
  "year": 2024,
  "poster_url": "https://example.com/bait-poster.jpg",
  "is_trending": true,
  "created_at": "2024-01-15T10:00:00Z"
}
```

### 2. **series** Collection
Store TV series and shows with episodes.

**Document Fields:**
```
{
  id: auto-generated,
  title: string,
  category: string,
  poster_url: string,
  rating: number (0-10),
  year: number,
  episodes: array [
    {
      title: string,
      stream_url: string,
      episode_number: number
    }
  ],
  created_at: timestamp
}
```

**Example Document:**
```json
{
  "title": "Goddess of Fire",
  "category": "Drama",
  "poster_url": "https://example.com/goddess.jpg",
  "rating": 8.5,
  "year": 2023,
  "episodes": [
    {
      "title": "Episode 1",
      "stream_url": "https://example.com/goddess-ep1.mp4",
      "episode_number": 1
    },
    {
      "title": "Episode 2",
      "stream_url": "https://example.com/goddess-ep2.mp4",
      "episode_number": 2
    }
  ],
  "created_at": "2024-01-15T10:00:00Z"
}
```

### 3. **carousel** Collection
Store featured items for the hero carousel.

**Document Fields:**
```
{
  id: auto-generated,
  title: string,
  subtitle: string,
  banner_url: string,
  link_type: string ("movie", "series", "link", "none"),
  link_id: string (optional),
  created_at: timestamp
}
```

**Example Document:**
```json
{
  "title": "Rapid Action",
  "subtitle": "(ENGLISH, DUBBED)",
  "banner_url": "https://example.com/rapid-banner.jpg",
  "link_type": "movie",
  "link_id": "movie-id-123",
  "created_at": "2024-01-15T10:00:00Z"
}
```

### 4. **users** Collection
Automatically populated with user data when they sign in via Google OAuth.

**Document Fields:**
```
{
  id: user-uid,
  uid: string,
  email: string,
  displayName: string,
  photoURL: string,
  isAdmin: boolean,
  created_at: timestamp,
  updated_at: timestamp
}
```

**Note:** Users are automatically created when they sign in with Google. The two admin emails are:
- `okotstephen57@gmail.com`
- `vjpilesugbt@gmail.com`

### 5. **music** Collection (Optional)
For music/audio content.

**Document Fields:**
```
{
  id: auto-generated,
  title: string,
  artist: string,
  genre: string,
  audio_url: string,
  cover_url: string,
  duration: number,
  created_at: timestamp
}
```

## How to Add Content via Admin Dashboard

1. **Sign in** with your Firebase authenticated account
2. **Navigate to Admin Panel** (available in sidebar for admins)
3. **Choose a section:**
   - **Movies**: Add new movies with poster URLs and stream links
   - **Series**: Add TV shows with multiple episodes
   - **Carousel**: Add featured banners for the homepage
   - **Users**: View all users and manage permissions
   - **Music**: Add audio content
   - **Animation**: Add animated content

4. **Fill in the form fields** with your content details
5. **Click "Add"** to save to Firebase
6. **Changes appear instantly** on the website via real-time listeners

## Setting Up Firestore Security Rules

Copy these rules to your Firestore Security Rules in the Firebase Console:

```
rules_version = '3';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to read content collections
    match /{document=**} {
      allow read: if true;
    }
    
    // Admin-only write access for content
    match /movies/{document=**} {
      allow write: if request.auth != null && 
        request.auth.token.email in ['okotstephen57@gmail.com', 'vjpilesugbt@gmail.com'];
    }
    
    match /series/{document=**} {
      allow write: if request.auth != null && 
        request.auth.token.email in ['okotstephen57@gmail.com', 'vjpilesugbt@gmail.com'];
    }
    
    match /carousel/{document=**} {
      allow write: if request.auth != null && 
        request.auth.token.email in ['okotstephen57@gmail.com', 'vjpilesugbt@gmail.com'];
    }
    
    match /music/{document=**} {
      allow write: if request.auth != null && 
        request.auth.token.email in ['okotstephen57@gmail.com', 'vjpilesugbt@gmail.com'];
    }
    
    // Users can read their own user document
    match /users/{uid} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == uid;
      allow update: if request.auth != null && 
        (request.auth.uid == uid || 
         request.auth.token.email in ['okotstephen57@gmail.com', 'vjpilesugbt@gmail.com']);
    }
  }
}
```

## Real-Time Updates

All content updates are **real-time**:
- When you add a movie in the Admin Dashboard → appears instantly on the homepage
- When you delete a series → disappears immediately from all users
- Carousel changes → update the hero section in real-time
- User changes → reflect instantly

## Important Notes

1. **Stream URLs**: Make sure your streaming URLs are publicly accessible or have proper CORS configuration
2. **Image URLs**: Use URLs from CDNs or cloud storage (Cloudinary, AWS S3, Vercel Blob, etc.)
3. **Authentication**: Only admins can modify content. All users can view it.
4. **Data Format**: Ensure dates are stored as Firestore Timestamps, not strings

## Troubleshooting

**Movies/Series not showing?**
- Check that collection names match exactly: `movies`, `series`, `carousel`
- Verify the Firebase Realtime Listener is active in browser console
- Check browser console for errors

**Admin features not visible?**
- Make sure you're signed in with an admin email
- Check that your email is in the ADMIN_EMAILS list in `/lib/auth-context.tsx`

**Changes not appearing?**
- Check that Firestore Rules allow your account to write
- Verify documents are being created in the correct collection
- Refresh the page (real-time listeners should update automatically)

## Next Steps

1. Go to Firebase Console → Firestore Database
2. Create the collections mentioned above
3. Add your first movies/series via the Admin Dashboard
4. Share the app with friends and start streaming!
