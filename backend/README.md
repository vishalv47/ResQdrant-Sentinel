# ResQdrant Sentinel - Backend API

Professional backend for the ResQdrant Sentinel emergency response system with AI-powered semantic emergency classification.

## 🏗️ Architecture

```
Frontend (React)
    ↓
    ↓ REST API
    ↓
Backend (Node.js + Express)
    ↓
    ├─→ In-Memory Storage (Development)
    └─→ Groq AI / LLaMA 3.3 (Emergency Classification)
```

## ✨ Features

- ✅ **REST API** for emergency classification and reporting
- ✅ **In-Memory Storage** (no database required)
- ✅ **AI-Powered Classification** via Groq's LLaMA 3.3 70B
- ✅ **Semantic Understanding** (no keyword matching)
- ✅ **CORS Enabled** for frontend communication
- ✅ **Resource Mapping** based on emergency type

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Get Groq API Key (FREE)

1. Go to [Groq Console](https://console.groq.com)
2. Create a free account
3. Generate an API key
4. Copy the key (starts with `gsk_`)

### 3. Setup Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your credentials
# Edit .env and add your Groq API key
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
PORT=5000
```

### 4. Start the Server

```bash
node index.js
```

Server will run on: `http://localhost:5000`

✅ **That's it!** No database setup needed.

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
  "storage": "in-memory",
  "totalReports": 0,
  "aiEnabled": true
}
```

### Classify Emergency (AI-Powered)
```http
POST /api/classify
Content-Type: application/json

{
  "userDescription": "Fire in building"
}
```

Response:
```json
{
  "emergencyType": "fire",
  "severity": "CRITICAL",
  "explanation": "Flames in building pose immediate threat",
  "firstAidSteps": ["Evacuate immediately", "Call 911", ...],
  "nearbyResources": [...]
}
```

### Submit Emergency Report
```http
POST /api/report
Content-Type: application/json

{
  "userDescription": "Fire in building, smoke everywhere",
  "detectedEmergencies": ["fire"],
  "severityLevel": "CRITICAL",
  "location": {
    "city": "Chennai",
    "latitude": 13.0827,
    "longitude": 80.2707
  },
  "imageUploaded": false
  }
}
```

### Get All Reports (In-Memory)
```http
GET /api/reports
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
    "total": 12,
    "totalReports": 12,
    "reportsByStatus": {...}
  }
}
```

## 🤖 AI Classification

### How It Works
1. User describes emergency in natural language
2. Groq AI (LLaMA 3.3 70B) analyzes the text semantically
3. AI returns: emergency type, severity, explanation, first-aid steps
4. No keyword matching needed

### Why Groq?
- ⚡ **Blazing Fast**: 300+ tokens/second
- 🆓 **Free Tier**: Generous limits for development
- 🎯 **Accurate**: LLaMA 3.3 70B state-of-the-art model
- 📊 **Structured Output**: Guaranteed JSON responses

### Examples
```
"Building shaking violently" → Earthquake, CRITICAL
"Person collapsed and not breathing" → Medical, CRITICAL
"Heavy smoke from kitchen" → Fire, CRITICAL
"Flood water rising rapidly" → Flood, CRITICAL
```

### Cost
- Free tier: Generous limits for development & demos
- Production: Pay-as-you-go pricing
- Alternative: Can add database for persistent storage

## 🔒 Architecture Decisions

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

## 🧪 Testing

### Test Health Check
```bash
curl http://localhost:5000/api/health
```

### Test Emergency Classification
```bash
curl -X POST http://localhost:5000/api/classify \
  -H "Content-Type: application/json" \
  -d '{"description": "Building shaking violently, things falling"}'
```

Expected response:
```json
{
  "success": true,
  "classification": {
    "emergencyType": "earthquake",
    "severity": "CRITICAL",
    "explanation": "Severe seismic activity...",
    "firstAidSteps": ["Drop, Cover, and Hold On", ...]
  },
  "nearbyResources": {
    "hospitals": [...],
    "fireStations": [...]
  }
}
```

### Test Report Viewing
```bash
curl http://localhost:5000/api/reports
```

## 🚀 Deployment

### Render (Recommended - Free Tier)
1. Connect GitHub repository
2. Set environment variables:
   - `GROQ_API_KEY`: Your Groq API key
3. Deploy

### Railway (Free Tier)
1. Connect GitHub repo
2. Add `GROQ_API_KEY` environment variable
3. Deploy

### Railway (Free Tier)
1. Import project
2. Add `GROQ_API_KEY` environment variable
3. Deploy

## 🐛 Troubleshooting

### "Groq API Error"
- Check GROQ_API_KEY in .env
- Verify API key is valid at https://console.groq.com
- Check rate limits (free tier has generous limits)

### "Port already in use"
- Another process is using port 5000
- Change PORT in .env to 5001
- Or kill the process: `npx kill-port 5000`

### CORS Errors
- Backend must run before frontend
- Check backend is on http://localhost:5000
- Frontend should fetch from http://localhost:5000/api/...

### "Module not found"
- Run `npm install` in backend folder
- Check package.json dependencies
- Try deleting node_modules and reinstalling

## 📝 License

MIT License - Hackathon Demo Project
