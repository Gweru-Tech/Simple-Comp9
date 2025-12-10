# Ntandostore Enhanced - Multiple Domain Hosting Platform

🚀 **Deploy your websites with FREE custom domains!** Choose from 10+ professional domain endings and manage your sites with our advanced dashboard.

## ✨ Features

### 🌐 Multiple Domain Endings
Choose from 10+ professional domain endings:
- `.ntandostore.com` - Professional business domain
- `.ntandostore.online` - Perfect for online presence
- `.ntandostore.id` - Personal identity domain
- `.ntandostore.cloud` - Ideal for tech services
- `.ntandostore.net` - Network and services
- `.ntandostore.store` - E-commerce websites
- `.ntandostore.blog` - Bloggers and writers
- `.ntandostore.org` - Organizations
- `.ntandostore.uk` - UK-based sites
- `.ntandostore.zw` - African regional presence

### 👥 User Management System
- **Secure Authentication** - JWT-based login system
- **User Accounts** - Each user gets isolated space
- **Multiple Sites** - Host unlimited websites per account
- **Session Management** - Secure token-based sessions

### ✏️ Advanced Site Management
- **Built-in Editor** - Edit HTML, CSS, and JavaScript online
- **Live Preview** - See changes before publishing
- **Automatic Backups** - Every update creates a backup
- **Version History** - Restore previous versions anytime

### 🎨 Professional Templates
- **Portfolio Template** - Showcase your work
- **Business Template** - Professional company sites
- **Blog Template** - Clean blog layout
- **Landing Page** - Modern marketing pages

### 🌙 Enhanced Dashboard
- **Dark Mode** - Easy on the eyes for late-night work
- **Real-time Analytics** - Track visitor statistics
- **Site Management** - Organize and manage all your sites
- **Mobile Responsive** - Works perfectly on all devices

## 🚀 Quick Start

### Deploy on Render.com (Recommended)

1. **Clone or Download** this repository
2. **Create Account** on [Render.com](https://render.com)
3. **Connect GitHub** or upload the files manually
4. **Configure Environment Variables**:
   ```
   NODE_ENV=production
   JWT_SECRET=your-secret-key-here
   ```
5. **Deploy** - Click "Create Web Service"
6. **Your platform is live!** 🎉

### Local Development

```bash
# Clone the repository
git clone <repository-url>
cd ntandostore-enhanced

# Install dependencies
npm install

# Start development server
npm run dev

# Or start production server
npm start
```

## 📁 Project Structure

```
ntandostore-enhanced/
├── server.js              # Main Express server
├── package.json            # Node.js dependencies
├── render.yaml            # Render.com deployment config
├── README.md              # This file
└── public/                # Static files
    ├── index.html         # Landing page
    └── dashboard.html     # User dashboard
```

## 🔧 Technical Stack

- **Backend**: Node.js + Express.js
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt for password hashing
- **Storage**: File-based with JSON databases
- **Frontend**: Vanilla JavaScript + HTML5 + CSS3
- **Deployment**: Render.com compatible

## 🌐 API Endpoints

### Authentication
- `POST /api/register` - Create new user account
- `POST /api/login` - User login

### Domain Management
- `GET /api/domains` - Get available domain endings

### Templates
- `GET /api/templates` - Get website templates

### Site Management
- `POST /api/upload` - Create new website
- `GET /api/user/sites` - Get user's websites
- `GET /api/sites/:id` - Get site for editing
- `PUT /api/sites/:id` - Update website
- `DELETE /api/sites/:id` - Delete website

### System
- `GET /health` - Health check endpoint

## 🎯 How It Works

1. **Sign Up** - Create your free account
2. **Choose Domain** - Select your preferred domain ending
3. **Create Website** - Use templates or custom code
4. **Deploy Instantly** - Your site goes live immediately
5. **Manage & Edit** - Update anytime with automatic backups

## 🔒 Security Features

- **JWT Authentication** - Secure token-based login
- **Password Hashing** - bcrypt encryption
- **User Isolation** - Each user has separate space
- **Session Management** - Automatic token expiration
- **Input Validation** - Protection against XSS/SQL injection

## 📊 Analytics & Features

- **Visitor Tracking** - Real-time visit counters
- **Site Statistics** - Creation and update dates
- **Backup System** - Automatic version control
- **Dark Mode** - Eye-friendly interface
- **Mobile Responsive** - Works on all devices

## 🛠️ Configuration

### Environment Variables
```env
NODE_ENV=production
JWT_SECRET=your-secret-key-change-this
```

### Available Domains
The platform supports these domain endings:
- .com, .online, .id, .cloud, .net, .store, .blog, .org, .uk, .zw

## 🌟 Sample Website URLs

```
username-quick123.ntandostore.com    # Business site
john-smart456.ntandostore.online      # Portfolio
mary-cool789.ntandostore.blog         # Personal blog
tech-team321.ntandostore.cloud        # Tech startup
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you need help:
- 📧 Create an issue on GitHub
- 📖 Check the documentation
- 🌐 Visit our platform at [ntandostore.com](https://ntandostore.com)

## 🎉 Deploy Now!

Ready to get your free custom domain website? 

**🚀 Deploy on Render.com in 2 minutes:**
1. Click the "Deploy to Render" button
2. Connect your GitHub account
3. Set your JWT_SECRET environment variable
4. Deploy and start creating!

**Your professional website with custom domain awaits!** 🌐✨

---

⭐ **Star this repo if it helped you!** ⭐

Made with ❤️ by SuperNinja AI