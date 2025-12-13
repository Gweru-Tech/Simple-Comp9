# Ntando Enhanced Hosting Platform

A secure, enterprise-grade subdomain hosting platform with advanced file management, comprehensive security features, and multi-domain support.

## 🚀 Features

### Core Features
- **User Authentication System** - Secure JWT-based authentication with account locking
- **Subdomain Hosting** - Unique subdomains for each user with multiple domain extensions
- **File Upload Manager** - Drag-and-drop file uploads with validation and security scanning
- **Website Templates** - Professional templates for portfolios, business, blogs, and landing pages
- **Site Editing** - In-place editing with automatic backups and version control
- **DNS Forwarding** - Custom domain support with automatic SSL certificates
- **Real-time Analytics** - Visitor tracking and performance monitoring

### Security Features
- **CSRF Protection** - Cross-Site Request Forgery prevention
- **Rate Limiting** - Advanced rate limiting for API endpoints
- **Input Validation** - Comprehensive input sanitization and validation
- **Content Security Policy** - XSS prevention with CSP headers
- **File Upload Security** - File type validation, size limits, and virus scanning
- **HTTPS Enforcement** - Automatic SSL certificates and HTTPS redirects
- **Account Locking** - Automatic account locking after failed login attempts
- **Security Headers** - Complete security header implementation

### Multi-Domain Support
- **Primary Domain**: `ntando.app`
- **Alias Domains**: `ntl.cloud`, `ntando.zw`, `ntandostore.com`
- **Domain Extensions**: `.app`, `.cloud`, `.zw`, `.com`, `.online`, `.id`, `.net`, `.store`, `.blog`, `.uk`, `.org`
- **Subdomain Mapping**: Automatic linking across all domains

## 🛡️ Security Architecture

### Authentication & Authorization
- JWT tokens with expiration and refresh
- Password hashing with bcrypt (12 rounds)
- Account locking after 5 failed attempts
- Session management with secure cookies
- Two-factor authentication support (planned)

### Input Validation & Sanitization
- Server-side validation for all inputs
- XSS prevention with Content Security Policy
- SQL injection prevention
- Path traversal protection
- File upload validation with allowlist

### Rate Limiting
- Authentication endpoints: 5 attempts per 15 minutes
- Upload endpoints: 10 uploads per minute
- General API: 100 requests per 15 minutes
- Distributed rate limiting support

### File Upload Security
- File type validation with MIME type checking
- File size limits (10MB per file, 10 files max)
- Filename sanitization
- Virus scanning integration (planned)
- Secure file storage with isolated directories

### Security Headers
- `Content-Security-Policy` - Prevents XSS and code injection
- `X-Frame-Options` - Prevents clickjacking
- `X-Content-Type-Options` - Prevents MIME sniffing
- `X-XSS-Protection` - XSS filter
- `Strict-Transport-Security` - HTTPS enforcement
- `Referrer-Policy` - Referrer control

## 📁 Project Structure

```
ntando-enhanced-hosting/
├── server.js                 # Main application server
├── security-middleware.js    # Security utilities and middleware
├── package.json             # Dependencies and scripts
├── README.md               # Project documentation
├── public/                 # Static files
│   ├── index.html         # Landing page
│   └── dashboard.html     # User dashboard
├── uploads/               # User uploaded files
├── users/                 # User sites and data
├── domains.json           # Domain configurations
├── users.json            # User database
└── dns-records.json      # DNS records
```

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18.0.0 or higher
- npm or yarn package manager
- Redis (for rate limiting in production)

### Local Development
1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/ntando-enhanced-hosting.git
   cd ntando-enhanced-hosting
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Landing page: http://localhost:3000
   - Dashboard: http://localhost:3000/dashboard
   - Health check: http://localhost:3000/health

### Production Deployment

#### Render.com Deployment
1. **Connect your repository** to Render.com
2. **Set environment variables** in Render dashboard:
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key
   PORT=3000
   DNS_FORWARDING_ENABLED=true
   DNS_PROVIDER=cloudflare
   DNS_API_KEY=your-cloudflare-api-key
   ```
3. **Deploy** - Render will automatically build and deploy

#### Docker Deployment
```bash
# Build the image
docker build -t ntando-hosting .

# Run the container
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret \
  ntando-hosting
```

## 🔧 Configuration

### Environment Variables
```env
# Application
NODE_ENV=development
PORT=3000

# Security
JWT_SECRET=your-super-secret-jwt-key
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# DNS Configuration
DNS_FORWARDING_ENABLED=false
DNS_PROVIDER=cloudflare
DNS_API_KEY=your-dns-api-key

# File Upload
MAX_FILE_SIZE=10485760  # 10MB in bytes
MAX_FILES=10

# Rate Limiting
REDIS_URL=redis://localhost:6379
```

### Domain Configuration
Edit the `DOMAIN_CONFIG` object in `server.js` to customize:
- Primary domain and aliases
- Available domain extensions
- Subdomain mapping rules
- DNS zone configurations

## 📊 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/csrf-token` - Get CSRF token

### Site Management
- `POST /api/upload` - Upload/create new site
- `GET /api/user/sites` - Get user's sites
- `GET /api/sites/:id` - Get site details
- `PUT /api/sites/:id` - Update site
- `DELETE /api/sites/:id` - Delete site

### Templates
- `GET /api/templates` - Get available templates

### Domain Management
- `GET /api/domains/extensions` - Get domain extensions
- `GET /api/domains/check/:subdomain/:extension` - Check availability
- `GET /api/domains/subdomain/:subdomain` - Get subdomain info
- `GET /api/domains/test/:subdomain` - Test subdomain routing

### System
- `GET /health` - Health check and system info

## 🔒 Security Best Practices

### For Developers
1. **Always validate inputs** on both client and server side
2. **Use parameterized queries** if using databases
3. **Implement proper error handling** without leaking sensitive information
4. **Regularly update dependencies** to patch security vulnerabilities
5. **Use HTTPS in production** with proper SSL certificates

### For Administrators
1. **Monitor logs** for suspicious activity
2. **Implement backup strategies** for user data
3. **Regular security audits** and penetration testing
4. **Keep systems updated** with latest security patches
5. **Monitor rate limiting** and adjust as needed

### For Users
1. **Use strong passwords** and enable 2FA when available
2. **Regularly backup** website content
3. **Be cautious** with file uploads from unknown sources
4. **Keep software updated** on local development machines
5. **Report security issues** to the development team

## 🚨 Security Monitoring

### Logging
- All authentication attempts are logged
- Failed login triggers security alerts
- File uploads are monitored and logged
- API access patterns are tracked

### Rate Limiting
- Configurable limits per endpoint
- Distributed rate limiting support
- Automatic IP blocking for abuse
- Whitelist support for trusted IPs

### Security Headers
- All responses include security headers
- CSP is enforced for all user content
- XSS protection is enabled
- Clickjacking protection is active

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Security Contributions
- Follow responsible disclosure
- Report security vulnerabilities privately
- Include detailed reproduction steps
- Provide suggested fixes if possible

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs and feature requests on GitHub Issues
- **Security**: Report security vulnerabilities to security@ntando.app
- **Community**: Join our Discord server for community support

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Enhanced security features
- ✅ File upload manager
- ✅ Multi-domain support
- ✅ Rate limiting
- ✅ Input validation

### Phase 2 (Q1 2024)
- 🔄 Two-factor authentication
- 🔄 Real virus scanning
- 🔄 Advanced analytics dashboard
- 🔄 CDN integration
- 🔄 Automated backups

### Phase 3 (Q2 2024)
- 📋 API versioning
- 📋 Webhook support
- 📋 Team collaboration
- 📋 Custom themes
- 📋 Plugin system

### Phase 4 (Q3 2024)
- 📋 Mobile apps
- 📋 Desktop client
- 📋 CLI tools
- 📋 Enterprise features
- 📋 White-label options

---

**Built with ❤️ by the Ntando Enhanced Team**