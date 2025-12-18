// Data Entry Portal Logic

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    checkStaffAuth();
    initializeDataEntry();
    setupFormHandler();
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
        if (user.role !== 'staff') {
            showToast('Access denied. Staff privileges required.', 'error');
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

// Initialize data entry portal
async function initializeDataEntry() {
    await loadFamiliesData();
    updateStats();
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

// Add new family
async function addNewFamily() {
    const familyData = {
        familyName: document.getElementById('familyName').value.trim(),
        contactNumber: document.getElementById('contactNumber').value.trim(),
        email: document.getElementById('email').value.trim(),
        address: document.getElementById('address').value.trim(),
        area: document.getElementById('area').value.trim(),
        city: document.getElementById('city').value.trim(),
        postalCode: document.getElementById('postalCode').value.trim(),
        numberOfMembers: parseInt(document.getElementById('numberOfMembers').value) || 1,
        status: 'active',
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

        showToast('Family added successfully! ✓', 'success');
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
    document.getElementById('numberOfMembers').value = 1;
}

// Search families
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
                family.familyName?.toLowerCase().includes(searchTerm) ||
                family.contactNumber?.includes(searchTerm) ||
                family.email?.toLowerCase().includes(searchTerm) ||
                family.address?.toLowerCase().includes(searchTerm) ||
                family.area?.toLowerCase().includes(searchTerm) ||
                family.city?.toLowerCase().includes(searchTerm)
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
                            <h4 style="font-size: 1.1rem; margin-bottom: 0.5rem;">${sanitizeInput(family.familyName)}</h4>
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
                            <div style="color: var(--text-primary);">${formatPhoneNumber(family.contactNumber)}</div>
                        </div>
                        
                        ${family.email ? `
                            <div>
                                <div style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 0.25rem;">Email</div>
                                <div style="color: var(--text-primary);">${sanitizeInput(family.email)}</div>
                            </div>
                        ` : ''}
                        
                        <div>
                            <div style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 0.25rem;">Members</div>
                            <div style="color: var(--text-primary);">${family.numberOfMembers || 0} members</div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 1rem;">
                        <div style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 0.25rem;">Address</div>
                        <div style="color: var(--text-primary);">${sanitizeInput(family.address)}</div>
                        ${family.area || family.city ? `
                            <div style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem;">
                                ${[family.area, family.city, family.postalCode].filter(Boolean).join(', ')}
                            </div>
                        ` : ''}
                    </div>
                    
                    ${family.notes ? `
                        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                            <div style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 0.25rem;">Notes</div>
                            <div style="color: var(--text-secondary); font-size: 0.9rem;">${sanitizeInput(family.notes)}</div>
                        </div>
                    ` : ''}
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
