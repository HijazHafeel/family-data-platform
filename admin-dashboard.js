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
                    <button class="btn btn-danger btn-sm" onclick="confirmDeleteFamily('${family.id}')">
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

    tbody.innerHTML = users.map(user => {
        const isPending = user.status === 'pending';
        const isActive = user.status === 'active';
        const isDisabled = user.status === 'disabled';
        const isCurrentUser = user.username === AppState.currentUser.username;

        return `
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
                <span class="badge ${isActive ? 'active' : (isPending ? 'inactive' : 'danger')}">
                    ${user.status || 'active'}
                </span>
            </td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <div class="table-actions-cell">
                    ${isPending ? `
                        <button class="btn btn-success btn-sm" onclick="approveUser('${user.id}', '${user.username}')" title="Approve Admin">
                            ✅ Approve
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="rejectUser('${user.id}', '${user.username}')" title="Reject">
                            ❌ Reject
                        </button>
                    ` : isActive && !isCurrentUser ? `
                        <button class="btn btn-warning btn-sm" onclick="toggleUserStatus('${user.id}', '${user.username}', 'disabled')" title="Disable Access">
                            🚫 Disable
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteUserConfirm('${user.id}', '${user.username}')" title="Delete User">
                            🗑️ Delete
                        </button>
                    ` : isDisabled && !isCurrentUser ? `
                        <button class="btn btn-success btn-sm" onclick="toggleUserStatus('${user.id}', '${user.username}', 'active')" title="Enable Access">
                            ✅ Enable
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteUserConfirm('${user.id}', '${user.username}')" title="Delete User">
                            🗑️ Delete
                        </button>
                    ` : isCurrentUser ? `
                        <span style="color: var(--text-muted); font-size: 0.875rem;">Current User</span>
                    ` : ''}
                </div>
            </td>
        </tr>
    `;
    }).join('');
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

// Approve user (for pending admin accounts)
async function approveUser(userId, username) {
    if (!confirm(`Approve admin account for @${username}?\n\nThey will have full admin privileges including:\n- View all family data\n- Edit/delete records\n- Manage users\n- Access backups`)) {
        return;
    }

    try {
        if (AppState.isFirebaseReady && FirebaseDB) {
            await FirebaseDB.approveUser(userId, AppState.currentUser.username);
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

        showToast(`✅ Admin account @${username} approved successfully`, 'success');
        await loadUsers();
    } catch (error) {
        console.error('Error approving user:', error);
        showToast('Error approving account', 'error');
    }
}

// Toggle user status (Enable/Disable)
async function toggleUserStatus(userId, username, newStatus) {
    const action = newStatus === 'active' ? 'enable' : 'disable';
    const actionCaps = action.charAt(0).toUpperCase() + action.slice(1);
    const actionText = newStatus === 'active' ? 'enabled' : 'disabled';

    if (!confirm(`${actionCaps} access for @${username}?\n\n${newStatus === 'disabled' ? 'User will not be able to login until re-enabled.' : 'User will regain full access to the system.'}`)) {
        return;
    }

    try {
        if (AppState.isFirebaseReady && FirebaseDB) {
            await FirebaseDB.updateUserStatus(userId, newStatus, AppState.currentUser.username);
        } else {
            const users = JSON.parse(localStorage.getItem('platformUsers') || '[]');
            const index = users.findIndex(u => u.id === userId || u.username === username);
            if (index !== -1) {
                users[index].status = newStatus;
                users[index].updatedAt = Date.now();
                users[index].updatedBy = AppState.currentUser.username;
                localStorage.setItem('platformUsers', JSON.stringify(users));
            }
        }

        showToast(`✅ User @${username} ${actionText} successfully`, 'success');
        await loadUsers();
    } catch (error) {
        console.error('Error updating user status:', error);
        showToast('Error updating user status', 'error');
    }
}

// Reject pending user
async function rejectUser(userId, username) {
    if (!confirm(`Reject admin request from @${username}?\n\nThis will permanently delete their account.`)) {
        return;
    }

    try {
        if (AppState.isFirebaseReady && FirebaseDB) {
            await FirebaseDB.deleteUser(userId);
        } else {
            let users = JSON.parse(localStorage.getItem('platformUsers') || '[]');
            users = users.filter(u => u.id !== userId && u.username !== username);
            localStorage.setItem('platformUsers', JSON.stringify(users));
        }

        showToast(`❌ Admin request from @${username} rejected`, 'success');
        await loadUsers();
    } catch (error) {
        console.error('Error rejecting user:', error);
        showToast('Error rejecting user', 'error');
    }
}

// Delete user permanently
async function deleteUserConfirm(userId, username) {
    if (!confirm(`⚠️ PERMANENTLY DELETE user @${username}?\n\nThis will:\n- Remove all their data\n- Cannot be undone\n- Remove their login access forever\n\nAre you sure?`)) {
        return;
    }

    // Double confirmation for safety
    if (!confirm(`Final confirmation: Delete @${username}?\n\nClick OK to permanently delete, or Cancel to keep the user.`)) {
        return;
    }

    try {
        if (AppState.isFirebaseReady && FirebaseDB) {
            await FirebaseDB.deleteUser(userId);
        } else {
            let users = JSON.parse(localStorage.getItem('platformUsers') || '[]');
            users = users.filter(u => u.id !== userId && u.username !== username);
            localStorage.setItem('platformUsers', JSON.stringify(users));
        }

        showToast(`🗑️ User @${username} permanently deleted`, 'success');
        await loadUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast('Error deleting user', 'error');
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

// Confirm delete family (NEW - Fixed delete function)
async function confirmDeleteFamily(familyId) {
    const familyToDelete = AppState.families.find(f => f.id === familyId);
    if (!familyToDelete) {
        showToast('Family not found', 'error');
        return;
    }

    // Show confirmation dialog
    if (!confirm(`⚠️ Delete family record for "${familyToDelete.familyName}"?\n\nYou will have 60 seconds to undo this action.`)) {
        return;
    }

    await deleteFamily(familyId);
}

// Delete family with Undo (FIXED)
async function deleteFamily(familyId) {
    const familyToDelete = AppState.families.find(f => f.id === familyId);
    if (!familyToDelete) return;

    try {
        if (AppState.isFirebaseReady && FirebaseDB) {
            await FirebaseDB.deleteFamily(familyId);
        } else {
            AppState.families = AppState.families.filter(f => f.id !== familyId);
            localStorage.setItem('familiesData', JSON.stringify(AppState.families));
        }

        // Reload the table to show changes
        await loadFamilies();

        // Show Undo option
        showUndoToast('Family record deleted', () => restoreFamily(familyToDelete));
    } catch (error) {
        console.error('Error deleting family:', error);
        showToast('Error deleting family', 'error');
    }
}

// Restore family (Undo delete)
async function restoreFamily(familyData) {
    try {
        if (AppState.isFirebaseReady && FirebaseDB) {
            await FirebaseDB.restoreFamily(familyData.id, familyData);
        } else {
            AppState.families.push(familyData);
            localStorage.setItem('familiesData', JSON.stringify(AppState.families));
        }

        showToast('✅ Family record restored!', 'success');
        await loadFamilies();
    } catch (error) {
        console.error('Error restoring family:', error);
        showToast('Failed to restore record', 'error');
    }
}

// Show toast with Undo button (FIXED)
function showUndoToast(message, undoCallback) {
    const toast = document.createElement('div');
    toast.className = 'toast info';
    toast.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 350px;
        z-index: 9999;
        padding: 1rem 1.5rem;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-left: 4px solid var(--info-color);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
    `;

    toast.innerHTML = `
        <span style="color: var(--text-primary); font-weight: 500;">${message}</span>
        <button id="undoActionBtn" style="
            background: var(--info-color); 
            border: none; 
            color: white; 
            padding: 0.5rem 1.25rem; 
            border-radius: 6px; 
            cursor: pointer; 
            margin-left: 1rem;
            font-weight: 700;
            font-size: 0.9rem;
            transition: all 0.15s;
        " onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='var(--info-color)'">
            ↩️ UNDO
        </button>
    `;

    document.body.appendChild(toast);

    const btn = toast.querySelector('#undoActionBtn');

    btn.onclick = () => {
        undoCallback();
        toast.remove();
    };

    // Auto remove after 60 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => {
                if (toast.parentNode) toast.remove();
            }, 300);
        }
    }, 60000);
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
