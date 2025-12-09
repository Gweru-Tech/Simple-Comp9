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

// Validate custom domain name
function validateCustomDomain(domain) {
  // Remove .ntandostore suffix if present
  domain = domain.replace(/\.ntandostore$/, '');
  
  // Check if domain is alphanumeric and allows hyphens
  const validPattern = /^[a-zA-Z0-9-]+$/;
  if (!validPattern.test(domain)) {
    return false;
  }
  
  // Check length (3-50 characters)
  if (domain.length < 3 || domain.length > 50) {
    return false;
  }
  
  // Check if it starts or ends with hyphen
  if (domain.startsWith('-') || domain.endsWith('-')) {
    return false;
  }
  
  return true;
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Dashboard route
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Get available templates
app.get('/api/templates', (req, res) => {
  const templates = [
    {
      id: 'portfolio',
      name: 'Portfolio Website',
      description: 'Clean portfolio template for showcasing your work',
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Portfolio</title>
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
      css: `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
header { background: #2c3e50; color: white; padding: 1rem 0; position: fixed; width: 100%; top: 0; }
nav { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
nav ul { display: flex; list-style: none; gap: 2rem; }
nav a { color: white; text-decoration: none; }
main { margin-top: 80px; padding: 2rem; max-width: 1200px; margin-left: auto; margin-right: auto; }
#hero { text-align: center; padding: 4rem 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; margin: -2rem -2rem 2rem -2rem; }
.project-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-top: 2rem; }
.project { padding: 2rem; border: 1px solid #ddd; border-radius: 8px; }`
    },
    {
      id: 'business',
      name: 'Business Website',
      description: 'Professional business template',
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Business</title>
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
      css: `* { margin: 0; padding: 0; box-sizing: border-box; }
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
button { background: #0984e3; color: white; border: none; padding: 1rem 2rem; font-size: 1.1rem; border-radius: 5px; cursor: pointer; margin-top: 1rem; }`
    },
    {
      id: 'blog',
      name: 'Blog Template',
      description: 'Clean blog layout template',
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Blog</title>
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
      css: `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Georgia, serif; line-height: 1.8; background: #f8f9fa; }
header { text-align: center; padding: 3rem 2rem; background: white; border-bottom: 1px solid #ddd; }
header h1 { font-size: 2.5rem; color: #2c3e50; margin-bottom: 0.5rem; }
main { max-width: 800px; margin: 2rem auto; padding: 0 2rem; }
.post { background: white; padding: 2rem; margin-bottom: 2rem; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
.post h2 { color: #2c3e50; margin-bottom: 0.5rem; }
.meta { color: #666; font-size: 0.9rem; margin-bottom: 1rem; font-style: italic; }
.read-more { color: #3498db; text-decoration: none; font-weight: bold; }
.read-more:hover { text-decoration: underline; }`
    }
  ];
  
  res.json(templates);
});

// Upload and create a new hosted site
app.post('/upload', async (req, res) => {
  try {
    const { html, css, js, siteName, customDomain, favicon } = req.body;
    
    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    // Generate domain
    let domain;
    if (customDomain) {
      // Validate custom domain
      if (!validateCustomDomain(customDomain)) {
        return res.status(400).json({ error: 'Invalid domain name. Use 3-50 characters, letters, numbers, and hyphens only.' });
      }
      domain = customDomain + '.ntandostore';
    } else {
      domain = generateDomain();
    }
    
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
      if (customDomain) {
        return res.status(400).json({ error: 'This domain is already taken. Please choose another.' });
      }
      domain = generateDomain();
    }

    // Create site directory
    const siteDir = path.join(UPLOADS_DIR, domain);
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

    // Save domain mapping
    domains[domain] = {
      name: siteName || 'Untitled Site',
      createdAt: new Date().toISOString(),
      visits: 0,
      isCustom: !!customDomain
    };
    
    await fs.writeFile(DOMAINS_FILE, JSON.stringify(domains, null, 2));

    res.json({ 
      success: true, 
      domain: domain,
      url: `/${domain}/`,
      message: 'Site published successfully!',
      isCustom: !!customDomain
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload site' });
  }
});

// Route to serve hosted sites (direct domain access)
app.get('/:domain/', async (req, res, next) => {
  try {
    const { domain } = req.params;
    
    // Check if this is a hosted domain (ends with .ntandostore)
    if (!domain.endsWith('.ntandostore')) {
      return next(); // Let other routes handle it
    }

    const filePath = path.join(UPLOADS_DIR, domain, 'index.html');

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
    next();
  }
});

// Keep the old /hosted/ route for backward compatibility
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
      isCustom: info.isCustom || false,
      url: `/${domain}/`,
      oldUrl: `/hosted/${domain}/` // Keep for backward compatibility
    }));

    res.json(sites);
  } catch (error) {
    res.json([]);
  }
});

// API to check domain availability
app.get('/api/check-domain/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    
    // Validate domain format
    if (!validateCustomDomain(domain)) {
      return res.json({ available: false, error: 'Invalid domain format' });
    }
    
    const fullDomain = domain + '.ntandostore';
    
    // Check if domain exists
    let domains = {};
    try {
      const domainsData = await fs.readFile(DOMAINS_FILE, 'utf8');
      domains = JSON.parse(domainsData);
    } catch (error) {
      // File doesn't exist
    }
    
    const isAvailable = !domains[fullDomain];
    res.json({ available: isAvailable, domain: fullDomain });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check domain' });
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
    service: 'Ntandostore Enhanced Free Hosting',
    features: ['Custom Domains', 'Direct Access', 'Templates', 'Favicon Support'],
    timestamp: new Date().toISOString() 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Ntandostore Enhanced Hosting running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${UPLOADS_DIR}`);
  console.log(`🌐 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`✨ Features: Custom domains, direct access, templates`);
});