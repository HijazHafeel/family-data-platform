// Backup Utility Logic

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    initializeBackupUtility();
});

// Check if user is admin
function checkAdminAuth() {
    const session = localStorage.getItem('userSession');
    if (!session) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const user = JSON.parse(session);
        if (user.role !== 'admin') {
            showToast('Access denied. Admin privileges required.', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }

        AppState.currentUser = user;
    } catch (error) {
        window.location.href = 'index.html';
    }
}

// Initialize backup utility
async function initializeBackupUtility() {
    await loadAllData();
    updateBackupStatus();
}

// Load all data
async function loadAllData() {
    try {
        if (AppState.isFirebaseReady && FirebaseDB) {
            AppState.families = await FirebaseDB.getAllFamilies();
        } else {
            const stored = localStorage.getItem('familiesData');
            AppState.families = stored ? JSON.parse(stored) : [];
        }
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error loading data', 'error');
    }
}

// Update backup status
function updateBackupStatus() {
    document.getElementById('totalRecords').textContent = AppState.families.length;

    const lastBackup = localStorage.getItem('lastBackupDate');
    if (lastBackup) {
        const date = new Date(parseInt(lastBackup));
        document.getElementById('lastBackup').textContent = date.toLocaleString();
    } else {
        document.getElementById('lastBackup').textContent = 'Never';
    }
}

// Backup as JSON
function backupAsJSON() {
    if (AppState.families.length === 0) {
        showToast('No data to backup', 'warning');
        return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `family-data-backup-${timestamp}.json`;

    const backupData = {
        exportDate: new Date().toISOString(),
        exportedBy: AppState.currentUser.username,
        totalRecords: AppState.families.length,
        data: AppState.families
    };

    exportAsJSON(backupData, filename);
    updateLastBackupDate();
    showToast('JSON backup downloaded successfully! Save it to your Dialog router USB.', 'success');
}

// Backup as CSV
function backupAsCSV() {
    if (AppState.families.length === 0) {
        showToast('No data to backup', 'warning');
        return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `family-data-backup-${timestamp}.csv`;

    exportAsCSV(AppState.families, filename);
    updateLastBackupDate();
    showToast('CSV backup downloaded successfully! Save it to your Dialog router USB.', 'success');
}

// Backup both formats
function backupBoth() {
    if (AppState.families.length === 0) {
        showToast('No data to backup', 'warning');
        return;
    }

    backupAsJSON();

    // Delay CSV download slightly to avoid browser blocking
    setTimeout(() => {
        backupAsCSV();
    }, 500);
}

// Update last backup date
function updateLastBackupDate() {
    localStorage.setItem('lastBackupDate', Date.now().toString());
    updateBackupStatus();
}

// Handle restore file
async function handleRestoreFile() {
    const fileInput = document.getElementById('restoreFile');
    const file = fileInput.files[0];

    if (!file) return;

    if (!file.name.endsWith('.json')) {
        showToast('Please select a valid JSON backup file', 'error');
        return;
    }

    const confirmed = await confirmAction(
        'Are you sure you want to restore from this backup? This will REPLACE all current data. ' +
        'Make sure you have backed up current data first!'
    );

    if (!confirmed) {
        fileInput.value = '';
        return;
    }

    try {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const backupData = JSON.parse(e.target.result);

                // Validate backup data structure
                if (!backupData.data || !Array.isArray(backupData.data)) {
                    showToast('Invalid backup file format', 'error');
                    return;
                }

                // Restore data
                if (AppState.isFirebaseReady && FirebaseDB) {
                    // Clear existing data and restore to Firebase
                    const familiesRef = FirebaseDB.getFamiliesRef();
                    await familiesRef.remove();

                    for (const family of backupData.data) {
                        await FirebaseDB.addFamily(family);
                    }
                } else {
                    // Restore to localStorage
                    localStorage.setItem('familiesData', JSON.stringify(backupData.data));
                }

                AppState.families = backupData.data;
                updateBackupStatus();

                showToast(
                    `Successfully restored ${backupData.totalRecords} family records from backup!`,
                    'success'
                );

                // Reload page after a delay
                setTimeout(() => {
                    window.location.reload();
                }, 2000);

            } catch (error) {
                console.error('Restore error:', error);
                showToast('Error restoring backup. Invalid file format.', 'error');
            }
        };

        reader.onerror = () => {
            showToast('Error reading backup file', 'error');
        };

        reader.readAsText(file);

    } catch (error) {
        console.error('Restore error:', error);
        showToast('Error restoring backup', 'error');
    }

    // Clear file input
    fileInput.value = '';
}
