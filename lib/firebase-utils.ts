import { db } from './firebase'
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  updateDoc,
  setDoc,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'

// Movies Collection
export async function addMovie(movieData: any) {
  try {
    const docRef = await addDoc(collection(db, 'movies'), {
      ...movieData,
      created_at: new Date(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error adding movie:', error)
    throw error
  }
}

export async function getMovies() {
  try {
    const q = query(collection(db, 'movies'), orderBy('created_at', 'desc'))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Error getting movies:', error)
    throw error
  }
}

export async function updateMovie(movieId: string, movieData: any) {
  try {
    await updateDoc(doc(db, 'movies', movieId), movieData)
  } catch (error) {
    console.error('Error updating movie:', error)
    throw error
  }
}

export async function deleteMovie(movieId: string) {
  try {
    await deleteDoc(doc(db, 'movies', movieId))
  } catch (error) {
    console.error('Error deleting movie:', error)
    throw error
  }
}

// Series Collection
export async function addSeries(seriesData: any) {
  try {
    const docRef = await addDoc(collection(db, 'series'), {
      ...seriesData,
      created_at: new Date(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error adding series:', error)
    throw error
  }
}

export async function getSeries() {
  try {
    const q = query(collection(db, 'series'), orderBy('created_at', 'desc'))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Error getting series:', error)
    throw error
  }
}

export async function updateSeries(seriesId: string, seriesData: any) {
  try {
    await updateDoc(doc(db, 'series', seriesId), seriesData)
  } catch (error) {
    console.error('Error updating series:', error)
    throw error
  }
}

export async function deleteSeries(seriesId: string) {
  try {
    await deleteDoc(doc(db, 'series', seriesId))
  } catch (error) {
    console.error('Error deleting series:', error)
    throw error
  }
}

// Originals Collection
export async function addOriginal(data: any) {
  try {
    const docRef = await addDoc(collection(db, 'originals'), {
      ...data,
      created_at: new Date(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error adding original:', error)
    throw error
  }
}

export async function getOriginals() {
  try {
    const q = query(collection(db, 'originals'), orderBy('created_at', 'desc'))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }))
  } catch (error) {
    console.error('Error getting originals:', error)
    throw error
  }
}

export async function updateOriginal(id: string, data: any) {
  try {
    await updateDoc(doc(db, 'originals', id), data)
  } catch (error) {
    console.error('Error updating original:', error)
    throw error
  }
}

export async function deleteOriginal(id: string) {
  try {
    await deleteDoc(doc(db, 'originals', id))
  } catch (error) {
    console.error('Error deleting original:', error)
    throw error
  }
}

// Animations Collection
export async function addAnimation(data: any) {
  try {
    const docRef = await addDoc(collection(db, 'animations'), {
      ...data,
      created_at: new Date(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error adding animation:', error)
    throw error
  }
}

export async function getAnimations() {
  try {
    const q = query(collection(db, 'animations'), orderBy('created_at', 'desc'))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }))
  } catch (error) {
    console.error('Error getting animations:', error)
    throw error
  }
}

export async function updateAnimation(id: string, data: any) {
  try {
    await updateDoc(doc(db, 'animations', id), data)
  } catch (error) {
    console.error('Error updating animation:', error)
    throw error
  }
}

export async function deleteAnimation(id: string) {
  try {
    await deleteDoc(doc(db, 'animations', id))
  } catch (error) {
    console.error('Error deleting animation:', error)
    throw error
  }
}

// Music Videos Collection
export async function addMusicVideo(data: any) {
  try {
    const docRef = await addDoc(collection(db, 'music_videos'), {
      ...data,
      created_at: new Date(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error adding music video:', error)
    throw error
  }
}

export async function getMusicVideos() {
  try {
    const q = query(collection(db, 'music_videos'), orderBy('created_at', 'desc'))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }))
  } catch (error) {
    console.error('Error getting music videos:', error)
    throw error
  }
}

export async function updateMusicVideo(id: string, data: any) {
  try {
    await updateDoc(doc(db, 'music_videos', id), data)
  } catch (error) {
    console.error('Error updating music video:', error)
    throw error
  }
}

export async function deleteMusicVideo(id: string) {
  try {
    await deleteDoc(doc(db, 'music_videos', id))
  } catch (error) {
    console.error('Error deleting music video:', error)
    throw error
  }
}

// Carousel Collection
export async function addCarouselItem(data: any) {
  try {
    const docRef = await addDoc(collection(db, 'carousel'), {
      ...data,
      created_at: new Date(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error adding carousel item:', error)
    throw error
  }
}

export async function getCarouselItems() {
  try {
    const q = query(collection(db, 'carousel'), orderBy('order', 'asc'))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }))
  } catch (error) {
    console.error('Error getting carousel items:', error)
    throw error
  }
}

export async function updateCarouselItem(id: string, data: any) {
  try {
    await updateDoc(doc(db, 'carousel', id), data)
  } catch (error) {
    console.error('Error updating carousel item:', error)
    throw error
  }
}

export async function deleteCarouselItem(id: string) {
  try {
    await deleteDoc(doc(db, 'carousel', id))
  } catch (error) {
    console.error('Error deleting carousel item:', error)
    throw error
  }
}

// Wallet Collection
export async function getWalletBalance() {
  try {
    const q = query(collection(db, 'subscriptions'))
    const snapshot = await getDocs(q)
    let total = 0
    snapshot.forEach((doc) => {
      const data = doc.data()
      total += data.amount || 0
    })
    return total
  } catch (error) {
    console.error('Error getting wallet balance:', error)
    return 0
  }
}

export async function addWithdrawal(data: { amount: number; method: string; account: string; notes?: string }) {
  try {
    const docRef = await addDoc(collection(db, 'withdrawals'), {
      ...data,
      status: 'pending',
      created_at: new Date(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error adding withdrawal:', error)
    throw error
  }
}

// Users Collection
export async function addUser(userId: string, userData: any) {
  try {
    console.log('[v0] addUser: Saving user:', userId, userData.email)
    const userDocRef = doc(db, 'users', userId)
    
    // Check if user already exists
    const docSnap = await getDoc(userDocRef)
    const isNewUser = !docSnap.exists()
    console.log('[v0] addUser: User exists:', !isNewUser)
    
    // Use setDoc with merge: true to create if doesn't exist or update if it does
    await setDoc(userDocRef, {
      uid: userId,
      ...userData,
      last_login: serverTimestamp(),
      updated_at: serverTimestamp(),
      ...(isNewUser && { created_at: serverTimestamp() })
    }, { merge: true })
    console.log('[v0] addUser: Success - user saved to Firestore')
  } catch (error: any) {
    console.error('[v0] addUser: Error:', error?.code, error?.message)
    throw error
  }
}

export async function getUser(userId: string) {
  try {
    const q = query(collection(db, 'users'), where('uid', '==', userId))
    const querySnapshot = await getDocs(q)
    if (querySnapshot.docs.length > 0) {
      return {
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data(),
      }
    }
    return null
  } catch (error) {
    console.error('Error getting user:', error)
    throw error
  }
}

export async function getUsers() {
  try {
    const q = query(collection(db, 'users'))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Error getting users:', error)
    throw error
  }
}
