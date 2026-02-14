
export type Role = 'student' | 'admin' | 'staff';

export interface User {
  id: string;
  name: string;
  email: string;
  universityId?: string;
  role: Role;
  avatar?: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface AdministrativeProcess {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  office?: string;
  documents?: string[];
  steps?: string[];
  estimatedTime?: string;
  notes?: string;
  isChunk?: boolean;
  createdAt?: string | Date;
}

export interface DashboardStats {
  totalInquiries: number;
  activeSessions: number;
  aiResolutionRate: number;
  avgWaitTime: string;
  totalDocuments: number;
  totalUsers: number;
  activeUsers: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
