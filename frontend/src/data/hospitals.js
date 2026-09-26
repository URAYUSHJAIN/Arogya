// Hospital and clinic data with location coordinates
// Sample data for emergency hospital finder feature

export const hospitals = [
  {
    id: 1,
    name: "City General Hospital",
    type: "Hospital",
    specialty: "Multi-specialty",
    location: { lat: 28.6139, lng: 77.2090 },
    address: "123 Healthcare Avenue, Medical District, Healthcare City 110001",
    phone: "+1-234-567-8901",
    emergency24x7: true,
    distance: null, // Will be calculated dynamically
    rating: 4.5,
    beds: 500,
    ambulanceAvailable: true,
    facilities: ['ICU', 'Emergency', 'Surgery', 'Cardiology', 'Neurology', 'Orthopedics'],
    website: "https://citygeneralhospital.com",
    email: "emergency@citygeneralhospital.com"
  },
  {
    id: 2,
    name: "Heart Care Center",
    type: "Hospital",
    specialty: "Cardiology",
    location: { lat: 28.6189, lng: 77.2150 },
    address: "456 Cardiac Street, Heart District, Healthcare City 110002",
    phone: "+1-234-567-8902",
    emergency24x7: true,
    distance: null,
    rating: 4.8,
    beds: 200,
    ambulanceAvailable: true,
    facilities: ['ICU', 'Emergency', 'Cardiac Surgery', 'Interventional Cardiology'],
    website: "https://heartcarecenter.com",
    email: "info@heartcarecenter.com"
  },
  {
    id: 3,
    name: "Neuro Specialty Clinic",
    type: "Clinic",
    specialty: "Neurology",
    location: { lat: 28.6089, lng: 77.2030 },
    address: "789 Brain Boulevard, Neuro Plaza, Healthcare City 110003",
    phone: "+1-234-567-8903",
    emergency24x7: false,
    distance: null,
    rating: 4.3,
    beds: 50,
    ambulanceAvailable: false,
    facilities: ['Neurology', 'EEG', 'MRI', 'CT Scan'],
    website: "https://neurospecialty.com",
    email: "appointments@neurospecialty.com"
  },
  {
    id: 4,
    name: "Children's Hospital",
    type: "Hospital",
    specialty: "Pediatrics",
    location: { lat: 28.6239, lng: 77.2190 },
    address: "321 Kids Corner, Children District, Healthcare City 110004",
    phone: "+1-234-567-8904",
    emergency24x7: true,
    distance: null,
    rating: 4.7,
    beds: 300,
    ambulanceAvailable: true,
    facilities: ['Pediatric ICU', 'NICU', 'Emergency', 'Pediatric Surgery', 'Vaccination'],
    website: "https://childrenshospital.com",
    email: "emergency@childrenshospital.com"
  },
  {
    id: 5,
    name: "Orthopedic Care Center",
    type: "Clinic",
    specialty: "Orthopedics",
    location: { lat: 28.6039, lng: 77.1990 },
    address: "654 Bone Street, Orthopedic Complex, Healthcare City 110005",
    phone: "+1-234-567-8905",
    emergency24x7: false,
    distance: null,
    rating: 4.2,
    beds: 75,
    ambulanceAvailable: false,
    facilities: ['Orthopedics', 'Physiotherapy', 'X-Ray', 'Minor Surgery'],
    website: "https://orthocare.com",
    email: "info@orthocare.com"
  },
  {
    id: 6,
    name: "Emergency Medical Center",
    type: "Emergency Center",
    specialty: "Emergency Medicine",
    location: { lat: 28.6289, lng: 77.2250 },
    address: "987 Emergency Lane, Urgent Care District, Healthcare City 110006",
    phone: "+1-234-567-8906",
    emergency24x7: true,
    distance: null,
    rating: 4.6,
    beds: 100,
    ambulanceAvailable: true,
    facilities: ['Emergency', 'Trauma Center', 'Intensive Care', 'Ambulatory Surgery'],
    website: "https://emergencymedcenter.com",
    email: "trauma@emergencymedcenter.com"
  },
  {
    id: 7,
    name: "Women's Health Hospital",
    type: "Hospital",
    specialty: "Obstetrics & Gynecology",
    location: { lat: 28.5989, lng: 77.1930 },
    address: "147 Women's Way, Maternity District, Healthcare City 110007",
    phone: "+1-234-567-8907",
    emergency24x7: true,
    distance: null,
    rating: 4.4,
    beds: 250,
    ambulanceAvailable: true,
    facilities: ['Maternity', 'NICU', 'Gynecology', 'Emergency', 'Labor & Delivery'],
    website: "https://womenshealthhospital.com",
    email: "maternity@womenshealthhospital.com"
  },
  {
    id: 8,
    name: "Dental Care Clinic",
    type: "Clinic",
    specialty: "Dentistry",
    location: { lat: 28.6339, lng: 77.2310 },
    address: "258 Smile Street, Dental Plaza, Healthcare City 110008",
    phone: "+1-234-567-8908",
    emergency24x7: false,
    distance: null,
    rating: 4.1,
    beds: 20,
    ambulanceAvailable: false,
    facilities: ['General Dentistry', 'Oral Surgery', 'Orthodontics', 'Emergency Dental'],
    website: "https://dentalcare.com",
    email: "appointments@dentalcare.com"
  },
  {
    id: 9,
    name: "Eye Care Hospital",
    type: "Hospital",
    specialty: "Ophthalmology",
    location: { lat: 28.5939, lng: 77.1870 },
    address: "369 Vision Avenue, Eye Care District, Healthcare City 110009",
    phone: "+1-234-567-8909",
    emergency24x7: false,
    distance: null,
    rating: 4.5,
    beds: 80,
    ambulanceAvailable: false,
    facilities: ['Ophthalmology', 'Laser Surgery', 'Retina Care', 'Emergency Eye Care'],
    website: "https://eyecarehospital.com",
    email: "info@eyecarehospital.com"
  },
  {
    id: 10,
    name: "Urgent Care Clinic",
    type: "Urgent Care",
    specialty: "General Medicine",
    location: { lat: 28.6389, lng: 77.2370 },
    address: "741 Quick Care Road, Urgent District, Healthcare City 110010",
    phone: "+1-234-567-8910",
    emergency24x7: true,
    distance: null,
    rating: 4.0,
    beds: 30,
    ambulanceAvailable: true,
    facilities: ['Urgent Care', 'Minor Emergency', 'X-Ray', 'Laboratory'],
    website: "https://urgentcare.com",
    email: "walk-in@urgentcare.com"
  },
  {
    id: 11,
    name: "Metro General Hospital",
    type: "Hospital",
    specialty: "Multi-specialty",
    location: { lat: 28.6439, lng: 77.2430 },
    address: "852 Metro Boulevard, Central District, Healthcare City 110011",
    phone: "+1-234-567-8911",
    emergency24x7: true,
    distance: null,
    rating: 4.6,
    beds: 600,
    ambulanceAvailable: true,
    facilities: ['ICU', 'Emergency', 'Surgery', 'Oncology', 'Radiology', 'Laboratory'],
    website: "https://metrogeneralhospital.com",
    email: "emergency@metrogeneralhospital.com"
  },
  {
    id: 12,
    name: "Skin & Dermatology Center",
    type: "Clinic",
    specialty: "Dermatology",
    location: { lat: 28.5889, lng: 77.1810 },
    address: "963 Skin Street, Beauty District, Healthcare City 110012",
    phone: "+1-234-567-8912",
    emergency24x7: false,
    distance: null,
    rating: 4.3,
    beds: 25,
    ambulanceAvailable: false,
    facilities: ['Dermatology', 'Cosmetic Surgery', 'Laser Treatment', 'Allergy Testing'],
    website: "https://skindermatology.com",
    email: "appointments@skindermatology.com"
  },
  {
    id: 13,
    name: "Mental Health Institute",
    type: "Hospital",
    specialty: "Psychiatry",
    location: { lat: 28.6489, lng: 77.2490 },
    address: "159 Peace Avenue, Mental Health District, Healthcare City 110013",
    phone: "+1-234-567-8913",
    emergency24x7: true,
    distance: null,
    rating: 4.4,
    beds: 150,
    ambulanceAvailable: true,
    facilities: ['Psychiatry', 'Psychology', 'Crisis Intervention', 'Rehabilitation'],
    website: "https://mentalhealthinstitute.com",
    email: "crisis@mentalhealthinstitute.com"
  },
  {
    id: 14,
    name: "Rehabilitation Center",
    type: "Clinic",
    specialty: "Physical Therapy",
    location: { lat: 28.5839, lng: 77.1750 },
    address: "357 Recovery Road, Rehab District, Healthcare City 110014",
    phone: "+1-234-567-8914",
    emergency24x7: false,
    distance: null,
    rating: 4.2,
    beds: 40,
    ambulanceAvailable: false,
    facilities: ['Physical Therapy', 'Occupational Therapy', 'Sports Medicine', 'Pain Management'],
    website: "https://rehabilitationcenter.com",
    email: "therapy@rehabilitationcenter.com"
  },
  {
    id: 15,
    name: "Cancer Treatment Center",
    type: "Hospital",
    specialty: "Oncology",
    location: { lat: 28.6539, lng: 77.2550 },
    address: "789 Hope Street, Cancer Care District, Healthcare City 110015",
    phone: "+1-234-567-8915",
    emergency24x7: true,
    distance: null,
    rating: 4.8,
    beds: 200,
    ambulanceAvailable: true,
    facilities: ['Oncology', 'Radiation Therapy', 'Chemotherapy', 'Palliative Care', 'Surgery'],
    website: "https://cancertreatmentcenter.com",
    email: "oncology@cancertreatmentcenter.com"
  }
];

// Export default for easy import
export default hospitals;

// Helper function to filter hospitals by type
export const getHospitalsByType = (type) => {
  return hospitals.filter(hospital => hospital.type === type);
};

// Helper function to get emergency hospitals only
export const getEmergencyHospitals = () => {
  return hospitals.filter(hospital => hospital.emergency24x7 === true);
};

// Helper function to get hospitals by specialty
export const getHospitalsBySpecialty = (specialty) => {
  return hospitals.filter(hospital => 
    hospital.specialty.toLowerCase().includes(specialty.toLowerCase())
  );
};

// Helper function to get hospitals with ambulance service
export const getHospitalsWithAmbulance = () => {
  return hospitals.filter(hospital => hospital.ambulanceAvailable === true);
};