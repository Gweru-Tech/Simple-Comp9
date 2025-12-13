const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'ntandostore-secret-key-2024';

// CSRF Token Management
const CSRF_TOKENS = new Map();

function generateCSRFToken() {
  const token = crypto.randomBytes(32).toString('hex');
  CSRF_TOKENS.set(token, {
    createdAt: Date.now(),
    expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  });
  
  // Clean up expired tokens
  const now = Date.now();
  for (const [key, value] of CSRF_TOKENS.entries()) {
    if (value.expiresAt < now) {
      CSRF_TOKENS.delete(key);
    }
  }
  
  return token;
}

function validateCSRFToken(req, res, next) {
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  
  if (!token) {
    return res.status(403).json({ error: 'CSRF token required' });
  }
  
  const tokenData = CSRF_TOKENS.get(token);
  
  if (!tokenData || tokenData.expiresAt < Date.now()) {
    return res.status(403).json({ error: 'Invalid or expired CSRF token' });
  }
  
  // Remove used token
  CSRF_TOKENS.delete(token);
  
  next();
}

// Rate Limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads per window
  message: { error: 'Too many upload attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Input Validation
function validateInput(input, type) {
  if (!input || typeof input !== 'string') {
    return false;
  }

  // Sanitize input
  const sanitized = input.trim();

  switch (type) {
    case 'username':
      return /^[a-zA-Z0-9_-]{3,30}$/.test(sanitized);
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized);
    case 'slug':
      return /^[a-zA-Z0-9-]{3,63}$/.test(sanitized);
    case 'sitename':
      return sanitized.length >= 1 && sanitized.length <= 100;
    default:
      return sanitized.length > 0 && sanitized.length <= 1000;
  }
}

// File Upload Validation
function validateFileUpload(file) {
  const allowedTypes = [
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'image/x-icon'
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return { valid: false, error: 'File type not allowed' };
  }

  // Check file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'File size too large' };
  }

  return { valid: true };
}

// HTML Sanitization
function sanitizeHTML(html) {
  if (!html) return '';
  
  // Basic XSS protection
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<iframe[^>]*>/gi, '')
    .replace(/<\/iframe>/gi, '')
    .replace(/<object[^>]*>/gi, '')
    .replace(/<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<\/embed>/gi, '');
}

// Security Headers
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://sites.super.myninja.ai"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Security Logger
function securityLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration,
      suspicious: false
    };

    // Check for suspicious activity
    const suspiciousPatterns = [
      /\.\./,
      /<script/i,
      /javascript:/i,
      /union.*select/i,
      /drop.*table/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(req.originalUrl) || pattern.test(JSON.stringify(req.body))) {
        log.suspicious = true;
        console.warn('🚨 Suspicious activity detected:', log);
        break;
      }
    }

    if (!log.suspicious && (res.statusCode >= 400 || duration > 5000)) {
      console.warn('⚠️ Request worth noting:', log);
    }
  });

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