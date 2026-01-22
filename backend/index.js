// ========================
// ENVIRONMENT SETUP
// ========================
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const aiClassifier = require('./aiClassifier');

// ========================
// IN-MEMORY DATA STORAGE
// ========================
let reports = [];
let reportIdCounter = 1;

const app = express();
const PORT = process.env.PORT || 5000;

// ========================
// MIDDLEWARE
// ========================
// Enable CORS for frontend communication (allow Vercel + localhost)
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174', 
    'http://localhost:3000',
    'https://resqdrant-sentinel.vercel.app',
    'https://resqdrant-sentinel-git-main-vishals-projects-e1c7645c.vercel.app',
    /\.vercel\.app$/ // Allow all Vercel preview deployments
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Parse JSON requests (support large base64 images)
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ========================
// IN-MEMORY STORAGE READY
// ========================
console.log('✅ Using in-memory storage (no database required)');

// ========================
// RESOURCE MAPPING
// ========================

/**
 * Generate nearby resources based on emergency type
 * @param {string} emergencyType - Type of emergency detected by AI
 * @returns {Array} Array of relevant nearby resources
 */
function getNearbyResources(emergencyType) {
  // Base resources available in Chennai area
  const baseResources = {
    hospital: [
      { type: 'Hospital', name: 'Chennai General Hospital', lat: 13.0827, lng: 80.2707, distance: 2.3, eta: 8 },
      { type: 'Hospital', name: 'Apollo Hospital', lat: 13.0569, lng: 80.2425, distance: 4.1, eta: 15 },
    ],
    fireStation: [
      { type: 'Fire Station', name: 'Central Fire Station', lat: 13.0878, lng: 80.2785, distance: 1.8, eta: 5 },
    ],
    shelter: [
      { type: 'Shelter', name: 'Community Center Shelter', lat: 13.0525, lng: 80.2511, distance: 3.8, eta: 12 },
      { type: 'Shelter', name: 'Emergency Relief Center', lat: 13.0650, lng: 80.2620, distance: 2.5, eta: 9 },
    ],
    rescue: [
      { type: 'Rescue Team', name: 'Emergency Response Unit', lat: 13.0794, lng: 80.2680, distance: 1.5, eta: 4 },
    ],
    police: [
      { type: 'Police Station', name: 'T Nagar Police', lat: 13.0418, lng: 80.2341, distance: 3.2, eta: 10 },
    ],
  };

  // Resource mapping based on emergency type
  const resourceMap = {
    fire: [
      { type: 'Fire Rescue', name: 'Rapid Response Fire Team', lat: 13.0750, lng: 80.2650, distance: 1.2, eta: 3, status: 'Dispatched' },
      ...baseResources.fireStation,
      ...baseResources.hospital,
    ],
    earthquake: [
      { type: 'Disaster Response', name: 'Earthquake Response Unit', lat: 13.0780, lng: 80.2700, distance: 1.6, eta: 5, status: 'Dispatched' },
      ...baseResources.shelter,
      ...baseResources.rescue,
      baseResources.hospital[0],
    ],
    medical: [
      { type: 'Ambulance', name: 'Emergency Ambulance Service', lat: 13.0820, lng: 80.2700, distance: 0.9, eta: 3, status: 'Dispatched' },
      ...baseResources.hospital,
      ...baseResources.rescue,
    ],
    flood: [
      { type: 'Water Rescue', name: 'Flood Rescue Team', lat: 13.0600, lng: 80.2500, distance: 2.8, eta: 9, status: 'Dispatched' },
      ...baseResources.shelter,
      ...baseResources.rescue,
      baseResources.hospital[1],
    ],
    electric: [
      { type: 'Power Emergency', name: 'Electricity Emergency Response', lat: 13.0760, lng: 80.2640, distance: 1.7, eta: 6, status: 'Dispatched' },
      { type: 'Ambulance', name: 'Emergency Ambulance Service', lat: 13.0820, lng: 80.2700, distance: 0.9, eta: 3, status: 'Dispatched' },
      baseResources.hospital[0],
    ],
    bleeding: [
      { type: 'Ambulance', name: 'Emergency Ambulance Service', lat: 13.0820, lng: 80.2700, distance: 0.9, eta: 3, status: 'Dispatched' },
      ...baseResources.hospital,
    ],
    gas: [
      { type: 'Fire Rescue', name: 'Hazmat Response Team', lat: 13.0750, lng: 80.2650, distance: 1.2, eta: 3, status: 'Dispatched' },
      ...baseResources.fireStation,
      baseResources.hospital[0],
    ],
    storm: [
      ...baseResources.shelter,
      ...baseResources.rescue,
      baseResources.hospital[0],
    ],
    landslide: [
      { type: 'Disaster Response', name: 'Landslide Rescue Team', lat: 13.0780, lng: 80.2700, distance: 1.6, eta: 5, status: 'Dispatched' },
      ...baseResources.rescue,
      ...baseResources.shelter,
    ],
  };

  // Get resources for the specific emergency type, or return general resources
  const resources = resourceMap[emergencyType.toLowerCase()] || [
    ...baseResources.rescue,
    ...baseResources.hospital,
    baseResources.police[0],
  ];

  // Sort by distance and return top 6
  return resources.sort((a, b) => a.distance - b.distance).slice(0, 6);
}

// ========================
// ROUTES
// ========================

/**
 * Health Check Endpoint
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    storage: 'in-memory',
    totalReports: reports.length,
    aiEnabled: aiClassifier.isEnabled()
  });
});

/**
 * Submit Emergency Report
 * POST /api/report
 * 
 * IMPORTANT: This endpoint stores reports but does NOT make safety decisions.
 * All severity and mode decisions are made by the frontend's rule-based system.
 */
app.post('/api/report', async (req, res) => {
  try {
    const {
      userDescription,
      detectedEmergencies,
      severityLevel,
      emergencyMode,
      location,
      imageUploaded,
      keywordDetectedEmergencies
    } = req.body;

    // Validation
    if (!userDescription || !detectedEmergencies || !severityLevel || !emergencyMode) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['userDescription', 'detectedEmergencies', 'severityLevel', 'emergencyMode']
      });
    }

    // Create new report in memory
    const report = {
      id: reportIdCounter++,
      userDescription,
      detectedEmergencies,
      keywordDetectedEmergencies: keywordDetectedEmergencies || [],
      aiDetectedEmergencies: [],
      severityLevel,
      emergencyMode,
      location: location || {},
      imageUploaded: imageUploaded || false,
      status: 'pending',
      timestamp: new Date()
    };

    reports.push(report);

    console.log(`📝 New Report Saved: #${report.id}`);
    console.log(`   Mode: ${emergencyMode}`);
    console.log(`   Emergencies: ${detectedEmergencies.join(', ')}`);

    res.status(201).json({
      success: true,
      reportId: report.id,
      message: 'Emergency report stored successfully'
    });

  } catch (error) {
    console.error('❌ Error saving report:', error);
    res.status(500).json({
      error: 'Failed to save report',
      details: error.message
    });
  }
});

/**
 * AI-Enhanced Emergency Classification
 * POST /api/classify
 * 
 * ResQdrant Sentinel: Understands emergencies through natural language.
 * Provides severity assessment and immediate safety instructions.
 */
app.post('/api/classify', async (req, res) => {
  try {
    const { userDescription } = req.body;

    if (!userDescription || userDescription.trim().length === 0) {
      return res.status(400).json({
        error: 'userDescription is required'
      });
    }

    // Use AI to classify emergency with full intelligence
    const aiResult = await aiClassifier.classifyEmergency(userDescription);

    // Attach nearby resources based on emergency type
    const nearbyResources = getNearbyResources(aiResult.emergencyType || 'unknown');

    res.json({
      ...aiResult,
      nearbyResources
    });

  } catch (error) {
    console.error('❌ Classification error:', error);
    res.status(500).json({
      error: 'Classification failed',
      details: error.message
    });
  }
});

/**
 * Get All Reports
 * GET /api/reports
 * 
 * Query parameters:
 * - limit: Number of reports to return (default: 50)
 * - status: Filter by status (pending/reviewed/resolved)
 * - mode: Filter by emergency mode
 */
app.get('/api/reports', async (req, res) => {
  try {
    const { limit = 50, status, mode } = req.query;
    
    // Filter reports
    let filteredReports = reports;
    if (status) filteredReports = filteredReports.filter(r => r.status === status);
    if (mode) filteredReports = filteredReports.filter(r => r.emergencyMode === mode);

    // Sort by timestamp (most recent first) and limit
    const sortedReports = filteredReports
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      count: sortedReports.length,
      reports: sortedReports
    });

  } catch (error) {
    console.error('❌ Error fetching reports:', error);
    res.status(500).json({
      error: 'Failed to fetch reports',
      details: error.message
    });
  }
});

/**
 * Get Report Statistics
 * GET /api/stats
 */
app.get('/api/stats', async (req, res) => {
  try {
    const totalReports = reports.length;
    const criticalReports = reports.filter(r => r.emergencyMode === 'CRITICAL_EMERGENCY_MODE').length;
    const riskAccumulationReports = reports.filter(r => r.emergencyMode === 'RISK_ACCUMULATION_MODE').length;
    
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentReports = reports.filter(r => r.timestamp >= last24Hours).length;

    // Get emergency type distribution
    const typeCount = {};
    reports.forEach(report => {
      report.detectedEmergencies.forEach(type => {
        typeCount[type] = (typeCount[type] || 0) + 1;
      });
    });
    
    const emergencyTypes = Object.entries(typeCount)
      .map(([type, count]) => ({ _id: type, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      stats: {
        total: totalReports,
        critical: criticalReports,
        riskAccumulation: riskAccumulationReports,
        last24Hours: recentReports,
        byType: emergencyTypes
      }
    });

  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      details: error.message
    });
  }
});

/**
 * Update Report Status
 * PATCH /api/report/:id
 */
app.patch('/api/report/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be: pending, reviewed, or resolved'
      });
    }

    const report = reports.find(r => r.id === parseInt(id));

    if (!report) {
      return res.status(404).json({
        error: 'Report not found'
      });
    }

    report.status = status;

    res.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('❌ Error updating report:', error);
    res.status(500).json({
      error: 'Failed to update report',
      details: error.message
    });
  }
});

// ========================
// 404 HANDLER
// ========================
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    availableRoutes: [
      'GET  /api/health',
      'POST /api/report',
      'POST /api/classify',
      'GET  /api/reports',
      'GET  /api/stats',
      'PATCH /api/report/:id'
    ]
  });
});

// ========================
// ERROR HANDLER
// ========================
app.use((err, req, res, next) => {
  console.error('❌ Unhandled Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// ========================
// START SERVER
// ========================
app.listen(PORT, () => {
  console.log('');
  console.log('🚨 ResQdrant Sentinel Backend Server');
  console.log('=====================================');
  console.log(`🌐 Server running on: http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 AI Classifier: ${aiClassifier.isEnabled() ? 'Enabled' : 'Disabled (keywords only)'}`);
  console.log('');
  console.log('Available endpoints:');
  console.log('  POST /api/report     - Submit emergency report');
  console.log('  POST /api/classify   - AI-classify emergency text');
  console.log('  GET  /api/reports    - Retrieve all reports');
  console.log('  GET  /api/stats      - Get statistics');
  console.log('  PATCH /api/report/:id - Update report status');
  console.log('');
});
