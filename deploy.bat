@echo off
echo 🚀 Nutrition App Deployment Script
echo ==================================

REM Check if git is initialized
if not exist ".git" (
    echo ❌ Git repository not found. Please initialize git first:
    echo    git init
    echo    git add .
    echo    git commit -m "Initial commit"
    pause
    exit /b 1
)

REM Check if remote origin is set
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo ❌ Git remote origin not set. Please add your GitHub repository:
    echo    git remote add origin https://github.com/yourusername/your-repo.git
    pause
    exit /b 1
)

echo ✅ Git repository ready

REM Install dependencies
echo 📦 Installing dependencies...
cd client && npm install && cd ..
cd server && npm install && cd ..

REM Build frontend
echo 🔨 Building frontend...
cd client && npm run build && cd ..

REM Commit changes
echo 💾 Committing changes...
git add .
git commit -m "Prepare for deployment"

REM Push to GitHub
echo 🚀 Pushing to GitHub...
git push origin main

echo.
echo 🎉 Code pushed to GitHub!
echo.
echo Next steps:
echo 1. Go to https://render.com and deploy your backend
echo 2. Go to https://vercel.com and deploy your frontend
echo 3. Follow the detailed guide in DEPLOYMENT_GUIDE.md
echo.
echo Your app will be live on the internet! 🌍
pause



