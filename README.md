# Simple Computer - Render.com Deployable Web Application

A simple, responsive web-based calculator application built with Node.js and Express, designed for easy deployment on Render.com.

## 🚀 Features

- **Basic Arithmetic Operations**: Addition, subtraction, multiplication, and division
- **Real-time Display**: Shows the current calculation as you type
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Health Check Endpoint**: `/health` endpoint for monitoring
- **REST API**: POST `/calculate` endpoint for programmatic access
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Keyboard Support**: Press Enter to calculate, Escape to clear

## 📁 Project Structure

```
simple-computer/
├── server.js              # Main Express server
├── package.json           # Node.js dependencies and scripts
├── render.yaml           # Render.com deployment configuration
├── public/
│   └── index.html        # Frontend HTML/CSS/JavaScript
└── README.md            # This file
```

## 🛠️ Technology Stack

- **Backend**: Node.js with Express.js
- **Frontend**: Pure HTML, CSS, and JavaScript (no frameworks required)
- **Deployment**: Render.com (free tier compatible)
- **API**: RESTful API with JSON responses

## 🚀 Quick Start - Deploy to Render.com

### Method 1: GitHub Repository (Recommended)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Simple Computer"
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
     - **Name**: simple-computer
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Instance Type**: Free
   - Click "Create Web Service"

3. **Wait for Deployment**: Render will automatically build and deploy your app

### Method 2: Using render.yaml (Automatic)

1. The `render.yaml` file is already included in this project
2. When you connect your GitHub repository to Render, it will automatically use this configuration
3. No manual configuration needed!

## 🏃‍♂️ Local Development

1. **Clone and Install**:
   ```bash
   git clone <your-repository-url>
   cd simple-computer
   npm install
   ```

2. **Start the Server**:
   ```bash
   npm start
   ```
   The app will be available at `http://localhost:3000`

3. **Development Mode** (with auto-restart):
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
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### POST `/calculate`
Perform arithmetic calculations.

**Request Body:**
```json
{
  "operation": "add|subtract|multiply|divide",
  "num1": "number",
  "num2": "number"
}
```

**Response:**
```json
{
  "result": "123.45"
}
```

**Error Response:**
```json
{
  "error": "Cannot divide by zero"
}
```

## 🎨 Customization

### Adding New Operations
1. Open `server.js`
2. Add new case in the `/calculate` route:
```javascript
case 'power':
  result = Math.pow(n1, n2);
  break;
```

### Styling Changes
- Edit the CSS in `public/index.html`
- All styles are embedded in the HTML file for simplicity

### Adding New Pages
1. Create new HTML files in the `public/` directory
2. Add new routes in `server.js`:
```javascript
app.get('/newpage', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'newpage.html'));
});
```

## 🔧 Environment Variables

The application uses the following environment variable:

- `PORT`: Server port (defaults to 3000, automatically set by Render.com)

## 📱 Screenshots

The application features:
- Clean, modern interface with gradient background
- Large, easy-to-read display
- Responsive button layout
- Mobile-friendly design
- Real-time calculation preview

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**:
   - The app automatically uses the PORT environment variable
   - Locally, change the port with: `PORT=3001 npm start`

2. **Build Fails on Render**:
   - Check that all dependencies are in `package.json`
   - Ensure Node.js version is >= 14.0.0

3. **App Not Responding**:
   - Check the `/health` endpoint
   - Review Render.com logs for errors

### Getting Help

- Check Render.com dashboard for deployment logs
- Verify all files are pushed to GitHub
- Ensure `package.json` has correct start script

## 📄 License

MIT License - Feel free to use this project for learning or as a template for your own applications.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

If you encounter any issues during deployment:
1. Check this README file first
2. Review Render.com documentation
3. Check the application logs in the Render.com dashboard

---

**Happy Coding! 🎉**

This Simple Computer application is ready to deploy and demonstrates a complete, production-ready web application suitable for the Render.com free tier.