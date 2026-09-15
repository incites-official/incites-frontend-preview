import { ApiError, apiDownload, apiFetch } from "@/lib/api";
import type { ApiRequestLogItem, PageResponse, UserListItem, UserProfile } from "@/lib/types";

export type PhotoConsentStatus = "PENDING" | "CONSENTED" | "DENIED";
export type ParentConnectionStatus = "UNCONNECTED" | "PENDING" | "APPROVED" | "REJECTED";
export type GuardianConnectionStatus = "PENDING" | "APPROVED" | "REJECTED" | "DISCONNECTED";
export type ObservationLevel = "L1" | "L2" | "L3" | "L4";

export interface SignupRequest {
  password: string;
  name: string;
  email: string;
  role: "PARENT" | "STUDENT";
  studentCode?: string;
}

export interface SignupResponse {
  id: string;
  loginId: string;
  name: string;
  role: "PARENT" | "STUDENT";
  studentCode: string | null;
  guardianConnectionRequested: boolean;
  studentAccountLinked: boolean;
}

export interface PasswordResetRequestResult {
  challengeId: string;
  expiresInSeconds: number;
  developmentCode: string | null;
}

export interface PasswordResetVerifyResult {
  resetToken: string;
  expiresInSeconds: number;
}

export interface StudentListItem {
  id: string;
  studentCode: string;
  name: string;
  birthDate: string;
  age: number | null;
  teacherId: string | null;
  teacherName: string | null;
  photoConsentStatus: PhotoConsentStatus;
  parentConnectionStatus: ParentConnectionStatus;
  observationCount: number;
  lastObservedAt: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentDetail {
  id: string;
  studentCode: string;
  name: string;
  birthDate: string;
  age: number | null;
  teacherId: string | null;
  teacherName: string | null;
  photoConsentStatus: PhotoConsentStatus;
  parentConnectionStatus: ParentConnectionStatus;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentWriteRequest {
  studentCode?: string;
  name: string;
  birthDate: string;
  teacherId: string;
  active?: boolean;
  age?: number | null;
}

export interface StudentImportRow {
  rowNumber: number;
  name: string;
  studentCode: string;
  age: string;
  birthDate: string;
  errors: string[];
}

export interface StudentImportPreview {
  requestedCount: number;
  validCount: number;
  rows: StudentImportRow[];
}

export interface StudentImportResult extends StudentImportRow {
  success: boolean;
  studentId: string | null;
}

export interface StudentBulkCreateResult {
  requestedCount: number;
  createdCount: number;
  failedCount: number;
  results: StudentImportResult[];
}

export interface TeacherAssignedStudent {
  id: string;
  studentCode: string;
  name: string;
  age: number | null;
  photoConsentStatus: PhotoConsentStatus;
  parentConnectionStatus: ParentConnectionStatus;
  observationCount: number;
  lastObservedAt: string | null;
  active: boolean;
}

export interface TeacherStudentAssignmentResult {
  teacherId: string;
  teacherName: string;
  requestedCount: number;
  changedCount: number;
  unchangedCount: number;
}

export interface GuardianConnectionListItem {
  id: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  age: number | null;
  parentId: string;
  parentLoginId: string;
  parentName: string;
  status: GuardianConnectionStatus;
  requestedAt: string;
  decidedAt: string | null;
}

export interface GuardianConnectionDetail extends GuardianConnectionListItem {
  decidedById: string | null;
  decidedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParentChild {
  id: string;
  studentCode: string;
  name: string;
  age: number | null;
  teacherId: string | null;
  teacherName: string | null;
  photoConsentStatus: PhotoConsentStatus;
}

export interface StudentPhotoConsent {
  studentId: string;
  studentCode: string;
  studentName: string;
  status: PhotoConsentStatus;
  changedAt: string;
  changedById: string | null;
  changedByName: string | null;
}

export interface StudentPhotoConsentHistoryItem {
  id: string;
  status: PhotoConsentStatus;
  changedAt: string;
  changedById: string;
  changedByName: string;
}

export interface LessonDetail {
  id: string;
  lessonAt: string;
  sessionRound: string;
  topic: string;
  teacherId: string;
  teacherName: string;
  participantStudentIds: string[];
  participantCount: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ObservationCompetency {
  competencyCode: string;
  level: ObservationLevel;
}

export interface ObservationListItem {
  id: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  lessonId: string;
  lessonAt: string;
  sessionRound: string;
  topic: string;
  authorId: string;
  authorName: string;
  competencyCount: number;
  tagCount: number;
  comment: string;
  createdAt: string;
}

export interface ObservationDetail {
  id: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  lessonId: string;
  lessonAt: string;
  sessionRound: string;
  topic: string;
  teacherId: string;
  teacherName: string;
  authorId: string;
  authorName: string;
  competencies: ObservationCompetency[];
  tags: string[];
  comment: string;
  createdAt: string;
}

export interface ObservationWriteRequest {
  studentId: string;
  lessonId: string;
  competencies: ObservationCompetency[];
  tags: string[];
  comment: string;
}

export interface ObservationDraftListItem {
  id: string;
  currentStep: number;
  studentId: string | null;
  studentCode: string | null;
  studentName: string | null;
  studentAge: number | null;
  lessonAt: string | null;
  sessionRound: string | null;
  topic: string | null;
  competencyCount: number;
  updatedAt: string;
  expiresAt: string;
}

export interface ObservationDraftCompetency {
  competencyCode: string;
  level: ObservationLevel | null;
}

export interface ObservationDraftWriteRequest {
  currentStep: number;
  studentId: string | null;
  lessonAt: string | null;
  sessionRound: string | null;
  topic: string | null;
  competencies: ObservationDraftCompetency[];
  tags: string[];
  comment: string;
  photoIds: string[];
}

export interface ObservationDraftDetail extends ObservationDraftWriteRequest {
  id: string;
  authorId: string;
  authorName: string;
  studentCode: string | null;
  studentName: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompetencyCatalogItem {
  code: string;
  name: string;
  englishName: string;
  description: string;
}

export interface CompetencyLevelItem {
  level: ObservationLevel;
  label: string;
  score: number;
}

export interface CompetencyCatalog {
  competencies: CompetencyCatalogItem[];
  levels: CompetencyLevelItem[];
  suggestedTags: string[];
}

export interface StudentGrowthCompetency {
  code: string;
  name: string;
  assessmentCount: number;
  averageScore: number;
  currentLevel: ObservationLevel | null;
  previousAverageScore: number | null;
  change: number | null;
}

export interface StudentGrowthObservation {
  observationId: string;
  lessonAt: string;
  topic: string;
  comment: string;
  tags: string[];
}

export interface StudentGrowth {
  studentId: string;
  studentCode: string;
  studentName: string;
  from: string;
  to: string;
  observationCount: number;
  lastObservedAt: string | null;
  competencies: StudentGrowthCompetency[];
  recentObservations: StudentGrowthObservation[];
}

export interface ObservationCommentSuggestions {
  provider: "RULE_BASED";
  suggestions: string[];
}

export interface ObservationPhoto {
  id: string;
  observationId: string;
  originalFilename: string;
  contentType: string;
  size: number;
  createdAt: string;
}

export type ReportStatus = "DRAFT" | "REVIEWED" | "PUBLISHED";

export interface GrowthReportListItem {
  id: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  periodStart: string;
  periodEnd: string;
  status: ReportStatus;
  title: string;
  observationCount: number;
  authorName: string;
  authorRole: "ADMIN" | "OPERATOR";
  guardianCount: number;
  readGuardianCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GrowthReportCompetency {
  code: string;
  name: string;
  assessmentCount: number;
  averageScore: number;
  currentLevel: ObservationLevel | null;
  change: number | null;
}

export interface GrowthReportDetail {
  id: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  studentAge: number | null;
  teacherId: string | null;
  teacherName: string | null;
  teacherPosition: string | null;
  periodStart: string;
  periodEnd: string;
  status: ReportStatus;
  title: string;
  summary: string;
  strengths: string;
  nextSteps: string;
  observationCount: number;
  competencies: GrowthReportCompetency[];
  authorId: string;
  authorName: string;
  reviewedByName: string | null;
  reviewedAt: string | null;
  publishedByName: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardCompetency {
  code: string;
  name: string;
  assessmentCount: number;
  averageScore: number;
  currentLevel: ObservationLevel | null;
  change: number | null;
}

export interface UserGrowthDashboard {
  audience: "STUDENT" | "PARENT";
  studentId: string;
  studentCode: string;
  studentName: string;
  from: string;
  to: string;
  observationCount: number;
  lastObservedAt: string | null;
  competencies: DashboardCompetency[];
  recentObservations: StudentGrowthObservation[];
  latestReport: null | { id: string; title: string; periodStart: string; periodEnd: string; publishedAt: string };
}

export interface AdminDashboard {
  from: string;
  to: string;
  activeStudents: number;
  activeTeachers: number;
  observationCount: number;
  pendingGuardianConnections: number;
  draftReports: number;
  publishedReports: number;
  unreadReports: number;
  observationTrend: DashboardTrendPoint[];
  competencies: DashboardCompetency[];
  recentActivities: Array<{ requestedAt: string; userName: string | null; method: string; path: string; status: number }>;
}

export interface DashboardTrendPoint {
  from: string;
  to: string;
  count: number;
}

export interface DashboardLesson {
  id: string;
  lessonAt: string;
  sessionRound: string;
  topic: string;
  participantCount: number;
}

export interface OperatorDashboard {
  teacherId: string;
  teacherName: string;
  from: string;
  to: string;
  assignedStudentCount: number;
  observationCount: number;
  draftCount: number;
  reportReviewCount: number;
  latestLesson: DashboardLesson | null;
  students: Array<{ id: string; studentCode: string; name: string; age: number | null; photoConsentStatus: PhotoConsentStatus; observationCount: number; lastObservedAt: string | null }>;
}

export interface NotificationSetting {
  observationEnabled: boolean;
  growthEnabled: boolean;
  serviceEnabled: boolean;
  updatedAt: string;
}

export interface UserNotification {
  id: string;
  category: "OBSERVATION" | "GROWTH_REPORT" | "GUARDIAN_CONNECTION" | "SERVICE";
  title: string;
  targetPath: string;
  reportId: string | null;
  studentId: string | null;
  studentName: string | null;
  message: string;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationReadAllResult {
  readCount: number;
  readAt: string | null;
}

export interface ReportAiSetting {
  tone: string;
  promptTemplate: string;
  updatedByName: string | null;
  updatedAt: string;
}

export interface UnreadReport {
  reportId: string;
  studentId: string;
  studentName: string;
  parentId: string;
  parentName: string;
  publishedAt: string;
}

type QueryValue = string | number | boolean | null | undefined;

function withQuery(path: string, values: Record<string, QueryValue>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function apiErrorMessage(reason: unknown, fallback: string) {
  return reason instanceof ApiError ? reason.message : fallback;
}

export function registerAccount(request: SignupRequest) {
  return apiFetch<SignupResponse>(
    "/api/auth/register",
    { method: "POST", body: JSON.stringify(request) },
    { retryAuthentication: false, redirectUnauthorized: false, redirectForbidden: false },
  );
}

const publicAuthOptions = {
  retryAuthentication: false,
  redirectUnauthorized: false,
  redirectForbidden: false,
} as const;

export function findEmail(request: { name: string; studentCode: string }) {
  return apiFetch<{ email: string }>(
    "/api/auth/find-email",
    { method: "POST", body: JSON.stringify(request) },
    publicAuthOptions,
  );
}

export function requestPasswordReset(request: { name: string; email: string }) {
  return apiFetch<PasswordResetRequestResult>(
    "/api/auth/password-reset/request",
    { method: "POST", body: JSON.stringify(request) },
    publicAuthOptions,
  );
}

export function verifyPasswordReset(request: { challengeId: string; code: string }) {
  return apiFetch<PasswordResetVerifyResult>(
    "/api/auth/password-reset/verify",
    { method: "POST", body: JSON.stringify(request) },
    publicAuthOptions,
  );
}

export function completePasswordReset(request: { resetToken: string; newPassword: string }) {
  return apiFetch<void>(
    "/api/auth/password-reset/complete",
    { method: "POST", body: JSON.stringify(request) },
    publicAuthOptions,
  );
}

export function getStudents(values: {
  query?: string;
  teacherId?: string;
  photoConsentStatus?: PhotoConsentStatus;
  parentConnectionStatus?: ParentConnectionStatus;
  active?: boolean;
  page?: number;
  size?: number;
} = {}) {
  return apiFetch<PageResponse<StudentListItem>>(withQuery("/api/students", { active: true, page: 0, size: 100, ...values }));
}

export function getStudent(id: string) {
  return apiFetch<StudentDetail>(`/api/students/${encodeURIComponent(id)}`);
}

export function createStudent(request: StudentWriteRequest) {
  return apiFetch<StudentDetail>("/api/students", { method: "POST", body: JSON.stringify(request) });
}

export function importStudentWorkbook(file: File) {
  const body = new FormData();
  body.append("file", file);
  return apiFetch<StudentBulkCreateResult>("/api/students/bulk", { method: "POST", body });
}

export function previewStudentWorkbook(file: File) {
  const body = new FormData();
  body.append("file", file);
  return apiFetch<StudentImportPreview>("/api/students/bulk/preview", { method: "POST", body });
}

export function downloadStudentTemplate() {
  return apiDownload("/api/students/bulk/template");
}

export function updateStudent(id: string, request: StudentWriteRequest) {
  return apiFetch<StudentDetail>(`/api/students/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(request) });
}

export function deactivateStudent(id: string) {
  return apiFetch<void>(`/api/students/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function getActiveTeachers() {
  return apiFetch<PageResponse<UserListItem>>("/api/users?roles=OPERATOR&page=0&size=100").then((page) =>
    page.items.filter((user) => user.role === "OPERATOR" && user.active),
  );
}

export function getUser(id: string) {
  return apiFetch<UserListItem>(`/api/users/${encodeURIComponent(id)}`);
}

export function getAssignedStudents(teacherId: string, values: { query?: string; page?: number; size?: number } = {}) {
  return apiFetch<PageResponse<TeacherAssignedStudent>>(withQuery(`/api/teachers/${encodeURIComponent(teacherId)}/students`, {
    active: true,
    page: 0,
    size: 100,
    ...values,
  }));
}

export function assignStudents(teacherId: string, studentIds: string[]) {
  return apiFetch<TeacherStudentAssignmentResult>(`/api/teachers/${encodeURIComponent(teacherId)}/student-assignments`, {
    method: "PUT",
    body: JSON.stringify({ studentIds }),
  });
}

export function getGuardianConnections(values: { query?: string; status?: GuardianConnectionStatus; page?: number; size?: number } = {}) {
  return apiFetch<PageResponse<GuardianConnectionListItem>>(withQuery("/api/guardian-connections", {
    status: "PENDING",
    page: 0,
    size: 100,
    ...values,
  }));
}

export function approveGuardianConnection(id: string) {
  return apiFetch<GuardianConnectionDetail>(`/api/guardian-connections/${encodeURIComponent(id)}/approve`, { method: "POST" });
}

export function rejectGuardianConnection(id: string) {
  return apiFetch<GuardianConnectionDetail>(`/api/guardian-connections/${encodeURIComponent(id)}/reject`, { method: "POST" });
}

export function requestGuardianConnection(studentCode: string) {
  return apiFetch<GuardianConnectionDetail>("/api/guardian-connections", {
    method: "POST",
    body: JSON.stringify({ studentCode }),
  });
}

export function getMyChildren() {
  return apiFetch<ParentChild[]>("/api/parents/me/children");
}

export function getPhotoConsent(studentId: string) {
  return apiFetch<StudentPhotoConsent>(`/api/students/${encodeURIComponent(studentId)}/photo-consent`);
}

export function getPhotoConsentHistory(studentId: string) {
  return apiFetch<StudentPhotoConsentHistoryItem[]>(`/api/students/${encodeURIComponent(studentId)}/photo-consent/history`);
}

export function updatePhotoConsent(studentId: string, status: PhotoConsentStatus) {
  return apiFetch<StudentPhotoConsent>(`/api/students/${encodeURIComponent(studentId)}/photo-consent`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export function createLesson(request: {
  lessonAt: string;
  sessionRound: string;
  topic: string;
  teacherId: string;
  participantStudentIds: string[];
}) {
  return apiFetch<LessonDetail>("/api/lessons", { method: "POST", body: JSON.stringify(request) });
}

export function cancelLesson(id: string) {
  return apiFetch<void>(`/api/lessons/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function createObservation(request: ObservationWriteRequest) {
  return apiFetch<ObservationDetail>("/api/observations", { method: "POST", body: JSON.stringify(request) });
}

export function getObservations(values: { studentId?: string; lessonId?: string; teacherId?: string; from?: string; to?: string; page?: number; size?: number } = {}) {
  return apiFetch<PageResponse<ObservationListItem>>(withQuery("/api/observations", { page: 0, size: 20, ...values }));
}

export function getObservation(id: string) {
  return apiFetch<ObservationDetail>(`/api/observations/${encodeURIComponent(id)}`);
}

export function getObservationDrafts(values: { page?: number; size?: number } = {}) {
  return apiFetch<PageResponse<ObservationDraftListItem>>(withQuery("/api/observation-drafts", { page: 0, size: 100, ...values }));
}

export function getObservationDraft(id: string) {
  return apiFetch<ObservationDraftDetail>(`/api/observation-drafts/${encodeURIComponent(id)}`);
}

export function createObservationDraft(request: ObservationDraftWriteRequest) {
  return apiFetch<ObservationDraftDetail>("/api/observation-drafts", { method: "POST", body: JSON.stringify(request) });
}

export function updateObservationDraft(id: string, request: ObservationDraftWriteRequest) {
  return apiFetch<ObservationDraftDetail>(`/api/observation-drafts/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(request) });
}

export function deleteObservationDraft(id: string) {
  return apiFetch<void>(`/api/observation-drafts/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function getCompetencyCatalog() {
  return apiFetch<CompetencyCatalog>("/api/competencies");
}

export function getStudentGrowth(studentId: string, values: { from?: string; to?: string } = {}) {
  return apiFetch<StudentGrowth>(withQuery(`/api/students/${encodeURIComponent(studentId)}/growth`, values));
}

export function getMyGrowth(values: { from?: string; to?: string } = {}) {
  return apiFetch<StudentGrowth>(withQuery("/api/students/me/growth", values));
}

export function suggestObservationComments(request: { studentId: string; competencyCodes: string[]; tags: string[]; context?: string }) {
  return apiFetch<ObservationCommentSuggestions>("/api/observations/comment-suggestions", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function uploadObservationPhotos(observationId: string, files: File[]) {
  const body = new FormData();
  files.forEach((file) => body.append("files", file));
  return apiFetch<ObservationPhoto[]>(`/api/observations/${encodeURIComponent(observationId)}/photos`, {
    method: "POST",
    body,
  });
}

export function getObservationPhotos(observationId: string) {
  return apiFetch<ObservationPhoto[]>(`/api/observations/${encodeURIComponent(observationId)}/photos`);
}

export function downloadObservationPhoto(observationId: string, photoId: string) {
  return apiDownload(`/api/observations/${encodeURIComponent(observationId)}/photos/${encodeURIComponent(photoId)}`);
}

export function getReports(values: { studentId?: string; status?: ReportStatus; authorRole?: "ADMIN" | "OPERATOR"; page?: number; size?: number } = {}) {
  return apiFetch<PageResponse<GrowthReportListItem>>(withQuery("/api/reports", { page: 0, size: 100, ...values }));
}

export function getReport(id: string) {
  return apiFetch<GrowthReportDetail>(`/api/reports/${encodeURIComponent(id)}`);
}

export function createReport(request: { studentId: string; periodStart: string; periodEnd: string }) {
  return apiFetch<GrowthReportDetail>("/api/reports", { method: "POST", body: JSON.stringify(request) });
}

export function updateReport(id: string, request: { title: string; summary: string; strengths: string; nextSteps: string }) {
  return apiFetch<GrowthReportDetail>(`/api/reports/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(request) });
}

export function regenerateReport(id: string) {
  return apiFetch<GrowthReportDetail>(`/api/reports/${encodeURIComponent(id)}/regenerate`, { method: "POST" });
}

export function reviewReport(id: string) {
  return apiFetch<GrowthReportDetail>(`/api/reports/${encodeURIComponent(id)}/review`, { method: "POST" });
}

export function publishReport(id: string) {
  return apiFetch<GrowthReportDetail>(`/api/reports/${encodeURIComponent(id)}/publish`, { method: "POST" });
}

export function unpublishReport(id: string) {
  return apiFetch<GrowthReportDetail>(`/api/reports/${encodeURIComponent(id)}/unpublish`, { method: "POST" });
}

export function bulkPublishReports(reportIds: string[]) {
  return apiFetch<{ requestedCount: number; publishedCount: number; skippedCount: number }>("/api/reports/bulk-publish", {
    method: "POST", body: JSON.stringify({ reportIds }),
  });
}

export function getUnreadReports() {
  return apiFetch<UnreadReport[]>("/api/reports/unread");
}

export function remindUnreadReports() {
  return apiFetch<{ unreadCount: number; createdCount: number; deliveryChannel: "IN_APP" }>("/api/reports/unread/reminders", { method: "POST" });
}

export function downloadReports() {
  return apiDownload("/api/reports/export");
}

export function getAdminDashboard(values: { from?: string; to?: string } = {}) {
  return apiFetch<AdminDashboard>(withQuery("/api/dashboard/admin", values));
}

export function getOperatorDashboard(values: { from?: string; to?: string } = {}) {
  return apiFetch<OperatorDashboard>(withQuery("/api/dashboard/operator", values));
}

export function getStudentDashboard(values: { from?: string; to?: string } = {}) {
  return apiFetch<UserGrowthDashboard>(withQuery("/api/dashboard/student", values));
}

export function getParentDashboard(studentId?: string, values: { from?: string; to?: string } = {}) {
  return apiFetch<UserGrowthDashboard>(withQuery("/api/dashboard/parent", { studentId, ...values }));
}

export function getNotificationSetting() {
  return apiFetch<NotificationSetting>("/api/me/notification-settings");
}

export function updateNotificationSetting(request: Pick<NotificationSetting, "observationEnabled" | "growthEnabled" | "serviceEnabled">) {
  return apiFetch<NotificationSetting>("/api/me/notification-settings", { method: "PUT", body: JSON.stringify(request) });
}

export function getNotifications() {
  return apiFetch<UserNotification[]>("/api/me/notifications");
}

export function markNotificationRead(id: string) {
  return apiFetch<UserNotification>(`/api/me/notifications/${encodeURIComponent(id)}/read`, { method: "POST" });
}

export function markAllNotificationsRead() {
  return apiFetch<NotificationReadAllResult>("/api/me/notifications/read-all", { method: "POST" });
}

export function updateCurrentUserProfile(request: { name: string; email: string }) {
  return apiFetch<UserProfile>("/api/me/profile", { method: "PUT", body: JSON.stringify(request) });
}

export function getCurrentUserProfileImage() {
  return apiDownload("/api/me/profile-image");
}

export function updateCurrentUserProfileImage(file: File) {
  const body = new FormData();
  body.append("file", file);
  return apiFetch<UserProfile>("/api/me/profile-image", { method: "PUT", body });
}

export function deactivateCurrentUser() {
  return apiFetch<void>("/api/me", { method: "DELETE" });
}

export function updateCurrentUserPassword(request: { currentPassword: string; newPassword: string }) {
  return apiFetch<void>("/api/me/password", { method: "PUT", body: JSON.stringify(request) });
}

export function getReportAiSetting() {
  return apiFetch<ReportAiSetting>("/api/settings/report-ai");
}

export function updateReportAiSetting(tone: string, promptTemplate: string) {
  return apiFetch<ReportAiSetting>("/api/settings/report-ai", { method: "PUT", body: JSON.stringify({ tone, promptTemplate }) });
}

export function getSettingsActivityLogs() {
  return apiFetch<PageResponse<ApiRequestLogItem>>("/api/settings/activity-logs?page=0&size=100");
}
