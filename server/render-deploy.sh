#!/bin/bash

# Render deployment script for Nutrition app backend

echo "🚀 Starting Render deployment..."

# Clean install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Rebuild SQLite3 for the target platform
echo "🔧 Rebuilding SQLite3 for Linux..."
npm rebuild sqlite3

# Create database directory if it doesn't exist
echo "🗄️ Setting up database..."
mkdir -p /tmp

echo "✅ Deployment preparation complete!"
echo "Starting server..."
npm start










