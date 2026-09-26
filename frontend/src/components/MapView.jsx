import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getDirectionsUrl } from '../services/locationService';

// Fix for default markers in production build
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Component to handle map recentering using useMap hook
const CenterOnSelect = ({ selectedHospital }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedHospital && selectedHospital.location) {
      map.setView([selectedHospital.location.lat, selectedHospital.location.lng], 15);
    }
  }, [map, selectedHospital]);

  return null;
};

const MapView = ({
  userLocation,
  hospitals = [],
  onHospitalSelect,
  selectedHospital = null,
  height = '500px',
  className = ''
}) => {
  const mapRef = useRef(null);

  // Create custom icons for different hospital types
  const createCustomIcon = (type, isSelected = false) => {
    const colors = {
      'Hospital': isSelected ? '#dc2626' : '#ef4444', // red for hospitals
      'Emergency Center': isSelected ? '#dc2626' : '#ef4444', // red for emergency centers
      'Clinic': isSelected ? '#2563eb' : '#3b82f6', // blue for clinics
      'Urgent Care': isSelected ? '#ea580c' : '#f97316' // orange for urgent care
    };

    const color = colors[type] || '#6b7280';
    const size = isSelected ? 35 : 25;

    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          ${isSelected ? 'transform: scale(1.2);' : ''}
          transition: all 0.3s ease;
        ">
          <svg width="16" height="16" fill="white" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
        </div>
      `,
      className: '',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });
  };

  // Create user location icon with pulse animation
  const userLocationIcon = L.divIcon({
    html: `
      <div style="
        background-color: #3b82f6;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        animation: pulse 2s infinite;
      "></div>
      <style>
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
      </style>
    `,
    className: 'location-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });

  // Memoize hospital markers to prevent unnecessary re-renders
  const hospitalMarkers = useMemo(() => {
    if (!hospitals || hospitals.length === 0) return [];

    return hospitals.slice(0, 15).map(hospital => {
      if (!hospital.location || !hospital.location.lat || !hospital.location.lng) {
        return null;
      }

      const isSelected = selectedHospital && selectedHospital.id === hospital.id;
      const icon = createCustomIcon(hospital.type, isSelected);

      return (
        <Marker
          key={hospital.id}
          position={[hospital.location.lat, hospital.location.lng]}
          icon={icon}
          eventHandlers={{
            click: () => {
              if (onHospitalSelect) {
                onHospitalSelect(hospital);
              }
            }
          }}
        >
          <Popup>
            <div className="p-2 min-w-64">
              <h3 className="font-bold text-lg text-gray-900 mb-2">{hospital.name}</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{hospital.type}</span>
                  {hospital.emergency24x7 && (
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">
                      24/7 Emergency
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700">{hospital.specialty}</p>
                {hospital.distance && (
                  <p className="text-sm font-semibold text-[#3D6B4F]">
                    {hospital.distanceText || `${hospital.distance} km away`}
                  </p>
                )}
                <p className="text-xs text-gray-600">{hospital.address}</p>
                <div className="flex gap-2 mt-3">
                  <a
                    href={`tel:${hospital.phone}`}
                    className="rounded bg-[#3D6B4F] px-3 py-1 text-xs text-white transition-colors duration-200 hover:bg-[#2A4A35]"
                  >
                    Call Hospital
                  </a>
                  <button
                    onClick={() => {
                      const directionsUrl = getDirectionsUrl(hospital.location, userLocation);
                      if (directionsUrl) {
                        window.open(directionsUrl, '_blank');
                      }
                    }}
                    className="rounded border border-[#3D6B4F] px-3 py-1 text-xs text-[#3D6B4F] transition-colors duration-200 hover:bg-[#E8F2E9]"
                  >
                    Get Directions
                  </button>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      );
    }).filter(Boolean);
  }, [hospitals, selectedHospital, onHospitalSelect, userLocation]);



  // Determine initial center and zoom
  const mapCenter = useMemo(() => {
    if (!userLocation) return [28.6139, 77.2090]; // Default center
    return [userLocation.lat, userLocation.lng];
  }, [userLocation]);

  const mapZoom = useMemo(() => {
    // Adjust zoom based on screen size
    const isMobile = window.innerWidth < 768;
    return isMobile ? 12 : 13;
  }, []);

  if (!userLocation && hospitals.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center rounded-xl border border-[#C8DFC9] bg-[#F5F3EE] ${className}`}
        style={{ height }}
      >
        <div className="text-center p-8">
          <svg className="mx-auto mb-4 h-16 w-16 text-[#6B8F71]" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-[#6B8F71]">Map will appear here when location is available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-xl border border-[#C8DFC9] shadow-sm ${className}`} style={{ height }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="h-full w-full"
        whenCreated={(map) => { mapRef.current = map; }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Component to handle recentering on selected hospital */}
        <CenterOnSelect selectedHospital={selectedHospital} />
        
        {/* User location marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userLocationIcon}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-gray-900">Your Location</h3>
                <p className="text-sm text-gray-600">You are here</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Hospital markers */}
        {hospitalMarkers}
      </MapContainer>
    </div>
  );
};

export default MapView;