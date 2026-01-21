# ResQdrant Sentinel - Backend API

Professional backend for the ResQdrant Sentinel emergency response system with AI-assisted classification and MongoDB storage.

## 🏗️ Architecture

```
Frontend (React)
    ↓
    ↓ REST API
    ↓
Backend (Node.js + Express)
    ↓
    ├─→ MongoDB Atlas (Data Storage)
    └─→ OpenAI API (Optional - AI Classification)
```

## ✨ Features

- ✅ **REST API** for emergency report management
- ✅ **MongoDB Atlas Integration** (Free Tier)
- ✅ **AI-Assisted Classification** (Optional - improves keyword detection)
- ✅ **Rule-Based Severity System** (AI does NOT make safety decisions)
- ✅ **CORS Enabled** for frontend communication
- ✅ **Statistics Dashboard** endpoint

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup MongoDB Atlas (FREE TIER)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (M0 Free Tier - 512MB)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your password

### 3. Setup Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your credentials
# Required:
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/resqdrant

# Optional (for AI classification):
OPENAI_API_KEY=sk-your-key-here
```

### 4. Start the Server

```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

Server will run on: `http://localhost:5000`

## 📡 API Endpoints

### Health Check
```http
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-21T...",
  "database": "connected",
  "aiEnabled": true
}
```

### Submit Emergency Report
```http
POST /api/report
Content-Type: application/json

{
  "userDescription": "Fire in building, smoke everywhere",
  "detectedEmergencies": ["fire"],
  "keywordDetectedEmergencies": ["fire"],
  "severityLevel": 3,
  "emergencyMode": "CRITICAL_EMERGENCY_MODE",
  "location": {
    "city": "Chennai",
    "latitude": 13.0827,
    "longitude": 80.2707
  },
  "imageUploaded": false
}
```

### AI-Enhanced Classification (Optional)
```http
POST /api/classify
Content-Type: application/json

{
  "userDescription": "Someone collapsed, not breathing, chest pain"
}
```

Response:
```json
{
  "success": true,
  "aiDetected": ["medical"],
  "confidence": "high",
  "reasoning": "Medical emergency - cardiac event with breathing issues",
  "aiEnabled": true
}
```

### Get All Reports
```http
GET /api/reports?limit=50&status=pending
```

### Get Statistics
```http
GET /api/stats
```

Response:
```json
{
  "success": true,
  "stats": {
    "total": 145,
    "critical": 89,
    "riskAccumulation": 56,
    "last24Hours": 23,
    "byType": [
      { "_id": "fire", "count": 45 },
      { "_id": "medical", "count": 38 }
    ]
  }
}
```

## 🤖 AI Integration (Optional)

### Why AI?
The keyword-based system misses cases like:
- "earthquake in building" (word "earthquake" not in original keywords)
- "someone collapsed" (synonym for "unconscious")
- "chest pain" (cardiac emergency)

### What AI Does
- ✅ Understands synonyms and context
- ✅ Detects multiple emergency types
- ✅ Improves classification accuracy

### What AI Does NOT Do
- ❌ Decide severity levels (rule-based only)
- ❌ Decide emergency modes (rule-based only)
- ❌ Provide first-aid instructions (rule-based only)
- ❌ Make final safety decisions

### Cost
- Uses GPT-3.5-turbo: ~$0.002 per request
- Demo with 1000 requests: ~$2
- Can be disabled - keywords still work

### Setup
1. Get API key: https://platform.openai.com/api-keys
2. Add to `.env`: `OPENAI_API_KEY=sk-...`
3. Restart server

## 🔒 Safety Design

### Rule-Based Decision System
```
User Input
    ↓
    ├─→ Keyword Detection (always runs)
    └─→ AI Classification (optional, enhances detection)
    ↓
Merge Results
    ↓
Rule-Based Severity Engine (frontend)
    ↓
CRITICAL or RISK_ACCUMULATION mode
```

### Key Principles
1. **AI is Assistant, Not Decision Maker**
   - AI only classifies emergency types
   - Severity logic is rule-based (frontend)

2. **Transparent Tracking**
   - Separate fields for keyword vs AI detections
   - Confidence scores logged

3. **Fail-Safe Design**
   - If AI fails, keyword detection works
   - If API key missing, system works without AI

4. **Conservative AI Prompt**
   - "False positive better than false negative"
   - Always err on side of safety

## 🗄️ Database Schema

```javascript
Report {
  userDescription: String,
  detectedEmergencies: [String],       // Final merged list
  keywordDetectedEmergencies: [String], // From keyword matching
  aiDetectedEmergencies: [String],     // From AI (if used)
  severityLevel: Number (1-3),
  emergencyMode: String,
  location: {
    city: String,
    latitude: Number,
    longitude: Number
  },
  imageUploaded: Boolean,
  status: String (pending/reviewed/resolved),
  aiConfidence: String,
  timestamp: Date
}
```

## 🧪 Testing

### Test Health Check
```bash
curl http://localhost:5000/api/health
```

### Test Report Submission
```bash
curl -X POST http://localhost:5000/api/report \
  -H "Content-Type: application/json" \
  -d '{
    "userDescription": "Fire emergency",
    "detectedEmergencies": ["fire"],
    "severityLevel": 3,
    "emergencyMode": "CRITICAL_EMERGENCY_MODE",
    "location": {"city": "Chennai"}
  }'
```

### Test AI Classification (if enabled)
```bash
curl -X POST http://localhost:5000/api/classify \
  -H "Content-Type: application/json" \
  -d '{"userDescription": "earthquake shaking building"}'
```

## 📊 MongoDB Atlas Setup Guide

### Step-by-Step

1. **Create Account**
   - Go to mongodb.com/cloud/atlas
   - Sign up (free)

2. **Create Cluster**
   - Choose "Shared" (Free)
   - Select provider (AWS recommended)
   - Choose region closest to you
   - Cluster Tier: M0 Sandbox (FREE)

3. **Create Database User**
   - Database Access → Add New Database User
   - Username: resqdrant_user
   - Password: (generate strong password)
   - Built-in Role: Read and write to any database

4. **Whitelist IP Address**
   - Network Access → Add IP Address
   - For development: Allow Access from Anywhere (0.0.0.0/0)
   - For production: Whitelist specific IPs

5. **Get Connection String**
   - Clusters → Connect → Connect your application
   - Driver: Node.js, Version: 4.1 or later
   - Copy connection string
   - Replace `<password>` with your password
   - Replace `<dbname>` with `resqdrant`

## 🚀 Deployment

### Heroku (Free Tier Available)
```bash
# Install Heroku CLI
# heroku login
# heroku create resqdrant-backend
# heroku config:set MONGO_URI="your-connection-string"
# heroku config:set OPENAI_API_KEY="your-key" (optional)
# git push heroku main
```

### Render (Free Tier)
1. Connect GitHub repo
2. Set environment variables
3. Deploy

### Railway (Free Tier)
1. Import project
2. Add environment variables
3. Deploy

## 🐛 Troubleshooting

### "MongoDB Connection Error"
- Check MONGO_URI in .env
- Verify database password
- Check IP whitelist in MongoDB Atlas

### "AI Classifier: Disabled"
- This is normal if no OPENAI_API_KEY set
- System works with keywords only
- Add API key to enable AI

### CORS Errors
- Backend must run before frontend
- Check backend is on http://localhost:5000
- Frontend should fetch from http://localhost:5000/api/...

## 📝 License

MIT License - Hackathon Demo Project
