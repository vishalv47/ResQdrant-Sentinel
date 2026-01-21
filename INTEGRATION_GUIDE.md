# Frontend ↔ Backend Integration Guide

## Overview

This guide shows how to connect your existing ResQdrant Sentinel React frontend to the new backend API with AI-enhanced classification.

## 🎯 Integration Points

### 1. Environment Variables (Frontend)

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 2. API Service Module

Create `frontend/src/services/api.js`:

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * API Service for ResQdrant Backend
 */
export const api = {
  /**
   * AI-Enhanced Emergency Classification
   * Call this BEFORE running rule-based detection
   */
  async classifyEmergency(userDescription) {
    try {
      const response = await fetch(`${API_URL}/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userDescription }),
      });

      if (!response.ok) {
        throw new Error(`Classification failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        aiDetected: data.aiDetected || [],
        confidence: data.confidence || 'not_used',
        reasoning: data.reasoning || '',
        aiEnabled: data.aiEnabled || false
      };
    } catch (error) {
      console.error('AI Classification Error:', error);
      // Return empty result - keyword detection will still work
      return {
        aiDetected: [],
        confidence: 'not_used',
        reasoning: 'AI not available',
        aiEnabled: false
      };
    }
  },

  /**
   * Submit Emergency Report to Backend
   * Call this AFTER frontend has determined severity and mode
   */
  async submitReport(reportData) {
    try {
      const response = await fetch(`${API_URL}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        throw new Error(`Submit failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        reportId: data.reportId
      };
    } catch (error) {
      console.error('Report Submission Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Get Recent Reports (for admin dashboard)
   */
  async getReports(limit = 50) {
    try {
      const response = await fetch(`${API_URL}/reports?limit=${limit}`);
      const data = await response.json();
      return data.reports || [];
    } catch (error) {
      console.error('Fetch Reports Error:', error);
      return [];
    }
  },

  /**
   * Get Statistics
   */
  async getStats() {
    try {
      const response = await fetch(`${API_URL}/stats`);
      const data = await response.json();
      return data.stats || {};
    } catch (error) {
      console.error('Fetch Stats Error:', error);
      return {};
    }
  }
};
```

### 3. Updated ResQdrant Component

Modify `frontend/src/components/ResQdrant.jsx` - Add these changes:

#### Import the API service (add to top of file):
```javascript
import { api } from '../services/api';
```

#### Add new state for AI results:
```javascript
const [aiClassification, setAiClassification] = useState(null);
const [isClassifying, setIsClassifying] = useState(false);
```

#### Update the `handleAnalyze` function:

Replace the existing `handleAnalyze` function with this enhanced version:

```javascript
const handleAnalyze = async () => {
  setIsClassifying(true);
  
  try {
    // Step 1: Get AI classification (if available)
    const aiResult = await api.classifyEmergency(emergencyInput);
    setAiClassification(aiResult);
    
    // Step 2: Run keyword-based detection (existing code)
    const keywordDetected = detectEmergencies(emergencyInput, uploadedImage);
    
    // Step 3: Merge AI and keyword detections
    const allDetected = [...new Set([
      ...keywordDetected,
      ...aiResult.aiDetected
    ])];
    
    // If no emergencies detected
    if (allDetected.length === 0) {
      setDetectedEmergencies([]);
      setSuggestions(['Please describe your emergency clearly. Include details like: fire, flood, injury, bleeding, electric shock, etc.']);
      setResources([]);
      setEmergencyMode(null);
      setTriggerExplanation('');
      setIsClassifying(false);
      return;
    }

    setDetectedEmergencies(allDetected);

    // Step 4: Apply RULE-BASED severity logic (existing code)
    const hasText = emergencyInput.trim().length > 0;
    const hasImage = uploadedImage !== null;
    const { mode, explanation } = determineEmergencyMode(allDetected, hasImage, hasText);
    setEmergencyMode(mode);
    setTriggerExplanation(explanation);

    // Step 5: Get first aid suggestions (existing code)
    const allSuggestions = [];
    allDetected.forEach(em => {
      if (firstAidGuidance[em]) {
        allSuggestions.push(`\n${emergencyPatterns[em].icon} ${em.toUpperCase()}:`);
        allSuggestions.push(...firstAidGuidance[em]);
      }
    });
    setSuggestions(allSuggestions);

    // Step 6: Get resources (existing code)
    const resourceList = mockResources(allDetected, userLocation);
    setResources(resourceList);

    // Step 7: Submit to backend
    await api.submitReport({
      userDescription: emergencyInput,
      detectedEmergencies: allDetected,
      keywordDetectedEmergencies: keywordDetected,
      aiDetectedEmergencies: aiResult.aiDetected,
      severityLevel: Math.max(...allDetected.map(em => 
        emergencyPatterns[em]?.severity || 1
      )),
      emergencyMode: mode,
      location: {
        city: 'Chennai',
        latitude: userLocation?.lat,
        longitude: userLocation?.lng
      },
      imageUploaded: uploadedImage !== null,
      aiConfidence: aiResult.confidence
    });

    console.log('✅ Report submitted to backend');

  } catch (error) {
    console.error('Analysis error:', error);
    // Still show results even if backend submission fails
  } finally {
    setIsClassifying(false);
  }
};
```

#### Update the Analyze button to show loading state:

```javascript
<button
  onClick={handleAnalyze}
  disabled={isClassifying}
  className={`flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-md ${
    isClassifying ? 'opacity-50 cursor-not-allowed' : ''
  }`}
>
  {isClassifying ? 'Analyzing...' : 'Analyze Emergency'}
</button>
```

#### Add AI Classification Info (optional - add after "Why This Was Triggered" section):

```javascript
{/* AI Classification Info (if AI was used) */}
{aiClassification && aiClassification.aiEnabled && (
  <div className={`rounded-xl p-4 mb-6 border ${
    isDarkMode 
      ? 'bg-gray-800 border-gray-700' 
      : 'bg-blue-50 border-blue-200'
  }`}>
    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
      <span className="font-semibold">🤖 AI-Assisted Classification:</span>
      {aiClassification.aiDetected.length > 0 ? (
        <>
          <span> Detected {aiClassification.aiDetected.join(', ')}</span>
          <span className="ml-2 text-xs">
            (Confidence: {aiClassification.confidence})
          </span>
        </>
      ) : (
        <span> Using keyword detection only</span>
      )}
    </div>
  </div>
)}
```

### 4. Update Emergency Patterns (Add Earthquake)

In `ResQdrant.jsx`, add earthquake to the patterns:

```javascript
const emergencyPatterns = {
  // ... existing patterns ...
  earthquake: {
    keywords: ['earthquake', 'quake', 'seismic', 'tremor', 'ground shaking'],
    icon: '🌍',
    color: '#78716C',
    severity: 3 // Critical
  }
};

const firstAidGuidance = {
  // ... existing guidance ...
  earthquake: [
    "DROP, COVER, and HOLD ON",
    "Get under a sturdy desk or table",
    "Stay away from windows and heavy objects",
    "If outside, move to an open area",
    "Do not use elevators",
    "Check for injuries after shaking stops"
  ]
};
```

## 🚀 Running the Complete System

### Terminal 1: Backend
```bash
cd backend
npm install
# Create .env file with MONGO_URI
npm run dev
```

Backend runs on: `http://localhost:5000`

### Terminal 2: Frontend
```bash
cd frontend  # or just the root if vite project is in root
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

## 🧪 Testing the Integration

### Test 1: AI-Enhanced Detection
```javascript
// In frontend console
const result = await fetch('http://localhost:5000/api/classify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userDescription: 'earthquake shaking building'
  })
});
console.log(await result.json());
```

Expected output:
```json
{
  "success": true,
  "aiDetected": ["earthquake"],
  "confidence": "high",
  "reasoning": "Clear seismic emergency"
}
```

### Test 2: Full Flow
1. Open frontend: http://localhost:5173
2. Type: "earthquake in building, people trapped"
3. Click "Analyze Emergency"
4. Verify:
   - ✅ Earthquake detected (AI helps with this)
   - ✅ CRITICAL_EMERGENCY_MODE triggered (rule-based)
   - ✅ Report saved to MongoDB
5. Check backend: http://localhost:5000/api/reports

## 📊 Flow Diagram

```
User Input: "earthquake in building"
        ↓
    Frontend
        ↓
1. Call /api/classify
        ↓
   Backend + AI
        ↓
   Returns: ["earthquake"]
        ↓
    Frontend
        ↓
2. Merge with keyword detection
   Result: ["earthquake"]
        ↓
3. Apply RULE-BASED severity
   Severity: 3 (Critical)
   Mode: CRITICAL_EMERGENCY_MODE
        ↓
4. Show UI + First Aid
        ↓
5. Call /api/report
        ↓
   Backend
        ↓
6. Save to MongoDB
```

## 🔒 Safety Guarantees

### What AI Does
- ✅ Classifies emergency type only
- ✅ Improves detection accuracy
- ✅ Catches synonyms and context

### What AI Does NOT Do
- ❌ Set severity levels (always rule-based)
- ❌ Determine emergency mode (always rule-based)
- ❌ Override keyword detection
- ❌ Give first-aid instructions

### Fail-Safe Design
- If AI fails → keyword detection works
- If backend fails → frontend still works
- If API key missing → system runs without AI

## 📝 Example: Complete Analysis Flow

### Input
```
"Someone had a heart attack and collapsed"
```

### AI Classification
```json
{
  "aiDetected": ["medical"],
  "confidence": "high",
  "reasoning": "Cardiac emergency with loss of consciousness"
}
```

### Keyword Detection
```javascript
["medical"] // Detected from "heart" keyword
```

### Merged Detection
```javascript
["medical"] // Both systems agree
```

### Rule-Based Severity (Frontend)
```javascript
{
  severityLevel: 3, // Medical = Critical
  emergencyMode: "CRITICAL_EMERGENCY_MODE"
}
```

### Backend Storage
```json
{
  "userDescription": "Someone had a heart attack and collapsed",
  "detectedEmergencies": ["medical"],
  "keywordDetectedEmergencies": ["medical"],
  "aiDetectedEmergencies": ["medical"],
  "severityLevel": 3,
  "emergencyMode": "CRITICAL_EMERGENCY_MODE",
  "aiConfidence": "high"
}
```

## 🎓 Why This Design is Safe

1. **Separation of Concerns**
   - AI: Understanding/Classification
   - Rules: Safety Decisions

2. **Transparency**
   - Track what AI detected vs keywords
   - Log confidence levels

3. **Conservative Approach**
   - AI prompt says: "false positive better than false negative"
   - Merge all detections (never ignore)

4. **Fail-Safe**
   - System works without AI
   - System works without backend
   - Frontend is source of truth for severity

5. **Hackathon-Ready**
   - Easy to demo
   - Easy to explain
   - Works locally
   - No complex infrastructure

## 🏆 Demo Script for Judges

1. **Show keyword limitation**
   - Type: "fire"
   - Shows: Detected ✓

2. **Show AI enhancement**
   - Type: "earthquake in building"
   - Shows: Detected ✓ (AI helped!)

3. **Show rule-based safety**
   - Explain: "AI only classifies, rules decide severity"
   - Show: Mode triggered by rules, not AI

4. **Show backend/database**
   - Open: http://localhost:5000/api/stats
   - Show: All reports stored with metadata

5. **Show fail-safe**
   - Stop backend
   - Frontend still works!

This demonstrates a production-ready, safe, and intelligent emergency response system. 🚨
