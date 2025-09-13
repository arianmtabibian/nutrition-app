# 🚀 Nutrition App Deployment Guide

## Overview
This guide will help you deploy your Nutrition app to the internet using free services.

## 🎯 What We're Deploying
- **Frontend**: React app → Vercel (free)
- **Backend**: Node.js API → Render (free)
- **Database**: SQLite (included with backend)

## 📋 Prerequisites
- [GitHub account](https://github.com)
- [Vercel account](https://vercel.com) (free)
- [Render account](https://render.com) (free)
- [OpenAI API key](https://platform.openai.com/api-keys) (optional)

## 🚀 Step 1: Deploy Backend to Render

### 1.1 Push Code to GitHub
```bash
# In your project directory
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 1.2 Deploy to Render
1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `nutrition-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 1.3 Set Environment Variables
In Render dashboard, go to "Environment" and add:
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
OPENAI_API_KEY=your-openai-api-key-here
NODE_ENV=production
```

### 1.4 Get Your Backend URL
After deployment, copy the URL (e.g., `https://nutrition-backend.onrender.com`)

## 🌐 Step 2: Deploy Frontend to Vercel

### 2.1 Update API URL
1. Go to `client/src/config/production.js`
2. Replace `your-backend-url.onrender.com` with your actual backend URL

### 2.2 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### 2.3 Set Environment Variables
In Vercel dashboard, go to "Settings" → "Environment Variables":
```
REACT_APP_API_URL=https://your-backend-url.onrender.com
```

## 🔧 Step 3: Update CORS Settings

### 3.1 Update Backend CORS
In `server/index.js`, update the CORS origin:
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://your-frontend-domain.vercel.app',
  credentials: true,
  // ... rest of config
}));
```

### 3.2 Redeploy Backend
After making changes, push to GitHub and Render will auto-deploy.

## 🌍 Step 4: Custom Domain (Optional)

### 4.1 Frontend Domain
1. In Vercel, go to "Settings" → "Domains"
2. Add your custom domain
3. Update DNS records as instructed

### 4.2 Backend Domain
1. In Render, go to "Settings" → "Custom Domains"
2. Add your subdomain (e.g., `api.yourdomain.com`)
3. Update DNS records

## ✅ Step 5: Test Your Deployment

### 5.1 Test Backend
```bash
curl https://your-backend-url.onrender.com/api/health
# Should return: {"status":"OK","timestamp":"..."}
```

### 5.2 Test Frontend
1. Visit your Vercel URL
2. Try to register/login
3. Test all features

## 🔄 Step 6: Continuous Deployment

### 6.1 Automatic Deployments
- **Frontend**: Vercel auto-deploys on every Git push
- **Backend**: Render auto-deploys on every Git push

### 6.2 Development Workflow
1. Make changes locally
2. Test locally
3. Push to GitHub
4. Auto-deploy to production
5. Test production

## 🚨 Troubleshooting

### Common Issues
1. **CORS errors**: Check CORS origin settings
2. **Database errors**: Ensure SQLite file is included
3. **Environment variables**: Verify all are set in Render/Vercel
4. **Build errors**: Check Node.js version compatibility

### Debug Commands
```bash
# Check backend logs
# In Render dashboard → Logs

# Check frontend build
# In Vercel dashboard → Functions → Build Logs
```

## 📈 Next Steps

### Performance Improvements
1. **Database**: Migrate to PostgreSQL (Render has free tier)
2. **Caching**: Add Redis for session storage
3. **CDN**: Vercel provides automatic CDN
4. **Monitoring**: Add Sentry for error tracking

### Scaling
1. **Load balancing**: Multiple backend instances
2. **Database clustering**: Read replicas
3. **Microservices**: Split into smaller services

## 🎉 Congratulations!
Your Nutrition app is now live on the internet! 

**Frontend**: https://your-app.vercel.app
**Backend**: https://your-backend.onrender.com

## 📞 Support
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Render Docs**: [render.com/docs](https://render.com/docs)
- **GitHub Issues**: Create issues in your repository










