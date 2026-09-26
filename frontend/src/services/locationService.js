// Location service for emergency feature
// Following the pattern established in geminiService.js

// Constants
const EARTH_RADIUS_KM = 6371;
const DEFAULT_EMERGENCY_NUMBER = '112';
const LOCATION_TIMEOUT = 10000; // 10 seconds
const HIGH_ACCURACY = true;

// Helper function to convert degrees to radians
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Helper function to detect platform
const detectPlatform = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'iOS';
  }
  
  if (/android/i.test(userAgent)) {
    return 'Android';
  }
  
  return 'Desktop';
};

// Helper function to format distance with units
const formatDistance = (km) => {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
};

// Get user's current location
export const getLocation = () => {
  return new Promise((resolve) => {
    try {
      if (!('geolocation' in navigator)) {
        resolve({ 
          success: false, 
          error: 'Geolocation is not supported by this browser' 
        });
        return;
      }

      console.log('Requesting user location...');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Location obtained successfully');
          resolve({
            success: true,
            data: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy
            }
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          let errorMessage = 'Failed to get your location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location services in your browser.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable. Please check your device settings.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage = 'An unknown error occurred while retrieving location.';
              break;
          }

          resolve({
            success: false,
            error: errorMessage
          });
        },
        {
          enableHighAccuracy: HIGH_ACCURACY,
          timeout: LOCATION_TIMEOUT,
          maximumAge: 0
        }
      );
    } catch (error) {
      console.error('Error in getLocation:', error);
      resolve({
        success: false,
        error: 'Failed to access location services'
      });
    }
  });
};

// Calculate distance between two points using Haversine formula
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  try {
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = EARTH_RADIUS_KM * c;
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  } catch (error) {
    console.error('Error calculating distance:', error);
    return 0;
  }
};

// Sort hospitals by distance from user location
export const sortHospitalsByDistance = (userLocation, hospitals) => {
  try {
    if (!userLocation || !hospitals || !Array.isArray(hospitals)) {
      return [];
    }

    const hospitalsWithDistance = hospitals.map(hospital => {
      if (!hospital.location || !hospital.location.lat || !hospital.location.lng) {
        return { ...hospital, distance: 999 }; // Put invalid locations at the end
      }

      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        hospital.location.lat,
        hospital.location.lng
      );

      return {
        ...hospital,
        distance: distance,
        distanceText: formatDistance(distance)
      };
    });

    // Sort by distance (ascending)
    return hospitalsWithDistance.sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error('Error sorting hospitals by distance:', error);
    return hospitals || [];
  }
};

// Generate platform-specific directions URL
export const getDirectionsUrl = (destination, userLocation = null) => {
  try {
    if (!destination || !destination.lat || !destination.lng) {
      return null;
    }

    const platform = detectPlatform();
    const { lat, lng, name = 'Hospital' } = destination;

    switch (platform) {
      case 'iOS':
        if (userLocation) {
          return `maps://maps.apple.com/?saddr=${userLocation.lat},${userLocation.lng}&daddr=${lat},${lng}`;
        }
        return `maps://maps.apple.com/?daddr=${lat},${lng}`;

      case 'Android':
        if (userLocation) {
          return `geo:${userLocation.lat},${userLocation.lng}?q=${lat},${lng}(${encodeURIComponent(name)})`;
        }
        return `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(name)})`;

      default: // Desktop
        if (userLocation) {
          return `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${lat},${lng}`;
        }
        return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    }
  } catch (error) {
    console.error('Error generating directions URL:', error);
    return `https://www.google.com/maps/search/${destination.lat},${destination.lng}`;
  }
};

// Detect local emergency number based on browser locale
export const detectEmergencyNumber = () => {
  try {
    const locale = navigator.language || navigator.languages?.[0] || 'en-US';
    const country = locale.split('-')[1]?.toUpperCase();

    // Emergency number mappings
    const emergencyNumbers = {
      'US': { number: '911', country: 'United States', displayText: '911 (US Emergency)' },
      'CA': { number: '911', country: 'Canada', displayText: '911 (Canada Emergency)' },
      'GB': { number: '999', country: 'United Kingdom', displayText: '999 (UK Emergency)' },
      'AU': { number: '000', country: 'Australia', displayText: '000 (Australia Emergency)' },
      'NZ': { number: '111', country: 'New Zealand', displayText: '111 (New Zealand Emergency)' },
      'IN': { number: '112', country: 'India', displayText: '112 (India Emergency)' },
      'DE': { number: '112', country: 'Germany', displayText: '112 (EU Emergency)' },
      'FR': { number: '112', country: 'France', displayText: '112 (EU Emergency)' },
      'IT': { number: '112', country: 'Italy', displayText: '112 (EU Emergency)' },
      'ES': { number: '112', country: 'Spain', displayText: '112 (EU Emergency)' },
    };

    if (country && emergencyNumbers[country]) {
      return emergencyNumbers[country];
    }

    // Default to international standard
    return {
      number: DEFAULT_EMERGENCY_NUMBER,
      country: 'International',
      displayText: '112 (International Emergency)'
    };
  } catch (error) {
    console.error('Error detecting emergency number:', error);
    return {
      number: DEFAULT_EMERGENCY_NUMBER,
      country: 'International',
      displayText: '112 (International Emergency)'
    };
  }
};

// Check location permission status
export const requestLocationPermission = async () => {
  try {
    if (!('geolocation' in navigator)) {
      return 'unsupported';
    }

    // Check if Permissions API is available
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        return permission.state; // 'granted', 'denied', or 'prompt'
      } catch (error) {
        console.warn('Permissions API query failed:', error);
      }
    }

    // Fallback: Try to get location to test permission
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve('granted'),
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            resolve('denied');
          } else {
            resolve('prompt');
          }
        },
        { timeout: 1000 }
      );
    });
  } catch (error) {
    console.error('Error checking location permission:', error);
    return 'unknown';
  }
};

// Export all functions as default object for convenience
export default {
  getLocation,
  calculateDistance,
  sortHospitalsByDistance,
  getDirectionsUrl,
  detectEmergencyNumber,
  requestLocationPermission,
  formatDistance
};