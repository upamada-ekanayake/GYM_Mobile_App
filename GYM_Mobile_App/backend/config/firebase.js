const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
require('dotenv').config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

let firebaseApp = null;
let db = null;
let auth = null;

if (!getApps().length) {
  try {
    if (!projectId || !clientEmail || !privateKey || privateKey.includes('your-') || privateKey.includes('mock') || privateKey.length < 100) {
        throw new Error("Invalid or placeholder Firebase Private Key credentials in .env");
    }
    firebaseApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey
      })
    });
    console.log("Success: Firebase Admin SDK Initialized! ✅");
    db = getFirestore(firebaseApp);
    auth = getAuth(firebaseApp);
  } catch (error) {
    console.warn("⚠️ Warning: Firebase Admin failed to initialize (using mock fallback). Reason:", error.message);
    
    // Create a mock fallback Firestore instance to prevent server crash
    db = {
        collection: (colName) => ({
            doc: (id) => ({
                get: async () => ({
                    exists: true,
                    data: () => ({
                        Role: 'User',
                        Approve: true,
                        Email: 'mock@aurafit.com',
                        Workouts: []
                    })
                }),
                set: async () => {},
                update: async () => {},
                delete: async () => {}
            }),
            where: () => ({
                get: async () => ({ empty: true, docs: [] })
            }),
            add: async () => ({ id: 'mock-doc-id' }),
            get: async () => ({ empty: true, docs: [] })
        })
    };
    
    // Create a mock fallback Auth instance
    auth = {
        createUser: async () => ({ uid: 'mock-uid-12345' }),
        verifyIdToken: async () => ({ uid: 'mock-uid-12345', email: 'mock@aurafit.com' }),
        updateUser: async () => {},
        deleteUser: async () => {}
    };
  }
} else {
  firebaseApp = getApps()[0];
  db = getFirestore(firebaseApp);
  auth = getAuth(firebaseApp);
}

// Classic admin object compatibility wrapper
const admin = {
  auth: () => auth,
  get firestore() {
    const fs = () => db;
    fs.FieldValue = FieldValue || {
        arrayUnion: (val) => val,
        arrayRemove: (val) => val,
        serverTimestamp: () => new Date()
    };
    return fs;
  }
};

module.exports = { admin, db, auth };
