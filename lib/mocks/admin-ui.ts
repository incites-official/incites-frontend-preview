import type { RoleOption, UserListItem } from "@/lib/types";

export type AdminPreviewRole = "SA" | "GA";

export const previewRoleOptions: RoleOption[] = [
  { value: "ADMIN", label: "총괄관리자 (SA)" },
  { value: "OPERATOR", label: "일반관리자 (GA)" },
];

export const previewAdministrators: UserListItem[] = [
  {
    id: "preview-sa-001",
    loginId: "center.director",
    name: "김관우",
    email: "director@incites.edu",
    company: "INCITES 교육센터",
    department: "플랫폼 운영팀",
    position: "Center Director",
    role: "ADMIN",
    roleLabel: "총괄관리자 (SA)",
    active: true,
    createdAt: "2026-08-07T09:00:00+09:00",
    updatedAt: "2026-08-25T14:20:00+09:00",
  },
  {
    id: "preview-ga-001",
    loginId: "teacher.park",
    name: "박지수",
    email: "jisoo.park@incites.edu",
    company: "INCITES 교육센터",
    department: "창의교육팀",
    position: "수석강사",
    role: "OPERATOR",
    roleLabel: "일반관리자 (GA)",
    active: true,
    createdAt: "2026-08-07T10:30:00+09:00",
    updatedAt: "2026-08-24T16:10:00+09:00",
  },
  {
    id: "preview-ga-002",
    loginId: "teacher.lee",
    name: "이선영",
    email: "sunyoung.lee@incites.edu",
    company: "INCITES 교육센터",
    department: "융합교육팀",
    position: "강사",
    role: "OPERATOR",
    roleLabel: "일반관리자 (GA)",
    active: true,
    createdAt: "2026-08-11T11:10:00+09:00",
    updatedAt: "2026-08-23T09:40:00+09:00",
  },
  {
    id: "preview-ga-003",
    loginId: "teacher.choi",
    name: "최유진",
    email: "yujin.choi@incites.edu",
    company: "INCITES 교육센터",
    department: "관찰연구팀",
    position: "강사",
    role: "OPERATOR",
    roleLabel: "일반관리자 (GA)",
    active: false,
    createdAt: "2026-08-14T13:00:00+09:00",
    updatedAt: "2026-08-22T17:30:00+09:00",
  },
];

export interface AdminAssignmentStudent {
  id: string;
  name: string;
  grade: string;
  records: number;
  lastRecord: string;
}

export const previewAdminAssignmentStudents: AdminAssignmentStudent[] = [
  { id: "STU-2026-001", name: "김지훈", grade: "초등 5학년", records: 14, lastRecord: "2026. 08. 07" },
  { id: "STU-2026-002", name: "김예린", grade: "초등 5학년", records: 12, lastRecord: "2026. 08. 05" },
  { id: "STU-2026-003", name: "박민우", grade: "초등 5학년", records: 9, lastRecord: "2026. 07. 31" },
  { id: "STU-2026-004", name: "이서현", grade: "초등 5학년", records: 15, lastRecord: "2026. 08. 08" },
  { id: "STU-2026-005", name: "최하준", grade: "초등 6학년", records: 11, lastRecord: "2026. 08. 06" },
  { id: "STU-2026-006", name: "윤서아", grade: "초등 4학년", records: 8, lastRecord: "2026. 08. 01" },
  { id: "STU-2026-007", name: "정민준", grade: "초등 6학년", records: 13, lastRecord: "2026. 08. 07" },
  { id: "STU-2026-008", name: "한유나", grade: "초등 4학년", records: 7, lastRecord: "2026. 07. 30" },
  { id: "STU-2026-009", name: "오지후", grade: "초등 5학년", records: 16, lastRecord: "2026. 08. 09" },
  { id: "STU-2026-010", name: "서지안", grade: "초등 6학년", records: 10, lastRecord: "2026. 08. 04" },
  { id: "STU-2026-011", name: "임도윤", grade: "초등 4학년", records: 6, lastRecord: "2026. 07. 29" },
  { id: "STU-2026-012", name: "강하은", grade: "초등 5학년", records: 12, lastRecord: "2026. 08. 06" },
  { id: "STU-2026-013", name: "송시우", grade: "초등 4학년", records: 5, lastRecord: "2026. 07. 28" },
  { id: "STU-2026-014", name: "백채원", grade: "초등 6학년", records: 9, lastRecord: "2026. 08. 02" },
  { id: "STU-2026-015", name: "권준서", grade: "초등 5학년", records: 8, lastRecord: "2026. 08. 01" },
  { id: "STU-2026-016", name: "배수아", grade: "초등 4학년", records: 14, lastRecord: "2026. 08. 08" },
  { id: "STU-2026-017", name: "문예준", grade: "초등 6학년", records: 4, lastRecord: "2026. 07. 26" },
  { id: "STU-2026-018", name: "신다은", grade: "초등 5학년", records: 11, lastRecord: "2026. 08. 03" },
];

export const previewStudentAssignments: Record<string, string[]> = {
  "preview-sa-001": ["STU-2026-001", "STU-2026-005", "STU-2026-006", "STU-2026-008"],
  "preview-ga-001": ["STU-2026-001", "STU-2026-002", "STU-2026-003", "STU-2026-004"],
  "preview-ga-002": ["STU-2026-005", "STU-2026-006", "STU-2026-007", "STU-2026-008"],
  "preview-ga-003": ["STU-2026-009", "STU-2026-010"],
};

export const superAdminDashboardData = {
  metrics: [
    { label: "전체 학생", value: "1,284", change: "4.2% 전월 대비", tone: "positive" },
    { label: "활성 관리자", value: "42", change: "2명 증가", tone: "positive" },
    { label: "이번달 기록", value: "3,903", change: "11% 상승 중", tone: "positive" },
    { label: "리포트 공개율", value: "87.4%", change: "3.1% 전월대비", tone: "danger" },
  ],
  weeklyRecords: [812, 421, 735, 458, 586, 414, 731, 798, 632, 784, 699, 615, 801],
  competencies: [72, 72, 72, 72, 72, 72, 72, 72],
  activityLogs: [
    { label: "최유진 관리자 로그인", meta: "10분 전 · IP: 99.109.22" },
    { label: "리포트 일괄 공개 (32건)", meta: "45분 전 · 자동 스케줄러" },
    { label: "LEVEL 기준 수정됨", meta: "2시간 전 · 이영희 팀장" },
  ],
  queues: [
    { label: "공개 후 미열람", count: 61, detail: "열람 재발송 및 대기 상태 추적", tone: "blue" },
    { label: "보호자 연결 대기", count: 9, detail: "신규 자녀 연결 신청 검토", tone: "green" },
    { label: "미검토 리포트", count: 28, detail: "담당자 배정 및 검토 승인 필요", tone: "orange" },
  ],
} as const;

export const generalAdminDashboardData = {
  todayClass: {
    title: "창의융합 B반",
    session: "오늘 수업 학급",
    tags: ["홍길동", "홍길동", "홍길동", "홍길동"],
  },
  metrics: [
    { label: "관찰 필요", value: "2명", detail: "박민우, 김예린 이번 주 기록 필요", tone: "neutral" },
    { label: "작성 중", value: "0건", detail: "이번 수업 임시저장 데이터", tone: "success" },
    { label: "리포트 검토", value: "1건", detail: "AI 생성 코멘트 검토 대기 중", tone: "warning" },
  ],
  students: [
    { id: "STU-2026-001", name: "김지훈", grade: "초등 5학년", records: 14, lastRecord: "2026. 08. 07", photoRestricted: false },
    { id: "STU-2026-002", name: "김지훈", grade: "초등 5학년", records: 14, lastRecord: "2026. 08. 07", photoRestricted: true },
    { id: "STU-2026-003", name: "김지훈", grade: "초등 5학년", records: 14, lastRecord: "2026. 08. 07", photoRestricted: false },
    { id: "STU-2026-004", name: "김지훈", grade: "초등 5학년", records: 14, lastRecord: "2026. 08. 07", photoRestricted: false },
  ],
} as const;

export const permissionPreviewRules = [
  { id: "01", label: "로그인 및 세션 인증", allowed: ["ADMIN", "OPERATOR"] },
  { id: "02", label: "운영 대시보드 조회", allowed: ["ADMIN"] },
  { id: "03", label: "관리자 계정 및 역할 관리", allowed: ["ADMIN"] },
  { id: "04", label: "학생·보호자 연결 관리", allowed: ["ADMIN"] },
  { id: "05", label: "담당 학생 목록 조회", allowed: ["ADMIN", "OPERATOR"] },
  { id: "06", label: "관찰 기록 작성 및 임시저장", allowed: ["ADMIN", "OPERATOR"] },
  { id: "07", label: "AI 성장 리포트 검토", allowed: ["ADMIN", "OPERATOR"] },
  { id: "08", label: "전체 기록 감사 및 공개 통제", allowed: ["ADMIN"] },
] as const;
