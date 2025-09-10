# ⚡ Quick Start Deployment Checklist

## 🎯 Get Your App Online in 15 Minutes!

### ✅ Step 1: GitHub Setup (2 min)
- [ ] Create GitHub repository
- [ ] Push your code: `git push origin main`

### ✅ Step 2: Deploy Backend (5 min)
- [ ] Go to [render.com](https://render.com)
- [ ] Sign up with GitHub
- [ ] Click "New +" → "Web Service"
- [ ] Connect your repo
- [ ] Set environment variables:
  ```
  JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
  OPENAI_API_KEY=your-openai-api-key-here
  NODE_ENV=production
  ```

### ✅ Step 3: Deploy Frontend (5 min)
- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Sign up with GitHub
- [ ] Import your repo
- [ ] Set root directory: `client`
- [ ] Add environment variable:
  ```
  REACT_APP_API_URL=https://your-backend-url.onrender.com
  ```

### ✅ Step 4: Test (3 min)
- [ ] Visit your Vercel URL
- [ ] Try to register/login
- [ ] Test meal input feature

## 🎉 You're Done!
Your app is now live on the internet!

**Frontend**: `https://your-app.vercel.app`
**Backend**: `https://your-backend.onrender.com`

## 🔄 Future Updates
- Make changes locally
- Push to GitHub
- Auto-deploy to production
- I can still help you make agentic changes! 🤖

## 📚 Need Help?
- Read `DEPLOYMENT_GUIDE.md` for detailed instructions
- Run `deploy.bat` (Windows) or `deploy.sh` (Mac/Linux)
- Check the troubleshooting section in the main guide








