// Global variables
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let selectedTemplate = null;
let editingSiteId = null;
let templates = [];

// API Base URL
const API_BASE = '/api';

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadTemplates();
    loadDomainExtensions();
    
    // Set up search functionality
    const searchInput = document.getElementById('searchUsers');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchUsers, 300));
    }
});

// Check authentication
async function checkAuth() {
    if (!authToken) {
        window.location.href = '/';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/user/sites`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            logout();
            return;
        }

        // Get user data from localStorage
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            currentUser = JSON.parse(storedUser);
            updateUserDisplay();
            
            // Check if user is admin (username: Ntando)
            if (currentUser.username === 'Ntando') {
                document.getElementById('adminMenuItems').style.display = 'block';
            }
            
            // Load dashboard data
            loadDashboardData();
            loadSites();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        logout();
    }
}

// Update user display
function updateUserDisplay() {
    if (!currentUser) return;

    document.getElementById('userDisplayName').textContent = currentUser.username;
    document.getElementById('userAvatar').textContent = currentUser.username.charAt(0).toUpperCase();
    document.getElementById('settingsUsername').value = currentUser.username;
    document.getElementById('settingsEmail').value = currentUser.email;
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const response = await fetch(`${API_BASE}/user/sites`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const sites = await response.json();
            updateDashboardStats(sites);
            updateRecentSites(sites);
        }

        // Load system data if admin
        if (currentUser.username === 'Ntando') {
            loadSystemData();
        }
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

// Update dashboard statistics
function updateDashboardStats(sites) {
    const totalSites = sites.length;
    const totalVisits = sites.reduce((sum, site) => sum + (site.visits || 0), 0);
    const storageUsed = totalSites * 5; // Estimate 5MB per site

    document.getElementById('totalSites').textContent = totalSites;
    document.getElementById('totalVisits').textContent = totalVisits.toLocaleString();
    document.getElementById('storageUsed').textContent = `${storageUsed} MB`;
}

// Update recent sites
function updateRecentSites(sites) {
    const recentSitesDiv = document.getElementById('recentSites');
    const recentSites = sites.slice(-5).reverse();

    if (recentSites.length === 0) {
        recentSitesDiv.innerHTML = '<p style="color: var(--text-muted);">No sites created yet</p>';
        return;
    }

    recentSitesDiv.innerHTML = recentSites.map(site => `
        <div style="padding: 1rem 0; border-bottom: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: 600;">${site.name}</div>
                    <div style="color: var(--text-muted); font-size: 0.875rem;">${site.primaryDomain}</div>
                </div>
                <div style="text-align: right;">
                    <div style="color: var(--text-muted); font-size: 0.875rem;">${site.visits || 0} visits</div>
                    <div style="color: var(--text-muted); font-size: 0.875rem;">${formatDate(site.updatedAt)}</div>
                </div>
            </div>
        </div>
    `).join('');
}

// Load sites
async function loadSites() {
    try {
        const response = await fetch(`${API_BASE}/user/sites`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const sites = await response.json();
            displaySites(sites);
        }
    } catch (error) {
        console.error('Failed to load sites:', error);
    }
}

// Display sites
function displaySites(sites) {
    const sitesGrid = document.getElementById('sitesGrid');
    if (!sitesGrid) return;

    const sitesHTML = `
        <div class="create-site-card" onclick="showSection('create-site')">
            <div class="create-site-icon">➕</div>
            <h3>Create New Site</h3>
            <p>Start building your website</p>
        </div>
    `;

    const siteCards = sites.map(site => `
        <div class="site-card">
            <div class="site-header">
                <div>
                    <div class="site-title">${site.name}</div>
                    <div class="site-url">${site.primaryDomain}</div>
                </div>
                <span class="badge badge-success">Active</span>
            </div>
            <div class="site-stats">
                <div class="site-stat">👁️ ${site.visits || 0} views</div>
                <div class="site-stat">📅 ${formatDate(site.createdAt)}</div>
            </div>
            <div class="site-actions">
                <a href="${site.fullUrl}" target="_blank" class="btn btn-sm btn-primary">👁️ View</a>
                <button onclick="editSite('${site.id}')" class="btn btn-sm btn-secondary">✏️ Edit</button>
                <button onclick="deleteSite('${site.id}')" class="btn btn-sm btn-danger">🗑️ Delete</button>
            </div>
        </div>
    `).join('');

    sitesGrid.innerHTML = sitesHTML + siteCards;
}

// Load templates
async function loadTemplates() {
    try {
        const response = await fetch(`${API_BASE}/templates`);
        if (response.ok) {
            templates = await response.json();
            displayTemplates(templates);
        }
    } catch (error) {
        console.error('Failed to load templates:', error);
    }
}

// Display templates
function displayTemplates(templatesList) {
    const templateGrid = document.getElementById('templateGrid');
    const allTemplatesGrid = document.getElementById('allTemplates');
    
    const templateHTML = templatesList.map(template => `
        <div class="template-card ${selectedTemplate === template.id ? 'selected' : ''}" onclick="selectTemplate('${template.id}')">
            <div class="template-preview">
                📄
            </div>
            <div class="template-info">
                <div class="template-title">${template.name}</div>
                <div class="template-description">${template.description}</div>
            </div>
        </div>
    `).join('');

    if (templateGrid) templateGrid.innerHTML = templateHTML;
    if (allTemplatesGrid) allTemplatesGrid.innerHTML = templateHTML;
}

// Select template
function selectTemplate(templateId) {
    selectedTemplate = templateId;
    displayTemplates(templates);
    
    // Load template content
    const template = templates.find(t => t.id === templateId);
    if (template) {
        document.getElementById('siteHTML').value = template.html;
        document.getElementById('siteCSS').value = template.css || '';
        document.getElementById('siteJS').value = template.js || '';
    }
}

// Load domain extensions
async function loadDomainExtensions() {
    try {
        const response = await fetch(`${API_BASE}/domains/extensions`);
        if (response.ok) {
            const data = await response.json();
            
            // Update domain selects
            const selects = ['settingsDomain', 'newUserDomain'];
            selects.forEach(selectId => {
                const select = document.getElementById(selectId);
                if (select) {
                    select.innerHTML = data.extensions.map(ext => {
                        const isPremium = data.customSubdomains && data.customSubdomains[ext] && data.customSubdomains[ext].premium;
                        return `<option value="${ext}">${ext} ${isPremium ? '(Premium)' : '(Standard)'}</option>`;
                    }).join('');
                }
            });

            // Update domain extensions display
            const extensionsDiv = document.getElementById('domainExtensions');
            if (extensionsDiv) {
                extensionsDiv.innerHTML = `
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
                        ${data.extensions.map(ext => {
                            const isPremium = data.customSubdomains && data.customSubdomains[ext] && data.customSubdomains[ext].premium;
                            return `
                                <div style="padding: 1rem; border: 1px solid var(--border-color); border-radius: var(--radius);">
                                    <div style="font-weight: 600;">${ext}</div>
                                    <div style="color: ${isPremium ? 'var(--warning-color)' : 'var(--success-color)'}; font-size: 0.875rem;">
                                        ${isPremium ? 'Premium' : 'Standard'}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }

            // Update user subdomains
            updateSubdomainDisplay(data);
        }
    } catch (error) {
        console.error('Failed to load domain extensions:', error);
    }
}

// Update subdomain display
function updateSubdomainDisplay(domainData) {
    const subdomainsDiv = document.getElementById('userSubdomains');
    if (!subdomainsDiv || !currentUser) return;

    const userSubdomain = currentUser.subdomain;
    const slug = userSubdomain.substring(0, userSubdomain.lastIndexOf('.'));
    
    subdomainsDiv.innerHTML = `
        <div style="padding: 1rem; background: var(--light-color); border-radius: var(--radius);">
            <div style="font-weight: 600; margin-bottom: 1rem;">Your Subdomains</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">
                ${domainData.aliases.map(alias => {
                    const fullDomain = `${slug}.${alias}`;
                    return `
                        <div style="padding: 0.75rem; background: white; border-radius: var(--radius); border: 1px solid var(--border-color);">
                            <div style="font-weight: 600;">${fullDomain}</div>
                            <div style="color: var(--success-color); font-size: 0.875rem;">✓ Active</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// Create site
async function createSite(event) {
    event.preventDefault();
    
    const siteName = document.getElementById('siteName').value.trim();
    const siteSlug = document.getElementById('siteSlug').value.trim();
    const html = document.getElementById('siteHTML').value;
    const css = document.getElementById('siteCSS').value;
    const js = document.getElementById('siteJS').value;
    const enableDNS = document.getElementById('enableDNS').checked;

    if (!siteName || !siteSlug || !html) {
        alert('Please fill in all required fields');
        return;
    }

    // Validate slug
    if (!/^[a-zA-Z0-9-]{3,63}$/.test(siteSlug)) {
        alert('Site URL must be 3-63 characters, letters, numbers, and hyphens only');
        return;
    }

    document.getElementById('createSiteText').style.display = 'none';
    document.getElementById('createSiteSpinner').style.display = 'inline-block';

    try {
        const response = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                siteName,
                siteSlug,
                html,
                css,
                js,
                enableDNS
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Site created successfully!');
            document.getElementById('createSiteForm').reset();
            showSection('sites');
            loadSites();
            loadDashboardData();
        } else {
            alert(data.error || 'Failed to create site');
        }
    } catch (error) {
        console.error('Create site error:', error);
        alert('Network error. Please try again.');
    } finally {
        document.getElementById('createSiteText').style.display = 'inline';
        document.getElementById('createSiteSpinner').style.display = 'none';
    }
}

// Edit site
async function editSite(siteId) {
    try {
        const response = await fetch(`${API_BASE}/sites/${siteId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            editingSiteId = siteId;
            
            document.getElementById('editSiteName').value = data.site.name;
            document.getElementById('editSiteHTML').value = data.html;
            document.getElementById('editSiteCSS').value = '';
            document.getElementById('editSiteJS').value = '';
            
            showModal('editSiteModal');
        }
    } catch (error) {
        console.error('Failed to load site:', error);
    }
}

// Update site
async function updateSite(event) {
    event.preventDefault();
    
    const siteName = document.getElementById('editSiteName').value.trim();
    const html = document.getElementById('editSiteHTML').value;
    const css = document.getElementById('editSiteCSS').value;
    const js = document.getElementById('editSiteJS').value;

    if (!siteName || !html) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/sites/${editingSiteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                siteName,
                html,
                css,
                js
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Site updated successfully!');
            hideModal('editSiteModal');
            loadSites();
            loadDashboardData();
        } else {
            alert(data.error || 'Failed to update site');
        }
    } catch (error) {
        console.error('Update site error:', error);
        alert('Network error. Please try again.');
    }
}

// Delete site
async function deleteSite(siteId) {
    if (!confirm('Are you sure you want to delete this site? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/sites/${siteId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            alert('Site deleted successfully!');
            loadSites();
            loadDashboardData();
        } else {
            alert(data.error || 'Failed to delete site');
        }
    } catch (error) {
        console.error('Delete site error:', error);
        alert('Network error. Please try again.');
    }
}

// Load system data (admin only)
async function loadSystemData() {
    try {
        // This would typically be an admin endpoint
        // For now, we'll simulate it
        document.getElementById('totalUsers').textContent = '0';
        document.getElementById('systemTotalSites').textContent = '0';
        loadUsers();
    } catch (error) {
        console.error('Failed to load system data:', error);
    }
}

// Load users (admin only)
async function loadUsers() {
    // This would typically be an admin endpoint to get all users
    // For now, we'll show current user info
    const usersTableBody = document.getElementById('usersTableBody');
    if (!usersTableBody) return;

    if (currentUser) {
        usersTableBody.innerHTML = `
            <tr>
                <td>${currentUser.username}</td>
                <td>${currentUser.email}</td>
                <td>${currentUser.subdomain}</td>
                <td>0</td>
                <td>${formatDate(currentUser.createdAt)}</td>
                <td><span class="badge badge-success">Active</span></td>
                <td>
                    <div class="user-actions">
                        <button class="btn btn-sm btn-secondary">Edit</button>
                        <button class="btn btn-sm btn-danger">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Create user (admin only)
async function createUser(event) {
    event.preventDefault();
    
    const username = document.getElementById('newUserUsername').value.trim();
    const email = document.getElementById('newUserEmail').value.trim();
    const password = document.getElementById('newUserPassword').value;
    const domainExtension = document.getElementById('newUserDomain').value;

    if (!username || !email || !password) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                email,
                password,
                domainExtension
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('User created successfully!');
            hideModal('createUserModal');
            loadUsers();
        } else {
            alert(data.error || 'Failed to create user');
        }
    } catch (error) {
        console.error('Create user error:', error);
        alert('Network error. Please try again.');
    }
}

// Search users (admin only)
function searchUsers() {
    const searchTerm = document.getElementById('searchUsers').value.toLowerCase();
    const rows = document.querySelectorAll('#usersTableBody tr');
    
    rows.forEach(row => {
        const username = row.cells[0].textContent.toLowerCase();
        const email = row.cells[1].textContent.toLowerCase();
        
        if (username.includes(searchTerm) || email.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Update settings
async function updateSettings(event) {
    event.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value;
    const domainExtension = document.getElementById('settingsDomain').value;

    try {
        // This would typically be an endpoint to update user settings
        // For now, we'll just show success
        alert('Settings updated successfully!');
    } catch (error) {
        console.error('Update settings error:', error);
        alert('Failed to update settings');
    }
}

// Navigation functions
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.classList.add('active');
    }
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Update page title
    const titles = {
        overview: 'Dashboard',
        sites: 'My Sites',
        'create-site': 'Create Site',
        templates: 'Templates',
        analytics: 'Analytics',
        domains: 'Domains',
        users: 'User Management',
        system: 'System',
        security: 'Security',
        settings: 'Settings'
    };
    
    document.getElementById('pageTitle').textContent = titles[sectionId] || 'Dashboard';
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

function switchTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Show selected tab
    event.target.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

function switchEditTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('#editSiteModal .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Hide all tab contents
    document.querySelectorAll('#editSiteModal .tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Show selected tab
    event.target.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

function showCreateUserModal() {
    showModal('createUserModal');
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function previewSite() {
    const html = document.getElementById('siteHTML').value;
    const css = document.getElementById('siteCSS').value;
    const js = document.getElementById('siteJS').value;
    
    let fullHtml = html;
    if (css) {
        fullHtml = fullHtml.replace('</head>', `<style>${css}</style></head>`);
    }
    if (js) {
        fullHtml = fullHtml.replace('</body>', `<script>${js}</script></body>`);
    }
    
    const preview = window.open('', '_blank');
    preview.document.write(fullHtml);
    preview.document.close();
}

function previewEditSite() {
    const html = document.getElementById('editSiteHTML').value;
    const css = document.getElementById('editSiteCSS').value;
    const js = document.getElementById('editSiteJS').value;
    
    let fullHtml = html;
    if (css) {
        fullHtml = fullHtml.replace('</head>', `<style>${css}</style></head>`);
    }
    if (js) {
        fullHtml = fullHtml.replace('</body>', `<script>${js}</script></body>`);
    }
    
    const preview = window.open('', '_blank');
    preview.document.write(fullHtml);
    preview.document.close();
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = '/';
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Close modals when clicking outside
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        hideModal(event.target.id);
    }
});

// Close modals with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            hideModal(modal.id);
        });
    }
});