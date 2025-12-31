// Enhanced Data Entry Portal Logic with Comprehensive Form Support

// Global state for dynamic form elements
let memberRowCount = 0;
let specialCategoryCount = 0;
// No limits on members or special categories

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    checkStaffAuth();
    initializeDataEntry();
    setupFormHandler();
    setupValidation();
    checkMasterAdminAccess();
    setupDynamicMemberRows();
});

// Check if user is staff
function checkStaffAuth() {
    const session = localStorage.getItem('userSession');
    if (!session) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const user = JSON.parse(session);
        if (user.role !== 'staff' && user.role !== 'admin') {
            showToast('Access denied. Staff or Admin privileges required.', 'error');
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

// Check if current user is Master Admin on authorized device
function checkMasterAdminAccess() {
    const user = AppState.currentUser;
    const isMasterDevice = localStorage.getItem('masterDeviceFlag') === 'true';

    // Show file upload section only if user is 'admin' AND on master device
    if (user && user.username === 'admin' && isMasterDevice) {
        document.getElementById('fileUploadSection').style.display = 'block';
    }
}

// Initialize data entry portal
async function initializeDataEntry() {
    await loadFamiliesData();
    updateStats();
    updateMemberCountInfo();
    updateSpecialCategoryCountInfo();
}

// Load families data
async function loadFamiliesData() {
    try {
        if (AppState.isFirebaseReady && FirebaseDB) {
            AppState.families = await FirebaseDB.getAllFamilies();
        } else {
            const stored = localStorage.getItem('familiesData');
            AppState.families = stored ? JSON.parse(stored) : [];
        }

        updateStats();
    } catch (error) {
        console.error('Error loading families:', error);
        showToast('Error loading data', 'error');
    }
}

// Update statistics
function updateStats() {
    const totalFamilies = AppState.families.length;

    // Count families added today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const addedToday = AppState.families.filter(f => {
        const createdDate = new Date(f.createdAt);
        createdDate.setHours(0, 0, 0, 0);
        return createdDate.getTime() === today.getTime();
    }).length;

    document.getElementById('totalFamilies').textContent = totalFamilies;
    document.getElementById('addedToday').textContent = addedToday;
}

// Setup form submission handler
function setupFormHandler() {
    const form = document.getElementById('addFamilyForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await addNewFamily();
    });
}

// Setup real-time validation
function setupValidation() {
    // Phone number validation
    const phoneNumber = document.getElementById('phoneNumber');

    phoneNumber.addEventListener('input', () => validatePhone(phoneNumber, 'phoneNumberError'));
    phoneNumber.addEventListener('blur', () => validatePhone(phoneNumber, 'phoneNumberError'));

    // Email validation
    const email = document.getElementById('email');
    email.addEventListener('input', () => validateEmail(email));
    email.addEventListener('blur', () => validateEmail(email));

    // NIC validation
    const nicNumber = document.getElementById('nicNumber');
    nicNumber.addEventListener('input', () => validateNIC(nicNumber));
    nicNumber.addEventListener('blur', () => validateNIC(nicNumber));

    // Family name validation
    const familyName = document.getElementById('familyName');
    familyName.addEventListener('input', () => validateTextOnly(familyName, 'familyNameError'));
}

// Setup dynamic member row generation based on numFamilyMembers input
function setupDynamicMemberRows() {
    const numFamilyMembers = document.getElementById('numFamilyMembers');

    numFamilyMembers.addEventListener('change', function () {
        const targetCount = parseInt(this.value) || 0;

        // Clear existing rows
        document.getElementById('membersTableBody').innerHTML = '';
        memberRowCount = 0;

        // Add rows to match the target count
        for (let i = 0; i < targetCount; i++) {
            addMemberRow();
        }

        updateMemberCountInfo();
    });
}

// Validate phone number (8-15 digits)
function validatePhone(input, errorId) {
    const errorElement = document.getElementById(errorId);
    const value = input.value.trim();

    if (!value) {
        input.classList.remove('error', 'success');
        errorElement.textContent = '';
        return true;
    }

    const phonePattern = /^[0-9]{8,15}$/;

    if (!phonePattern.test(value)) {
        input.classList.add('error');
        input.classList.remove('success');
        errorElement.textContent = 'Phone must be 8-15 digits, numbers only';
        return false;
    }

    input.classList.remove('error');
    input.classList.add('success');
    errorElement.textContent = '';
    return true;
}

// Validate email format and check for duplicates
function validateEmail(input) {
    const errorElement = document.getElementById('emailError');
    const value = input.value.trim();

    if (!value) {
        input.classList.add('error');
        errorElement.textContent = 'Email is required';
        return false;
    }

    // Email format validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(value)) {
        input.classList.add('error');
        input.classList.remove('success');
        errorElement.textContent = 'Invalid email format';
        return false;
    }

    // Check for duplicate email
    const isDuplicate = AppState.families.some(f =>
        f.email && f.email.toLowerCase() === value.toLowerCase()
    );

    if (isDuplicate) {
        input.classList.add('error');
        input.classList.remove('success');
        errorElement.textContent = 'Email already exists in database';
        return false;
    }

    input.classList.remove('error');
    input.classList.add('success');
    errorElement.textContent = '';
    return true;
}

// Validate NIC number (9 digits + V/X or 12 digits)
function validateNIC(input) {
    const errorElement = document.getElementById('nicNumberError');
    const value = input.value.trim();

    if (!value) {
        input.classList.add('error');
        errorElement.textContent = 'NIC is required';
        return false;
    }

    const nicPattern = /^([0-9]{9}[vVxX]|[0-9]{12})$/;

    if (!nicPattern.test(value)) {
        input.classList.add('error');
        input.classList.remove('success');
        errorElement.textContent = 'NIC must be 9 digits + V/X or 12 digits';
        return false;
    }

    input.classList.remove('error');
    input.classList.add('success');
    errorElement.textContent = '';
    return true;
}

// Validate text-only fields
function validateTextOnly(input, errorId) {
    const errorElement = document.getElementById(errorId);
    const value = input.value.trim();

    if (!value) {
        input.classList.remove('error', 'success');
        errorElement.textContent = '';
        return true;
    }

    const textPattern = /^[A-Za-z\s]+$/;

    if (!textPattern.test(value)) {
        input.classList.add('error');
        input.classList.remove('success');
        errorElement.textContent = 'Text only, no numbers or special characters';
        return false;
    }

    input.classList.remove('error');
    input.classList.add('success');
    errorElement.textContent = '';
    return true;
}

// Add household member row
function addMemberRow() {
    memberRowCount++;
    const tbody = document.getElementById('membersTableBody');
    const row = document.createElement('tr');
    row.className = 'member-row';
    row.id = `member-${memberRowCount}`;

    row.innerHTML = `
        <td><input type="text" name="memberName[]" required placeholder="Full Name"></td>
        <td><input type="text" name="memberNIC[]" pattern="[0-9]{9}[vVxX]|[0-9]{12}" placeholder="NIC Number" title="9 digits + V/X or 12 digits"></td>
        <td><input type="text" name="memberRelationship[]" required placeholder="e.g., Spouse, Child"></td>
        <td><input type="date" name="memberDOB[]"></td>
        <td>
            <select name="memberGender[]">
                <option value="">-</option>
                <option value="M">M</option>
                <option value="F">F</option>
            </select>
        </td>
        <td><input type="text" name="memberOccupation[]" placeholder="Occupation"></td>
        <td><input type="tel" name="memberContact[]" pattern="[0-9]{8,15}" placeholder="Contact"></td>
        <td><input type="text" name="memberWorkplace[]" placeholder="School/Workplace"></td>
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
            <button type="button" class="btn btn-danger btn-sm" onclick="removeMemberRow('member-${memberRowCount}')">
                ✕
            </button>
        </td>
    `;

    tbody.appendChild(row);
    updateMemberCountInfo();

    // Re-initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Remove household member row
function removeMemberRow(rowId) {
    const row = document.getElementById(rowId);
    if (row) {
        row.remove();
        memberRowCount--;
        updateMemberCountInfo();
    }
}

// Update member count info
function updateMemberCountInfo() {
    const info = document.getElementById('memberCountInfo');
    info.textContent = `${memberRowCount} members added`;
}

// Add special category entry
function addSpecialCategory() {
    // No limit on special categories

    specialCategoryCount++;
    const container = document.getElementById('specialCategoriesContainer');
    const entry = document.createElement('div');
    entry.className = 'special-category-entry';
    entry.id = `special-${specialCategoryCount}`;

    entry.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h5 style="margin: 0; font-weight: 600;">Special Category Entry ${specialCategoryCount}</h5>
            <button type="button" class="btn btn-danger btn-sm" onclick="removeSpecialCategory('special-${specialCategoryCount}')">
                Remove
            </button>
        </div>
        <div class="form-grid">
            <div class="form-group">
                <label>Name in Full</label>
                <input type="text" name="specialName[]" class="form-input" placeholder="Full Name">
            </div>
            <div class="form-group">
                <label>Age</label>
                <input type="number" name="specialAge[]" class="form-input" min="1" placeholder="Age">
            </div>
        </div>
        <div class="form-grid">
            <div class="form-group">
                <label>Category</label>
                <select name="specialCategory[]" class="form-input">
                    <option value="">Select Category</option>
                    <option value="H">H - Hafiz</option>
                    <option value="M">M - Moulavi</option>
                    <option value="R">R - Revert</option>
                    <option value="D">D - Differently Abled</option>
                    <option value="C">C - Chronic Illness</option>
                    <option value="S">S - Special Needs</option>
                </select>
            </div>
            <div class="form-group">
                <label>Work Place</label>
                <input type="text" name="specialWorkplace[]" class="form-input" placeholder="Workplace">
            </div>
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea name="specialDescription[]" class="form-input" rows="2" placeholder="Additional details"></textarea>
        </div>
    `;

    container.appendChild(entry);
    updateSpecialCategoryCountInfo();

    // Re-initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Remove special category entry
function removeSpecialCategory(entryId) {
    const entry = document.getElementById(entryId);
    if (entry) {
        entry.remove();
        specialCategoryCount--;
        updateSpecialCategoryCountInfo();
    }
}

// Update special category count info
function updateSpecialCategoryCountInfo() {
    const info = document.getElementById('specialCategoryCountInfo');
    info.textContent = `${specialCategoryCount} entries added`;
}

// Collect household members data
function collectMembersData() {
    const members = [];
    const rows = document.querySelectorAll('.member-row');

    rows.forEach(row => {
        const member = {
            name: row.querySelector('input[name="memberName[]"]').value.trim(),
            nicNumber: row.querySelector('input[name="memberNIC[]"]').value.trim(),
            relationship: row.querySelector('input[name="memberRelationship[]"]').value.trim(),
            dateOfBirth: row.querySelector('input[name="memberDOB[]"]').value,
            gender: row.querySelector('select[name="memberGender[]"]').value,
            occupation: row.querySelector('input[name="memberOccupation[]"]').value.trim(),
            contactNumber: row.querySelector('input[name="memberContact[]"]').value.trim(),
            workplace: row.querySelector('input[name="memberWorkplace[]"]').value.trim(),
            civilStatus: row.querySelector('select[name="memberCivilStatus[]"]').value,
            qualification: row.querySelector('input[name="memberQualification[]"]').value.trim()
        };

        if (member.name && member.relationship) {
            members.push(member);
        }
    });

    return members;
}

// Collect special categories data
function collectSpecialCategoriesData() {
    const categories = [];
    const entries = document.querySelectorAll('.special-category-entry');

    entries.forEach((entry, index) => {
        const category = {
            name: entry.querySelector('input[name="specialName[]"]').value.trim(),
            age: entry.querySelector('input[name="specialAge[]"]').value,
            category: entry.querySelector('select[name="specialCategory[]"]').value,
            workplace: entry.querySelector('input[name="specialWorkplace[]"]').value.trim(),
            description: entry.querySelector('textarea[name="specialDescription[]"]').value.trim()
        };

        if (category.name || category.category) {
            categories.push(category);
        }
    });

    return categories;
}

// Add new family with comprehensive data
async function addNewFamily() {
    // Validate all required fields
    const familyName = document.getElementById('familyName');
    const nicNumber = document.getElementById('nicNumber');
    const phoneNumber = document.getElementById('phoneNumber');
    const email = document.getElementById('email');

    let isValid = true;

    if (!validateTextOnly(familyName, 'familyNameError')) isValid = false;
    if (!validateNIC(nicNumber)) isValid = false;
    if (!validatePhone(phoneNumber, 'phoneNumberError')) isValid = false;
    if (!validateEmail(email)) isValid = false;

    if (!isValid) {
        showToast('Please fix validation errors before submitting', 'error');
        return;
    }

    // Collect all form data
    const familyData = {
        // Family Information
        familyInfo: {
            address: document.getElementById('address').value.trim(),
            location: document.getElementById('location').value.trim(),
            familyName: familyName.value.trim(),
            phoneNumber: phoneNumber.value.trim(),
            email: email.value.trim(),
            eligibleZakath: document.querySelector('input[name="eligibleZakath"]:checked')?.value,
            houseOwnership: document.querySelector('input[name="houseOwnership"]:checked')?.value,
            numFamilyMembers: parseInt(document.getElementById('numFamilyMembers').value) || 0,
            nicNumber: nicNumber.value.trim()
        },

        // Household Members
        householdMembers: collectMembersData(),

        // Special Categories
        specialCategories: collectSpecialCategoriesData(),

        // Metadata
        status: 'active',
        lastModifiedBy: AppState.currentUser.username,
        totalMembers: memberRowCount
    };

    // Validate required fields
    if (!familyData.familyInfo.familyName || !familyData.familyInfo.nicNumber ||
        !familyData.familyInfo.address || !familyData.familyInfo.phoneNumber ||
        !familyData.familyInfo.email || !familyData.familyInfo.location) {
        showToast('Please fill all required fields in Section 1', 'error');
        return;
    }

    try {
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

        showToast('Family data saved successfully! ✓', 'success');
        resetForm();
        updateStats();

        // Clear search results
        document.getElementById('searchResults').innerHTML = `
            <p style="text-align: center; color: var(--text-muted); padding: 2rem;">
                Enter search terms above to find families
            </p>
        `;
        document.getElementById('searchInput').value = '';
    } catch (error) {
        console.error('Error adding family:', error);
        showToast('Error saving family data', 'error');
    }
}

// Reset form
function resetForm() {
    document.getElementById('addFamilyForm').reset();

    // Clear dynamic members
    document.getElementById('membersTableBody').innerHTML = '';
    memberRowCount = 0;
    updateMemberCountInfo();

    // Clear special categories
    document.getElementById('specialCategoriesContainer').innerHTML = '';
    specialCategoryCount = 0;
    updateSpecialCategoryCountInfo();

    // Clear validation states
    document.querySelectorAll('.form-input').forEach(input => {
        input.classList.remove('error', 'success');
    });
    document.querySelectorAll('.error-message').forEach(msg => {
        msg.textContent = '';
    });
}

// Search families (existing functionality)
async function searchFamilies() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    const resultsDiv = document.getElementById('searchResults');

    if (!searchTerm) {
        resultsDiv.innerHTML = `
            <p style="text-align: center; color: var(--text-muted); padding: 2rem;">
                Enter search terms above to find families
            </p>
        `;
        return;
    }

    if (searchTerm.length < 2) {
        resultsDiv.innerHTML = `
            <p style="text-align: center; color: var(--text-muted); padding: 2rem;">
                Please enter at least 2 characters to search
            </p>
        `;
        return;
    }

    try {
        let searchResults;

        if (AppState.isFirebaseReady && FirebaseDB) {
            searchResults = await FirebaseDB.searchFamilies(searchTerm);
        } else {
            searchResults = AppState.families.filter(family =>
                family.familyInfo?.familyName?.toLowerCase().includes(searchTerm) ||
                family.familyInfo?.phoneNumber?.includes(searchTerm) ||
                family.familyInfo?.email?.toLowerCase().includes(searchTerm) ||
                family.familyInfo?.address?.toLowerCase().includes(searchTerm) ||
                family.familyInfo?.location?.toLowerCase().includes(searchTerm) ||
                family.familyInfo?.nicNumber?.toLowerCase().includes(searchTerm)
            );
        }

        displaySearchResults(searchResults);
    } catch (error) {
        console.error('Search error:', error);
        showToast('Error searching families', 'error');
    }
}

// Display search results
function displaySearchResults(results) {
    const resultsDiv = document.getElementById('searchResults');

    if (results.length === 0) {
        resultsDiv.innerHTML = `
            <p style="text-align: center; color: var(--text-muted); padding: 2rem;">
                No families found matching your search
            </p>
        `;
        return;
    }

    resultsDiv.innerHTML = `
        <div style="display: grid; gap: 1rem;">
            ${results.map(family => `
                <div class="glass-container" style="padding: 1.5rem; border-left: 4px solid var(--primary-color);">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div>
                            <h4 style="font-size: 1.1rem; margin-bottom: 0.5rem;">${sanitizeInput(family.familyInfo?.familyName || 'N/A')}</h4>
                            <span class="badge ${family.status === 'active' ? 'active' : 'inactive'}">
                                ${family.status || 'active'}
                            </span>
                        </div>
                        <div style="text-align: right; color: var(--text-muted); font-size: 0.875rem;">
                            <div>ID: ${sanitizeInput(family.id || 'N/A')}</div>
                            <div>Registered: ${formatDate(family.createdAt)}</div>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
                        <div>
                            <div style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 0.25rem;">Contact</div>
                            <div style="color: var(--text-primary);">${formatPhoneNumber(family.familyInfo?.phoneNumber)}</div>
                        </div>
                        
                        ${family.familyInfo?.email ? `
                            <div>
                                <div style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 0.25rem;">Email</div>
                                <div style="color: var(--text-primary);">${sanitizeInput(family.familyInfo.email)}</div>
                            </div>
                        ` : ''}
                        
                        <div>
                            <div style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 0.25rem;">Total Members</div>
                            <div style="color: var(--text-primary);">${family.totalMembers || 0} members</div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 1rem;">
                        <div style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 0.25rem;">Address</div>
                        <div style="color: var(--text-primary);">${sanitizeInput(family.familyInfo?.address || 'N/A')}</div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div style="text-align: center; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
            <p style="color: var(--text-muted); font-size: 0.875rem;">
                Found ${results.length} ${results.length === 1 ? 'family' : 'families'}
            </p>
        </div>
    `;
}
