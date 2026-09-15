import type {
  CompetencyCatalog,
  GrowthReportDetail,
  GuardianConnectionDetail,
  NotificationSetting,
  ObservationDetail,
  ObservationDraftDetail,
  ReportAiSetting,
  StudentDetail,
  UserNotification,
} from "@/lib/incites-api";
import type { ApiRequestLogItem, UserListItem } from "@/lib/types";

export const DEMO_PASSWORD = "incites1234";
export const DEMO_DATA_VERSION = 1;

export interface DemoAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  roleLabel: string;
  roleGroup: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";
}

export interface DemoLesson {
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

export interface DemoState {
  users: UserListItem[];
  students: StudentDetail[];
  guardianConnections: GuardianConnectionDetail[];
  observations: ObservationDetail[];
  drafts: ObservationDraftDetail[];
  reports: GrowthReportDetail[];
  lessons: DemoLesson[];
  notifications: Record<string, UserNotification[]>;
  notificationSettings: Record<string, NotificationSetting>;
  reportAiSetting: ReportAiSetting;
}

const organization = "INCITES 창의교육센터";

export const demoUsers: UserListItem[] = [
  { id: "admin-001", loginId: "admin1@incites.kr", email: "admin1@incites.kr", name: "김관우", company: organization, department: "플랫폼 운영팀", position: "센터장", role: "ADMIN", roleLabel: "총괄 관리자", active: true, createdAt: "2026-01-05T09:00:00+09:00", updatedAt: "2026-09-10T13:30:00+09:00" },
  { id: "admin-002", loginId: "admin2@incites.kr", email: "admin2@incites.kr", name: "정다혜", company: organization, department: "교육 운영팀", position: "운영 팀장", role: "ADMIN", roleLabel: "총괄 관리자", active: true, createdAt: "2026-02-02T09:00:00+09:00", updatedAt: "2026-09-09T10:20:00+09:00" },
  { id: "admin-003", loginId: "admin3@incites.kr", email: "admin3@incites.kr", name: "오세진", company: organization, department: "교육 연구팀", position: "연구 책임자", role: "ADMIN", roleLabel: "총괄 관리자", active: true, createdAt: "2026-03-03T09:00:00+09:00", updatedAt: "2026-09-08T16:10:00+09:00" },
  { id: "teacher-001", loginId: "teacher1@incites.kr", email: "teacher1@incites.kr", name: "박지수", company: organization, department: "창의교육팀", position: "수석 선생님", role: "OPERATOR", roleLabel: "선생님", active: true, createdAt: "2026-01-12T09:00:00+09:00", updatedAt: "2026-09-12T17:30:00+09:00" },
  { id: "teacher-002", loginId: "teacher2@incites.kr", email: "teacher2@incites.kr", name: "이선영", company: organization, department: "융합교육팀", position: "선생님", role: "OPERATOR", roleLabel: "선생님", active: true, createdAt: "2026-01-19T09:00:00+09:00", updatedAt: "2026-09-11T15:40:00+09:00" },
  { id: "teacher-003", loginId: "teacher3@incites.kr", email: "teacher3@incites.kr", name: "최유진", company: organization, department: "메이커교육팀", position: "선생님", role: "OPERATOR", roleLabel: "선생님", active: true, createdAt: "2026-02-09T09:00:00+09:00", updatedAt: "2026-09-10T11:50:00+09:00" },
  { id: "student-account-001", loginId: "student1@incites.kr", email: "student1@incites.kr", name: "김지훈", company: organization, department: null, position: null, role: "STUDENT", roleLabel: "학생", active: true, createdAt: "2026-03-02T09:00:00+09:00", updatedAt: "2026-09-12T10:00:00+09:00" },
  { id: "student-account-002", loginId: "student2@incites.kr", email: "student2@incites.kr", name: "김예린", company: organization, department: null, position: null, role: "STUDENT", roleLabel: "학생", active: true, createdAt: "2026-03-02T09:00:00+09:00", updatedAt: "2026-09-12T10:00:00+09:00" },
  { id: "student-account-003", loginId: "student3@incites.kr", email: "student3@incites.kr", name: "박민우", company: organization, department: null, position: null, role: "STUDENT", roleLabel: "학생", active: true, createdAt: "2026-03-02T09:00:00+09:00", updatedAt: "2026-09-12T10:00:00+09:00" },
  { id: "parent-001", loginId: "parent1@incites.kr", email: "parent1@incites.kr", name: "김서연", company: null, department: null, position: null, role: "PARENT", roleLabel: "보호자", active: true, createdAt: "2026-03-03T09:00:00+09:00", updatedAt: "2026-09-12T10:00:00+09:00" },
  { id: "parent-002", loginId: "parent2@incites.kr", email: "parent2@incites.kr", name: "한지민", company: null, department: null, position: null, role: "PARENT", roleLabel: "보호자", active: true, createdAt: "2026-03-03T09:00:00+09:00", updatedAt: "2026-09-12T10:00:00+09:00" },
  { id: "parent-003", loginId: "parent3@incites.kr", email: "parent3@incites.kr", name: "박현수", company: null, department: null, position: null, role: "PARENT", roleLabel: "보호자", active: true, createdAt: "2026-03-03T09:00:00+09:00", updatedAt: "2026-09-12T10:00:00+09:00" },
];

export const demoAccounts: DemoAccount[] = demoUsers.map((user) => ({
  id: user.id,
  email: user.email,
  password: DEMO_PASSWORD,
  name: user.name,
  roleLabel: user.roleLabel,
  roleGroup: user.role === "OPERATOR" ? "TEACHER" : user.role as DemoAccount["roleGroup"],
}));

export const demoAccountGroups = [
  { id: "ADMIN", label: "관리자", accounts: demoAccounts.filter((account) => account.roleGroup === "ADMIN") },
  { id: "TEACHER", label: "선생님", accounts: demoAccounts.filter((account) => account.roleGroup === "TEACHER") },
  { id: "STUDENT", label: "학생", accounts: demoAccounts.filter((account) => account.roleGroup === "STUDENT") },
  { id: "PARENT", label: "보호자", accounts: demoAccounts.filter((account) => account.roleGroup === "PARENT") },
] as const;

export const demoStudents: StudentDetail[] = [
  { id: "student-001", studentCode: "STU-2026-001", name: "김지훈", birthDate: "2015-04-18", age: 11, teacherId: "teacher-001", teacherName: "박지수", photoConsentStatus: "CONSENTED", parentConnectionStatus: "APPROVED", active: true, createdAt: "2026-03-02T09:00:00+09:00", updatedAt: "2026-09-12T10:00:00+09:00" },
  { id: "student-002", studentCode: "STU-2026-002", name: "김예린", birthDate: "2015-07-09", age: 11, teacherId: "teacher-001", teacherName: "박지수", photoConsentStatus: "DENIED", parentConnectionStatus: "APPROVED", active: true, createdAt: "2026-03-02T09:05:00+09:00", updatedAt: "2026-09-11T14:10:00+09:00" },
  { id: "student-003", studentCode: "STU-2026-003", name: "박민우", birthDate: "2014-12-22", age: 12, teacherId: "teacher-002", teacherName: "이선영", photoConsentStatus: "CONSENTED", parentConnectionStatus: "APPROVED", active: true, createdAt: "2026-03-02T09:10:00+09:00", updatedAt: "2026-09-10T09:20:00+09:00" },
  { id: "student-004", studentCode: "STU-2026-004", name: "이서현", birthDate: "2016-02-14", age: 10, teacherId: "teacher-002", teacherName: "이선영", photoConsentStatus: "PENDING", parentConnectionStatus: "PENDING", active: true, createdAt: "2026-03-02T09:15:00+09:00", updatedAt: "2026-09-09T16:30:00+09:00" },
  { id: "student-005", studentCode: "STU-2026-005", name: "최하준", birthDate: "2015-10-03", age: 11, teacherId: "teacher-003", teacherName: "최유진", photoConsentStatus: "CONSENTED", parentConnectionStatus: "UNCONNECTED", active: true, createdAt: "2026-03-02T09:20:00+09:00", updatedAt: "2026-09-08T13:40:00+09:00" },
];

export const demoCompetencyCatalog: CompetencyCatalog = {
  competencies: [
    { code: "I", name: "주도성", englishName: "Initiative", description: "스스로 목표를 정하고 행동을 시작하는 역량" },
    { code: "N", name: "탐구력", englishName: "Inquiry", description: "질문을 만들고 근거를 찾아 확인하는 역량" },
    { code: "C", name: "협업력", englishName: "Collaboration", description: "의견을 나누고 공동의 결과를 만드는 역량" },
    { code: "I2", name: "상상력", englishName: "Imagination", description: "새로운 가능성과 해결 방법을 떠올리는 역량" },
    { code: "T", name: "사고력", englishName: "Thinking", description: "정보를 비교하고 논리적으로 판단하는 역량" },
    { code: "E", name: "표현력", englishName: "Expression", description: "생각과 결과를 명확하게 전달하는 역량" },
    { code: "S", name: "지속력", englishName: "Sustained Focus", description: "실패 후에도 방법을 바꾸어 계속 시도하는 역량" },
  ],
  levels: [
    { level: "L1", label: "시작", score: 25 },
    { level: "L2", label: "발전", score: 50 },
    { level: "L3", label: "심화", score: 75 },
    { level: "L4", label: "확장", score: 100 },
  ],
  suggestedTags: ["질문 주도", "역할 조정", "근거 제시", "끝까지 시도", "친구 격려", "아이디어 확장", "오류 발견", "발표 참여"],
};

const competencySets = [
  [["I", "L3"], ["N", "L3"], ["C", "L4"], ["I2", "L3"], ["T", "L3"], ["E", "L2"], ["S", "L4"]],
  [["I", "L2"], ["N", "L4"], ["C", "L3"], ["I2", "L4"], ["T", "L3"], ["E", "L3"], ["S", "L3"]],
  [["I", "L3"], ["N", "L2"], ["C", "L3"], ["I2", "L3"], ["T", "L4"], ["E", "L3"], ["S", "L2"]],
  [["I", "L4"], ["N", "L3"], ["C", "L3"], ["I2", "L2"], ["T", "L3"], ["E", "L4"], ["S", "L3"]],
  [["I", "L2"], ["N", "L3"], ["C", "L2"], ["I2", "L4"], ["T", "L3"], ["E", "L3"], ["S", "L4"]],
] as const;

const topics = ["스마트 시티 자율주행 모듈", "친환경 에너지 마을", "우리 동네 안전 지도", "화성 탐사 로봇", "생태계를 지키는 발명"];
const comments = [
  "센서값을 여러 번 비교하며 오류 원인을 찾고, 조원들과 해결 순서를 정해 끝까지 완성했습니다.",
  "친구들의 의견을 표로 정리한 뒤 공통점을 찾아 팀의 아이디어를 구체적으로 설명했습니다.",
  "관찰한 정보를 근거로 새로운 질문을 만들고 직접 확인할 방법을 제안했습니다.",
  "예상과 다른 결과가 나오자 조건을 하나씩 바꾸며 원인을 찾아 발표했습니다.",
  "역할이 늦어진 친구를 도우면서도 맡은 작업을 계획한 시간 안에 마무리했습니다.",
];

export const demoLessons: DemoLesson[] = demoStudents.map((student, index) => ({
  id: `lesson-${String(index + 1).padStart(3, "0")}`,
  lessonAt: `2026-09-${String(12 - index).padStart(2, "0")}T15:00:00+09:00`,
  sessionRound: String(6 + index),
  topic: topics[index],
  teacherId: student.teacherId ?? "teacher-001",
  teacherName: student.teacherName ?? "박지수",
  participantStudentIds: [student.id],
  participantCount: 1,
  active: true,
  createdAt: `2026-09-${String(12 - index).padStart(2, "0")}T14:50:00+09:00`,
  updatedAt: `2026-09-${String(12 - index).padStart(2, "0")}T16:30:00+09:00`,
}));

export const demoObservations: ObservationDetail[] = demoStudents.flatMap((student, index) => [0, 1].map((offset) => ({
  id: `observation-${index + 1}-${offset + 1}`,
  studentId: student.id,
  studentCode: student.studentCode,
  studentName: student.name,
  lessonId: demoLessons[index].id,
  lessonAt: offset === 0 ? demoLessons[index].lessonAt : `2026-08-${String(27 - index).padStart(2, "0")}T15:00:00+09:00`,
  sessionRound: String(6 + index - offset),
  topic: offset === 0 ? topics[index] : `${topics[index]} 아이디어 확장`,
  teacherId: student.teacherId ?? "teacher-001",
  teacherName: student.teacherName ?? "박지수",
  authorId: student.teacherId ?? "teacher-001",
  authorName: student.teacherName ?? "박지수",
  competencies: competencySets[index].map(([competencyCode, level]) => ({ competencyCode, level })),
  tags: index % 2 ? ["질문 주도", "아이디어 확장", "발표 참여"] : ["근거 제시", "역할 조정", "끝까지 시도"],
  comment: comments[index],
  createdAt: offset === 0 ? demoLessons[index].updatedAt : `2026-08-${String(27 - index).padStart(2, "0")}T16:20:00+09:00`,
})));

export const demoDrafts: ObservationDraftDetail[] = [
  { id: "draft-001", currentStep: 5, studentId: "student-002", studentCode: "STU-2026-002", studentName: "김예린", lessonAt: "2026-09-15", sessionRound: "8", topic: "바다를 살리는 로봇", competencies: [{ competencyCode: "N", level: "L3" }, { competencyCode: "I2", level: null }], tags: ["질문 주도"], comment: "정화 장치의 구조를 비교하며", photoIds: [], authorId: "teacher-001", authorName: "박지수", expiresAt: "2026-10-15T18:00:00+09:00", createdAt: "2026-09-15T14:00:00+09:00", updatedAt: "2026-09-15T14:20:00+09:00" },
  { id: "draft-002", currentStep: 3, studentId: "student-003", studentCode: "STU-2026-003", studentName: "박민우", lessonAt: "2026-09-14", sessionRound: "7", topic: "우주 기지 설계", competencies: [{ competencyCode: "T", level: null }], tags: [], comment: "", photoIds: [], authorId: "teacher-002", authorName: "이선영", expiresAt: "2026-10-14T18:00:00+09:00", createdAt: "2026-09-14T16:00:00+09:00", updatedAt: "2026-09-14T16:08:00+09:00" },
];

function reportCompetencies(studentIndex: number) {
  return competencySets[studentIndex].map(([code, level], competencyIndex) => ({
    code,
    name: demoCompetencyCatalog.competencies.find((item) => item.code === code)?.name ?? code,
    assessmentCount: 4 + (competencyIndex % 3),
    averageScore: ({ L1: 25, L2: 50, L3: 75, L4: 100 } as const)[level],
    currentLevel: level,
    change: competencyIndex % 2 ? 5 : 8,
  }));
}

export const demoReports: GrowthReportDetail[] = demoStudents.map((student, index) => {
  const status = index < 3 ? "PUBLISHED" : index === 3 ? "REVIEWED" : "DRAFT";
  return {
    id: `REPORT-2026-09-${String(index + 1).padStart(3, "0")}`,
    studentId: student.id,
    studentCode: student.studentCode,
    studentName: student.name,
    studentAge: student.age,
    teacherId: student.teacherId,
    teacherName: student.teacherName,
    teacherPosition: "선생님",
    periodStart: "2026-08-01T00:00:00+09:00",
    periodEnd: "2026-09-14T23:59:59+09:00",
    status,
    title: `${student.name}의 9월 성장 리포트`,
    summary: `${student.name} 학생은 프로젝트 과정에서 자신의 생각을 구체화하고 친구들과 해결 방법을 조율하는 힘이 성장했습니다.`,
    strengths: `${student.name} 학생의 강점은 ${index % 2 ? "새로운 질문을 만들고 아이디어를 확장하는 태도" : "근거를 바탕으로 끝까지 해결 방법을 찾는 태도"}입니다.`,
    nextSteps: "다음 수업에서는 해결 과정을 짧은 문장으로 기록하고 친구에게 설명하는 활동을 이어가면 좋겠습니다.",
    observationCount: 2,
    competencies: reportCompetencies(index),
    authorId: student.teacherId ?? "teacher-001",
    authorName: student.teacherName ?? "박지수",
    reviewedByName: status === "DRAFT" ? null : "김관우",
    reviewedAt: status === "DRAFT" ? null : "2026-09-14T16:00:00+09:00",
    publishedByName: status === "PUBLISHED" ? "김관우" : null,
    publishedAt: status === "PUBLISHED" ? "2026-09-14T18:00:00+09:00" : null,
    createdAt: "2026-09-14T10:00:00+09:00",
    updatedAt: status === "PUBLISHED" ? "2026-09-14T18:00:00+09:00" : "2026-09-14T16:00:00+09:00",
  };
});

export const demoGuardianConnections: GuardianConnectionDetail[] = [
  { id: "connection-001", studentId: "student-001", studentCode: "STU-2026-001", studentName: "김지훈", age: 11, parentId: "parent-001", parentLoginId: "parent1@incites.kr", parentName: "김서연", status: "APPROVED", requestedAt: "2026-03-03T10:00:00+09:00", decidedAt: "2026-03-03T13:00:00+09:00", decidedById: "admin-001", decidedByName: "김관우", createdAt: "2026-03-03T10:00:00+09:00", updatedAt: "2026-03-03T13:00:00+09:00" },
  { id: "connection-002", studentId: "student-002", studentCode: "STU-2026-002", studentName: "김예린", age: 11, parentId: "parent-002", parentLoginId: "parent2@incites.kr", parentName: "한지민", status: "APPROVED", requestedAt: "2026-03-03T10:10:00+09:00", decidedAt: "2026-03-03T13:10:00+09:00", decidedById: "admin-001", decidedByName: "김관우", createdAt: "2026-03-03T10:10:00+09:00", updatedAt: "2026-03-03T13:10:00+09:00" },
  { id: "connection-003", studentId: "student-003", studentCode: "STU-2026-003", studentName: "박민우", age: 12, parentId: "parent-003", parentLoginId: "parent3@incites.kr", parentName: "박현수", status: "APPROVED", requestedAt: "2026-03-03T10:20:00+09:00", decidedAt: "2026-03-03T13:20:00+09:00", decidedById: "admin-002", decidedByName: "정다혜", createdAt: "2026-03-03T10:20:00+09:00", updatedAt: "2026-03-03T13:20:00+09:00" },
  { id: "connection-004", studentId: "student-004", studentCode: "STU-2026-004", studentName: "이서현", age: 10, parentId: "parent-002", parentLoginId: "parent2@incites.kr", parentName: "한지민", status: "PENDING", requestedAt: "2026-09-13T11:30:00+09:00", decidedAt: null, decidedById: null, decidedByName: null, createdAt: "2026-09-13T11:30:00+09:00", updatedAt: "2026-09-13T11:30:00+09:00" },
];

const commonNotifications = (role: "admin" | "teacher" | "student" | "parent"): UserNotification[] => role === "admin" ? [
  { id: "notification-admin-1", category: "GUARDIAN_CONNECTION", title: "보호자 연결 요청", targetPath: "/admin/members/guardians", reportId: null, studentId: "student-004", studentName: "이서현", message: "한지민 보호자가 이서현 학생 연결을 요청했습니다.", readAt: null, createdAt: "2026-09-15T09:30:00+09:00" },
  { id: "notification-admin-2", category: "GROWTH_REPORT", title: "리포트 검토 대기", targetPath: "/admin/reports", reportId: "REPORT-2026-09-005", studentId: "student-005", studentName: "최하준", message: "최하준 학생의 성장 리포트 초안이 생성되었습니다.", readAt: null, createdAt: "2026-09-14T16:10:00+09:00" },
] : role === "teacher" ? [
  { id: "notification-teacher-1", category: "OBSERVATION", title: "오늘의 관찰 기록", targetPath: "/admin/observations/write", reportId: null, studentId: "student-001", studentName: "김지훈", message: "담당 학생의 오늘 수업 관찰을 기록해주세요.", readAt: null, createdAt: "2026-09-15T08:30:00+09:00" },
] : role === "student" ? [
  { id: "notification-student-1", category: "GROWTH_REPORT", title: "새 성장 리포트", targetPath: "/student/report", reportId: "REPORT-2026-09-001", studentId: "student-001", studentName: "김지훈", message: "9월 성장 리포트가 공개되었어요.", readAt: null, createdAt: "2026-09-14T18:00:00+09:00" },
] : [
  { id: "notification-parent-1", category: "GROWTH_REPORT", title: "자녀 성장 리포트", targetPath: "/parent/report", reportId: "REPORT-2026-09-001", studentId: "student-001", studentName: "김지훈", message: "자녀의 9월 성장 리포트가 도착했습니다.", readAt: null, createdAt: "2026-09-14T18:00:00+09:00" },
];

export const demoActivityLogs: ApiRequestLogItem[] = [
  { id: 1, requestId: "demo-request-001", requestedAt: "2026-09-15T09:30:00+09:00", userId: "admin-001", loginId: "admin1@incites.kr", userName: "김관우", role: "ADMIN", httpMethod: "POST", requestPath: "/api/guardian-connections/connection-004/approve", responseStatus: 200, clientIp: "127.0.0.1", userAgent: "INCITES Preview", durationMs: 42 },
  { id: 2, requestId: "demo-request-002", requestedAt: "2026-09-14T18:00:00+09:00", userId: "admin-002", loginId: "admin2@incites.kr", userName: "정다혜", role: "ADMIN", httpMethod: "POST", requestPath: "/api/reports/REPORT-2026-09-001/publish", responseStatus: 200, clientIp: "127.0.0.1", userAgent: "INCITES Preview", durationMs: 57 },
  { id: 3, requestId: "demo-request-003", requestedAt: "2026-09-14T16:20:00+09:00", userId: "teacher-001", loginId: "teacher1@incites.kr", userName: "박지수", role: "OPERATOR", httpMethod: "POST", requestPath: "/api/observations", responseStatus: 201, clientIp: "127.0.0.1", userAgent: "INCITES Preview", durationMs: 31 },
];

export function createDemoState(): DemoState {
  const notifications = Object.fromEntries(demoUsers.map((user) => [
    user.id,
    commonNotifications(user.role === "ADMIN" ? "admin" : user.role === "OPERATOR" ? "teacher" : user.role === "STUDENT" ? "student" : "parent")
      .map((item) => ({ ...item, id: `${item.id}-${user.id}` })),
  ]));
  const notificationSettings = Object.fromEntries(demoUsers.map((user) => [user.id, {
    observationEnabled: true,
    growthEnabled: true,
    serviceEnabled: true,
    updatedAt: "2026-09-14T12:00:00+09:00",
  }]));
  return JSON.parse(JSON.stringify({
    users: demoUsers,
    students: demoStudents,
    guardianConnections: demoGuardianConnections,
    observations: demoObservations,
    drafts: demoDrafts,
    reports: demoReports,
    lessons: demoLessons,
    notifications,
    notificationSettings,
    reportAiSetting: {
      tone: "warm",
      promptTemplate: "학생의 구체적인 관찰 장면을 근거로 강점과 다음 성장 단계를 따뜻하고 명확하게 작성합니다.",
      updatedByName: "김관우",
      updatedAt: "2026-09-10T14:00:00+09:00",
    },
  }));
}
