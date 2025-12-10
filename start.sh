#!/bin/bash

# Ntandostore Enhanced - Startup Script
echo "🚀 Starting Ntandostore Enhanced Hosting Platform..."

# Create necessary directories
mkdir -p uploads users

# Set permissions
chmod 755 uploads users

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
echo "🌐 Starting server..."
npm start