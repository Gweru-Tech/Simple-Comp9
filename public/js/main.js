// Global variables
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// API Base URL
const API_BASE = '/api';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    if (authToken) {
        validateToken();
    }
    
    // Load domain extensions
    loadDomainExtensions();
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Modal functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus first input
        const firstInput = modal.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        // Clear forms
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
        
        // Clear errors
        clearErrors(modalId);
    }
}

function switchToRegister() {
    hideModal('loginModal');
    showModal('registerModal');
}

function switchToLogin() {
    hideModal('registerModal');
    showModal('loginModal');
}

// Clear error messages
function clearErrors(modalId) {
    const errorDiv = document.getElementById(modalId === 'loginModal' ? 'loginError' : 'registerError');
    if (errorDiv) {
        errorDiv.classList.add('hidden');
        errorDiv.textContent = '';
    }
}

// Show error message
function showError(modalId, message) {
    const errorDiv = document.getElementById(modalId === 'loginModal' ? 'loginError' : 'registerError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }
}

// Show loading state
function setLoading(modalId, loading) {
    const textSpan = document.getElementById(modalId === 'loginModal' ? 'loginText' : 'registerText');
    const spinner = document.getElementById(modalId === 'loginModal' ? 'loginSpinner' : 'registerSpinner');
    const submitBtn = document.querySelector(`#${modalId === 'loginModal' ? 'loginForm' : 'registerForm'} button[type="submit"]`);
    
    if (loading) {
        textSpan.classList.add('hidden');
        spinner.classList.remove('hidden');
        submitBtn.disabled = true;
    } else {
        textSpan.classList.remove('hidden');
        spinner.classList.add('hidden');
        submitBtn.disabled = false;
    }
}

// Load domain extensions
async function loadDomainExtensions() {
    try {
        const response = await fetch(`${API_BASE}/domains/extensions`);
        if (response.ok) {
            const data = await response.json();
            const select = document.getElementById('domainExtension');
            if (select) {
                select.innerHTML = '';
                data.extensions.forEach(ext => {
                    const option = document.createElement('option');
                    option.value = ext;
                    const isPremium = data.customSubdomains && data.customSubdomains[ext] && data.customSubdomains[ext].premium;
                    option.textContent = `${ext} ${isPremium ? '(Premium)' : '(Standard)'}`;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Failed to load domain extensions:', error);
    }
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    clearErrors('loginModal');
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showError('loginModal', 'Please fill in all fields');
        return;
    }
    
    setLoading('loginModal', true);
    
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store auth token and user data
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Redirect to dashboard
            window.location.href = '/dashboard';
        } else {
            showError('loginModal', data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('loginModal', 'Network error. Please try again.');
    } finally {
        setLoading('loginModal', false);
    }
}

// Handle registration
async function handleRegister(event) {
    event.preventDefault();
    clearErrors('registerModal');
    
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const domainExtension = document.getElementById('domainExtension').value;
    
    // Basic validation
    if (!username || !email || !password) {
        showError('registerModal', 'Please fill in all fields');
        return;
    }
    
    if (password.length < 6) {
        showError('registerModal', 'Password must be at least 6 characters');
        return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('registerModal', 'Please enter a valid email address');
        return;
    }
    
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
        showError('registerModal', 'Username must be 3-30 characters, letters, numbers, hyphens, underscores only');
        return;
    }
    
    setLoading('registerModal', true);
    
    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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
            // Store auth token and user data
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Show success message and redirect
            showError('registerModal', 'Registration successful! Redirecting to dashboard...');
            document.getElementById('registerError').classList.remove('alert-error');
            document.getElementById('registerError').classList.add('alert-success');
            
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);
        } else {
            showError('registerModal', data.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('registerModal', 'Network error. Please try again.');
    } finally {
        setLoading('registerModal', false);
    }
}

// Validate token
async function validateToken() {
    try {
        const response = await fetch(`${API_BASE}/user/sites`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            // Token is valid, user is logged in
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                currentUser = JSON.parse(storedUser);
            }
        } else {
            // Token is invalid, clear it
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            authToken = null;
            currentUser = null;
        }
    } catch (error) {
        console.error('Token validation error:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        authToken = null;
        currentUser = null;
    }
}

// Contact sales function
function contactSales() {
    alert('Please contact us at sales@ntando.app for enterprise plans.');
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

// Form validation helpers
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateUsername(username) {
    return /^[a-zA-Z0-9_-]{3,30}$/.test(username);
}

function validatePassword(password) {
    return password.length >= 6;
}

// Utility functions
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

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

// Add animation on scroll
function animateOnScroll() {
    const elements = document.querySelectorAll('.feature-card, .pricing-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });
    
    elements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
}

// Initialize animations
animateOnScroll();

// Add parallax effect to hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Add hover effect to cards
document.querySelectorAll('.feature-card, .pricing-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});