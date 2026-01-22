const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD
    ? 'https://resqdrant-sentinel.onrender.com'
    : 'http://localhost:5000');

const API_URL = `${API_BASE_URL}/api`;

/**
 * API Service for ResQdrant Backend
 * 
 * This service connects the frontend to the backend for:
 * 1. AI-enhanced emergency classification
 * 2. Report storage and retrieval
 * 3. Statistics dashboard
 */
export const api = {
  /**
   * AI-Enhanced Emergency Classification
   * Call this BEFORE running rule-based detection
   * 
   * @param {string} userDescription - User's emergency description
   * @returns {Promise<Object>} AI classification result
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
   * 
   * @param {Object} reportData - Complete report data
   * @returns {Promise<Object>} Submission result
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
   * 
   * @param {number} limit - Number of reports to retrieve
   * @returns {Promise<Array>} Array of reports
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
   * 
   * @returns {Promise<Object>} Statistics object
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
  },

  /**
   * Check Backend Health
   * 
   * @returns {Promise<Object>} Health status
   */
  async checkHealth() {
    try {
      const response = await fetch(`${API_URL}/health`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Health Check Error:', error);
      return {
        status: 'error',
        database: 'disconnected',
        aiEnabled: false
      };
    }
  }
};

export default api;
