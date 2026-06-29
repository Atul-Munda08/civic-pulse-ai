import { Timestamp, GeoPoint as FirebaseGeoPoint } from 'firebase/firestore';

export type IssueCategory = 
  | 'ROAD' | 'WATER' | 'LIGHTING' | 'WASTE' | 'SEWAGE' | 'ENCROACHMENT' | 'OTHER';

export type IssueStatus = 
  | 'REPORTED' | 'AI_CLASSIFIED' | 'COMMUNITY_VERIFIED' | 'ASSIGNED'
  | 'IN_PROGRESS' | 'PENDING_REVIEW' | 'COMMUNITY_CONFIRMED' | 'RESOLVED'
  | 'ESCALATED' | 'OVERDUE' | 'FLAGGED_FOR_AUDIT' | 'CLOSED_REJECTED';

export type SLAStatus = 'ON_TRACK' | 'AT_RISK' | 'BREACHED';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface MediaAttachment {
  url: string;
  thumbnailUrl?: string;
  type: 'IMAGE' | 'VIDEO';
  uploadedAt: string; // ISO timestamp
}

export interface LifecycleEvent {
  timestamp: string;
  fromStatus: IssueStatus;
  toStatus: IssueStatus;
  actor: string; // agent name | user ID | 'system'
  note: string;
}

export interface Issue {
  id: string;
  
  // Reporter
  reporterId: string;
  reportedAt: string;
  
  // Classification
  category: IssueCategory;
  subCategory: string;
  severity: number;           // 1–10
  priorityScore: number;      // 0–100
  aiConfidence: number;       // 0.0–1.0
  aiDescription: string;
  riskToLife: boolean;
  areaEstimateSqm: number;
  flags: string[];
  
  // Location
  geoPoint: GeoPoint;
  address: string;
  wardId: string;
  municipalityId: string;
  
  // Evidence
  media: MediaAttachment[];
  arPolygon: GeoPoint[] | null;
  
  // Status
  status: IssueStatus;
  lifecycleHistory: LifecycleEvent[];
  
  // Community
  verificationCount: number;
  verifierIds: string[];
  communityCredibilityScore: number;
  
  // Government
  assignedDepartmentId: string | null;
  assignedTeamId: string | null;
  workOrderId: string | null;
  slaDeadline: string | null;
  slaStatus: SLAStatus;
  escalationLevel: number;    // 0–4
  
  // Resolution
  resolvedAt: string | null;
  resolutionPhotos: string[];
  resolutionVerified: boolean;
  resolutionRejectionCount: number;
  
  // Meta
  isClusterChild: boolean;
  clusterId: string | null;
  duplicateOf: string | null;
  
  // Gamification
  pointsAwarded: boolean;
}

export type UserRank = 'SEEDLING' | 'NEIGHBOUR' | 'GUARDIAN' | 'CIVIC_HERO' | 'LEGEND';

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  earnedAt: string;
}

export interface User {
  id: string;
  phone?: string;
  email?: string;
  displayName: string;
  avatarUrl?: string;
  preferredLanguage: string;
  
  homeWardId?: string;
  homeGeo?: GeoPoint;
  
  points: number;
  rank: UserRank;
  badges: Badge[];
  streakDays: number;
  lastActivity: string;
  
  reportsCount: number;
  verificationsGiven: number;
  issuesResolvedCount: number;
  
  reputationScore: number;
  fraudFlags: number;
  
  fcmToken?: string;
  isVerifiedReporter: boolean;
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'PROBATION';
  createdAt: string;
}

export type WorkOrderStatus = 
  | 'CREATED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface WorkOrder {
  id: string;
  issueId: string;
  departmentId: string;
  teamId?: string;
  createdAt: string;
  createdBy: string;
  priorityScore: number;
  slaDeadline: string;
  status: WorkOrderStatus;
  assignedWorkers: string[];
  estimatedCost?: number;
  actualCost?: number;
  completionEvidence: string[];
  completionNotes?: string;
  aiVerified: boolean;
  communityVerified: boolean;
}
