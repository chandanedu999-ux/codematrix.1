export type ShelterStatus = 'AVAILABLE' | 'LIMITED' | 'CRITICAL' | 'OVERCAPACITY' | 'INACTIVE';

export type UserRole = 'PUBLIC' | 'VOLUNTEER' | 'SHELTER_COORDINATOR' | 'ADMIN' | 'SUPER_ADMIN';

export type Language = 'en' | 'hi' | 'gu';

export interface ShelterFacilities {
  drinkingWater: boolean;
  foodRation: boolean;
  toilets: boolean;
  electricity: boolean;
  medicalAid: boolean;
  chargingStation: boolean;
  wifi: boolean;
  petFriendly: boolean;
  wheelchairAccessible: boolean;
  infantCare: boolean;
  elderlySupport: boolean;
  womenChildrenArea: boolean;
}

export interface ShelterResources {
  bedsAvailable: number;
  bedsRequired: number;
  waterLiters: number;
  waterRequired: number;
  rationKits: number;
  rationRequired: number;
  medicalTeams: number;
  medicalTeamsRequired: number;
}

export interface Shelter {
  id: string;
  name: string;
  code: string;
  address: string;
  district: string;
  lat: number;
  lng: number;
  capacity: number;
  currentOccupancy: number;
  status: ShelterStatus;
  facilities: ShelterFacilities;
  resources: ShelterResources;
  contactPhone: string;
  coordinatorName: string;
  coordinatorPhone: string;
  managerHomeAddress: string;
  managerAadhaarVerified: boolean;
  managerAadhaarMasked: string;
  policePermissionVerified: boolean;
  policeStation: string;
  policeNocNumber: string;
  policePermissionDocName?: string;
  lastUpdated: string;
  acceptingNewArrivals: boolean;
  notes?: string;
  verifiedByAuthority?: boolean;
  isDemoMode?: boolean;
}

export interface NewShelterSubmission {
  name: string;
  address: string;
  district: string;
  lat: number;
  lng: number;
  capacity: number;
  contactPhone: string;
  managerName: string;
  managerPhone: string;
  managerHomeAddress: string;
  aadhaarNumber?: string;
  policeStation?: string;
  policeNocNumber?: string;
  policeDocName?: string;
  isDemoMode?: boolean;
  facilities: Partial<ShelterFacilities>;
  resources: Partial<ShelterResources>;
}

export interface ResidentMember {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  specialNeeds: string[];
  relationship?: string;
}

export interface FamilyRegistration {
  id: string;
  rsqId: string;
  familyName: string;
  phone: string;
  origin: string;
  shelterId: string;
  shelterName: string;
  members: ResidentMember[];
  totalMembers: number;
  specialNeedsSummary: string[];
  timestamp: string;
  status: 'Active' | 'Transferred' | 'CheckedOut';
  offlinePending?: boolean;
}

export interface ResourceTransaction {
  id: string;
  timestamp: string;
  type: 'beds' | 'ration' | 'water' | 'medical';
  quantity: number;
  action: 'DELIVERY' | 'CONSUMPTION' | 'TRANSFER' | 'SHORTAGE_REPORT';
  donorOrRecipient: string;
  recordedBy: string;
  shelterId: string;
  shelterName: string;
  notes?: string;
}

export interface AlertItem {
  id: string;
  timestamp: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  shelterId?: string;
  shelterName?: string;
  category: 'capacity' | 'water' | 'ration' | 'medical' | 'weather' | 'general';
  resolved: boolean;
  actionLabel?: string;
  actionUrl?: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: 'REGISTRATION' | 'RESOURCE_DELIVERY' | 'RESOURCE_SHORTAGE' | 'TRANSFER' | 'STATUS_CHANGE' | 'ALERT';
  message: string;
  shelterId?: string;
  shelterName?: string;
  badge?: string;
}

export interface UserReport {
  id: string;
  timestamp: string;
  shelterId: string;
  shelterName: string;
  reason: 'FULL' | 'CLOSED' | 'INCORRECT_LOCATION' | 'RESOURCE_UNAVAILABLE' | 'OTHER';
  details: string;
  reportedBy?: string;
  status: 'PENDING' | 'VERIFIED' | 'DISMISSED';
}
