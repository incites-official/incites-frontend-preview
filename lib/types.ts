export type Role = "ADMIN" | "OPERATOR" | "VIEWER" | "STUDENT" | "PARENT";

export interface UserProfile {
  id: string;
  loginId: string;
  name: string;
  email: string;
  company: string | null;
  department: string | null;
  position: string | null;
  role: Role;
  roleLabel: string;
  hasProfileImage?: boolean;
  profileImageUpdatedAt?: string | null;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: "Bearer";
  accessTokenExpiresAt: string;
  user: UserProfile;
}

export interface ApiErrorBody {
  success?: boolean;
  code?: string;
  message?: string;
  timestamp?: string;
  path?: string;
}

export interface DashboardSummary {
  systemStatus: "NORMAL" | string;
  serverTime: string;
  totalUsers: number;
  activeUsers: number;
  lockedAccounts: number;
  requestsLast24Hours: number;
  failedRequestsLast24Hours: number;
}

export interface UserListItem extends UserProfile {
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PageResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface RoleOption {
  value: Role;
  label: string;
}

export interface ApiRequestLogItem {
  id: number;
  requestId: string;
  requestedAt: string;
  userId: string | null;
  loginId: string | null;
  userName: string | null;
  role: Role | null;
  httpMethod: string;
  requestPath: string;
  responseStatus: number;
  clientIp: string | null;
  userAgent: string | null;
  durationMs: number;
}
