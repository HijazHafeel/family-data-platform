// Admin Dashboard Logic
let currentEditingId = null;

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    initializeDashboard();
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
        document.getElementById('userBadge').textContent = user.fullName || user.username;
    } catch (error) {
        window.location.href = 'index.html';
    }
}

// Initialize dashboard
async function initializeDashboard() {
    await loadFamilies();
    await loadUsers();
    updateStatistics();
}

// Tab Switching Logic
function switchTab(tabName) {
    // Update tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update sections
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}Section`);
    });

    if (tabName === 'users') {
        loadUsers();
    } else {
        loadFamilies();
    }
}

// Load all families
async function loadFamilies() {
    try {
        if (AppState.isFirebaseReady && FirebaseDB) {
            AppState.families = await FirebaseDB.getAllFamilies();
        } else {
            // Load from localStorage as fallback
            const stored = localStorage.getItem('familiesData');
            AppState.families = stored ? JSON.parse(stored) : [];
        }

        renderFamilyTable(AppState.families);
        updateStatistics();
    } catch (error) {
        console.error('Error loading families:', error);
        showToast('Error loading family data', 'error');
    }
}

// Render family table
function renderFamilyTable(families) {
    const tbody = document.getElementById('familyTableBody');

    if (families.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    No family records found. Click "Add Family" to get started.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = families.map(family => `
        <tr>
            <td><strong>${sanitizeInput(family.id || 'N/A')}</strong></td>
            <td>${sanitizeInput(family.familyName)}</td>
            <td>${formatPhoneNumber(family.contactNumber)}</td>
            <td>${sanitizeInput(family.email || 'N/A')}</td>
            <td>${family.numberOfMembers || 0}</td>
            <td>${sanitizeInput(family.address)}</td>
            <td>
                <span class="badge ${family.status === 'active' ? 'active' : 'inactive'}">
                    ${family.status || 'active'}
                </span>
            </td>
            <td>${formatDate(family.createdAt)}</td>
            <td>
                <div class="table-actions-cell">
                    <button class="btn btn-secondary btn-sm" onclick="editFamily('${family.id}')">
                        ✏️
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteFamily('${family.id}')">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Update statistics
async function updateStatistics() {
    const totalFamilies = AppState.families.length;
    const activeRecords = AppState.families.filter(f => f.status === 'active').length;
    const totalMembers = AppState.families.reduce((sum, f) => sum + (parseInt(f.numberOfMembers) || 0), 0);

    // Fetch users for count if not already loaded
    if (AppState.users.length === 0 && AppState.isFirebaseReady) {
        try {
            AppState.users = await FirebaseDB.getAllUsers();
        } catch (e) {
            console.error('Stats users load fail', e);
        }
    }
    const totalUsers = AppState.users.length;

    document.getElementById('totalFamilies').textContent = totalFamilies;
    document.getElementById('activeRecords').textContent = activeRecords;
    document.getElementById('totalMembers').textContent = totalMembers;
    document.getElementById('totalUsers').textContent = totalUsers;
}

// Load all users
async function loadUsers() {
    try {
        if (AppState.isFirebaseReady && FirebaseDB) {
            AppState.users = await FirebaseDB.getAllUsers();
        } else {
            // Load from localStorage as fallback
            const stored = localStorage.getItem('platformUsers');
            AppState.users = stored ? JSON.parse(stored) : [];
        }

        renderUserTable(AppState.users);
        updateStatistics();
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Error loading user data', 'error');
    }
}

// Render user table
function renderUserTable(users) {
    const tbody = document.getElementById('userTableBody');

    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    No users found.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td><strong>${sanitizeInput(user.username)}</strong></td>
            <td>${sanitizeInput(user.fullName || 'N/A')}</td>
            <td>${sanitizeInput(user.email || 'N/A')}</td>
            <td>
                <span class="user-badge" style="background: rgba(99,102,241,0.1); border:none; color: var(--primary-light);">
                    ${user.role}
                </span>
            </td>
            <td>${sanitizeInput(user.organization || 'N/A')}</td>
            <td>
                <span class="badge ${user.status === 'active' ? 'active' : (user.status === 'pending' ? 'inactive' : 'danger')}">
                    ${user.status || 'active'}
                </span>
            </td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <div class="table-actions-cell">
                    ${user.status === 'pending' ? `
                        <button class="btn btn-success btn-sm" onclick="approveUser('${user.id}', '${user.username}')" title="Approve">
                            ✅
                        </button>
                    ` : ''}
                    ${user.username !== AppState.currentUser.username ? `
                        <button class="btn btn-danger btn-sm" onclick="rejectUser('${user.id}', '${user.username}')" title="Delete/Reject">
                            🗑️
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// Search users
function searchUsers() {
    const searchTerm = document.getElementById('userSearchInput').value.toLowerCase();

    if (!searchTerm) {
        renderUserTable(AppState.users);
        return;
    }

    const filtered = AppState.users.filter(user =>
        user.username?.toLowerCase().includes(searchTerm) ||
        user.fullName?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        user.organization?.toLowerCase().includes(searchTerm)
    );

    renderUserTable(filtered);
}

// Approve user
async function approveUser(userId, username) {
    const confirmed = await confirmAction(`Are you sure you want to approve admin account for @${username}?`);
    if (!confirmed) return;

    try {
        if (AppState.isFirebaseReady && FirebaseDB) {
            // For Firebase, we update status to active and role to admin
            await fs.collection('users').doc(userId).update({
                status: 'active',
                role: 'admin',
                approvedBy: AppState.currentUser.username,
                updatedAt: Date.now()
            });
        } else {
            const users = JSON.parse(localStorage.getItem('platformUsers') || '[]');
            const index = users.findIndex(u => u.id === userId || u.username === username);
            if (index !== -1) {
                users[index].status = 'active';
                users[index].role = 'admin';
                users[index].approvedBy = AppState.currentUser.username;
                users[index].updatedAt = Date.now();
                localStorage.setItem('platformUsers', JSON.stringify(users));
            }
        }

        showToast(`Account @${username} approved successfully`, 'success');
        await loadUsers();
    } catch (error) {
        console.error('Error approving user:', error);
        showToast('Error approving account', 'error');
    }
}

// Reject/Delete user
async function rejectUser(userId, username) {
    const confirmed = await confirmAction(`Are you sure you want to remove user @${username}? This cannot be undone.`);
    if (!confirmed) return;

    try {
        if (AppState.isFirebaseReady && FirebaseDB) {
            await fs.collection('users').doc(userId).delete();
        } else {
            let users = JSON.parse(localStorage.getItem('platformUsers') || '[]');
            users = users.filter(u => u.id !== userId && u.username !== username);
            localStorage.setItem('platformUsers', JSON.stringify(users));
        }

        showToast(`User @${username} removed`, 'success');
        await loadUsers();
    } catch (error) {
        console.error('Error removing user:', error);
        showToast('Error removing user', 'error');
    }
}

// Search families
function searchFamilies() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    if (!searchTerm) {
        renderFamilyTable(AppState.families);
        return;
    }

    const filtered = AppState.families.filter(family =>
        family.familyName?.toLowerCase().includes(searchTerm) ||
        family.contactNumber?.includes(searchTerm) ||
        family.email?.toLowerCase().includes(searchTerm) ||
        family.address?.toLowerCase().includes(searchTerm) ||
        family.area?.toLowerCase().includes(searchTerm) ||
        family.city?.toLowerCase().includes(searchTerm)
    );

    renderFamilyTable(filtered);
}

// Open add family modal
function openAddFamilyModal() {
    currentEditingId = null;
    document.getElementById('modalTitle').textContent = 'Add New Family';
    document.getElementById('familyForm').reset();
    document.getElementById('familyId').value = '';
    document.getElementById('status').value = 'active';
    document.getElementById('familyModal').classList.add('active');
}

// Open edit family modal
function editFamily(familyId) {
    const family = AppState.families.find(f => f.id === familyId);
    if (!family) {
        showToast('Family not found', 'error');
        return;
    }

    currentEditingId = familyId;
    document.getElementById('modalTitle').textContent = 'Edit Family';
    document.getElementById('familyId').value = family.id;
    document.getElementById('familyName').value = family.familyName || '';
    document.getElementById('contactNumber').value = family.contactNumber || '';
    document.getElementById('email').value = family.email || '';
    document.getElementById('address').value = family.address || '';
    document.getElementById('area').value = family.area || '';
    document.getElementById('city').value = family.city || '';
    document.getElementById('postalCode').value = family.postalCode || '';
    document.getElementById('numberOfMembers').value = family.numberOfMembers || 1;
    document.getElementById('status').value = family.status || 'active';
    document.getElementById('notes').value = family.notes || '';

    document.getElementById('familyModal').classList.add('active');
}

// Close family modal
function closeFamilyModal() {
    document.getElementById('familyModal').classList.remove('active');
    currentEditingId = null;
}

// Save family data
async function saveFamilyData() {
    const familyData = {
        familyName: document.getElementById('familyName').value.trim(),
        contactNumber: document.getElementById('contactNumber').value.trim(),
        email: document.getElementById('email').value.trim(),
        address: document.getElementById('address').value.trim(),
        area: document.getElementById('area').value.trim(),
        city: document.getElementById('city').value.trim(),
        postalCode: document.getElementById('postalCode').value.trim(),
        numberOfMembers: parseInt(document.getElementById('numberOfMembers').value) || 1,
        status: document.getElementById('status').value,
        notes: document.getElementById('notes').value.trim(),
        lastModifiedBy: AppState.currentUser.username
    };

    // Validate data
    const errors = validateFamilyData(familyData);
    if (errors.length > 0) {
        showToast(errors[0], 'error');
        return;
    }

    try {
        if (currentEditingId) {
            // Update existing family
            familyData.id = currentEditingId;

            if (AppState.isFirebaseReady && FirebaseDB) {
                await FirebaseDB.updateFamily(currentEditingId, familyData);
            } else {
                const index = AppState.families.findIndex(f => f.id === currentEditingId);
                if (index !== -1) {
                    AppState.families[index] = { ...AppState.families[index], ...familyData, updatedAt: Date.now() };
                    localStorage.setItem('familiesData', JSON.stringify(AppState.families));
                }
            }

            showToast('Family updated successfully', 'success');
        } else {
            // Add new family
            if (AppState.isFirebaseReady && FirebaseDB) {
                const newFamily = await FirebaseDB.addFamily(familyData);
                AppState.families.push(newFamily);
            } else {
                familyData.id = 'FAM' + Date.now();
                familyData.createdAt = Date.now();
                familyData.updatedAt = Date.now();
                AppState.families.push(familyData);
                localStorage.setItem('familiesData', JSON.stringify(AppState.families));
            }

            showToast('Family added successfully', 'success');
        }

        closeFamilyModal();
        await loadFamilies();
    } catch (error) {
        console.error('Error saving family:', error);
        showToast('Error saving family data', 'error');
    }
}

// Delete family
async function deleteFamily(familyId) {
    const confirmed = await confirmAction('Are you sure you want to delete this family record? This action cannot be undone.');

    if (!confirmed) return;

    try {
        if (AppState.isFirebaseReady && FirebaseDB) {
            await FirebaseDB.deleteFamily(familyId);
        } else {
            AppState.families = AppState.families.filter(f => f.id !== familyId);
            localStorage.setItem('familiesData', JSON.stringify(AppState.families));
        }

        showToast('Family deleted successfully', 'success');
        await loadFamilies();
    } catch (error) {
        console.error('Error deleting family:', error);
        showToast('Error deleting family', 'error');
    }
}

// Export data
function exportData() {
    if (AppState.families.length === 0) {
        showToast('No data to export', 'warning');
        return;
    }

    const choice = confirm('Export as CSV? (Click OK for CSV, Cancel for JSON)');
    const timestamp = new Date().toISOString().split('T')[0];

    if (choice) {
        exportAsCSV(AppState.families, `family-data-${timestamp}.csv`);
    } else {
        exportAsJSON(AppState.families, `family-data-${timestamp}.json`);
    }

    showToast('Data exported successfully', 'success');
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('familyModal');
    if (e.target === modal) {
        closeFamilyModal();
    }
});
