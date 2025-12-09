const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;

// Ensure directories exist
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DOMAINS_FILE = path.join(__dirname, 'domains.json');

// Create uploads directory if it doesn't exist
async function ensureDirectories() {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    
    // Initialize domains file if it doesn't exist
    try {
      await fs.access(DOMAINS_FILE);
    } catch {
      await fs.writeFile(DOMAINS_FILE, JSON.stringify({}));
    }
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

// Initialize directories on startup
ensureDirectories();

// Middleware
app.use(express.static('public'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/hosted', express.static(UPLOADS_DIR));

// Generate unique domain name
function generateDomain() {
  const adjectives = ['quick', 'bright', 'clever', 'swift', 'smart', 'happy', 'lucky', 'sunny', 'cool', 'warm'];
  const nouns = ['site', 'web', 'page', 'space', 'zone', 'hub', 'spot', 'place', 'world', 'realm'];
  const numbers = Math.floor(Math.random() * 9999) + 1;
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adjective}${noun}${numbers}.ntandostore`;
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Dashboard route
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Upload and create a new hosted site
app.post('/upload', async (req, res) => {
  try {
    const { html, css, js, siteName } = req.body;
    
    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    // Generate unique domain
    let domain = generateDomain();
    
    // Read existing domains
    let domains = {};
    try {
      const domainsData = await fs.readFile(DOMAINS_FILE, 'utf8');
      domains = JSON.parse(domainsData);
    } catch (error) {
      // File doesn't exist or is empty
    }

    // Ensure domain is unique
    while (domains[domain]) {
      domain = generateDomain();
    }

    // Create site directory
    const siteDir = path.join(UPLOADS_DIR, domain);
    await fs.mkdir(siteDir, { recursive: true });

    // Create index.html
    let fullHtml = html;
    if (css) {
      fullHtml = html.replace('</head>', `<style>${css}</style></head>`);
    }
    if (js) {
      fullHtml = fullHtml.replace('</body>', `<script>${js}</script></body>`);
    }

    await fs.writeFile(path.join(siteDir, 'index.html'), fullHtml);

    // Save domain mapping
    domains[domain] = {
      name: siteName || 'Untitled Site',
      createdAt: new Date().toISOString(),
      visits: 0
    };
    
    await fs.writeFile(DOMAINS_FILE, JSON.stringify(domains, null, 2));

    res.json({ 
      success: true, 
      domain: domain,
      url: `/hosted/${domain}/`,
      message: 'Site published successfully!'
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload site' });
  }
});

// Route to serve hosted sites
app.get('/hosted/:domain/*', async (req, res) => {
  try {
    const { domain } = req.params;
    const requestedPath = req.params[0] || 'index.html';
    const filePath = path.join(UPLOADS_DIR, domain, requestedPath);

    // Update visit count
    let domains = {};
    try {
      const domainsData = await fs.readFile(DOMAINS_FILE, 'utf8');
      domains = JSON.parse(domainsData);
      if (domains[domain]) {
        domains[domain].visits = (domains[domain].visits || 0) + 1;
        await fs.writeFile(DOMAINS_FILE, JSON.stringify(domains, null, 2));
      }
    } catch (error) {
      console.error('Error updating visit count:', error);
    }

    // Serve the file
    res.sendFile(filePath);
  } catch (error) {
    res.status(404).send('Site not found');
  }
});

// API to get all hosted sites
app.get('/api/sites', async (req, res) => {
  try {
    const domainsData = await fs.readFile(DOMAINS_FILE, 'utf8');
    const domains = JSON.parse(domainsData);
    
    const sites = Object.entries(domains).map(([domain, info]) => ({
      domain,
      name: info.name,
      createdAt: info.createdAt,
      visits: info.visits,
      url: `/hosted/${domain}/`
    }));

    res.json(sites);
  } catch (error) {
    res.json([]);
  }
});

// API to delete a site
app.delete('/api/sites/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    
    // Remove site directory
    const siteDir = path.join(UPLOADS_DIR, domain);
    await fs.rm(siteDir, { recursive: true, force: true });
    
    // Remove from domains mapping
    let domains = {};
    try {
      const domainsData = await fs.readFile(DOMAINS_FILE, 'utf8');
      domains = JSON.parse(domainsData);
      delete domains[domain];
      await fs.writeFile(DOMAINS_FILE, JSON.stringify(domains, null, 2));
    } catch (error) {
      console.error('Error updating domains file:', error);
    }

    res.json({ success: true, message: 'Site deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete site' });
  }
});

// Health check endpoint for render.com
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'Ntandostore Free Hosting',
    timestamp: new Date().toISOString() 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Ntandostore Free Hosting running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${UPLOADS_DIR}`);
  console.log(`🌐 Dashboard: http://localhost:${PORT}/dashboard`);
});