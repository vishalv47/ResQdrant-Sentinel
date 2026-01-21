import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Phone, MapPin, Activity, Navigation, Upload, X, Moon, Sun } from 'lucide-react';

const ResQdrant = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [emergencyInput, setEmergencyInput] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [detectedEmergency, setDetectedEmergency] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const fileInputRef = useRef(null);

  // Emergency type icons and colors
  const emergencyIcons = {
    fire: { icon: '🔥', color: '#D97706' },
    flood: { icon: '🌊', color: '#0891B2' },
    earthquake: { icon: '🌍', color: '#78716C' },
    medical: { icon: '🚑', color: '#EF4444' },
    bleeding: { icon: '🩸', color: '#DC2626' },
    electric: { icon: '⚡', color: '#FBBF24' },
    storm: { icon: '🌪️', color: '#6B7280' },
    landslide: { icon: '⛰️', color: '#78716C' },
    gas: { icon: '💨', color: '#F59E0B' },
  };

  const getSeverityColor = (severity) => {
    switch(severity?.toUpperCase()) {
      case 'CRITICAL': return '#EF4444';
      case 'HIGH': return '#F59E0B';
      case 'MODERATE': return '#EAB308';
      default: return '#6B7280';
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          setUserLocation({ lat: 13.0827, lng: 80.2707 });
        }
      );
    } else {
      setUserLocation({ lat: 13.0827, lng: 80.2707 });
    }
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage({
          file: file,
          preview: reader.result,
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const detectEmergencies = (text, hasImage) => {
    const detected = [];
    const lowerText = text.toLowerCase();

    Object.keys(emergencyPatterns).forEach(key => {
      const pattern = emergencyPatterns[key];
      if (pattern.keywords.some(keyword => lowerText.includes(keyword))) {
        detected.push(key);
      }
    });

    if (hasImage && detected.length === 0) {
      detected.push('medical');
    }

    return [...new Set(detected)];
  };

  // NEW: Severity-Based Decision Engine
  // This function determines the emergency response mode based on detected emergencies
  const determineEmergencyMode = (emergencies, hasImage, hasText) => {
    if (emergencies.length === 0) {
      return {
        mode: null,
        explanation: ''
      };
    }

    // Check if ANY emergency has severity level 3 (critical)
    // RULE: A SINGLE high-severity emergency triggers CRITICAL_EMERGENCY_MODE immediately
    const criticalEmergencies = emergencies.filter(em => 
      emergencyPatterns[em] && emergencyPatterns[em].severity === 3
    );

    const hasCriticalEmergency = criticalEmergencies.length > 0;

    // CRITICAL_EMERGENCY_MODE: Triggered by any severity-3 emergency
    if (hasCriticalEmergency) {
      const criticalNames = criticalEmergencies.map(em => 
        emergencyPatterns[em].icon + ' ' + em.toUpperCase()
      ).join(', ');

      // Build detailed explanation in plain English
      let explanation = `CRITICAL MODE ACTIVATED: You reported ${criticalNames}. `;
      
      if (criticalEmergencies.length > 1) {
        explanation += `All ${criticalEmergencies.length} of these emergencies are classified as CRITICAL (severity level 3), meaning they are life-threatening situations requiring immediate professional response. `;
      } else {
        explanation += `This emergency is classified as CRITICAL (severity level 3), meaning it is a life-threatening situation requiring immediate professional response. `;
      }

      // Add context based on input method
      if (hasImage && hasText) {
        explanation += `Your report included both a written description and a photo, which helps emergency responders understand the situation better. `;
      } else if (hasImage) {
        explanation += `You uploaded a photo to document the emergency scene. `;
      } else if (hasText) {
        explanation += `Your written description has been analyzed to identify the emergency type. `;
      }

      explanation += `All available emergency services have been notified and dispatched to your location at maximum priority. Resources are being allocated immediately.`;

      return {
        mode: 'CRITICAL_EMERGENCY_MODE',
        explanation: explanation
      };
    }

    // RISK_ACCUMULATION_MODE: Multiple moderate-risk emergencies
    // Calculate total severity score
    const totalSeverityScore = emergencies.reduce((sum, em) => {
      return sum + (emergencyPatterns[em] ? emergencyPatterns[em].severity : 0);
    }, 0);

    const emergencyList = emergencies.map(em => 
      emergencyPatterns[em].icon + ' ' + em.toUpperCase()
    ).join(', ');

    // Build detailed explanation
    let explanation = `RISK ACCUMULATION MODE: Multiple emergencies detected - ${emergencyList}. `;
    
    explanation += `While individually these may be moderate risks (severity level 2), the combination of ${emergencies.length} concurrent emergencies increases the overall danger level. `;
    
    explanation += `Combined risk score: ${totalSeverityScore}. `;

    // Add context about input
    if (hasImage && hasText) {
      explanation += `Both visual and text evidence provided. `;
    } else if (hasImage) {
      explanation += `Photo evidence uploaded. `;
    }

    explanation += `Coordinated response teams are being dispatched to handle all situations simultaneously. Multiple specialized units may be deployed.`;

    return {
      mode: 'RISK_ACCUMULATION_MODE',
      explanation: explanation
    };
  };

  const handleAnalyze = async () => {
    if (!emergencyInput.trim()) {
      setError('Please describe your emergency');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userDescription: emergencyInput,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.emergencyType && data.severity) {
        setDetectedEmergency({
          type: data.emergencyType,
          severity: data.severity,
          explanation: data.explanation,
          firstAidSteps: data.firstAidSteps || [],
          nearbyResources: data.nearbyResources || [],
        });
      } else {
        setError('Unable to classify emergency. Please try again.');
      }
    } catch (err) {
      console.error('Classification error:', err);
      setError('Connection error. Make sure backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const handleAlert = () => {
    setAlertSent(true);
    setTimeout(() => setAlertSent(false), 3000);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`min-h-screen transition-all duration-500 p-4 sm:p-8 ${
      isDarkMode 
        ? 'bg-[#0B0B0E] text-gray-100' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1">
            <h1 className={`text-4xl sm:text-5xl font-bold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              ResQdrant Sentinel
            </h1>
            <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              AI-Powered Emergency Response System
            </p>
            {userLocation && (
              <div className={`mt-3 flex items-center gap-2 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <Navigation size={16} />
                <span>Chennai, Tamil Nadu • {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</span>
              </div>
            )}
          </div>
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              isDarkMode 
                ? 'bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 text-yellow-400 shadow-lg shadow-yellow-500/20' 
                : 'bg-white hover:bg-gray-50 text-gray-700 shadow-lg border border-gray-200'
            }`}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>

        {/* Emergency Input Section */}
        <div className={`rounded-2xl p-6 sm:p-8 mb-6 transition-all duration-500 hover:scale-[1.01] ${
          isDarkMode 
            ? 'bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50' 
            : 'bg-white border border-gray-200 shadow-xl hover:shadow-2xl'
        }`}>
          <h2 className={`text-2xl font-semibold mb-6 flex items-center gap-3 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            <AlertCircle className="text-red-600" size={28} />
            Report Emergency
          </h2>
          
          <textarea
            value={emergencyInput}
            onChange={(e) => setEmergencyInput(e.target.value)}
            placeholder="Describe your emergency... (e.g., 'Fire in building', 'Severe bleeding', 'Flood water rising')"
            className={`w-full h-32 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none transition-all duration-300 ${
              isDarkMode 
                ? 'bg-black/40 text-gray-100 border border-white/10 placeholder:text-gray-500 focus:bg-black/60 focus:border-red-500/30' 
                : 'bg-gray-50 text-gray-900 border border-gray-300 focus:border-red-500 focus:bg-white'
            }`}
          />

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                isDarkMode 
                  ? 'bg-white/5 hover:bg-white/10 text-gray-100 border border-white/10' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 shadow-sm'
              }`}
            >
              <Upload size={20} />
              Upload Photo
            </button>

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg shadow-red-500/30 transform hover:scale-[1.02] active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing...' : 'Analyze Emergency'}
            </button>
          </div>

          {uploadedImage && (
            <div className="mt-6 relative inline-block">
              <img 
                src={uploadedImage.preview} 
                alt="Emergency" 
                className={`h-32 rounded-lg ${
                  isDarkMode ? 'border-2 border-gray-600' : 'border-2 border-gray-300'
                }`} 
              />
              <button
                onClick={() => setUploadedImage(null)}
                className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1.5 hover:bg-red-700 shadow-lg transition-colors"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className={`mb-6 rounded-2xl p-6 sm:p-8 border transition-all duration-500 animate-fade-in-up ${
            isDarkMode 
              ? 'bg-white/5 backdrop-blur-2xl border-white/10 shadow-2xl shadow-black/50' 
              : 'bg-white border-gray-200 shadow-xl'
          }`}>
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                AI is analyzing your emergency...
              </span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className={`mb-6 rounded-2xl p-6 sm:p-8 border-l-4 border-red-500 transition-all duration-500 animate-fade-in-up ${
            isDarkMode 
              ? 'bg-red-950/50 backdrop-blur-xl border border-red-900/50' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-red-200' : 'text-red-900'}`}>
                  Error
                </h3>
                <p className={isDarkMode ? 'text-red-100' : 'text-red-800'}>
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* AI Emergency Classification */}
        {detectedEmergency && (
          <div className={`rounded-2xl p-6 sm:p-8 mb-6 border-l-4 transition-all duration-700 animate-fade-in-up hover:scale-[1.01] ${
            isDarkMode 
              ? 'bg-white/5 backdrop-blur-2xl border-white/10 border-l-red-500 shadow-2xl shadow-red-500/10' 
              : 'bg-white border-gray-200 shadow-xl hover:shadow-2xl border-l-red-600'
          }`}>
            <h2 className={`text-2xl font-semibold mb-6 flex items-center gap-3 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <span className="text-3xl">{emergencyIcons[detectedEmergency.type]?.icon || '🚨'}</span>
              Emergency Classification
            </h2>

            {/* Emergency Type Badge */}
            <div className="mb-6">
              <div 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold shadow-md"
                style={{ backgroundColor: emergencyIcons[detectedEmergency.type]?.color || '#6B7280' }}
              >
                <span className="text-xl">{emergencyIcons[detectedEmergency.type]?.icon || '🚨'}</span>
                <span>{detectedEmergency.type.toUpperCase()}</span>
              </div>
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium shadow-md ml-3"
                style={{ backgroundColor: getSeverityColor(detectedEmergency.severity) }}
              >
                Severity: {detectedEmergency.severity}
              </div>
            </div>

            {/* AI Explanation */}
            <div className={`mb-6 p-4 rounded-xl transition-all duration-300 ${
              isDarkMode ? 'bg-black/40 border border-white/5' : 'bg-gray-50 border border-gray-100'
            }`}>
              <h3 className={`text-lg font-semibold mb-2 flex items-center gap-2 ${
                isDarkMode ? 'text-blue-300' : 'text-blue-700'
              }`}>
                <span className="text-xl">🧠</span>
                AI Analysis
              </h3>
              <p className={`leading-relaxed ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {detectedEmergency.explanation}
              </p>
            </div>

            {/* First Aid Steps */}
            {detectedEmergency.firstAidSteps && detectedEmergency.firstAidSteps.length > 0 && (
              <div>
                <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  <Activity className="text-blue-600" size={24} />
                  Immediate First Aid Steps
                </h3>
                <ol className="space-y-3">
                  {detectedEmergency.firstAidSteps.map((step, idx) => (
                    <li 
                      key={idx}
                      className={`flex gap-3 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                        {idx + 1}
                      </span>
                      <span className="flex-1 leading-relaxed pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Nearby Resources */}
        {detectedEmergency && detectedEmergency.nearbyResources && detectedEmergency.nearbyResources.length > 0 && (
          <div className={`rounded-2xl p-6 sm:p-8 mb-6 transition-all duration-700 animate-fade-in-up delay-200 hover:scale-[1.01] ${
            isDarkMode 
              ? 'bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50' 
              : 'bg-white border border-gray-200 shadow-xl hover:shadow-2xl'
          }`}>
            <h2 className={`text-2xl font-semibold mb-6 flex items-center gap-3 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <MapPin className="text-green-600" size={28} />
              Nearby Resources
            </h2>
            <div className="space-y-3">
              {detectedEmergency.nearbyResources.map((resource, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-xl flex items-center justify-between transition-all duration-300 transform hover:scale-[1.02] hover:translate-x-1 ${
                    isDarkMode 
                      ? 'bg-black/30 border border-white/5 hover:bg-black/50 hover:border-white/10' 
                      : 'bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex-1">
                    <div className={`font-semibold text-base mb-1 ${
                      isDarkMode ? 'text-yellow-400' : 'text-yellow-700'
                    }`}>
                      {resource.type}
                    </div>
                    <div className={`text-base mb-2 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-900'
                    }`}>
                      {resource.name}
                    </div>
                    <div className={`text-sm flex items-center gap-4 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <span>📍 {resource.distance} km away</span>
                      <span>⏱️ ETA: {resource.eta} min</span>
                    </div>
                  </div>
                  {resource.status && (
                    <div className="ml-4 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-md">
                      {resource.status}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emergency Contacts */}
        <div className={`rounded-2xl p-6 sm:p-8 transition-all duration-500 hover:scale-[1.01] ${
          isDarkMode 
            ? 'bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50' 
            : 'bg-white border border-gray-200 shadow-xl hover:shadow-2xl'
        }`}>
          <h2 className={`text-2xl font-semibold mb-6 flex items-center gap-3 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            <Phone className="text-red-600" size={28} />
            Emergency Hotlines
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setShowPhoneDialog(true)}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95"
            >
              <span className="text-xl">🚨</span>
              <span>Emergency: 108</span>
            </button>
            <button
              onClick={() => setShowPhoneDialog(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95"
            >
              <span className="text-xl">👮</span>
              <span>Police: 100</span>
            </button>
            <button
              onClick={() => setShowPhoneDialog(true)}
              className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95"
            >
              <span className="text-xl">🚒</span>
              <span>Fire: 101</span>
            </button>
            <button
              onClick={handleAlert}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95"
            >
              <span className="text-xl">📱</span>
              <span>Alert Contacts</span>
            </button>
          </div>
        </div>

        {/* Alert Sent Notification */}
        {alertSent && (
          <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl animate-pulse z-50">
            <div className="flex items-center gap-2">
              <span className="text-xl">✓</span>
              <span className="font-semibold">Emergency contacts have been alerted!</span>
            </div>
          </div>
        )}

        {/* Phone Dialog */}
        {showPhoneDialog && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className={`rounded-2xl p-8 max-w-md w-full transition-all duration-500 transform animate-scale-in ${
              isDarkMode 
                ? 'bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl' 
                : 'bg-white border border-gray-200 shadow-2xl'
            }`}>
              <h3 className={`text-2xl font-bold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Call Emergency Services
              </h3>
              <p className={`mb-6 leading-relaxed ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                This is a demo app. In a real emergency, this would directly dial emergency services.
                Please use your phone to call the appropriate emergency number.
              </p>
              <button
                onClick={() => setShowPhoneDialog(false)}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-red-500/30 transform hover:scale-[1.02] active:scale-98"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResQdrant;
