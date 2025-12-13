// Security Middleware for Enhanced Protection
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const crypto = require('crypto');

// Generate CSRF tokens
const csrfTokens = new Map();

function generateCSRFToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 3600000; // 1 hour
    csrfTokens.set(token, expiresAt);
    return token;
}

function validateCSRFToken(req, res, next) {
    const token = req.headers['x-csrf-token'];
    
    if (!token || !csrfTokens.has(token)) {
        return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    
    const expiresAt = csrfTokens.get(token);
    if (Date.now() > expiresAt) {
        csrfTokens.delete(token);
        return res.status(403).json({ error: 'CSRF token expired' });
    }
    
    csrfTokens.delete(token); // One-time use
    next();
}

// Clean up expired tokens
setInterval(() => {
    const now = Date.now();
    for (const [token, expiresAt] of csrfTokens.entries()) {
        if (now > expiresAt) {
            csrfTokens.delete(token);
        }
    }
}, 300000); // Clean up every 5 minutes

// Rate limiting
const createRateLimit = (windowMs, max, message) => rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
});

// Different rate limits for different endpoints
const authLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    5, // 5 attempts
    'Too many authentication attempts, please try again later'
);

const uploadLimiter = createRateLimit(
    60 * 1000, // 1 minute
    10, // 10 uploads
    'Too many upload attempts, please try again later'
);

const generalLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    100, // 100 requests
    'Too many requests, please try again later'
);

// Input validation
function validateInput(input, type = 'string') {
    if (typeof input !== 'string') return false;
    
    // Remove potentially dangerous characters
    const clean = input.trim();
    
    switch (type) {
        case 'username':
            return /^[a-zA-Z0-9_-]{3,30}$/.test(clean);
        case 'email':
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
        case 'slug':
            return /^[a-z0-9-]{3,63}$/.test(clean);
        case 'sitename':
            return clean.length >= 1 && clean.length <= 100 && !/<script/i.test(clean);
        default:
            return clean.length > 0 && clean.length <= 1000;
    }
}

// File upload validation
function validateFileUpload(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
        'text/html',
        'text/css',
        'text/javascript',
        'application/json',
        'text/plain',
        'image/png',
        'image/jpeg',
        'image/gif',
        'image/svg+xml',
        'image/x-icon'
    ];
    
    if (!file || !file.name || !file.type || !file.size) {
        return { valid: false, error: 'Invalid file data' };
    }
    
    if (file.size > maxSize) {
        return { valid: false, error: 'File too large (max 10MB)' };
    }
    
    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'File type not allowed' };
    }
    
    // Validate filename
    const filename = file.name;
    if (/\.\./.test(filename) || /[<>:"|?*]/.test(filename)) {
        return { valid: false, error: 'Invalid filename' };
    }
    
    return { valid: true };
}

// Content Security Policy
const cspPolicy = {
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://sites.super.myninja.ai"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        manifestSrc: ["'self'"]
    }
};

// Sanitize HTML content
function sanitizeHTML(html) {
    // Basic HTML sanitization - in production, use a library like DOMPurify
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
        .replace(/javascript:/gi, '') // Remove javascript: URLs
        .replace(/vbscript:/gi, '') // Remove vbscript: URLs
        .replace(/data:(?!image\/)/gi, ''); // Allow data: URLs for images only
}

// Security headers middleware
function securityHeaders(req, res, next) {
    // Helmet handles most security headers
    helmet({
        contentSecurityPolicy: cspPolicy,
        crossOriginEmbedderPolicy: false
    })(req, res, next);
}

// Request logging for security monitoring
function securityLogger(req, res, next) {
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${ip} - UA: ${userAgent}`);
    
    // Log suspicious activity
    if (req.path.includes('..') || req.path.includes('<script>')) {
        console.warn(`Suspicious request from ${ip}: ${req.method} ${req.path}`);
    }
    
    next();
}

module.exports = {
    generateCSRFToken,
    validateCSRFToken,
    authLimiter,
    uploadLimiter,
    generalLimiter,
    validateInput,
    validateFileUpload,
    sanitizeHTML,
    securityHeaders,
    securityLogger
};