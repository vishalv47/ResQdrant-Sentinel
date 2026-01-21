const Groq = require('groq-sdk');

/**
 * AI-Assisted Emergency Classifier
 * 
 * SAFETY PRINCIPLES:
 * 1. AI is ONLY used for understanding/classifying user text
 * 2. AI does NOT decide severity levels
 * 3. AI does NOT decide emergency modes
 * 4. AI does NOT provide first-aid instructions
 * 5. AI output is MERGED with rule-based keyword detection
 * 6. Rule-based system always has final say on severity
 * 
 * PURPOSE: Fix the issue where only a few keywords work
 * Example: "earthquake in building" not detected by keywords alone
 */

// ResQdrant Sentinel - Emergency Intelligence System
const EMERGENCY_CLASSIFICATION_PROMPT = `You are ResQdrant Sentinel, an emergency intelligence system.

Your task: Understand ANY emergency described in natural language and provide clear, actionable guidance.

RULES:
- Never say "I am an AI" or mention being an assistant
- Never ask questions - provide direct answers
- Be concise and focus on public safety
- Identify the primary emergency type (single most relevant)
- Handle indirect phrasing ("building shaking" = earthquake)

EMERGENCY TYPES:
- fire: flames, burning, smoke, explosion
- flood: water damage, drowning, submerged areas
- earthquake: shaking, ground movement, building collapse
- medical: unconscious, not breathing, heart attack, stroke
- bleeding: severe cuts, hemorrhage, trauma
- electric: shock, electrocution, power lines
- storm: tornado, hurricane, severe weather
- landslide: mudslide, avalanche, debris flow
- gas: gas leak, carbon monoxide smell

SEVERITY:
- CRITICAL: immediate life threat
- MODERATE: serious but not immediately life-threatening
- LOW: minor, can wait for help

Examples:
"Earthquake in the apartment" → emergencyType: "earthquake", severity: "CRITICAL"
"Building shaking violently" → emergencyType: "earthquake", severity: "CRITICAL"
"Person collapsed and not breathing" → emergencyType: "medical", severity: "CRITICAL"
"Heavy smoke coming from kitchen" → emergencyType: "fire", severity: "CRITICAL"

Output ONLY this JSON format (no markdown, no extra text):
{
  "emergencyType": "earthquake",
  "severity": "CRITICAL",
  "explanation": "Ground shaking inside a building strongly indicates an earthquake.",
  "firstAidSteps": [
    "Drop, cover, and hold on",
    "Stay away from windows",
    "Do not use elevators",
    "Exit only after shaking stops"
  ]
}

Classify this emergency:`;

class AIEmergencyClassifier {
  constructor() {
    this.groq = null;
    this.enabled = false;
    
    // Initialize Groq if API key exists
    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'gsk_your-api-key-here') {
      try {
        this.groq = new Groq({
          apiKey: process.env.GROQ_API_KEY
        });
        this.enabled = true;
        console.log('✅ AI Classifier: Enabled (Groq AI connected)');
      } catch (error) {
        console.warn('⚠️  AI Classifier: Failed to initialize Groq:', error.message);
        this.enabled = false;
      }
    } else {
      console.log('ℹ️  AI Classifier: Disabled (No API key - using keywords only)');
    }
  }

  /**
   * Classify emergency using AI
   * @param {string} userDescription - User's emergency description
   * @returns {Promise<Object>} Classification result: { emergencyType, severity, explanation, firstAidSteps }
   */
  async classifyEmergency(userDescription) {
    // If AI is not enabled, return empty result
    if (!this.enabled || !userDescription || userDescription.trim().length === 0) {
      return {
        emergencyType: 'unknown',
        severity: 'UNKNOWN',
        explanation: 'AI classification not available or no description provided',
        firstAidSteps: []
      };
    }

    try {
      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile', // Latest Groq model
        messages: [
          {
            role: 'system',
            content: EMERGENCY_CLASSIFICATION_PROMPT
          },
          {
            role: 'user',
            content: userDescription
          }
        ],
        temperature: 0.3, // Low temperature for consistent responses
        max_tokens: 300,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0].message.content);
      
      console.log('🤖 AI Classification:', result);
      return result;

    } catch (error) {
      console.error('❌ AI Classification Error:', error.message);
      return {
        emergencyType: 'unknown',
        severity: 'ERROR',
        explanation: `AI classification failed: ${error.message}`,
        firstAidSteps: []
      };
    }
  }

  /**
   * Merge AI-detected emergencies with keyword-detected emergencies
   * @param {Array} keywordEmergencies - Emergencies detected by keywords
   * @param {Array} aiEmergencies - Emergencies detected by AI
   * @returns {Array} Merged list of unique emergencies
   */
  mergeDetections(keywordEmergencies, aiEmergencies) {
    const merged = new Set([
      ...(keywordEmergencies || []),
      ...(aiEmergencies || [])
    ]);
    return Array.from(merged);
  }

  /**
   * Check if AI is available
   */
  isEnabled() {
    return this.enabled;
  }
}

// Export singleton instance
module.exports = new AIEmergencyClassifier();
