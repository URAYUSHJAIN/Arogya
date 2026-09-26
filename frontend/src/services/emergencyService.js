// Emergency service for managing contacts and medical summary
// Following the pattern established in geminiService.js

// LocalStorage keys
const STORAGE_KEYS = {
  EMERGENCY_CONTACTS: 'arogyaplus_emergency_contacts',
  LAST_ANALYSIS: 'arogyaplus_last_analysis',
  EMERGENCY_CONSENT: 'arogyaplus_emergency_consent',
  EMERGENCY_SETTINGS: 'arogyaplus_emergency_settings'
};

// Helper function to safely parse JSON from localStorage
const safeJSONParse = (data) => {
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Error parsing JSON data:', error);
    return null;
  }
};

// Helper function to safely stringify data for localStorage
const safeJSONStringify = (data) => {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Error stringifying data:', error);
    return null;
  }
};

// Helper function to validate phone numbers (basic format check)
const validatePhoneNumber = (phone) => {
  // Basic phone number validation - allows various formats
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
};

// Retrieve saved emergency contacts
export const getEmergencyContacts = () => {
  try {
    const contactsData = localStorage.getItem(STORAGE_KEYS.EMERGENCY_CONTACTS);
    
    if (!contactsData) {
      return { success: true, data: [] };
    }

    const contacts = safeJSONParse(contactsData);
    
    if (!Array.isArray(contacts)) {
      console.warn('Invalid contacts data format, returning empty array');
      return { success: true, data: [] };
    }

    return { success: true, data: contacts };
  } catch (error) {
    console.error('Error retrieving emergency contacts:', error);
    return { success: false, error: 'Failed to retrieve emergency contacts' };
  }
};

// Save emergency contacts
export const saveEmergencyContacts = (contacts) => {
  try {
    if (!Array.isArray(contacts)) {
      return { success: false, error: 'Contacts must be an array' };
    }

    // Validate each contact
    for (const contact of contacts) {
      if (!contact.name || !contact.phone) {
        return { success: false, error: 'Each contact must have a name and phone number' };
      }
      
      if (!validatePhoneNumber(contact.phone)) {
        return { success: false, error: `Invalid phone number format: ${contact.phone}` };
      }
    }

    const contactsData = safeJSONStringify(contacts);
    
    if (!contactsData) {
      return { success: false, error: 'Failed to save contacts data' };
    }

    localStorage.setItem(STORAGE_KEYS.EMERGENCY_CONTACTS, contactsData);
    
    return { success: true };
  } catch (error) {
    console.error('Error saving emergency contacts:', error);
    
    if (error.name === 'QuotaExceededError') {
      return { success: false, error: 'Storage quota exceeded. Please clear some data and try again.' };
    }
    
    return { success: false, error: 'Failed to save emergency contacts' };
  }
};

// Retrieve last AI analysis summary
export const getMedicalSummary = () => {
  try {
    const analysisData = localStorage.getItem(STORAGE_KEYS.LAST_ANALYSIS);
    
    if (!analysisData) {
      return { success: true, data: null };
    }

    const analysis = safeJSONParse(analysisData);
    
    if (!analysis) {
      console.warn('Invalid analysis data format');
      return { success: true, data: null };
    }

    return { success: true, data: analysis };
  } catch (error) {
    console.error('Error retrieving medical summary:', error);
    return { success: false, error: 'Failed to retrieve medical summary' };
  }
};

// Save analysis for emergency use
export const saveMedicalSummary = (analysisResults) => {
  try {
    if (!analysisResults) {
      return { success: false, error: 'Analysis results are required' };
    }

    // Add timestamp to the analysis
    const analysisWithTimestamp = {
      ...analysisResults,
      savedAt: new Date().toISOString()
    };

    const analysisData = safeJSONStringify(analysisWithTimestamp);
    
    if (!analysisData) {
      return { success: false, error: 'Failed to save analysis data' };
    }

    localStorage.setItem(STORAGE_KEYS.LAST_ANALYSIS, analysisData);
    
    console.log('Medical summary saved for emergency use');
    return { success: true };
  } catch (error) {
    console.error('Error saving medical summary:', error);
    
    if (error.name === 'QuotaExceededError') {
      return { success: false, error: 'Storage quota exceeded. Please clear some data and try again.' };
    }
    
    return { success: false, error: 'Failed to save medical summary' };
  }
};

// Format medical summary for emergency sharing
export const formatMedicalSummaryForSharing = () => {
  try {
    const summaryResult = getMedicalSummary();
    
    if (!summaryResult.success || !summaryResult.data) {
      return { success: false, error: 'No medical summary available' };
    }

    const summary = summaryResult.data;
    const timestamp = summary.savedAt ? new Date(summary.savedAt).toLocaleString() : 'Unknown';

    // Format as plain text for easy sharing
    const formattedSummary = `
EMERGENCY MEDICAL SUMMARY
Generated by ArogyaPlus AI
Analysis Date: ${timestamp}

=====================================

SUMMARY:
${summary.summary || 'No summary available'}

KEY INSIGHTS:
${summary.insights || 'No insights available'}

MODERN MEDICINE RECOMMENDATIONS:
${summary.modernMedicine || 'No recommendations available'}

AYURVEDIC RECOMMENDATIONS:
${summary.ayurvedic || 'No recommendations available'}

LIFESTYLE RECOMMENDATIONS:
${summary.lifestyle || 'No recommendations available'}

=====================================

IMPORTANT DISCLAIMER:
This is an AI-generated analysis for informational purposes only. 
It should not replace professional medical advice, diagnosis, or treatment. 
Always consult with a qualified healthcare provider for medical decisions.

Generated by ArogyaPlus - AI-Powered Healthcare Intelligence
    `.trim();

    return { success: true, data: formattedSummary };
  } catch (error) {
    console.error('Error formatting medical summary:', error);
    return { success: false, error: 'Failed to format medical summary' };
  }
};

// Send emergency alert to contacts
export const sendEmergencyAlert = (contacts, location, customMessage = '') => {
  try {
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return { success: false, error: 'No emergency contacts available' };
    }

    const locationText = location ? 
      `Location: https://www.google.com/maps?q=${location.lat},${location.lng}` : 
      'Location: Not available';

    const baseMessage = customMessage || 'I need emergency assistance. Please contact me immediately.';
    const fullMessage = `[ArogyaPlus Emergency Alert] ${baseMessage} ${locationText} - Sent from ArogyaPlus app`;

    const smsUrls = contacts.map(contact => {
      const phoneNumber = contact.phone.replace(/[\s\-()]/g, ''); // Clean phone number
      return `sms:${phoneNumber}?body=${encodeURIComponent(fullMessage)}`;
    });

    return { success: true, data: smsUrls };
  } catch (error) {
    console.error('Error sending emergency alert:', error);
    return { success: false, error: 'Failed to prepare emergency alerts' };
  }
};

// Get consent status for data sharing
export const getConsentStatus = () => {
  try {
    const consentData = localStorage.getItem(STORAGE_KEYS.EMERGENCY_CONSENT);
    
    if (!consentData) {
      return { granted: false };
    }

    const consent = safeJSONParse(consentData);
    
    if (!consent || typeof consent.granted !== 'boolean') {
      return { granted: false };
    }

    return consent;
  } catch (error) {
    console.error('Error retrieving consent status:', error);
    return { granted: false };
  }
};

// Save user's consent for emergency sharing
export const saveConsentStatus = (granted) => {
  try {
    if (typeof granted !== 'boolean') {
      return { success: false, error: 'Consent status must be a boolean value' };
    }

    const consentData = {
      granted: granted,
      timestamp: new Date().toISOString()
    };

    const consentJson = safeJSONStringify(consentData);
    
    if (!consentJson) {
      return { success: false, error: 'Failed to save consent data' };
    }

    localStorage.setItem(STORAGE_KEYS.EMERGENCY_CONSENT, consentJson);
    
    return { success: true };
  } catch (error) {
    console.error('Error saving consent status:', error);
    
    if (error.name === 'QuotaExceededError') {
      return { success: false, error: 'Storage quota exceeded. Please clear some data and try again.' };
    }
    
    return { success: false, error: 'Failed to save consent status' };
  }
};

// Clear all emergency-related data
export const clearEmergencyData = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.EMERGENCY_CONTACTS);
    localStorage.removeItem(STORAGE_KEYS.LAST_ANALYSIS);
    localStorage.removeItem(STORAGE_KEYS.EMERGENCY_CONSENT);
    localStorage.removeItem(STORAGE_KEYS.EMERGENCY_SETTINGS);
    
    console.log('All emergency data cleared');
    return { success: true };
  } catch (error) {
    console.error('Error clearing emergency data:', error);
    return { success: false, error: 'Failed to clear emergency data' };
  }
};

// Export all functions as default object for convenience
export default {
  getEmergencyContacts,
  saveEmergencyContacts,
  getMedicalSummary,
  saveMedicalSummary,
  formatMedicalSummaryForSharing,
  sendEmergencyAlert,
  getConsentStatus,
  saveConsentStatus,
  clearEmergencyData
};