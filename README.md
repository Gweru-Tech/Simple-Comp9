# 🚀 Ntandostore - Free Website Hosting Platform

A powerful free hosting platform that provides unique *.ntandostore domains and hosts HTML websites instantly. Built with Node.js and Express, designed for easy deployment on Render.com.

## ✨ Features

- **🌐 Free Domains**: Get unique *.ntandostore domains for your websites at no cost
- **⚡ Instant Deployment**: Upload and deploy websites in seconds
- **📱 Responsive Dashboard**: Modern, mobile-friendly management interface
- **🎨 HTML/CSS/JS Support**: Full support for modern web technologies
- **📊 Visitor Analytics**: Track visit counts for all your hosted websites
- **🗂️ Site Management**: Create, view, and delete websites from your dashboard
- **🔒 Secure Hosting**: Built with security best practices
- **📈 Real-time Statistics**: Live stats on your dashboard
- **🌍 Global Access**: Websites accessible worldwide instantly

## 🏗️ Technology Stack

- **Backend**: Node.js with Express.js
- **Frontend**: Pure HTML, CSS, and JavaScript (no frameworks required)
- **Storage**: File-based storage with JSON mapping
- **Deployment**: Render.com (free tier compatible)
- **API**: RESTful API with JSON responses

## 📁 Project Structure

```
ntandostore/
├── server.js              # Main Express server
├── package.json           # Node.js dependencies and scripts
├── render.yaml           # Render.com deployment configuration
├── domains.json          # Domain mappings (auto-generated)
├── uploads/              # Hosted websites directory
├── public/
│   ├── index.html        # Landing page
│   └── dashboard.html    # User dashboard
└── README.md            # This file
```

## 🚀 Quick Start - Deploy to Render.com

### Method 1: GitHub Repository (Recommended)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Ntandostore Free Hosting"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy on Render.com**:
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository
   - Use the following settings:
     - **Name**: ntandostore
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Instance Type**: Free
   - Click "Create Web Service"

3. **Access Your Platform**: Your hosting platform will be live at `https://your-app-name.onrender.com`

### Method 2: Using render.yaml (Automatic)

The `render.yaml` file is already included for automatic configuration when deploying to Render.com.

## 🏃‍♂️ Local Development

1. **Clone and Install**:
   ```bash
   git clone <your-repository-url>
   cd ntandostore
   npm install
   ```

2. **Start the Server**:
   ```bash
   npm start
   ```
   The platform will be available at `http://localhost:3000`

3. **Access the Dashboard**: Navigate to `http://localhost:3000/dashboard`

4. **Development Mode** (with auto-restart):
   ```bash
   npm run dev
   ```

## 📡 API Endpoints

### GET `/health`
Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "OK",
  "service": "Ntandostore Free Hosting",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### POST `/upload`
Upload and deploy a new website.

**Request Body:**
```json
{
  "siteName": "My Awesome Website",
  "html": "<!DOCTYPE html><html>...</html>",
  "css": "body { color: blue; }",
  "js": "console.log('Hello World');"
}
```

**Response:**
```json
{
  "success": true,
  "domain": "quickweb123.ntandostore",
  "url": "/hosted/quickweb123.ntandostore/",
  "message": "Site published successfully!"
}
```

### GET `/api/sites`
Get all hosted websites.

**Response:**
```json
[
  {
    "domain": "quickweb123.ntandostore",
    "name": "My Awesome Website",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "visits": 42,
    "url": "/hosted/quickweb123.ntandostore/"
  }
]
```

### DELETE `/api/sites/:domain`
Delete a hosted website.

**Response:**
```json
{
  "success": true,
  "message": "Site deleted successfully"
}
```

### GET `/hosted/:domain/`
Serve hosted websites.

This endpoint automatically tracks visitor counts and serves the deployed HTML files.

## 🎯 How to Use Ntandostore

1. **Visit the Platform**: Go to your deployed URL or `http://localhost:3000`
2. **Navigate to Dashboard**: Click "Get Started" or visit `/dashboard`
3. **Upload Your Website**:
   - Enter your website name
   - Paste your HTML code (required)
   - Add CSS styling (optional)
   - Add JavaScript functionality (optional)
   - Click "Deploy Website"
4. **Get Your Domain**: Receive a unique *.ntandostore domain instantly
5. **Manage Sites**: View, visit, or delete websites from your dashboard
6. **Track Analytics**: Monitor visitor counts and site statistics

## 🌐 Domain Generation

Domains are automatically generated using:
- **Format**: `[adjective][noun][number].ntandostore`
- **Examples**: 
  - `quickweb123.ntandostore`
  - `brightsite456.ntandostore`
  - `smartpage789.ntandostore`

Each domain is unique and automatically checked for availability.

## 🎨 Customization

### Adding New Domain Patterns
Edit `server.js` and modify the `generateDomain()` function:
```javascript
function generateDomain() {
  const adjectives = ['quick', 'bright', 'clever', 'swift', 'smart'];
  const nouns = ['site', 'web', 'page', 'space', 'zone'];
  const numbers = Math.floor(Math.random() * 9999) + 1;
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adjective}${noun}${numbers}.ntandostore`;
}
```

### Customizing the Landing Page
- Edit `public/index.html` to change the main landing page
- Modify colors, text, and features as needed

### Dashboard Customization
- Edit `public/dashboard.html` to change the user interface
- Add new features, statistics, or management options

## 🔧 Environment Variables

The application uses the following environment variable:

- `PORT`: Server port (defaults to 3000, automatically set by Render.com)

## 📱 Mobile Support

- Fully responsive design works on all devices
- Touch-friendly interface for mobile users
- Optimized dashboard for small screens

## 🔒 Security Features

- Input sanitization for uploaded content
- File system access restrictions
- Domain validation and uniqueness checks
- Safe file serving with proper headers

## 📊 Storage System

- **File-based storage**: Websites stored as HTML files
- **JSON mapping**: Domain-to-file mapping in `domains.json`
- **Automatic cleanup**: Files removed when domains are deleted
- **Scalable architecture**: Easy to migrate to database storage

## 🚨 Troubleshooting

### Common Issues

1. **Upload Fails**:
   - Check HTML syntax
   - Ensure JSON is properly formatted
   - Verify file size limits (50MB max)

2. **Domain Not Accessible**:
   - Check if the site was uploaded successfully
   - Verify the domain format
   - Check server logs for errors

3. **Dashboard Not Loading**:
   - Ensure the server is running
   - Check browser console for JavaScript errors
   - Verify all static files are accessible

### Getting Help

- Check the browser console for JavaScript errors
- Review server logs for backend issues
- Ensure all files are properly deployed
- Verify Render.com build and deployment logs

## 🔮 Future Enhancements

Consider adding these features to enhance the platform:

- **Custom Domains**: Allow users to connect their own domains
- **Database Storage**: Move from file-based to database storage
- **User Authentication**: Add user accounts and login system
- **SSL Certificates**: Automatic HTTPS for all hosted sites
- **Analytics Dashboard**: Detailed visitor analytics and insights
- **File Upload**: Support for uploading files via drag-and-drop
- **Templates**: Pre-built website templates for quick deployment
- **Collaboration**: Multi-user support for team projects

## 📄 License

MIT License - Feel free to use this project for learning or as a foundation for your own hosting platform.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

If you encounter any issues during deployment:
1. Check this README file first
2. Review Render.com documentation
3. Check the application logs in the Render.com dashboard
4. Verify all files are pushed to GitHub

---

**🎉 Start Hosting Your Websites for Free Today!**

Ntandostore provides a complete, production-ready hosting platform suitable for the Render.com free tier. Deploy your websites instantly with unique domains and professional management tools.