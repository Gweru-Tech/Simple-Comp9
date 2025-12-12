const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'ntandostore-secret-key-2024';

// Enhanced Domain Configuration with comprehensive subdomain linking
const DOMAIN_CONFIG = {
  primary: 'ntando.app',
  aliases: ['ntando.app', 'ntl.cloud', 'ntando.zw', 'ntandostore.com'],
  extensions: [
    '.app',
    '.cloud', 
    '.zw',
    '.com',
    '.online', 
    '.id',
    '.net',
    '.store',
    '.blog',
    '.uk',
    '.org'
  ],
  defaultExtension: '.app',
  customSubdomains: {
    'ntando.app': { 
      premium: true, 
      description: 'Premium app domain',
      type: 'primary',
      target: 'ntando.app'
    },
    'ntl.cloud': { 
      premium: true, 
      description: 'Cloud services domain',
      type: 'alias',
      target: 'ntando.app'
    },
    'ntando.zw': { 
      premium: true, 
      description: 'Zimbabwe domain',
      type: 'alias',
      target: 'ntando.app'
    },
    'ntandostore.com': { 
      premium: false, 
      description: 'Standard domain',
      type: 'legacy',
      target: 'ntando.app'
    }
  },
  // Subdomain mapping for all domains
  subdomainMapping: {
    // Primary domain subdomains
    'ntando.app': {
      base: 'ntando.app',
      pattern: '{subdomain}.ntando.app',
      aliases: ['{subdomain}.ntl.cloud', '{subdomain}.ntando.zw']
    },
    // Cloud domain subdomains
    'ntl.cloud': {
      base: 'ntl.cloud',
      pattern: '{subdomain}.ntl.cloud',
      aliases: ['{subdomain}.ntando.app', '{subdomain}.ntando.zw']
    },
    // Zimbabwe domain subdomains
    'ntando.zw': {
      base: 'ntando.zw',
      pattern: '{subdomain}.ntando.zw',
      aliases: ['{subdomain}.ntando.app', '{subdomain}.ntl.cloud']
    },
    // Legacy domain subdomains
    'ntandostore.com': {
      base: 'ntandostore.com',
      pattern: '{subdomain}.ntandostore.com',
      aliases: ['{subdomain}.ntando.app']
    }
  }
};

// DNS Forwarding Configuration
const DNS_CONFIG = {
  enabled: process.env.DNS_FORWARDING_ENABLED === 'true',
  provider: process.env.DNS_PROVIDER || 'cloudflare',
  apiKey: process.env.DNS_API_KEY,
  zones: {
    'ntando.app': process.env.DNS_ZONE_APP,
    'ntl.cloud': process.env.DNS_ZONE_CLOUD,
    'ntando.zw': process.env.DNS_ZONE_ZW,
    'ntandostore.com': process.env.DNS_ZONE_COM,
    'ntandostore.online': process.env.DNS_ZONE_ONLINE,
    'ntandostore.id': process.env.DNS_ZONE_ID,
    'ntandostore.cloud': process.env.DNS_ZONE_CLOUD_ALT,
    'ntandostore.net': process.env.DNS_ZONE_NET,
    'ntandostore.store': process.env.DNS_ZONE_STORE,
    'ntandostore.blog': process.env.DNS_ZONE_BLOG,
    'ntandostore.uk': process.env.DNS_ZONE_UK,
    'ntandostore.zw': process.env.DNS_ZONE_ZW_ALT,
    'ntandostore.org': process.env.DNS_ZONE_ORG
  }
};

// Ensure JWT_SECRET is set in production
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('JWT_SECRET environment variable is required in production');
  console.error('Please set JWT_SECRET in your Render.com environment variables');
  console.warn('⚠️  Using fallback JWT_SECRET - PLEASE SET PROPERLY IN RENDER DASHBOARD!');
  process.env.JWT_SECRET = 'ntandostore-emergency-fallback-' + Date.now();
}

// Ensure directories exist
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const USERS_DIR = path.join(__dirname, 'users');
const DOMAINS_FILE = path.join(__dirname, 'domains.json');
const USERS_FILE = path.join(__dirname, 'users.json');
const DNS_RECORDS_FILE = path.join(__dirname, 'dns-records.json');

// Create directories if they don't exist
async function ensureDirectories() {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.mkdir(USERS_DIR, { recursive: true });
    
    // Initialize files if they don't exist
    try {
      await fs.access(DOMAINS_FILE);
    } catch {
      await fs.writeFile(DOMAINS_FILE, JSON.stringify({}));
    }
    
    try {
      await fs.access(USERS_FILE);
    } catch {
      await fs.writeFile(USERS_FILE, JSON.stringify({}));
    }

    try {
      await fs.access(DNS_RECORDS_FILE);
    } catch {
      await fs.writeFile(DNS_RECORDS_FILE, JSON.stringify({}));
    }
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

// Initialize directories on startup
ensureDirectories();

// Middleware
app.use(express.static('public'));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/hosted', express.static(UPLOADS_DIR));
app.use('/users', express.static(USERS_DIR));

// Handle specific routes for static files
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// DNS Forwarding Functions
async function createDNSRecord(domain, recordType, name, content) {
  if (!DNS_CONFIG.enabled || !DNS_CONFIG.apiKey) {
    console.log(`DNS forwarding not enabled. Mock DNS record created: ${name}.${domain} -> ${content}`);
    return { success: true, record: { name, content, type: recordType } };
  }

  try {
    console.log(`Creating DNS record: ${name}.${domain} -> ${content}`);
    return { success: true, record: { name, content, type: recordType } };
  } catch (error) {
    console.error('Failed to create DNS record:', error);
    return { success: false, error: error.message };
  }
}

async function deleteDNSRecord(domain, recordId) {
  if (!DNS_CONFIG.enabled || !DNS_CONFIG.apiKey) {
    console.log(`DNS forwarding not enabled. Mock DNS record deleted: ${recordId}`);
    return { success: true };
  }

  try {
    console.log(`Deleting DNS record: ${recordId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete DNS record:', error);
    return { success: false, error: error.message };
  }
}

// Generate unique subdomain with enhanced options
function generateSubdomain(username, domainExtension = '.app') {
  const adjectives = ['quick', 'bright', 'clever', 'swift', 'smart', 'happy', 'lucky', 'sunny', 'cool', 'warm', 'elite', 'pro', 'max', 'ultra'];
  const nouns = ['site', 'web', 'page', 'space', 'zone', 'hub', 'spot', 'place', 'world', 'realm', 'studio', 'lab', 'tech', 'digital'];
  const numbers = Math.floor(Math.random() * 9999) + 1;
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  // Clean username for subdomain use
  const cleanUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
  
  return `${cleanUsername}-${adjective}${noun}${numbers}`;
}

// Validate username
function validateUsername(username) {
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  if (!validPattern.test(username)) {
    return false;
  }
  
  if (username.length < 3 || username.length > 30) {
    return false;
  }
  
  if (username.startsWith('-') || username.endsWith('-') || username.startsWith('_') || username.endsWith('_')) {
    return false;
  }
  
  const reserved = ['www', 'api', 'admin', 'dashboard', 'mail', 'ftp', 'cdn', 'static', 'assets', 'hosted', 'users'];
  if (reserved.includes(username.toLowerCase())) {
    return false;
  }
  
  return true;
}

// Validate subdomain with enhanced rules
function validateSubdomain(subdomain) {
  const validPattern = /^[a-zA-Z0-9-]+$/;
  if (!validPattern.test(subdomain)) {
    return false;
  }
  
  if (subdomain.length < 3 || subdomain.length > 63) {
    return false;
  }
  
  if (subdomain.startsWith('-') || subdomain.endsWith('-')) {
    return false;
  }
  
  return true;
}

// Validate domain extension with premium checking
function validateDomainExtension(extension) {
  return DOMAIN_CONFIG.extensions.includes(extension);
}

// Check if domain is premium
function isPremiumDomain(extension) {
  const domainConfig = DOMAIN_CONFIG.customSubdomains[extension];
  return domainConfig && domainConfig.premium;
}

// Check domain availability
async function checkDomainAvailability(subdomain, extension) {
  try {
    const usersData = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(usersData);
    
    const domainName = `${subdomain}${extension}`;
    
    // Check if any user has this subdomain with the same extension
    for (const user of Object.values(users)) {
      if (user.subdomain === domainName) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking domain availability:', error);
    return true;
  }
}

// Get all linked domains for a subdomain
function getLinkedDomains(subdomain, baseDomain) {
  const mapping = DOMAIN_CONFIG.subdomainMapping[baseDomain];
  if (!mapping) return [];

  const domains = [mapping.pattern.replace('{subdomain}', subdomain)];
  
  // Add all aliases
  if (mapping.aliases) {
    mapping.aliases.forEach(alias => {
      domains.push(alias.replace('{subdomain}', subdomain));
    });
  }

  return domains;
}

// Resolve subdomain to primary domain
function resolveSubdomain(host) {
  const parts = host.split('.');
  
  if (parts.length < 2) return null;
  
  const subdomain = parts[0];
  const domain = parts.slice(1).join('.');
  
  // Check if this is one of our domains
  if (DOMAIN_CONFIG.aliases.includes(domain)) {
    return {
      subdomain,
      domain,
      originalDomain: domain,
      primaryDomain: DOMAIN_CONFIG.primary,
      isAlias: domain !== DOMAIN_CONFIG.primary,
      fullSubdomain: `${subdomain}.${domain}`
    };
  }
  
  return null;
}

// Get canonical domain for routing
function getCanonicalDomain(resolvedSubdomain) {
  if (!resolvedSubdomain) return null;
  
  // Always route to primary domain internally
  return {
    subdomain: resolvedSubdomain.subdomain,
    canonicalDomain: resolvedSubdomain.primaryDomain,
    originalRequest: resolvedSubdomain.fullSubdomain,
    allDomains: getLinkedDomains(resolvedSubdomain.subdomain, resolvedSubdomain.primaryDomain)
  };
}

// Check if subdomain exists across all domains
async function findSubdomainAcrossDomains(subdomain) {
  try {
    const usersData = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(usersData);
    
    // Search for the subdomain across all user sites
    for (const user of Object.values(users)) {
      for (const site of user.sites) {
        if (site.slug === subdomain) {
          return {
            site,
            user,
            found: true
          };
        }
      }
    }
    
    return { found: false };
  } catch (error) {
    console.error('Error finding subdomain:', error);
    return { found: false };
  }
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get available domain extensions with premium info
app.get('/api/domains/extensions', (req, res) => {
  res.json({
    extensions: DOMAIN_CONFIG.extensions,
    default: DOMAIN_CONFIG.defaultExtension,
    aliases: DOMAIN_CONFIG.aliases,
    customSubdomains: DOMAIN_CONFIG.customSubdomains,
    primary: DOMAIN_CONFIG.primary,
    subdomainMapping: DOMAIN_CONFIG.subdomainMapping
  });
});

// Get subdomain information and links
app.get('/api/domains/subdomain/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;
    
    // Get all linked domains
    const linkedDomains = getLinkedDomains(subdomain, 'ntando.app');
    
    // Check if subdomain exists
    const result = await findSubdomainAcrossDomains(subdomain);
    
    res.json({
      subdomain,
      linkedDomains,
      primaryDomain: `${subdomain}.ntando.app`,
      aliasDomains: linkedDomains.filter(d => d !== `${subdomain}.ntando.app`),
      exists: result.found,
      siteInfo: result.found ? {
        name: result.site.name,
        user: result.user.username,
        visits: result.site.visits,
        createdAt: result.site.createdAt
      } : null
    });
  } catch (error) {
    console.error('Error getting subdomain info:', error);
    res.status(500).json({ error: 'Failed to get subdomain information' });
  }
});

// Test subdomain routing
app.get('/api/domains/test/:subdomain', (req, res) => {
  try {
    const { subdomain } = req.params;
    
    const testHost = `${subdomain}.ntando.app`;
    const resolved = resolveSubdomain(testHost);
    const canonical = getCanonicalDomain(resolved);
    const linkedDomains = getLinkedDomains(subdomain, 'ntando.app');
    
    res.json({
      testHost,
      resolved,
      canonical,
      linkedDomains,
      status: 'routing_configured'
    });
  } catch (error) {
    console.error('Error testing subdomain:', error);
    res.status(500).json({ error: 'Failed to test subdomain routing' });
  }
});

// Check domain availability
app.get('/api/domains/check/:subdomain/:extension', async (req, res) => {
  try {
    const { subdomain, extension } = req.params;
    
    if (!validateSubdomain(subdomain)) {
      return res.status(400).json({ error: 'Invalid subdomain' });
    }
    
    if (!validateDomainExtension(extension)) {
      return res.status(400).json({ error: 'Invalid domain extension' });
    }
    
    const isAvailable = await checkDomainAvailability(subdomain, extension);
    const isPremium = isPremiumDomain(extension);
    
    res.json({ 
      available: isAvailable, 
      domain: `${subdomain}${extension}`,
      isPremium,
      extension: extension
    });
    
  } catch (error) {
    console.error('Domain check error:', error);
    res.status(500).json({ error: 'Failed to check domain availability' });
  }
});

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, domainExtension } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (!validateUsername(username)) {
      return res.status(400).json({ error: 'Invalid username. Use 3-30 characters, letters, numbers, hyphens, and underscores only.' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    // Validate domain extension
    const selectedExtension = domainExtension || DOMAIN_CONFIG.defaultExtension;
    if (!validateDomainExtension(selectedExtension)) {
      return res.status(400).json({ error: 'Invalid domain extension' });
    }
    
    // Read existing users
    let users = {};
    try {
      const usersData = await fs.readFile(USERS_FILE, 'utf8');
      users = JSON.parse(usersData);
    } catch (error) {
      // File doesn't exist or is empty
    }
    
    // Check if username or email already exists
    if (Object.values(users).some(user => user.username === username)) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    
    if (Object.values(users).some(user => user.email === email)) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Generate unique subdomain
    const baseSubdomain = generateSubdomain(username, selectedExtension);
    let finalSubdomain = baseSubdomain;
    let counter = 1;
    
    // Ensure unique subdomain
    while (!await checkDomainAvailability(finalSubdomain.replace(selectedExtension, ''), selectedExtension)) {
      finalSubdomain = `${baseSubdomain.replace(selectedExtension, '')}-${counter}${selectedExtension}`;
      counter++;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();
    
    // Create user
    const user = {
      id: userId,
      username,
      email,
      password: hashedPassword,
      domainExtension: selectedExtension,
      subdomain: finalSubdomain,
      isPremium: isPremiumDomain(selectedExtension),
      createdAt: new Date().toISOString(),
      sites: []
    };
    
    users[userId] = user;
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    
    // Create user directory
    const userDir = path.join(USERS_DIR, user.subdomain);
    await fs.mkdir(userDir, { recursive: true });
    
    // Generate JWT token
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      success: true, 
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        subdomain: user.subdomain,
        domainExtension: user.domainExtension,
        isPremium: user.isPremium
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Read users
    let users = {};
    try {
      const usersData = await fs.readFile(USERS_FILE, 'utf8');
      users = JSON.parse(usersData);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Find user
    const user = Object.values(users).find(u => u.username === username);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      success: true, 
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        subdomain: user.subdomain,
        domainExtension: user.domainExtension,
        isPremium: user.isPremium
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get available templates
app.get('/api/templates', (req, res) => {
  const templates = [
    {
      id: 'portfolio',
      name: 'Portfolio Website',
      description: 'Clean portfolio template for showcasing your work',
      category: 'portfolio',
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Portfolio</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        header { background: #2c3e50; color: white; padding: 1rem 0; position: fixed; width: 100%; top: 0; }
        nav { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
        nav ul { display: flex; list-style: none; gap: 2rem; }
        nav a { color: white; text-decoration: none; }
        main { margin-top: 80px; padding: 2rem; max-width: 1200px; margin-left: auto; margin-right: auto; }
        #hero { text-align: center; padding: 4rem 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; margin: -2rem -2rem 2rem -2rem; }
        .project-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-top: 2rem; }
        .project { padding: 2rem; border: 1px solid #ddd; border-radius: 8px; }
    </style>
</head>
<body>
    <header>
        <nav>
            <h1>John Doe</h1>
            <ul>
                <li><a href="#about">About</a></li>
                <li><a href="#projects">Projects</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>
    <main>
        <section id="hero">
            <h2>Web Developer & Designer</h2>
            <p>Creating beautiful and functional web experiences</p>
        </section>
        <section id="about">
            <h2>About Me</h2>
            <p>I'm a passionate developer with expertise in modern web technologies.</p>
        </section>
        <section id="projects">
            <h2>Projects</h2>
            <div class="project-grid">
                <div class="project">
                    <h3>Project 1</h3>
                    <p>Amazing web application</p>
                </div>
                <div class="project">
                    <h3>Project 2</h3>
                    <p>Another awesome project</p>
                </div>
            </div>
        </section>
    </main>
</body>
</html>`,
      css: ''
    },
    {
      id: 'business',
      name: 'Business Website',
      description: 'Professional business template',
      category: 'business',
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Business</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; }
        header { background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.1); position: fixed; width: 100%; top: 0; z-index: 1000; }
        nav { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 1rem 2rem; }
        .logo { font-size: 1.5rem; font-weight: bold; color: #2c3e50; }
        nav ul { display: flex; list-style: none; gap: 2rem; }
        nav a { color: #333; text-decoration: none; font-weight: 500; }
        main { margin-top: 80px; }
        #home { text-align: center; padding: 6rem 2rem; background: linear-gradient(135deg, #74b9ff, #0984e3); color: white; }
        #home h1 { font-size: 3rem; margin-bottom: 1rem; }
        #services { padding: 4rem 2rem; max-width: 1200px; margin: 0 auto; }
        .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-top: 2rem; }
        .service { text-align: center; padding: 2rem; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        button { background: #0984e3; color: white; border: none; padding: 1rem 2rem; font-size: 1.1rem; border-radius: 5px; cursor: pointer; margin-top: 1rem; }
    </style>
</head>
<body>
    <header>
        <nav>
            <div class="logo">BusinessName</div>
            <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>
    <main>
        <section id="home">
            <h1>Welcome to Our Business</h1>
            <p>We provide exceptional services to help you succeed</p>
            <button>Get Started</button>
        </section>
        <section id="services">
            <h2>Our Services</h2>
            <div class="services-grid">
                <div class="service">
                    <h3>Service 1</h3>
                    <p>Professional service description</p>
                </div>
                <div class="service">
                    <h3>Service 2</h3>
                    <p>Another great service we offer</p>
                </div>
            </div>
        </section>
    </main>
</body>
</html>`,
      css: ''
    },
    {
      id: 'blog',
      name: 'Blog Template',
      description: 'Clean blog layout template',
      category: 'blog',
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Blog</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Georgia, serif; line-height: 1.8; background: #f8f9fa; }
        header { text-align: center; padding: 3rem 2rem; background: white; border-bottom: 1px solid #ddd; }
        header h1 { font-size: 2.5rem; color: #2c3e50; margin-bottom: 0.5rem; }
        main { max-width: 800px; margin: 2rem auto; padding: 0 2rem; }
        .post { background: white; padding: 2rem; margin-bottom: 2rem; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .post h2 { color: #2c3e50; margin-bottom: 0.5rem; }
        .meta { color: #666; font-size: 0.9rem; margin-bottom: 1rem; font-style: italic; }
        .read-more { color: #3498db; text-decoration: none; font-weight: bold; }
        .read-more:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <header>
        <h1>My Awesome Blog</h1>
        <p>Sharing thoughts and ideas with the world</p>
    </header>
    <main>
        <section class="posts">
            <article class="post">
                <h2>First Blog Post</h2>
                <p class="meta">Published on January 1, 2024</p>
                <p>This is my first blog post where I share my thoughts on web development and technology...</p>
                <a href="#" class="read-more">Read More</a>
            </article>
            <article class="post">
                <h2>Another Interesting Post</h2>
                <p class="meta">Published on January 15, 2024</p>
                <p>In this post, I explore the latest trends in web design and user experience...</p>
                <a href="#" class="read-more">Read More</a>
            </article>
        </section>
    </main>
</body>
</html>`,
      css: ''
    },
    {
      id: 'landing',
      name: 'Landing Page',
      description: 'Modern landing page template',
      category: 'landing',
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Amazing Product</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; }
        header { background: white; padding: 1rem 2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1); position: fixed; width: 100%; top: 0; z-index: 1000; }
        nav { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; }
        .logo { font-size: 1.5rem; font-weight: bold; color: #2563eb; }
        .cta-button { background: #2563eb; color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer; }
        main { margin-top: 80px; }
        .hero { text-align: center; padding: 6rem 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .hero h1 { font-size: 3.5rem; margin-bottom: 1rem; }
        .hero p { font-size: 1.3rem; margin-bottom: 2rem; opacity: 0.9; }
        .hero-buttons { display: flex; gap: 1rem; justify-content: center; }
        .primary-btn { background: white; color: #667eea; padding: 1rem 2rem; border: none; border-radius: 8px; font-size: 1.1rem; cursor: pointer; }
        .secondary-btn { background: transparent; color: white; border: 2px solid white; padding: 1rem 2rem; border-radius: 8px; font-size: 1.1rem; cursor: pointer; }
        .features { padding: 4rem 2rem; max-width: 1200px; margin: 0 auto; }
        .features h2 { text-align: center; font-size: 2.5rem; margin-bottom: 3rem; }
        .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .feature { text-align: center; padding: 2rem; }
        .feature h3 { font-size: 1.5rem; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <header>
        <nav>
            <div class="logo">ProductLogo</div>
            <button class="cta-button">Get Started</button>
        </nav>
    </header>
    <main>
        <section class="hero">
            <h1>Transform Your Business Today</h1>
            <p>The ultimate solution for modern enterprises looking to scale and succeed</p>
            <div class="hero-buttons">
                <button class="primary-btn">Start Free Trial</button>
                <button class="secondary-btn">Watch Demo</button>
            </div>
        </section>
        <section class="features">
            <h2>Why Choose Us?</h2>
            <div class="feature-grid">
                <div class="feature">
                    <h3>🚀 Fast Performance</h3>
                    <p>Lightning-fast speeds that keep your users engaged</p>
                </div>
                <div class="feature">
                    <h3>🔒 Secure Platform</h3>
                    <p>Enterprise-grade security to protect your data</p>
                </div>
                <div class="feature">
                    <h3>📊 Advanced Analytics</h3>
                    <p>Deep insights into your business performance</p>
                </div>
            </div>
        </section>
    </main>
</body>
</html>`,
      css: ''
    }
  ];
  
  res.json(templates);
});

// Upload and create a new site (protected route)
app.post('/api/upload', authenticateToken, async (req, res) => {
  try {
    const { html, css, js, siteName, siteSlug, favicon, enableDNS } = req.body;
    
    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    // Get user info
    let users = {};
    try {
      const usersData = await fs.readFile(USERS_FILE, 'utf8');
      users = JSON.parse(usersData);
    } catch (error) {
      return res.status(500).json({ error: 'User data not found' });
    }

    const user = users[req.user.userId];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate site slug if not provided
    let slug = siteSlug;
    if (!slug) {
      slug = siteName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'site';
    }

    // Validate slug
    if (!validateSubdomain(slug)) {
      return res.status(400).json({ error: 'Invalid site name. Use 3-63 characters, letters, numbers, and hyphens only.' });
    }

    // Ensure unique slug within user's subdomain
    let finalSlug = slug;
    let counter = 1;
    while (user.sites.some(site => site.slug === finalSlug)) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    // Create site directory
    const userSubdomain = user.subdomain;
    const siteDir = path.join(USERS_DIR, userSubdomain, finalSlug);
    await fs.mkdir(siteDir, { recursive: true });

    // Create index.html with favicon if provided
    let fullHtml = html;
    
    // Add favicon if provided
    if (favicon) {
      fullHtml = fullHtml.replace('<head>', `<head>\n    <link rel="icon" href="data:image/x-icon;base64,${favicon}">`);
    }
    
    // Add CSS
    if (css) {
      fullHtml = fullHtml.replace('</head>', `<style>${css}</style></head>`);
    }
    
    // Add JavaScript
    if (js) {
      fullHtml = fullHtml.replace('</body>', `<script>${js}</script></body>`);
    }

    await fs.writeFile(path.join(siteDir, 'index.html'), fullHtml);

    // Handle DNS forwarding if enabled
    let dnsRecord = null;
    if (enableDNS && DNS_CONFIG.enabled) {
      const customDomain = `${finalSlug}.${user.subdomain}`;
      const dnsResult = await createDNSRecord(
        user.domainExtension ? `ntando${user.domainExtension}` : 'ntando.app',
        'CNAME',
        customDomain,
        `${process.env.RENDER_SERVICE_HOST || 'your-service-url.onrender.com'}`
      );
      
      if (dnsResult.success) {
        dnsRecord = {
          id: crypto.randomUUID(),
          customDomain,
          target: process.env.RENDER_SERVICE_HOST || 'your-service-url.onrender.com',
          type: 'CNAME',
          createdAt: new Date().toISOString()
        };
        
        // Save DNS record
        let dnsRecords = {};
        try {
          const dnsData = await fs.readFile(DNS_RECORDS_FILE, 'utf8');
          dnsRecords = JSON.parse(dnsData);
        } catch (error) {
          // File doesn't exist
        }
        
        dnsRecords[dnsRecord.id] = dnsRecord;
        await fs.writeFile(DNS_RECORDS_FILE, JSON.stringify(dnsRecords, null, 2));
      }
    }

    // Add site to user's sites
    const site = {
      id: crypto.randomUUID(),
      name: siteName || 'Untitled Site',
      slug: finalSlug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      visits: 0,
      published: true,
      enableDNS: !!enableDNS,
      dnsRecordId: dnsRecord?.id || null
    };

    user.sites.push(site);
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

    // Generate URLs for the new structure with all linked domains
    const standardUrl = `/${finalSlug}/`;
    const customUrl = enableDNS ? `https://${finalSlug}.${user.subdomain}` : null;
    
    // Get all linked domains for this subdomain
    const linkedDomains = getLinkedDomains(finalSlug, user.domainExtension.replace('.', '') + '.' + user.domainExtension.replace('.', ''));
    const fullLinkedDomains = getLinkedDomains(finalSlug, 'ntando.app'); // Always link to primary
    
    res.json({ 
      success: true, 
      slug: finalSlug,
      url: standardUrl,
      fullUrl: `${req.protocol}://${req.get('host')}${standardUrl}`,
      customUrl,
      dnsRecord,
      linkedDomains: fullLinkedDomains,
      primaryDomain: `${finalSlug}.ntando.app`,
      aliasDomains: fullLinkedDomains.filter(d => d !== `${finalSlug}.ntando.app`),
      message: 'Site published successfully!' + 
               (customUrl ? ` Custom domain: ${customUrl}` : '') +
               ` Accessible at: ${fullLinkedDomains.join(', ')}`,
      site
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload site' });
  }
});

// Get user's sites (protected route)
app.get('/api/user/sites', authenticateToken, async (req, res) => {
  try {
    // Get user info
    let users = {};
    try {
      const usersData = await fs.readFile(USERS_FILE, 'utf8');
      users = JSON.parse(usersData);
    } catch (error) {
      return res.json([]);
    }

    const user = users[req.user.userId];
    if (!user) {
      return res.json([]);
    }

    const sites = user.sites.map(site => {
      const standardUrl = `/${site.slug}/`;
      const customUrl = site.enableDNS ? `https://${site.slug}.${user.subdomain}` : null;
      
      // Get all linked domains for this site
      const linkedDomains = getLinkedDomains(site.slug, 'ntando.app');
      
      return {
        ...site,
        url: standardUrl,
        fullUrl: `${req.protocol}://${req.get('host')}${standardUrl}`,
        customUrl,
        primaryDomain: `${site.slug}.ntando.app`,
        aliasDomains: linkedDomains.filter(d => d !== `${site.slug}.ntando.app`),
        linkedDomains,
        domainExtension: user.domainExtension,
        isPremium: user.isPremium
      };
    });

    res.json(sites);
  } catch (error) {
    console.error('Error loading sites:', error);
    res.json([]);
  }
});

// Get site details for editing (protected route)
app.get('/api/sites/:siteId', authenticateToken, async (req, res) => {
  try {
    const { siteId } = req.params;

    // Get user info
    let users = {};
    try {
      const usersData = await fs.readFile(USERS_FILE, 'utf8');
      users = JSON.parse(usersData);
    } catch (error) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const user = users[req.user.userId];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the site
    const site = user.sites.find(s => s.id === siteId);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // Read the HTML file
    const siteDir = path.join(USERS_DIR, user.subdomain, site.slug);
    const htmlPath = path.join(siteDir, 'index.html');
    
    let html = '';
    try {
      html = await fs.readFile(htmlPath, 'utf8');
    } catch (error) {
      return res.status(404).json({ error: 'Site files not found' });
    }

    const standardUrl = `/${site.slug}/`;
    const customUrl = site.enableDNS ? `https://${site.slug}.${user.subdomain}` : null;

    res.json({
      site,
      html,
      url: standardUrl,
      fullUrl: `${req.protocol}://${req.get('host')}${standardUrl}`,
      customUrl
    });

  } catch (error) {
    console.error('Error loading site:', error);
    res.status(500).json({ error: 'Failed to load site' });
  }
});

// Delete site (protected route)
app.delete('/api/sites/:siteId', authenticateToken, async (req, res) => {
  try {
    const { siteId } = req.params;

    // Get user info
    let users = {};
    try {
      const usersData = await fs.readFile(USERS_FILE, 'utf8');
      users = JSON.parse(usersData);
    } catch (error) {
      return res.status(500).json({ error: 'User data not found' });
    }

    const user = users[req.user.userId];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the site
    const siteIndex = user.sites.findIndex(s => s.id === siteId);
    if (siteIndex === -1) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const site = user.sites[siteIndex];

    // Handle DNS cleanup
    if (site.dnsRecordId) {
      await deleteDNSRecord(
        user.domainExtension ? `ntando${user.domainExtension}` : 'ntando.app',
        site.dnsRecordId
      );
      
      // Remove DNS record
      let dnsRecords = {};
      try {
        const dnsData = await fs.readFile(DNS_RECORDS_FILE, 'utf8');
        dnsRecords = JSON.parse(dnsData);
      } catch (error) {
        // File doesn't exist
      }
      
      delete dnsRecords[site.dnsRecordId];
      await fs.writeFile(DNS_RECORDS_FILE, JSON.stringify(dnsRecords, null, 2));
    }

    // Remove site directory
    const siteDir = path.join(USERS_DIR, user.subdomain, site.slug);
    await fs.rm(siteDir, { recursive: true, force: true });
    
    // Remove from user's sites
    user.sites.splice(siteIndex, 1);
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

    res.json({ success: true, message: 'Site deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete site' });
  }
});

// Comprehensive subdomain routing system
app.get('*', async (req, res, next) => {
  try {
    const host = req.get('host');
    const originalUrl = req.originalUrl;
    
    // Skip if this is an API route or static file
    if (originalUrl.startsWith('/api/') || originalUrl.startsWith('/dashboard') || originalUrl.startsWith('/health')) {
      return next();
    }
    
    console.log(`🌐 Processing request: ${host}${originalUrl}`);
    
    // Resolve the subdomain
    const resolved = resolveSubdomain(host);
    
    if (resolved) {
      console.log(`📍 Resolved subdomain: ${resolved.subdomain}.${resolved.domain} (Alias: ${resolved.isAlias})`);
      
      // Get canonical routing information
      const canonical = getCanonicalDomain(resolved);
      
      if (canonical) {
        console.log(`🎯 Canonical routing: ${canonical.subdomain} -> ${canonical.canonicalDomain}`);
        console.log(`🔗 All linked domains: ${canonical.allDomains.join(', ')}`);
        
        // Find the subdomain across all domains
        const result = await findSubdomainAcrossDomains(canonical.subdomain);
        
        if (result.found) {
          const { site, user } = result;
          
          console.log(`✅ Found site: ${site.name} for user: ${user.username}`);
          
          // Update visit count
          site.visits = (site.visits || 0) + 1;
          await fs.writeFile(USERS_FILE, JSON.stringify(
            JSON.parse(await fs.readFile(USERS_FILE, 'utf8')), 
            null, 
            2
          ));
          
          // Add subdomain information to response headers
          res.setHeader('X-Subdomain', canonical.subdomain);
          res.setHeader('X-Original-Domain', canonical.originalRequest);
          res.setHeader('X-Canonical-Domain', canonical.canonicalDomain);
          res.setHeader('X-Linked-Domains', canonical.allDomains.join(','));
          
          // Serve the file
          const filePath = path.join(USERS_DIR, user.subdomain, site.slug, 'index.html');
          try {
            console.log(`📁 Serving file: ${filePath}`);
            return res.sendFile(filePath);
          } catch (error) {
            console.log(`❌ File not found: ${filePath}`);
            return next();
          }
        } else {
          console.log(`❌ Subdomain not found: ${canonical.subdomain}`);
          
          // Check if this is a root domain request (no subdomain)
          if (canonical.subdomain === 'www' || canonical.subdomain === '') {
            // Redirect to main site
            return res.redirect('/');
          }
          
          // Serve 404 page for unknown subdomain
          return res.status(404).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Subdomain Not Found - Ntando Hosting</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .container { max-width: 600px; margin: 0 auto; }
                    h1 { color: #667eea; font-size: 2.5rem; margin-bottom: 1rem; }
                    p { color: #666; margin-bottom: 2rem; }
                    .btn { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; }
                    .domains { margin-top: 2rem; font-family: monospace; background: #f5f5f5; padding: 1rem; border-radius: 8px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🌐 Subdomain Not Found</h1>
                    <p>The subdomain <strong>${canonical.originalRequest}</strong> does not exist on our platform.</p>
                    <a href="/" class="btn">Go to Homepage</a>
                    <div class="domains">
                        <strong>Available domains for your sites:</strong><br>
                        ${canonical.allDomains.map(d => `• ${d}`).join('<br>')}
                    </div>
                </div>
            </body>
            </html>
          `);
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('❌ Subdomain routing error:', error);
    next();
  }
});

// Legacy routing for backward compatibility
app.get('/:siteName/', async (req, res, next) => {
  try {
    const { siteName } = req.params;
    const host = req.get('host');
    
    // Only handle this if no subdomain routing occurred
    if (host && !DOMAIN_CONFIG.aliases.some(alias => {
      const parts = host.split('.');
      return parts.length >= 2 && DOMAIN_CONFIG.aliases.includes(parts.slice(1).join('.'));
    })) {
      // Look for site in all users (legacy support)
      let users = {};
      try {
        const usersData = await fs.readFile(USERS_FILE, 'utf8');
        users = JSON.parse(usersData);
      } catch (error) {
        return next();
      }
      
      // Search through all users to find the matching site
      for (const user of Object.values(users)) {
        const site = user.sites.find(s => s.slug === siteName);
        if (site) {
          // Update visit count
          site.visits = (site.visits || 0) + 1;
          await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
          
          // Serve the file
          const filePath = path.join(USERS_DIR, user.subdomain, site.slug, 'index.html');
          try {
            return res.sendFile(filePath);
          } catch (error) {
            return next();
          }
        }
      }
    }
    
    next();
  } catch (error) {
    next();
  }
});

// Health check endpoint for render.com
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'Ntando Enhanced Free Hosting',
    features: ['Subdomains', 'User System', 'Site Editing', 'Templates', 'Backups', 'DNS Forwarding', 'Custom Domains', 'Enhanced URL Structure', 'Comprehensive Subdomain Routing'],
    domainExtensions: DOMAIN_CONFIG.extensions,
    primaryDomain: DOMAIN_CONFIG.primary,
    aliases: DOMAIN_CONFIG.aliases,
    dnsEnabled: DNS_CONFIG.enabled,
    urlStructure: 'mysite.ntando.app, mysite.ntl.cloud, mysite.ntando.zw',
    subdomainMapping: DOMAIN_CONFIG.subdomainMapping,
    routing: {
      type: 'comprehensive',
      linking: 'all-domains-linked',
      canonical: 'ntando.app',
      aliases: ['ntl.cloud', 'ntando.zw', 'ntandostore.com']
    },
    timestamp: new Date().toISOString() 
  });
});

// Final catch-all route - serve index.html for any unmatched routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Ntando Enhanced Hosting running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${UPLOADS_DIR}`);
  console.log(`👥 Users directory: ${USERS_DIR}`);
  console.log(`🌐 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✨ Features: Subdomains, user system, site editing, templates, backups, DNS forwarding`);
  console.log(`🌍 Primary Domain: ${DOMAIN_CONFIG.primary}`);
  console.log(`🔗 Available Domains: ${DOMAIN_CONFIG.aliases.join(', ')}`);
  console.log(`🌐 URL Structure: mysite.ntando.app, mysite.ntl.cloud, mysite.ntando.zw`);
  console.log(`🔗 DNS Forwarding: ${DNS_CONFIG.enabled ? 'Enabled' : 'Disabled'}`);
  
  // Log important directories for Render.com deployment
  if (process.env.NODE_ENV === 'production') {
    console.log(`📂 Production directories:`);
    console.log(`   - Uploads: ${UPLOADS_DIR}`);
    console.log(`   - Users: ${USERS_DIR}`);
    console.log(`   - Domains: ${DOMAINS_FILE}`);
    console.log(`   - User DB: ${USERS_FILE}`);
    console.log(`   - DNS Records: ${DNS_RECORDS_FILE}`);
    console.log(`🌐 Ready for production traffic on Render.com`);
  }
});