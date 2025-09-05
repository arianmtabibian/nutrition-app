# Vercel Environment Variables Setup

## CRITICAL: Set these environment variables in your Vercel dashboard

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add these variables for ALL environments (Production, Preview, Development):

### Required Environment Variables:

```
REACT_APP_API_URL=https://nutrition-back-jtf3.onrender.com
```

## Steps to fix domain issues:

### 1. Set Primary Domain
- Go to Vercel Dashboard → Your Project → Settings → Domains
- Add `nutryra.com` as a domain
- Click the "..." menu next to nutryra.com
- Select "Set as Primary Domain"
- This ensures nutryra.com is always used

### 2. Remove Auto-Generated Domains (Optional)
- You can remove the auto-generated .vercel.app domains
- Or keep them but set nutryra.com as primary

### 3. Update DNS
Make sure your DNS settings point to Vercel:
- CNAME: nutryra.com → cname.vercel-dns.com

### 4. Test
After these changes:
1. Redeploy your app
2. Visit nutryra.com (not the .vercel.app URL)
3. Your login should persist across deployments
