# 🚀 RENDER SETUP INSTRUCTIONS - PERMANENT DATABASE FIX

## ⚠️ CRITICAL: Set Environment Variable in Render

To make the database persistent across deployments, you MUST set this environment variable in Render:

### **1. Go to Render Dashboard:**
- Open: https://dashboard.render.com
- Find your backend service: `nutrition-back-jtf3`
- Click on it

### **2. Set Environment Variable:**
- Go to **"Environment"** tab
- Click **"Add Environment Variable"**
- Set:
  - **Key**: `DB_PATH`
  - **Value**: `/opt/render/project/data/nutrition.db`
- Click **"Save Changes"**

### **3. Redeploy:**
- Click **"Manual Deploy"** to restart with the new environment variable

## ✅ What This Fixes:

1. **Database Path**: Uses `/opt/render/project/data/` (persistent) instead of `/tmp/` (temporary)
2. **Default User**: Automatically creates `arianmtabibian@gmail.com` on every startup
3. **User Persistence**: Your account will survive ALL redeployments

## 🔧 Expected Behavior After Setup:

1. **Database persists** across all deployments
2. **arianmtabibian@gmail.com** is automatically created if it doesn't exist
3. **You can always login** with `arianmtabibian@gmail.com` / `newpassword123`
4. **New registrations persist** across deployments

## 📋 Verification:

After setting the environment variable and redeploying:
1. Check Render logs for: "✅ Default user arianmtabibian@gmail.com created successfully"
2. Try logging in with the default credentials
3. Register a new account and verify it persists after redeployment

## 🚨 If Still Having Issues:

If the database still resets, Render's free tier might have limitations. Consider:
1. Upgrading to Render's paid tier
2. Using an external database (PostgreSQL, MongoDB Atlas)
3. Implementing database backups to cloud storage
