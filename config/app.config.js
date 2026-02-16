// config/app-config.js
// Firebase Configuration - Smart Burme App

const firebaseConfig = {
    apiKey: "AIzaSyAr7Hv2ApKtNTxF11MhT5cuWeg_Dgsh0TY",
    authDomain: "smart-burme-app.firebaseapp.com",
    projectId: "smart-burme-app",
    storageBucket: "smart-burme-app.appspot.com",
    messagingSenderId: "851502425686",
    appId: "1:851502425686:web:f29e0e1dfa84794b4abdf7"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Firebase emulators for development (optional)
if (window.location.hostname === 'localhost') {
    // Uncomment to use Firebase emulators
    // auth.useEmulator('http://localhost:9099');
    // db.useEmulator('localhost', 8080);
    // storage.useEmulator('localhost', 9199);
    console.log('🔥 Using Firebase emulators');
}

// Auth providers
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

const githubProvider = new firebase.auth.GithubAuthProvider();
const emailProvider = new firebase.auth.EmailAuthProvider();

// Firestore settings
db.settings({
    timestampsInSnapshots: true,
    ignoreUndefinedProperties: true,
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// Enable offline persistence
db.enablePersistence({
    synchronizeTabs: true
}).catch((err) => {
    if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
        console.warn('The current browser does not support offline persistence');
    }
});

// Authentication state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('✅ User signed in:', user.email);
        document.dispatchEvent(new CustomEvent('user-signed-in', { detail: user }));
    } else {
        console.log('👋 User signed out');
        document.dispatchEvent(new CustomEvent('user-signed-out'));
    }
});

// Error handling
auth.onAuthStateChanged((user) => {
    // Handle auth errors
}, (error) => {
    console.error('Auth error:', error);
    showAuthError(error);
});

function showAuthError(error) {
    const errorMessages = {
        'auth/user-not-found': 'Email not found. Please sign up.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/email-already-in-use': 'Email already in use.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/network-request-failed': 'Network error. Check your connection.',
        'auth/popup-closed-by-user': 'Sign-in popup was closed.',
        'auth/cancelled-popup-request': 'Another popup is already open.',
        'auth/unauthorized-domain': 'This domain is not authorized for Firebase.'
    };
    
    const message = errorMessages[error.code] || error.message || 'Authentication error';
    console.error('Auth error:', message);
}

// Firestore collection references
const collections = {
    users: db.collection('users'),
    projects: db.collection('projects'),
    files: db.collection('files'),
    settings: db.collection('settings'),
    analytics: db.collection('analytics'),
    notifications: db.collection('notifications'),
    comments: db.collection('comments'),
    shares: db.collection('shares')
};

// Firestore timestamp
const timestamp = firebase.firestore.FieldValue.serverTimestamp;
const increment = firebase.firestore.FieldValue.increment;

// Export for use in other files
window.firebaseApp = {
    auth,
    db,
    storage,
    collections,
    googleProvider,
    githubProvider,
    emailProvider,
    timestamp,
    increment,
    firebase
};

// Helper functions
window.firebaseHelpers = {
    // Create user profile
    async createUserProfile(user, additionalData = {}) {
        if (!user) return null;
        
        const userRef = collections.users.doc(user.uid);
        const userSnap = await userRef.get();
        
        if (!userSnap.exists) {
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || 'User',
                photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=4f46e5&color=fff`,
                emailVerified: user.emailVerified,
                phoneNumber: user.phoneNumber,
                createdAt: timestamp(),
                lastLogin: timestamp(),
                projectCount: 0,
                settings: {
                    theme: 'dark',
                    fontSize: 14,
                    autoSave: true,
                    notifications: true
                },
                ...additionalData
            };
            
            await userRef.set(userData);
            return userData;
        } else {
            // Update last login
            await userRef.update({
                lastLogin: timestamp(),
                ...additionalData
            });
            return userSnap.data();
        }
    },
    
    // Sign out
    async signOut() {
        try {
            await auth.signOut();
            return { success: true };
        } catch (error) {
            return { success: false, error };
        }
    },
    
    // Get current user data
    async getCurrentUserData() {
        const user = auth.currentUser;
        if (!user) return null;
        
        const userSnap = await collections.users.doc(user.uid).get();
        return userSnap.data();
    },
    
    // Update user profile
    async updateUserProfile(data) {
        const user = auth.currentUser;
        if (!user) throw new Error('No user signed in');
        
        await collections.users.doc(user.uid).update({
            ...data,
            updatedAt: timestamp()
        });
        
        return { success: true };
    }
};

// Security rules reminder (for console)
console.log(`
🔐 Firebase Security Rules Reminder:
------------------------------------
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Projects collection
    match /projects/{projectId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || request.auth.uid == 'admin');
    }
    
    // Files collection
    match /files/{fileId} {
      allow read, write: if request.auth != null;
    }
  }
}
`);
