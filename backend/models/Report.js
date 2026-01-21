const mongoose = require('mongoose');

/**
 * Emergency Report Schema
 * 
 * This schema stores all emergency reports submitted through the frontend.
 * It captures both user input and system analysis results.
 * 
 * IMPORTANT: Severity levels and emergency modes are RULE-BASED (not AI-decided)
 */
const reportSchema = new mongoose.Schema({
  // User Input
  userDescription: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  
  // Emergency Analysis (Rule-Based + AI-Assisted)
  detectedEmergencies: [{
    type: String,
    enum: [
      'fire',
      'flood',
      'electric',
      'storm',
      'landslide',
      'bleeding',
      'medical',
      'earthquake',
      'other'
    ]
  }],
  
  // AI-Detected Emergencies (separate field for transparency)
  aiDetectedEmergencies: [{
    type: String
  }],
  
  // Keyword-Detected Emergencies (separate field for transparency)
  keywordDetectedEmergencies: [{
    type: String
  }],
  
  // Severity and Mode (RULE-BASED ONLY - Never AI-decided)
  severityLevel: {
    type: Number,
    min: 1,
    max: 3,
    required: true
  },
  
  emergencyMode: {
    type: String,
    enum: ['CRITICAL_EMERGENCY_MODE', 'RISK_ACCUMULATION_MODE'],
    required: true
  },
  
  // Location Data
  location: {
    city: {
      type: String,
      default: 'Unknown'
    },
    latitude: {
      type: Number,
      required: false
    },
    longitude: {
      type: Number,
      required: false
    }
  },
  
  // Media
  imageUploaded: {
    type: Boolean,
    default: false
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending'
  },
  
  // Metadata
  timestamp: {
    type: Date,
    default: Date.now
  },
  
  // AI Confidence (if AI was used)
  aiConfidence: {
    type: String,
    enum: ['high', 'medium', 'low', 'not_used'],
    default: 'not_used'
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for faster queries
reportSchema.index({ timestamp: -1 });
reportSchema.index({ emergencyMode: 1 });
reportSchema.index({ status: 1 });

// Virtual field to calculate hours since report
reportSchema.virtual('hoursSinceReport').get(function() {
  return Math.floor((Date.now() - this.timestamp) / (1000 * 60 * 60));
});

module.exports = mongoose.model('Report', reportSchema);
