# 🚀 Deployment Guide

## Prerequisites
- ✅ GitHub repository pushed
- ✅ Groq API key ready
- ✅ Backend deployed on Render
- ✅ Frontend deployed on Vercel

## 🔧 Step 1: Deploy Backend to Render

### 1.1 Create Render Web Service
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `resqdrant-backend` (or any name)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Instance Type**: `Free`

### 1.2 Add Environment Variables
In Render dashboard → Environment tab:
```
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
PORT=5000
NODE_ENV=production
```

### 1.3 Save Your Backend URL
After deployment, Render gives you a URL like:
```
https://resqdrant-backend-abc123.onrender.com
```
**Copy this URL** - you'll need it for Vercel!

---

## 🌐 Step 2: Configure Vercel Frontend

### 2.1 Add Environment Variable
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **resqdrant-sentinel**
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-backend-name.onrender.com/api`
   - **Environments**: Check all (Production, Preview, Development)

**IMPORTANT**: Replace `your-backend-name` with your actual Render backend URL!

Example:
```
VITE_API_URL=https://resqdrant-backend-abc123.onrender.com/api
```

### 2.2 Redeploy
After adding the environment variable:
1. Go to **Deployments** tab
2. Click **•••** (three dots) on latest deployment
3. Click **Redeploy**
4. Check **Use existing Build Cache** → **Redeploy**

---

## ✅ Step 3: Verify Deployment

### 3.1 Test Backend (Render)
Open in browser:
```
https://your-backend-name.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "storage": "in-memory",
  "aiEnabled": true,
  "timestamp": "2026-01-22T..."
}
```

### 3.2 Test Frontend (Vercel)
1. Open: `https://resqdrant-sentinel.vercel.app`
2. Enter emergency description: `"Building shaking violently"`
3. Click **Analyze Emergency**
4. Should see AI classification results

---

## 🐛 Troubleshooting

### ❌ "Connection error. Make sure backend is running on port 5000"

**Cause**: Frontend is still using `localhost:5000` instead of Render URL

**Solution**:
1. Check Vercel environment variables
2. Make sure `VITE_API_URL` is set to your Render backend URL
3. Redeploy Vercel after adding environment variable

### ❌ "CORS error" in browser console

**Cause**: Backend doesn't allow requests from Vercel domain

**Solution**: Already fixed in `backend/index.js`! Just redeploy backend:
```bash
git add .
git commit -m "Update CORS for Vercel deployment"
git push
```
Render will auto-redeploy.

### ❌ Render backend "Groq API key not found"

**Cause**: Environment variable not set in Render

**Solution**:
1. Render Dashboard → Your Service → Environment
2. Add `GROQ_API_KEY=gsk_...`
3. Click **Save Changes**
4. Backend will auto-restart

### ❌ Render "Free instance sleeping"

**Cause**: Free Render instances sleep after 15 minutes of inactivity

**Solution**: 
- First request wakes it up (takes 30-60 seconds)
- Subsequent requests are fast
- For production, upgrade to paid plan ($7/month)

### ❌ Vercel "Environment variable not found"

**Cause**: Forgot to add `VITE_API_URL` in Vercel

**Solution**:
1. Vercel → Project → Settings → Environment Variables
2. Add `VITE_API_URL` with your Render backend URL
3. Must include `/api` at the end
4. Redeploy

---

## 📋 Quick Checklist

Backend (Render):
- [ ] Service created and deployed
- [ ] `GROQ_API_KEY` environment variable set
- [ ] `/api/health` endpoint returns 200 OK
- [ ] Deployment status shows "Live"

Frontend (Vercel):
- [ ] Project deployed from GitHub
- [ ] `VITE_API_URL` environment variable set to Render backend URL
- [ ] Environment variable includes `/api` suffix
- [ ] Redeployed after adding environment variable
- [ ] Can access website and see UI

Integration:
- [ ] Frontend can call backend `/api/classify`
- [ ] No CORS errors in browser console
- [ ] AI classification works in production
- [ ] Emergency reports display correctly

---

## 🎯 Expected URLs

| Service | Environment | URL |
|---------|-------------|-----|
| Backend | Local | `http://localhost:5000` |
| Backend | Render | `https://your-backend.onrender.com` |
| Frontend | Local | `http://localhost:5173` |
| Frontend | Vercel | `https://resqdrant-sentinel.vercel.app` |

---

## 💡 Pro Tips

1. **Render Free Tier Sleep**: First request after 15min takes ~60 seconds (cold start)
2. **Environment Variables**: Must redeploy Vercel after adding variables
3. **CORS**: Backend already configured to accept Vercel domains
4. **API URL Format**: Must end with `/api` (not just domain)
5. **Testing**: Always test `/api/health` endpoint first

---

## 🆘 Still Having Issues?

1. Check browser console for errors (F12 → Console)
2. Verify Render logs: Dashboard → Your Service → Logs
3. Verify Vercel logs: Dashboard → Deployments → Function Logs
4. Test backend directly: `curl https://your-backend.onrender.com/api/health`
5. Make sure environment variables are in Production environment

---

**Need more help?** Open an issue on GitHub with:
- Error message from browser console
- Render backend logs
- Vercel deployment logs
