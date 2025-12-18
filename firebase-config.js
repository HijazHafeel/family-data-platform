// Firebase Configuration and Initialization
// Using Cloud Firestore for main data storage

const firebaseConfig = {
    apiKey: "AIzaSyA8DV6v1NU9JOGkTvgwqlxfADAn3Obm6NM",
    authDomain: "family-data-platform.firebaseapp.com",
    databaseURL: "https://family-data-platform-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "family-data-platform",
    storageBucket: "family-data-platform.firebasestorage.app",
    messagingSenderId: "281429677812",
    appId: "1:281429677812:web:58066534517ff4d6baf0a1"
};

// Global variables for Firebase services
let app, db, auth, fs;

/**
 * Initialize Firebase services
 * @returns {boolean} Success status
 */
function initializeFirebase() {
    try {
        if (!firebase.apps.length) {
            app = firebase.initializeApp(firebaseConfig);
        } else {
            app = firebase.app();
        }

        db = firebase.database(); // Still initialized for backward compatibility
        auth = firebase.auth();
        fs = firebase.firestore(); // Firestore initialization

        console.log('Firebase services initialized successfully');
        AppState.isFirebaseReady = true;
        return true;
    } catch (error) {
        console.error('Firebase initialization error:', error);
        AppState.isFirebaseReady = false;
        return false;
    }
}

/**
 * Helper object for Cloud Firestore operations
 */
const FirebaseDB = {
    // Families Collection Operations
    async getAllFamilies() {
        try {
            const snapshot = await fs.collection('families').orderBy('createdAt', 'desc').get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching families:', error);
            throw error;
        }
    },

    async addFamily(familyData) {
        try {
            const data = {
                ...familyData,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            const docRef = await fs.collection('families').add(data);
            return {
                id: docRef.id,
                ...data
            };
        } catch (error) {
            console.error('Error adding family:', error);
            throw error;
        }
    },

    async updateFamily(familyId, familyData) {
        try {
            const data = {
                ...familyData,
                updatedAt: Date.now()
            };
            await fs.collection('families').doc(familyId).update(data);
            return {
                id: familyId,
                ...data
            };
        } catch (error) {
            console.error('Error updating family:', error);
            throw error;
        }
    },

    async deleteFamily(familyId) {
        try {
            await fs.collection('families').doc(familyId).delete();
            return true;
        } catch (error) {
            console.error('Error deleting family:', error);
            throw error;
        }
    },

    async searchFamilies(searchTerm) {
        try {
            // Note: Firestore doesn't support partial string search natively like SQL 'LIKE'
            // For simple apps, we fetch and filter, or use prefix matching
            const all = await this.getAllFamilies();
            const term = searchTerm.toLowerCase();
            return all.filter(family =>
                family.familyName?.toLowerCase().includes(term) ||
                family.contactNumber?.includes(term) ||
                family.email?.toLowerCase().includes(term) ||
                family.address?.toLowerCase().includes(term)
            );
        } catch (error) {
            console.error('Error searching families:', error);
            throw error;
        }
    },

    async getAllUsers() {
        try {
            const snapshot = await fs.collection('users').orderBy('createdAt', 'desc').get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },

    async addUser(userData) {
        try {
            const docRef = await fs.collection('users').add(userData);
            return {
                id: docRef.id,
                ...userData
            };
        } catch (error) {
            console.error('Error adding user:', error);
            throw error;
        }
    },

    async getUserByUsername(username) {
        try {
            const snapshot = await fs.collection('users')
                .where('username', '==', username)
                .limit(1)
                .get();

            if (snapshot.empty) return null;

            const doc = snapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            console.error('Error fetching user:', error);
            throw error;
        }
    },

    async updateUserStatus(userId, status, approvedBy) {
        try {
            await fs.collection('users').doc(userId).update({
                status: status,
                approvedBy: approvedBy,
                updatedAt: Date.now()
            });
            return true;
        } catch (error) {
            console.error('Error updating user status:', error);
            throw error;
        }
    },

    // For Backup Utility
    getFamiliesRef() {
        // This is a dummy for firestore to avoid breaking the backup utility code
        // which might expect a Firebase Reference object
        return {
            remove: async () => {
                const snapshot = await fs.collection('families').get();
                const batch = fs.batch();
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                return batch.commit();
            }
        };
    }
};

// Application State
const AppState = {
    currentUser: null,
    families: [],
    users: [],
    isFirebaseReady: false
};

// Auto-initialize if SDKs are loaded
if (typeof firebase !== 'undefined') {
    initializeFirebase();
}
