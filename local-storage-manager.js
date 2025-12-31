// Local Storage Manager for Master Admin File Uploads
// Uses IndexedDB to store files locally in the browser

const DB_NAME = 'FamilyFilesDB';
const DB_VERSION = 1;
const STORE_NAME = 'familyFiles';
let db = null;

// Initialize IndexedDB
async function initLocalStorage() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('IndexedDB error:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('IndexedDB initialized successfully');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Create object store if it doesn't exist
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = database.createObjectStore(STORE_NAME, {
                    keyPath: 'id',
                    autoIncrement: true
                });

                // Create indexes
                objectStore.createIndex('familyId', 'familyId', { unique: false });
                objectStore.createIndex('fileName', 'fileName', { unique: false });
                objectStore.createIndex('uploadDate', 'uploadDate', { unique: false });
            }
        };
    });
}

// Check if current device is the Master Device
function isMasterDevice() {
    return localStorage.getItem('masterDeviceFlag') === 'true';
}

// Set current device as Master Device (one-time setup)
function setMasterDevice() {
    const confirmed = confirm(
        'Set this device as the Master Device?\n\n' +
        'Only the Master Device can upload and manage files.\n' +
        'This action cannot be easily undone.'
    );

    if (confirmed) {
        localStorage.setItem('masterDeviceFlag', 'true');
        localStorage.setItem('masterDeviceSetDate', new Date().toISOString());
        showToast('This device is now set as the Master Device', 'success');
        return true;
    }
    return false;
}

// Check if user can upload files (must be 'admin' AND on master device)
function canUploadFiles() {
    const user = AppState.currentUser;
    if (!user || user.username !== 'admin') {
        return false;
    }
    return isMasterDevice();
}

// Store file in IndexedDB
async function storeLocalFile(familyId, file) {
    if (!db) {
        await initLocalStorage();
    }

    // Validate file size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
        throw new Error('File size exceeds 10MB limit');
    }

    // Validate file type
    const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png',
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only images, PDF, and Excel files are allowed');
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            const fileData = {
                familyId: familyId,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                fileData: e.target.result, // Base64 or ArrayBuffer
                uploadDate: new Date().toISOString(),
                uploadedBy: AppState.currentUser.username
            };

            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.add(fileData);

            request.onsuccess = () => {
                const fileId = request.result;
                resolve({
                    id: fileId,
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    uploadDate: fileData.uploadDate
                });
            };

            request.onerror = () => {
                reject(request.error);
            };
        };

        reader.onerror = () => {
            reject(reader.error);
        };

        // Read file as Data URL (Base64)
        reader.readAsDataURL(file);
    });
}

// Get all files for a specific family
async function getLocalFiles(familyId) {
    if (!db) {
        await initLocalStorage();
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const index = objectStore.index('familyId');
        const request = index.getAll(familyId);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Get a specific file by ID
async function getLocalFile(fileId) {
    if (!db) {
        await initLocalStorage();
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.get(fileId);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Delete a file from IndexedDB
async function deleteLocalFile(fileId) {
    if (!db) {
        await initLocalStorage();
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.delete(fileId);

        request.onsuccess = () => {
            resolve(true);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Download a file from IndexedDB
async function downloadLocalFile(fileId) {
    try {
        const fileData = await getLocalFile(fileId);

        if (!fileData) {
            throw new Error('File not found');
        }

        // Create a download link
        const link = document.createElement('a');
        link.href = fileData.fileData;
        link.download = fileData.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('File downloaded successfully', 'success');
    } catch (error) {
        console.error('Download error:', error);
        showToast('Error downloading file', 'error');
    }
}

// Get total storage usage
async function getStorageUsage() {
    if (!db) {
        await initLocalStorage();
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.getAll();

        request.onsuccess = () => {
            const files = request.result;
            const totalSize = files.reduce((sum, file) => sum + file.fileSize, 0);
            const totalFiles = files.length;

            resolve({
                totalFiles,
                totalSize,
                totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
            });
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Format file size for display
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initLocalStorage();
        console.log('Local storage initialized');
    } catch (error) {
        console.error('Failed to initialize local storage:', error);
    }
});
