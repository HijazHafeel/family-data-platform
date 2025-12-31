// Admin Dashboard Logic
let currentEditingId = null;

// Member and Special Category tracking
let memberRowCount = 0;
let specialCategoryCount = 0;
let undoTimers = {};

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    initializeDashboard();
    setupDynamicMemberRows();
    updateDeviceStatusUI();
});

// Dynamic Member Rows Logic (from data-entry.js)
function setupDynamicMemberRows() {
    const numMembersInput = document.getElementById('numFamilyMembers');
    if (numMembersInput) {
        numMembersInput.addEventListener('change', () => {
            const count = parseInt(numMembersInput.value) || 0;
            const currentRows = document.querySelectorAll('#membersTableBody .member-row').length;

            if (count > currentRows) {
                // Add rows
                for (let i = currentRows; i < count; i++) {
                    addMemberRow();
                }
            } else if (count < currentRows) {
                // Remove rows from bottom
                const tbody = document.getElementById('membersTableBody');
                for (let i = currentRows; i > count; i--) {
                    if (tbody.lastElementChild) {
                        tbody.removeChild(tbody.lastElementChild);
                        memberRowCount--;
                    }
                }
            }
        });
    }
}

function addMemberRow() {
    memberRowCount++;
    const tbody = document.getElementById('membersTableBody');
    const row = document.createElement('tr');
    row.className = 'member-row';
    row.id = `member-${memberRowCount}`;

    row.innerHTML = `
        <td><input type="text" name="memberName[]" required placeholder="Full Name"></td>
        <td><input type="text" name="memberNIC[]" pattern="[0-9]{9}[vVxX]|[0-9]{12}" placeholder="NIC Number"></td>
        <td><input type="text" name="memberRelationship[]" required placeholder="Relationship"></td>
        <td><input type="date" name="memberDOB[]"></td>
        <td>
            <select name="memberGender[]">
                <option value="">-</option>
                <option value="M">M</option>
                <option value="F">F</option>
            </select>
        </td>
        <td><input type="text" name="memberOccupation[]" placeholder="Occupation"></td>
        <td><input type="tel" name="memberContact[]" placeholder="Contact"></td>
        <td><input type="text" name="memberWorkplace[]" placeholder="Workplace"></td>
        <td>
            <select name="memberCivilStatus[]">
                <option value="">-</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
            </select>
        </td>
        <td><input type="text" name="memberQualification[]" placeholder="Qualification"></td>
        <td>
            <button type="button" class="btn btn-danger btn-sm" onclick="removeMemberRow('member-${memberRowCount}')">✕</button>
        </td>
    `;

    tbody.appendChild(row);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function removeMemberRow(rowId) {
    const row = document.getElementById(rowId);
    if (row) {
        row.remove();
        // Update input count
        const numMembersInput = document.getElementById('numFamilyMembers');
        if (numMembersInput) {
            numMembersInput.value = document.querySelectorAll('#membersTableBody .member-row').length;
        }
    }
}

// Special Category Logic
function addSpecialCategory() {
    specialCategoryCount++;
    const container = document.getElementById('specialCategoriesContainer');
    const entry = document.createElement('div');
    entry.className = 'special-category-entry';
    entry.id = `spec-${specialCategoryCount}`;
    entry.style.cssText = 'background: var(--bg-subtle); padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--border-main); margin-bottom: 1.5rem; position: relative;';

    entry.innerHTML = `
        <button type="button" class="btn btn-danger btn-sm" onclick="removeSpecialCategory('spec-${specialCategoryCount}')" 
            style="position: absolute; top: 1rem; right: 1rem; width: 28px; height: 28px; padding: 0;">✕</button>
        
        <div class="form-grid">
            <div class="form-group">
                <label>Category *</label>
                <select name="specCategory[]" required class="form-input">
                    <option value="">Select Category</option>
                    <option value="Disabled">Disabled</option>
                    <option value="Chronic Illness">Chronic Illness</option>
                    <option value="Widow">Widow</option>
                    <option value="Orphan">Orphan</option>
                    <option value="Elderly Alone">Elderly Alone</option>
                    <option value="Loss of Income">Loss of Income</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            <div class="form-group">
                <label>Member Name</label>
                <input type="text" name="specMemberName[]" class="form-input" placeholder="Name of affected member">
            </div>
        </div>
        <div class="form-group">
            <label>Details / Description</label>
            <textarea name="specDescription[]" class="form-input" rows="2" placeholder="Describe the situation..."></textarea>
        </div>
    `;

    container.appendChild(entry);
}

function removeSpecialCategory(id) {
    const entry = document.getElementById(id);
    if (entry) entry.remove();
}

// Data Collection functions
function collectMembersData() {
    const members = [];
    const rows = document.querySelectorAll('#membersTableBody .member-row');

    rows.forEach(row => {
        members.push({
            name: row.querySelector('[name="memberName[]"]').value.trim(),
            nicNumber: row.querySelector('[name="memberNIC[]"]').value.trim(),
            relationship: row.querySelector('[name="memberRelationship[]"]').value.trim(),
            dateOfBirth: row.querySelector('[name="memberDOB[]"]').value,
            gender: row.querySelector('[name="memberGender[]"]').value,
            occupation: row.querySelector('[name="memberOccupation[]"]').value.trim(),
            contactNumber: row.querySelector('[name="memberContact[]"]').value.trim(),
            workplace: row.querySelector('[name="memberWorkplace[]"]').value.trim(),
            civilStatus: row.querySelector('[name="memberCivilStatus[]"]').value,
            qualification: row.querySelector('[name="memberQualification[]"]').value.trim()
        });
    });

    return members;
}

function collectSpecialCategoriesData() {
    const categories = [];
    const entries = document.querySelectorAll('.special-category-entry');

    entries.forEach(entry => {
        const category = entry.querySelector('[name="specCategory[]"]').value;
        if (category) {
            categories.push({
                category: category,
                memberName: entry.querySelector('[name="specMemberName[]"]').value.trim(),
                description: entry.querySelector('[name="specDescription[]"]').value.trim()
            });
        }
    });

    return categories;
}

// Device Authorization Functions
function updateDeviceStatusUI() {
    const statusBadge = document.getElementById('deviceStatus');
    const authBtn = document.getElementById('masterDeviceBtn');
    const explanation = document.getElementById('masterDeviceExplanation');
    const securitySection = document.getElementById('deviceManagementSection');

    // ONLY SHOW FOR USERNAME "admin"
    if (securitySection) {
        if (AppState.currentUser && AppState.currentUser.username === 'admin') {
            securitySection.style.display = 'block';
        } else {
            securitySection.style.display = 'none';
            return; // Exit if not admin
        }
    }

    if (!statusBadge) return;

    const isMaster = typeof isMasterDevice === 'function' ? isMasterDevice() : false;

    if (isMaster) {
        statusBadge.textContent = 'Authorized Master Device';
        statusBadge.className = 'badge active';
        authBtn.innerHTML = '<i data-lucide="check" style="width: 16px; height: 16px;"></i> Authorized';
        authBtn.className = 'btn btn-success';
        authBtn.disabled = true;
        explanation.style.display = 'block';
    } else {
        statusBadge.textContent = 'Not Authorized';
        statusBadge.className = 'badge inactive';
        authBtn.innerHTML = '<i data-lucide="key" style="width: 16px; height: 16px;"></i> Authorize This Device';
        authBtn.className = 'btn btn-primary';
        authBtn.disabled = false;
        explanation.style.display = 'block';
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function handleMasterDeviceSetup() {
    if (typeof setMasterDevice === 'function') {
        const success = setMasterDevice();
        if (success) {
            updateDeviceStatusUI();
        }
    } else {
        console.error('setMasterDevice function not found. Is local-storage-manager.js loaded?');
        showToast('System component missing. Please refresh.', 'error');
    }
}

// Export Functionality
function exportData() {
    if (AppState.families.length === 0) {
        showToast('No data to export', 'warning');
        return;
    }

    const choice = confirm('Export as CSV? (Click OK for CSV, Cancel for JSON)');
    const timestamp = new Date().toISOString().split('T')[0];

    if (choice) {
        exportAsCSV(AppState.families, `families-export-${timestamp}.csv`);
    } else {
        exportAsJSON(AppState.families, `families-export-${timestamp}.json`);
    }
}

// Backup Utility
async function backupData() {
    try {
        const backup = {
            timestamp: new Date().toISOString(),
            families: AppState.families,
            users: AppState.users,
            metadata: {
                version: '1.0',
                exportedBy: AppState.currentUser?.username
            }
        };

        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `platform-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Backup completed successfully', 'success');
    } catch (error) {
        console.error('Backup failed:', error);
        showToast('Backup failed', 'error');
    }
}

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
            <td>${sanitizeInput(family.familyInfo?.familyName || family.familyName || 'N/A')}</td>
            <td>${formatPhoneNumber(family.familyInfo?.phoneNumber || family.phoneNumber || family.contactNumber)}</td>
            <td>${sanitizeInput(family.familyInfo?.email || family.email || 'N/A')}</td>
            <td>${family.familyInfo?.numFamilyMembers || family.numFamilyMembers || family.numberOfMembers || 0}</td>
            <td>${sanitizeInput(family.familyInfo?.address || family.address || 'N/A')}</td>
            <td>
                <span class="badge ${family.status === 'active' ? 'active' : 'inactive'}">
                    ${family.status || 'active'}
                </span>
            </td>
            <td>${formatDate(family.createdAt)}</td>
            <td>
                <div class="table-actions-cell">
                    <button class="btn btn-secondary btn-sm" onclick="editFamily('${family.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="edit-2" style="width: 14px; height: 14px;" class="lucide lucide-edit-2"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path></svg>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="confirmDeleteFamily('${family.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="trash-2" style="width: 14px; height: 14px;" class="lucide lucide-trash-2"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
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
    const totalMembers = AppState.families.reduce((sum, f) => sum + (parseInt(f.familyInfo?.numFamilyMembers || f.numFamilyMembers || f.numberOfMembers) || 0), 0);

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
                <span class="user-badge" style="background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-weight: 500;">
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
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="check" style="width: 14px; height: 14px;" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"></path></svg> Approve
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="rejectUser('${user.id}', '${user.username}')" title="Reject">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="x" style="width: 14px; height: 14px;" class="lucide lucide-x"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg> Reject
                        </button>
                    ` : isActive && !isCurrentUser ? `
                        <button class="btn btn-warning btn-sm" onclick="toggleUserStatus('${user.id}', '${user.username}', 'disabled')" title="Disable Access">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="user-x" style="width: 14px; height: 14px;" class="lucide lucide-user-x"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="17" x2="22" y1="8" y2="13"></line><line x1="22" x2="17" y1="8" y2="13"></line></svg> Disable
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteUserConfirm('${user.id}', '${user.username}')" title="Delete User">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="trash-2" style="width: 14px; height: 14px;" class="lucide lucide-trash-2"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Delete
                        </button>
                    ` : isDisabled && !isCurrentUser ? `
                        <button class="btn btn-success btn-sm" onclick="toggleUserStatus('${user.id}', '${user.username}', 'active')" title="Enable Access">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="user-check" style="width: 14px; height: 14px;" class="lucide lucide-user-check"><path d="m16 11 2 2 4-4"></path><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg> Enable
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteUserConfirm('${user.id}', '${user.username}')" title="Delete User">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="trash-2" style="width: 14px; height: 14px;" class="lucide lucide-trash-2"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Delete
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

// Delete user with UNDO option
async function deleteUserConfirm(userId, username) {
    const userToDelete = AppState.users.find(u => u.id === userId || u.username === username);
    if (!userToDelete) return;

    if (!confirm(`⚠️ Are you sure you want to delete user @${username}?\n\nThis will remove their access to the system.`)) {
        return;
    }

    // Clear any existing undo timer for this user
    if (undoTimers[userId]) {
        clearTimeout(undoTimers[userId]);
        delete undoTimers[userId];
    }

    try {
        // Optimistic UI update or actual delete
        if (AppState.isFirebaseReady && FirebaseDB) {
            await FirebaseDB.deleteUser(userId);
        } else {
            AppState.users = AppState.users.filter(u => u.id !== userId && u.username !== username);
            localStorage.setItem('platformUsers', JSON.stringify(AppState.users));
        }

        await loadUsers();

        // Show undo toast
        showUndoToast(
            `User @${username} deleted`,
            () => restoreUser(userToDelete),
            userId
        );
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast('Error deleting user', 'error');
    }
}

// Restore user (Undo action)
async function restoreUser(userData) {
    try {
        const userId = userData.id || userData.uid;
        // Clear the undo timer
        if (undoTimers[userId]) {
            clearTimeout(undoTimers[userId]);
            delete undoTimers[userId];
        }

        if (AppState.isFirebaseReady && FirebaseDB) {
            await FirebaseDB.addUser(userData);
        } else {
            AppState.users.push(userData);
            localStorage.setItem('platformUsers', JSON.stringify(AppState.users));
        }

        showToast(`✅ User @${userData.username} restored!`, 'success');
        await loadUsers();
    } catch (error) {
        console.error('Error restoring user:', error);
        showToast('Failed to restore user', 'error');
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
        (family.familyInfo?.familyName || family.familyName)?.toLowerCase().includes(searchTerm) ||
        (family.familyInfo?.phoneNumber || family.phoneNumber || family.contactNumber)?.includes(searchTerm) ||
        (family.familyInfo?.email || family.email)?.toLowerCase().includes(searchTerm) ||
        (family.familyInfo?.address || family.address)?.toLowerCase().includes(searchTerm) ||
        (family.familyInfo?.location || family.location)?.toLowerCase().includes(searchTerm)
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

    // Clear dynamic rows
    document.getElementById('membersTableBody').innerHTML = '';
    document.getElementById('specialCategoriesContainer').innerHTML = '';
    memberRowCount = 0;
    specialCategoryCount = 0;

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

    // Support both old and new data structures
    const familyInfo = family.familyInfo || family;

    document.getElementById('address').value = familyInfo.address || '';
    document.getElementById('location').value = familyInfo.location || '';
    document.getElementById('familyName').value = familyInfo.familyName || '';
    document.getElementById('phoneNumber').value = familyInfo.phoneNumber || family.contactNumber || '';
    document.getElementById('email').value = familyInfo.email || '';

    // Set radio buttons
    if (familyInfo.eligibleZakath) {
        const zakathRadio = document.querySelector(`input[name="eligibleZakath"][value="${familyInfo.eligibleZakath}"]`);
        if (zakathRadio) zakathRadio.checked = true;
    }
    if (familyInfo.houseOwnership) {
        const ownershipRadio = document.querySelector(`input[name="houseOwnership"][value="${familyInfo.houseOwnership}"]`);
        if (ownershipRadio) ownershipRadio.checked = true;
    }

    document.getElementById('numFamilyMembers').value = familyInfo.numFamilyMembers || family.numberOfMembers || 0;
    document.getElementById('nicNumber').value = familyInfo.nicNumber || '';
    document.getElementById('status').value = family.status || 'active';
    document.getElementById('notes').value = family.notes || '';

    // Load Household Members
    const tbody = document.getElementById('membersTableBody');
    tbody.innerHTML = '';
    memberRowCount = 0;
    const members = family.householdMembers || [];
    members.forEach(member => {
        addMemberRow();
        const row = tbody.lastElementChild;
        row.querySelector('[name="memberName[]"]').value = member.name || '';
        row.querySelector('[name="memberNIC[]"]').value = member.nicNumber || '';
        row.querySelector('[name="memberRelationship[]"]').value = member.relationship || '';
        row.querySelector('[name="memberDOB[]"]').value = member.dateOfBirth || '';
        row.querySelector('[name="memberGender[]"]').value = member.gender || '';
        row.querySelector('[name="memberOccupation[]"]').value = member.occupation || '';
        row.querySelector('[name="memberContact[]"]').value = member.contactNumber || '';
        row.querySelector('[name="memberWorkplace[]"]').value = member.workplace || '';
        row.querySelector('[name="memberCivilStatus[]"]').value = member.civilStatus || '';
        row.querySelector('[name="memberQualification[]"]').value = member.qualification || '';
    });

    // Load Special Categories
    const specContainer = document.getElementById('specialCategoriesContainer');
    specContainer.innerHTML = '';
    specialCategoryCount = 0;
    const categories = family.specialCategories || [];
    categories.forEach(cat => {
        addSpecialCategory();
        const entry = specContainer.lastElementChild;
        entry.querySelector('[name="specCategory[]"]').value = cat.category || '';
        entry.querySelector('[name="specMemberName[]"]').value = cat.memberName || '';
        entry.querySelector('[name="specDescription[]"]').value = cat.description || '';
    });

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
        familyInfo: {
            address: document.getElementById('address').value.trim(),
            location: document.getElementById('location').value.trim(),
            familyName: document.getElementById('familyName').value.trim(),
            phoneNumber: document.getElementById('phoneNumber').value.trim(),
            email: document.getElementById('email').value.trim(),
            eligibleZakath: document.querySelector('input[name="eligibleZakath"]:checked')?.value,
            houseOwnership: document.querySelector('input[name="houseOwnership"]:checked')?.value,
            numFamilyMembers: parseInt(document.getElementById('numFamilyMembers').value) || 0,
            nicNumber: document.getElementById('nicNumber').value.trim()
        },
        householdMembers: collectMembersData(),
        specialCategories: collectSpecialCategoriesData(),
        status: document.getElementById('status').value,
        notes: document.getElementById('notes').value.trim(),
        lastModifiedBy: AppState.currentUser.username,
        totalMembers: parseInt(document.getElementById('numFamilyMembers').value) || 0
    };

    // Simple validation for Section 1
    if (!familyData.familyInfo.familyName || !familyData.familyInfo.address || !familyData.familyInfo.phoneNumber) {
        showToast('Please fill all required fields in Section 1', 'error');
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

// --- DELETE & UNDO LOGIC ---

// Show toast with Undo button
function showUndoToast(message, undoCallback, id) {
    // Remove existing undo toasts
    document.querySelectorAll('.toast.undo-toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = 'toast info undo-toast';
    toast.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        min-width: 350px;
        z-index: 9999;
    `;

    toast.innerHTML = `
        <span style="flex: 1;">${message}</span>
        <button id="undoActionBtn" class="btn btn-primary btn-sm" style="white-space: nowrap;">
            <i data-lucide="undo-2" style="width: 14px; height: 14px;"></i> UNDO
        </button>
    `;

    document.body.appendChild(toast);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const undoBtn = toast.querySelector('#undoActionBtn');
    undoBtn.onclick = () => {
        undoCallback();
        toast.remove();
    };

    // Auto-remove after 60 seconds
    undoTimers[id] = setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (toast.parentNode) toast.remove();
            }, 300);
        }
        delete undoTimers[id];
    }, 60000);
}

// Confirm delete family
async function confirmDeleteFamily(familyId) {
    const familyToDelete = AppState.families.find(f => f.id === familyId);
    if (!familyToDelete) return;

    if (!confirm(`⚠️ Delete family record for "${familyToDelete.familyInfo?.familyName || familyToDelete.familyName}"?\n\nYou will have 60 seconds to undo this action.`)) {
        return;
    }

    await deleteFamily(familyId);
}

// Delete family with Undo
async function deleteFamily(familyId) {
    const familyToDelete = AppState.families.find(f => f.id === familyId);
    if (!familyToDelete) return;

    // Clear any existing undo timer
    if (undoTimers[familyId]) {
        clearTimeout(undoTimers[familyId]);
        delete undoTimers[familyId];
    }

    try {
        if (AppState.isFirebaseReady && FirebaseDB) {
            await FirebaseDB.deleteFamily(familyId);
        } else {
            AppState.families = AppState.families.filter(f => f.id !== familyId);
            localStorage.setItem('familiesData', JSON.stringify(AppState.families));
        }

        await loadFamilies();

        showUndoToast(
            `Family "${familyToDelete.familyInfo?.familyName || familyToDelete.familyName}" deleted`,
            () => restoreFamily(familyToDelete),
            familyId
        );
    } catch (error) {
        console.error('Error deleting family:', error);
        showToast('Error deleting family', 'error');
    }
}

// Restore family
async function restoreFamily(familyData) {
    try {
        if (undoTimers[familyData.id]) {
            clearTimeout(undoTimers[familyData.id]);
            delete undoTimers[familyData.id];
        }

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

// Backup Utility
async function backupData() {
    try {
        const backupData = {
            timestamp: new Date().toISOString(),
            families: AppState.families,
            users: AppState.users,
            metadata: {
                version: '1.0',
                exportedBy: AppState.currentUser?.username
            }
        };

        const json = JSON.stringify(backupData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `platform-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Backup completed successfully', 'success');
    } catch (error) {
        console.error('Backup failed:', error);
        showToast('Backup failed', 'error');
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('familyModal');
    if (e.target === modal) {
        closeFamilyModal();
    }
});
