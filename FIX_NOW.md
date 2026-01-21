# 🚀 QUICK START - Fix Your Backend NOW!

## ⚡ Your Problem (90% Sure)

Your `backend/.env` file has:
```
MONGO_URI=mongodb+srv://vishal_db_user:YOUR_PASSWORD@...
```

**The text `YOUR_PASSWORD` is still there!** This is why you're getting "MONGO_URI is undefined" errors.

---

## ✅ The Fix (2 Minutes)

### Step 1: Get Your Password

**Go to**: https://cloud.mongodb.com/

1. Click **Database Access** (left sidebar)
2. Find user: `vishal_db_user`
3. Click **EDIT**
4. Click **Edit Password**
5. Click **Autogenerate Secure Password**
6. **COPY THE PASSWORD** (looks like: `4Xk9mP2nQr7sT`)

### Step 2: Update .env File

**Open**: `backend/.env` in VS Code

**Find this line**:
```env
MONGO_URI=mongodb+srv://vishal_db_user:YOUR_PASSWORD@resqdrant.nkiljhx.mongodb.net/resqdrant?retryWrites=true&w=majority
```

**Change to** (paste your password):
```env
MONGO_URI=mongodb+srv://vishal_db_user:4Xk9mP2nQr7sT@resqdrant.nkiljhx.mongodb.net/resqdrant?retryWrites=true&w=majority
```

**SAVE** the file (Ctrl+S)

### Step 3: Verify (Optional)

```powershell
cd backend
node verify-env.js
```

Should show: `🎉 PERFECT! Your .env is fully configured!`

### Step 4: Start Backend

```powershell
cd backend
npm run dev
```

**SUCCESS** looks like:
```
✅ MongoDB Connected Successfully!
   Database: resqdrant
🌐 Server running on: http://localhost:5000
```

---

## 🧪 Test It Works

**Open browser**: http://localhost:5000/api/health

Should return:
```json
{
  "status": "ok",
  "database": "connected"
}
```

---

## ❌ Still Not Working?

### Error: "Authentication failed"
→ Wrong password
→ Reset password in MongoDB Atlas again

### Error: "MongoServerSelectionError"
→ IP not whitelisted
→ Go to MongoDB Atlas → Network Access → Add IP Address → `0.0.0.0/0`

### Error: ".env file not found"
→ You're in the wrong directory
→ Run: `cd backend` then `npm run dev`

---

## 📞 Verification Checklist

Before asking for help, check:

- [ ] File `backend/.env` exists (not just `.env.example`)
- [ ] Opened `backend/.env` in VS Code (not `.env.example`)
- [ ] Replaced `YOUR_PASSWORD` with actual password
- [ ] Saved the file (Ctrl+S)
- [ ] No spaces or typos in password
- [ ] MongoDB Atlas → Network Access has IP address listed
- [ ] Running `npm run dev` from `backend/` folder

---

## 🎯 Expected Folder Structure

```
ResQdrant/
├── backend/
│   ├── .env              ← YOUR FILE (with real password)
│   ├── .env.example      ← Template (keep as is)
│   ├── index.js          ← Server code
│   ├── verify-env.js     ← Verification script
│   └── package.json
└── src/
    └── (frontend files)
```

---

## 🚀 Once It Works

1. **Keep backend running** (don't close terminal)
2. **Open NEW terminal**
3. **Start frontend**:
   ```powershell
   npm run dev
   ```
4. **Open**: http://localhost:5173
5. **Test**: Type "fire in building" → Analyze

---

## 📚 Full Documentation

- [BACKEND_SETUP.md](BACKEND_SETUP.md) - Complete setup from scratch
- [ENV_FIX.md](ENV_FIX.md) - Detailed troubleshooting
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Frontend + backend

---

**That's it! Replace the password, save, and run. Should work in 2 minutes!** 🎉
