import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyCCLBZ7vuMmYZTK_gyOvAsAR2Ahf0lyp94",
  authDomain: "vj-oneflex-1b735.firebaseapp.com",
  projectId: "vj-oneflex-1b735",
  storageBucket: "vj-oneflex-1b735.firebasestorage.app",
  messagingSenderId: "680715542379",
  appId: "1:680715542379:web:4319f44b8427183027b62e"
};
// Initialize Firebase
export const app = initializeApp(firebaseConfig)

// Initialize Firebase Auth
export const auth = getAuth(app)

// Initialize Cloud Firestore
export const db = getFirestore(app)

// Initialize Cloud Storage
export const storage = getStorage(app)

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider()
googleProvider.addScope('profile')
googleProvider.addScope('email')
