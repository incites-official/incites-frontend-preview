import {
  DEMO_DATA_VERSION,
  demoAccounts,
  demoActivityLogs,
  demoCompetencyCatalog,
  createDemoState,
  type DemoState,
} from "@/lib/demo-data";
import type {
  GrowthReportDetail,
  GrowthReportListItem,
  GuardianConnectionDetail,
  ObservationDetail,
  ObservationDraftDetail,
  ObservationDraftListItem,
  ObservationListItem,
  ParentChild,
  StudentGrowth,
  StudentGrowthCompetency,
  StudentListItem,
  TeacherAssignedStudent,
  UserGrowthDashboard,
} from "@/lib/incites-api";
import type { PageResponse, Role, TokenResponse, UserListItem, UserProfile } from "@/lib/types";

const STATE_KEY = "incites_demo_state";
const TOKEN_PREFIX = "incites-demo:";

export class DemoApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);
    this.name = "DemoApiError";
  }
}

function readState(): DemoState {
  if (typeof window === "undefined") return createDemoState();
  try {
    const saved = JSON.parse(window.localStorage.getItem(STATE_KEY) ?? "null") as { version?: number; state?: DemoState } | null;
    if (saved?.version === DEMO_DATA_VERSION && saved.state) return saved.state;
  } catch {
    // 손상된 데모 상태는 아래 초기 데이터로 복구한다.
  }
  const state = createDemoState();
  writeState(state);
  return state;
}

function writeState(state: DemoState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STATE_KEY, JSON.stringify({ version: DEMO_DATA_VERSION, state }));
}

function publicProfile(user: UserListItem): UserProfile {
  return {
    id: user.id,
    loginId: user.loginId,
    name: user.name,
    email: user.email,
    company: user.company,
    department: user.department,
    position: user.position,
    role: user.role,
    roleLabel: user.roleLabel,
    hasProfileImage: user.hasProfileImage,
    profileImageUpdatedAt: user.profileImageUpdatedAt,
  };
}

function userFromToken(state: DemoState, token: string | null): UserListItem {
  const id = token?.startsWith(TOKEN_PREFIX) ? token.slice(TOKEN_PREFIX.length) : "";
  const user = state.users.find((item) => item.id === id && item.active);
  if (!user) throw new DemoApiError(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  return user;
}

function bodyOf<T>(init: RequestInit): T {
  if (!init.body || typeof init.body !== "string") return {} as T;
  try { return JSON.parse(init.body) as T; }
  catch { return {} as T; }
}

function pageOf<T>(items: T[], url: URL): PageResponse<T> {
  const page = Math.max(0, Number(url.searchParams.get("page") ?? 0));
  const size = Math.max(1, Number(url.searchParams.get("size") ?? 100));
  return {
    items: items.slice(page * size, page * size + size),
    total: items.length,
    page,
    size,
    totalPages: items.length ? Math.ceil(items.length / size) : 0,
  };
}

function studentForAccount(state: DemoState, user: UserListItem) {
  const accountIndex = ["student-account-001", "student-account-002", "student-account-003"].indexOf(user.id);
  return state.students[accountIndex] ?? null;
}

function childrenForParent(state: DemoState, parentId: string) {
  const studentIds = state.guardianConnections
    .filter((connection) => connection.parentId === parentId && connection.status === "APPROVED")
    .map((connection) => connection.studentId);
  return state.students.filter((student) => studentIds.includes(student.id));
}

function assignedStudents(state: DemoState, teacherId: string): TeacherAssignedStudent[] {
  return state.students.filter((student) => student.teacherId === teacherId && student.active).map((student) => ({
    id: student.id,
    studentCode: student.studentCode,
    name: student.name,
    age: student.age,
    photoConsentStatus: student.photoConsentStatus,
    parentConnectionStatus: student.parentConnectionStatus,
    observationCount: state.observations.filter((observation) => observation.studentId === student.id).length,
    lastObservedAt: state.observations.filter((observation) => observation.studentId === student.id)
      .sort((a, b) => b.lessonAt.localeCompare(a.lessonAt))[0]?.lessonAt ?? null,
    active: student.active,
  }));
}

function studentListItem(state: DemoState, student: DemoState["students"][number]): StudentListItem {
  const observations = state.observations.filter((item) => item.studentId === student.id);
  return {
    ...student,
    observationCount: observations.length,
    lastObservedAt: observations.sort((a, b) => b.lessonAt.localeCompare(a.lessonAt))[0]?.lessonAt ?? null,
  };
}

function observationListItem(observation: ObservationDetail): ObservationListItem {
  return {
    id: observation.id,
    studentId: observation.studentId,
    studentCode: observation.studentCode,
    studentName: observation.studentName,
    lessonId: observation.lessonId,
    lessonAt: observation.lessonAt,
    sessionRound: observation.sessionRound,
    topic: observation.topic,
    authorId: observation.authorId,
    authorName: observation.authorName,
    competencyCount: observation.competencies.length,
    tagCount: observation.tags.length,
    comment: observation.comment,
    createdAt: observation.createdAt,
  };
}

function reportListItem(state: DemoState, report: GrowthReportDetail): GrowthReportListItem {
  const guardians = state.guardianConnections.filter((connection) => connection.studentId === report.studentId && connection.status === "APPROVED");
  return {
    id: report.id,
    studentId: report.studentId,
    studentCode: report.studentCode,
    studentName: report.studentName,
    periodStart: report.periodStart,
    periodEnd: report.periodEnd,
    status: report.status,
    title: report.title,
    observationCount: report.observationCount,
    authorName: report.authorName,
    authorRole: report.authorId.startsWith("admin") ? "ADMIN" : "OPERATOR",
    guardianCount: guardians.length,
    readGuardianCount: report.studentId === "student-002" ? guardians.length : 0,
    publishedAt: report.publishedAt,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}

function growthForStudent(state: DemoState, studentId: string): StudentGrowth {
  const student = state.students.find((item) => item.id === studentId);
  if (!student) throw new DemoApiError(404, "STUDENT_NOT_FOUND", "학생 정보를 찾을 수 없습니다.");
  const observations = state.observations.filter((item) => item.studentId === studentId)
    .sort((a, b) => b.lessonAt.localeCompare(a.lessonAt));
  const score = { L1: 25, L2: 50, L3: 75, L4: 100 } as const;
  const competencies: StudentGrowthCompetency[] = demoCompetencyCatalog.competencies.map((catalogItem) => {
    const levels = observations.flatMap((observation) => observation.competencies)
      .filter((item) => item.competencyCode === catalogItem.code).map((item) => score[item.level]);
    const averageScore = levels.length ? Math.round(levels.reduce((sum, value) => sum + value, 0) / levels.length) : 0;
    const currentLevel = averageScore >= 88 ? "L4" : averageScore >= 63 ? "L3" : averageScore >= 38 ? "L2" : levels.length ? "L1" : null;
    return {
      code: catalogItem.code,
      name: catalogItem.name,
      assessmentCount: levels.length,
      averageScore,
      currentLevel,
      previousAverageScore: levels.length ? Math.max(25, averageScore - 7) : null,
      change: levels.length ? 7 : null,
    };
  });
  return {
    studentId: student.id,
    studentCode: student.studentCode,
    studentName: student.name,
    from: "2026-08-01T00:00:00+09:00",
    to: "2026-09-15T23:59:59+09:00",
    observationCount: observations.length,
    lastObservedAt: observations[0]?.lessonAt ?? null,
    competencies,
    recentObservations: observations.slice(0, 4).map((observation) => ({
      observationId: observation.id,
      lessonAt: observation.lessonAt,
      topic: observation.topic,
      comment: observation.comment,
      tags: observation.tags,
    })),
  };
}

function dashboardForStudent(state: DemoState, studentId: string, audience: "STUDENT" | "PARENT"): UserGrowthDashboard {
  const growth = growthForStudent(state, studentId);
  const report = state.reports.find((item) => item.studentId === studentId && item.status === "PUBLISHED");
  return {
    ...growth,
    audience,
    latestReport: report ? {
      id: report.id,
      title: report.title,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      publishedAt: report.publishedAt ?? report.updatedAt,
    } : null,
  };
}

function updateConnectionStudentStatus(state: DemoState, connection: GuardianConnectionDetail) {
  const student = state.students.find((item) => item.id === connection.studentId);
  if (student) student.parentConnectionStatus = connection.status === "APPROVED" ? "APPROVED" : connection.status === "PENDING" ? "PENDING" : "UNCONNECTED";
}

function requireItem<T>(item: T | undefined, message: string): T {
  if (!item) throw new DemoApiError(404, "NOT_FOUND", message);
  return item;
}

function visibleReports(state: DemoState, user: UserListItem) {
  if (user.role === "STUDENT") {
    const student = studentForAccount(state, user);
    return state.reports.filter((report) => report.studentId === student?.id && report.status === "PUBLISHED");
  }
  if (user.role === "PARENT") {
    const childIds = childrenForParent(state, user.id).map((student) => student.id);
    return state.reports.filter((report) => childIds.includes(report.studentId) && report.status === "PUBLISHED");
  }
  if (user.role === "OPERATOR") {
    const studentIds = assignedStudents(state, user.id).map((student) => student.id);
    return state.reports.filter((report) => studentIds.includes(report.studentId));
  }
  return state.reports;
}

export async function handleDemoRequest<T>(path: string, init: RequestInit = {}, token: string | null): Promise<T> {
  const state = readState();
  const url = new URL(path, "https://preview.incites.local");
  const pathname = url.pathname;
  const method = (init.method ?? "GET").toUpperCase();

  if (pathname === "/api/auth/login" && method === "POST") {
    const request = bodyOf<{ email?: string; password?: string }>(init);
    const account = demoAccounts.find((item) => item.email.toLowerCase() === request.email?.toLowerCase() && item.password === request.password);
    const user = account ? state.users.find((item) => item.id === account.id && item.active) : null;
    if (!account || !user) throw new DemoApiError(401, "INVALID_CREDENTIALS", "데모 계정의 이메일과 비밀번호를 확인해주세요.");
    const response: TokenResponse = {
      accessToken: `${TOKEN_PREFIX}${user.id}`,
      tokenType: "Bearer",
      accessTokenExpiresAt: "2099-12-31T23:59:59+09:00",
      user: publicProfile(user),
    };
    return response as T;
  }
  if (pathname === "/api/auth/logout" && method === "POST") return undefined as T;
  if (pathname === "/api/auth/register" && method === "POST") {
    const request = bodyOf<{ name: string; email: string; role: "PARENT" | "STUDENT"; studentCode?: string }>(init);
    return { id: `signup-${Date.now()}`, loginId: request.email, name: request.name, role: request.role, studentCode: request.studentCode ?? null, guardianConnectionRequested: Boolean(request.studentCode && request.role === "PARENT"), studentAccountLinked: Boolean(request.studentCode && request.role === "STUDENT") } as T;
  }
  if (pathname === "/api/auth/find-email" && method === "POST") {
    const request = bodyOf<{ name?: string; studentCode?: string }>(init);
    const student = state.students.find((item) => item.name === request.name && item.studentCode === request.studentCode);
    const account = student ? state.users.find((item) => item.role === "STUDENT" && item.name === student.name) : null;
    if (!account) throw new DemoApiError(404, "ACCOUNT_NOT_FOUND", "일치하는 데모 학생 계정이 없습니다.");
    return { email: account.email } as T;
  }
  if (pathname === "/api/auth/password-reset/request" && method === "POST") return { challengeId: "demo-reset-challenge", expiresInSeconds: 600, developmentCode: "123456" } as T;
  if (pathname === "/api/auth/password-reset/verify" && method === "POST") return { resetToken: "demo-reset-token", expiresInSeconds: 600 } as T;
  if (pathname === "/api/auth/password-reset/complete" && method === "POST") return undefined as T;

  const currentUser = userFromToken(state, token);
  if (pathname === "/api/auth/me") return publicProfile(currentUser) as T;

  if (pathname === "/api/users/roles") return [{ value: "ADMIN", label: "총괄 관리자" }, { value: "OPERATOR", label: "선생님" }] as T;
  if (pathname === "/api/users" && method === "GET") {
    const query = (url.searchParams.get("query") ?? "").toLocaleLowerCase("ko-KR");
    const roles = (url.searchParams.get("roles") ?? "").split(",").filter(Boolean) as Role[];
    const items = state.users.filter((user) => (!roles.length || roles.includes(user.role)) && (!query || [user.name, user.email, user.department ?? "", user.position ?? ""].some((value) => value.toLocaleLowerCase("ko-KR").includes(query))));
    return pageOf(items, url) as T;
  }
  if (pathname === "/api/users" && method === "POST") {
    const request = bodyOf<Partial<UserListItem> & { password?: string }>(init);
    const user: UserListItem = { id: `user-${Date.now()}`, loginId: request.email ?? "demo@incites.kr", email: request.email ?? "demo@incites.kr", name: request.name ?? "새 사용자", company: request.company ?? "INCITES 창의교육센터", department: request.department ?? "교육 운영팀", position: request.position ?? "선생님", role: request.role ?? "OPERATOR", roleLabel: request.role === "ADMIN" ? "총괄 관리자" : "선생님", active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    state.users.unshift(user); writeState(state); return user as T;
  }
  const userMatch = pathname.match(/^\/api\/users\/([^/]+)$/);
  if (userMatch) {
    const id = decodeURIComponent(userMatch[1]);
    const user = requireItem(state.users.find((item) => item.id === id), "사용자를 찾을 수 없습니다.");
    if (method === "GET") return user as T;
    if (method === "PUT") { Object.assign(user, bodyOf<Partial<UserListItem>>(init), { updatedAt: new Date().toISOString() }); writeState(state); return user as T; }
    if (method === "DELETE") { user.active = false; user.updatedAt = new Date().toISOString(); writeState(state); return undefined as T; }
  }
  if (/^\/api\/users\/[^/]+\/password$/.test(pathname) && method === "PUT") return undefined as T;

  if (pathname === "/api/students" && method === "GET") {
    const query = (url.searchParams.get("query") ?? "").toLocaleLowerCase("ko-KR");
    const teacherId = url.searchParams.get("teacherId");
    const consent = url.searchParams.get("photoConsentStatus");
    const connection = url.searchParams.get("parentConnectionStatus");
    const items = state.students.filter((student) => student.active && (!teacherId || student.teacherId === teacherId) && (!consent || student.photoConsentStatus === consent) && (!connection || student.parentConnectionStatus === connection) && (!query || [student.name, student.studentCode, student.teacherName ?? ""].some((value) => value.toLocaleLowerCase("ko-KR").includes(query)))).map((student) => studentListItem(state, student));
    return pageOf(items, url) as T;
  }
  if (pathname === "/api/students" && method === "POST") {
    const request = bodyOf<{ studentCode?: string; name: string; birthDate: string; teacherId: string; age?: number | null }>(init);
    const teacher = state.users.find((user) => user.id === request.teacherId);
    const student = { id: `student-${Date.now()}`, studentCode: request.studentCode ?? `STU-DEMO-${state.students.length + 1}`, name: request.name, birthDate: request.birthDate, age: request.age ?? null, teacherId: request.teacherId, teacherName: teacher?.name ?? null, photoConsentStatus: "PENDING" as const, parentConnectionStatus: "UNCONNECTED" as const, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    state.students.push(student); writeState(state); return student as T;
  }
  if (pathname === "/api/students/bulk/preview" && method === "POST") return { requestedCount: 2, validCount: 2, rows: [{ rowNumber: 2, name: "정하린", studentCode: "STU-DEMO-006", age: "10", birthDate: "2016-05-11", errors: [] }, { rowNumber: 3, name: "윤도현", studentCode: "STU-DEMO-007", age: "11", birthDate: "2015-08-21", errors: [] }] } as T;
  if (pathname === "/api/students/bulk" && method === "POST") return { requestedCount: 2, createdCount: 2, failedCount: 0, results: [{ rowNumber: 2, name: "정하린", studentCode: "STU-DEMO-006", age: "10", birthDate: "2016-05-11", errors: [], success: true, studentId: "student-demo-006" }, { rowNumber: 3, name: "윤도현", studentCode: "STU-DEMO-007", age: "11", birthDate: "2015-08-21", errors: [], success: true, studentId: "student-demo-007" }] } as T;
  const studentMatch = pathname.match(/^\/api\/students\/([^/]+)$/);
  if (studentMatch) {
    const student = requireItem(state.students.find((item) => item.id === decodeURIComponent(studentMatch[1])), "학생을 찾을 수 없습니다.");
    if (method === "GET") return student as T;
    if (method === "PUT") {
      const request = bodyOf<Partial<typeof student> & { teacherId?: string }>(init);
      Object.assign(student, request, { teacherName: request.teacherId ? state.users.find((user) => user.id === request.teacherId)?.name ?? null : student.teacherName, updatedAt: new Date().toISOString() });
      writeState(state); return student as T;
    }
    if (method === "DELETE") { student.active = false; writeState(state); return undefined as T; }
  }
  const teacherStudentsMatch = pathname.match(/^\/api\/teachers\/([^/]+)\/students$/);
  if (teacherStudentsMatch) {
    const query = (url.searchParams.get("query") ?? "").toLocaleLowerCase("ko-KR");
    return pageOf(assignedStudents(state, decodeURIComponent(teacherStudentsMatch[1])).filter((student) => !query || [student.name, student.studentCode].some((value) => value.toLocaleLowerCase("ko-KR").includes(query))), url) as T;
  }
  const assignmentMatch = pathname.match(/^\/api\/teachers\/([^/]+)\/student-assignments$/);
  if (assignmentMatch && method === "PUT") {
    const teacherId = decodeURIComponent(assignmentMatch[1]);
    const teacher = requireItem(state.users.find((user) => user.id === teacherId), "선생님을 찾을 수 없습니다.");
    const studentIds = bodyOf<{ studentIds?: string[] }>(init).studentIds ?? [];
    let changedCount = 0;
    state.students.forEach((student) => {
      const shouldAssign = studentIds.includes(student.id);
      if ((student.teacherId === teacherId) !== shouldAssign && (student.teacherId === teacherId || shouldAssign)) changedCount += 1;
      if (shouldAssign) { student.teacherId = teacherId; student.teacherName = teacher.name; }
      else if (student.teacherId === teacherId) { student.teacherId = null; student.teacherName = null; }
    });
    writeState(state); return { teacherId, teacherName: teacher.name, requestedCount: studentIds.length, changedCount, unchangedCount: Math.max(0, studentIds.length - changedCount) } as T;
  }

  if (pathname === "/api/guardian-connections" && method === "GET") {
    const status = url.searchParams.get("status");
    const query = (url.searchParams.get("query") ?? "").toLocaleLowerCase("ko-KR");
    const items = state.guardianConnections.filter((connection) => (!status || connection.status === status) && (!query || [connection.parentName, connection.studentName, connection.studentCode].some((value) => value.toLocaleLowerCase("ko-KR").includes(query))));
    return pageOf(items, url) as T;
  }
  if (pathname === "/api/guardian-connections" && method === "POST") {
    const student = requireItem(state.students.find((item) => item.studentCode === bodyOf<{ studentCode?: string }>(init).studentCode), "학생 코드를 확인해주세요.");
    const connection: GuardianConnectionDetail = { id: `connection-${Date.now()}`, studentId: student.id, studentCode: student.studentCode, studentName: student.name, age: student.age, parentId: currentUser.id, parentLoginId: currentUser.loginId, parentName: currentUser.name, status: "PENDING", requestedAt: new Date().toISOString(), decidedAt: null, decidedById: null, decidedByName: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    state.guardianConnections.push(connection); updateConnectionStudentStatus(state, connection); writeState(state); return connection as T;
  }
  const connectionDecision = pathname.match(/^\/api\/guardian-connections\/([^/]+)\/(approve|reject)$/);
  if (connectionDecision && method === "POST") {
    const connection = requireItem(state.guardianConnections.find((item) => item.id === decodeURIComponent(connectionDecision[1])), "연결 요청을 찾을 수 없습니다.");
    connection.status = connectionDecision[2] === "approve" ? "APPROVED" : "REJECTED";
    connection.decidedAt = new Date().toISOString(); connection.decidedById = currentUser.id; connection.decidedByName = currentUser.name; connection.updatedAt = new Date().toISOString();
    updateConnectionStudentStatus(state, connection); writeState(state); return connection as T;
  }
  if (pathname === "/api/parents/me/children") {
    const items: ParentChild[] = childrenForParent(state, currentUser.id).map((student) => ({ id: student.id, studentCode: student.studentCode, name: student.name, age: student.age, teacherId: student.teacherId, teacherName: student.teacherName, photoConsentStatus: student.photoConsentStatus }));
    return items as T;
  }
  const consentMatch = pathname.match(/^\/api\/students\/([^/]+)\/photo-consent$/);
  if (consentMatch) {
    const student = requireItem(state.students.find((item) => item.id === decodeURIComponent(consentMatch[1])), "학생을 찾을 수 없습니다.");
    if (method === "PUT") { student.photoConsentStatus = bodyOf<{ status: typeof student.photoConsentStatus }>(init).status; student.updatedAt = new Date().toISOString(); writeState(state); }
    return { studentId: student.id, studentCode: student.studentCode, studentName: student.name, status: student.photoConsentStatus, changedAt: student.updatedAt, changedById: currentUser.id, changedByName: currentUser.name } as T;
  }
  const consentHistoryMatch = pathname.match(/^\/api\/students\/([^/]+)\/photo-consent\/history$/);
  if (consentHistoryMatch) {
    const student = requireItem(state.students.find((item) => item.id === decodeURIComponent(consentHistoryMatch[1])), "학생을 찾을 수 없습니다.");
    return [{ id: `consent-${student.id}`, status: student.photoConsentStatus, changedAt: student.updatedAt, changedById: "admin-001", changedByName: "김관우" }] as T;
  }

  if (pathname === "/api/lessons" && method === "POST") {
    const request = bodyOf<Omit<DemoState["lessons"][number], "id" | "teacherName" | "participantCount" | "active" | "createdAt" | "updatedAt">>(init);
    const lesson = { ...request, id: `lesson-${Date.now()}`, teacherName: state.users.find((user) => user.id === request.teacherId)?.name ?? currentUser.name, participantCount: request.participantStudentIds.length, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    state.lessons.push(lesson); writeState(state); return lesson as T;
  }
  const lessonDelete = pathname.match(/^\/api\/lessons\/([^/]+)$/);
  if (lessonDelete && method === "DELETE") { state.lessons = state.lessons.filter((item) => item.id !== decodeURIComponent(lessonDelete[1])); writeState(state); return undefined as T; }

  if (pathname === "/api/observations" && method === "GET") {
    let items = [...state.observations];
    for (const key of ["studentId", "lessonId", "teacherId"] as const) { const value = url.searchParams.get(key); if (value) items = items.filter((item) => item[key] === value); }
    const from = url.searchParams.get("from"); const to = url.searchParams.get("to");
    if (from) items = items.filter((item) => item.lessonAt >= from); if (to) items = items.filter((item) => item.lessonAt <= to);
    return pageOf(items.sort((a, b) => b.lessonAt.localeCompare(a.lessonAt)).map(observationListItem), url) as T;
  }
  if (pathname === "/api/observations" && method === "POST") {
    const request = bodyOf<{ studentId: string; lessonId: string; competencies: ObservationDetail["competencies"]; tags: string[]; comment: string }>(init);
    const student = requireItem(state.students.find((item) => item.id === request.studentId), "학생을 찾을 수 없습니다.");
    const lesson = requireItem(state.lessons.find((item) => item.id === request.lessonId), "수업을 찾을 수 없습니다.");
    const observation: ObservationDetail = { id: `observation-${Date.now()}`, studentId: student.id, studentCode: student.studentCode, studentName: student.name, lessonId: lesson.id, lessonAt: lesson.lessonAt, sessionRound: lesson.sessionRound, topic: lesson.topic, teacherId: lesson.teacherId, teacherName: lesson.teacherName, authorId: currentUser.id, authorName: currentUser.name, competencies: request.competencies, tags: request.tags, comment: request.comment, createdAt: new Date().toISOString() };
    state.observations.unshift(observation); writeState(state); return observation as T;
  }
  const observationMatch = pathname.match(/^\/api\/observations\/([^/]+)$/);
  if (observationMatch && method === "GET") return requireItem(state.observations.find((item) => item.id === decodeURIComponent(observationMatch[1])), "관찰 기록을 찾을 수 없습니다.") as T;
  if (pathname === "/api/observations/comment-suggestions" && method === "POST") return { provider: "RULE_BASED", suggestions: ["스스로 질문을 만들고 여러 해결 방법을 비교했습니다.", "친구의 의견을 경청하고 역할을 조율해 과제를 완성했습니다.", "실패한 원인을 차근차근 확인하며 끝까지 다시 시도했습니다."] } as T;
  if (/^\/api\/observations\/[^/]+\/photos$/.test(pathname)) return [] as T;

  if (pathname === "/api/observation-drafts" && method === "GET") {
    const drafts = currentUser.role === "OPERATOR" ? state.drafts.filter((draft) => draft.authorId === currentUser.id) : state.drafts;
    const items: ObservationDraftListItem[] = drafts.map((draft) => ({ id: draft.id, currentStep: draft.currentStep, studentId: draft.studentId, studentCode: draft.studentCode, studentName: draft.studentName, studentAge: state.students.find((student) => student.id === draft.studentId)?.age ?? null, lessonAt: draft.lessonAt, sessionRound: draft.sessionRound, topic: draft.topic, competencyCount: draft.competencies.filter((item) => item.level).length, updatedAt: draft.updatedAt, expiresAt: draft.expiresAt }));
    return pageOf(items, url) as T;
  }
  if (pathname === "/api/observation-drafts" && method === "POST") {
    const request = bodyOf<Omit<ObservationDraftDetail, "id" | "authorId" | "authorName" | "studentCode" | "studentName" | "expiresAt" | "createdAt" | "updatedAt">>(init);
    const student = state.students.find((item) => item.id === request.studentId);
    const draft: ObservationDraftDetail = { ...request, id: `draft-${Date.now()}`, authorId: currentUser.id, authorName: currentUser.name, studentCode: student?.studentCode ?? null, studentName: student?.name ?? null, expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    state.drafts.unshift(draft); writeState(state); return draft as T;
  }
  const draftMatch = pathname.match(/^\/api\/observation-drafts\/([^/]+)$/);
  if (draftMatch) {
    const id = decodeURIComponent(draftMatch[1]);
    const index = state.drafts.findIndex((item) => item.id === id);
    if (method === "GET") return requireItem(state.drafts[index], "임시저장 기록을 찾을 수 없습니다.") as T;
    if (method === "PUT") { const current = requireItem(state.drafts[index], "임시저장 기록을 찾을 수 없습니다."); const request = bodyOf<Partial<ObservationDraftDetail>>(init); const student = state.students.find((item) => item.id === request.studentId); state.drafts[index] = { ...current, ...request, studentCode: student?.studentCode ?? current.studentCode, studentName: student?.name ?? current.studentName, updatedAt: new Date().toISOString() }; writeState(state); return state.drafts[index] as T; }
    if (method === "DELETE") { state.drafts = state.drafts.filter((item) => item.id !== id); writeState(state); return undefined as T; }
  }

  if (pathname === "/api/competencies") return demoCompetencyCatalog as T;
  const growthMatch = pathname.match(/^\/api\/students\/([^/]+)\/growth$/);
  if (growthMatch) return growthForStudent(state, decodeURIComponent(growthMatch[1])) as T;
  if (pathname === "/api/students/me/growth") return growthForStudent(state, requireItem(studentForAccount(state, currentUser), "연결된 학생 정보를 찾을 수 없습니다.").id) as T;

  if (pathname === "/api/reports" && method === "GET") {
    let reports = visibleReports(state, currentUser);
    const studentId = url.searchParams.get("studentId"); const status = url.searchParams.get("status"); const authorRole = url.searchParams.get("authorRole");
    if (studentId) reports = reports.filter((report) => report.studentId === studentId);
    if (status) reports = reports.filter((report) => report.status === status);
    let items = reports.map((report) => reportListItem(state, report));
    if (authorRole) items = items.filter((item) => item.authorRole === authorRole);
    return pageOf(items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), url) as T;
  }
  if (pathname === "/api/reports" && method === "POST") {
    const request = bodyOf<{ studentId: string; periodStart: string; periodEnd: string }>(init);
    const student = requireItem(state.students.find((item) => item.id === request.studentId), "학생을 찾을 수 없습니다.");
    const base = growthForStudent(state, student.id);
    const report: GrowthReportDetail = { id: `REPORT-DEMO-${Date.now()}`, studentId: student.id, studentCode: student.studentCode, studentName: student.name, studentAge: student.age, teacherId: student.teacherId, teacherName: student.teacherName, teacherPosition: "선생님", periodStart: request.periodStart, periodEnd: request.periodEnd, status: "DRAFT", title: `${student.name}의 성장 리포트`, summary: `${student.name} 학생은 프로젝트 과정에서 스스로 질문하고 해결 방법을 찾는 힘이 성장했습니다.`, strengths: "관찰한 사실을 근거로 자신의 생각을 또렷하게 설명합니다.", nextSteps: "해결 과정을 짧게 기록하는 활동을 이어가면 좋겠습니다.", observationCount: base.observationCount, competencies: base.competencies.map((item) => ({ code: item.code, name: item.name, assessmentCount: item.assessmentCount, averageScore: item.averageScore, currentLevel: item.currentLevel, change: item.change })), authorId: currentUser.id, authorName: currentUser.name, reviewedByName: null, reviewedAt: null, publishedByName: null, publishedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    state.reports.unshift(report); writeState(state); return report as T;
  }
  if (pathname === "/api/reports/bulk-publish" && method === "POST") {
    const ids = bodyOf<{ reportIds?: string[] }>(init).reportIds ?? [];
    let publishedCount = 0;
    state.reports.forEach((report) => { if (ids.includes(report.id) && report.status === "REVIEWED") { report.status = "PUBLISHED"; report.publishedAt = new Date().toISOString(); report.publishedByName = currentUser.name; report.updatedAt = report.publishedAt; publishedCount += 1; } });
    writeState(state); return { requestedCount: ids.length, publishedCount, skippedCount: ids.length - publishedCount } as T;
  }
  if (pathname === "/api/reports/unread") {
    return state.reports.filter((report) => report.status === "PUBLISHED" && report.studentId !== "student-002").flatMap((report) => state.guardianConnections.filter((connection) => connection.studentId === report.studentId && connection.status === "APPROVED").map((connection) => ({ reportId: report.id, studentId: report.studentId, studentName: report.studentName, parentId: connection.parentId, parentName: connection.parentName, publishedAt: report.publishedAt ?? report.updatedAt }))) as T;
  }
  if (pathname === "/api/reports/unread/reminders" && method === "POST") { const unreadCount = state.guardianConnections.filter((item) => item.status === "APPROVED").length; return { unreadCount, createdCount: unreadCount, deliveryChannel: "IN_APP" } as T; }
  const reportAction = pathname.match(/^\/api\/reports\/([^/]+)\/(regenerate|review|publish|unpublish)$/);
  if (reportAction && method === "POST") {
    const report = requireItem(state.reports.find((item) => item.id === decodeURIComponent(reportAction[1])), "리포트를 찾을 수 없습니다.");
    const action = reportAction[2]; const now = new Date().toISOString();
    if (action === "regenerate") report.summary = `${report.studentName} 학생의 최근 관찰 기록을 반영해 성장 요약을 새로 생성했습니다.`;
    if (action === "review") { report.status = "REVIEWED"; report.reviewedByName = currentUser.name; report.reviewedAt = now; }
    if (action === "publish") { report.status = "PUBLISHED"; report.publishedByName = currentUser.name; report.publishedAt = now; }
    if (action === "unpublish") { report.status = "REVIEWED"; report.publishedByName = null; report.publishedAt = null; }
    report.updatedAt = now; writeState(state); return report as T;
  }
  const reportMatch = pathname.match(/^\/api\/reports\/([^/]+)$/);
  if (reportMatch) {
    const report = requireItem(state.reports.find((item) => item.id === decodeURIComponent(reportMatch[1])), "리포트를 찾을 수 없습니다.");
    if (method === "GET") return report as T;
    if (method === "PUT") { Object.assign(report, bodyOf<Pick<GrowthReportDetail, "title" | "summary" | "strengths" | "nextSteps">>(init), { updatedAt: new Date().toISOString() }); writeState(state); return report as T; }
  }

  if (pathname === "/api/dashboard/admin") {
    const trendCounts = [5, 7, 6, 9, 8, 10, 12, state.observations.length];
    return { from: url.searchParams.get("from") ?? "2026-07-01T00:00:00+09:00", to: url.searchParams.get("to") ?? "2026-09-15T23:59:59+09:00", activeStudents: state.students.filter((item) => item.active).length, activeTeachers: state.users.filter((item) => item.role === "OPERATOR" && item.active).length, observationCount: state.observations.length, pendingGuardianConnections: state.guardianConnections.filter((item) => item.status === "PENDING").length, draftReports: state.reports.filter((item) => item.status === "DRAFT").length, publishedReports: state.reports.filter((item) => item.status === "PUBLISHED").length, unreadReports: 2, observationTrend: trendCounts.map((count, index) => ({ from: `2026-${String(7 + Math.floor(index / 4)).padStart(2, "0")}-${String(1 + (index % 4) * 7).padStart(2, "0")}`, to: `2026-${String(7 + Math.floor(index / 4)).padStart(2, "0")}-${String(7 + (index % 4) * 7).padStart(2, "0")}`, count })), competencies: growthForStudent(state, "student-001").competencies.map((item) => ({ code: item.code, name: item.name, assessmentCount: item.assessmentCount, averageScore: item.averageScore, currentLevel: item.currentLevel, change: item.change })), recentActivities: demoActivityLogs.map((log) => ({ requestedAt: log.requestedAt, userName: log.userName, method: log.httpMethod, path: log.requestPath, status: log.responseStatus })) } as T;
  }
  if (pathname === "/api/dashboard/operator") {
    const students = assignedStudents(state, currentUser.id);
    const studentIds = students.map((item) => item.id);
    const lessons = state.lessons.filter((lesson) => lesson.teacherId === currentUser.id).sort((a, b) => b.lessonAt.localeCompare(a.lessonAt));
    return { teacherId: currentUser.id, teacherName: currentUser.name, from: "2026-08-01T00:00:00+09:00", to: "2026-09-15T23:59:59+09:00", assignedStudentCount: students.length, observationCount: state.observations.filter((item) => studentIds.includes(item.studentId)).length, draftCount: state.drafts.filter((item) => item.authorId === currentUser.id).length, reportReviewCount: state.reports.filter((item) => studentIds.includes(item.studentId) && item.status === "DRAFT").length, latestLesson: lessons[0] ?? null, students } as T;
  }
  if (pathname === "/api/dashboard/student") return dashboardForStudent(state, requireItem(studentForAccount(state, currentUser), "연결된 학생 정보를 찾을 수 없습니다.").id, "STUDENT") as T;
  if (pathname === "/api/dashboard/parent") {
    const children = childrenForParent(state, currentUser.id);
    const studentId = url.searchParams.get("studentId") ?? children[0]?.id;
    if (!studentId || !children.some((item) => item.id === studentId)) throw new DemoApiError(404, "CHILD_NOT_FOUND", "연결된 자녀 정보를 찾을 수 없습니다.");
    return dashboardForStudent(state, studentId, "PARENT") as T;
  }

  if (pathname === "/api/me/notification-settings") {
    if (method === "PUT") state.notificationSettings[currentUser.id] = { ...bodyOf<Pick<typeof state.notificationSettings[string], "observationEnabled" | "growthEnabled" | "serviceEnabled">>(init), updatedAt: new Date().toISOString() };
    writeState(state); return state.notificationSettings[currentUser.id] as T;
  }
  if (pathname === "/api/me/notifications") return (state.notifications[currentUser.id] ?? []) as T;
  if (pathname === "/api/me/notifications/read-all" && method === "POST") { const readAt = new Date().toISOString(); let readCount = 0; (state.notifications[currentUser.id] ?? []).forEach((item) => { if (!item.readAt) { item.readAt = readAt; readCount += 1; } }); writeState(state); return { readCount, readAt } as T; }
  const notificationMatch = pathname.match(/^\/api\/me\/notifications\/([^/]+)\/read$/);
  if (notificationMatch && method === "POST") { const item = requireItem((state.notifications[currentUser.id] ?? []).find((notification) => notification.id === decodeURIComponent(notificationMatch[1])), "알림을 찾을 수 없습니다."); item.readAt = item.readAt ?? new Date().toISOString(); writeState(state); return item as T; }
  if (pathname === "/api/me/profile" && method === "PUT") { Object.assign(currentUser, bodyOf<Pick<UserProfile, "name" | "email">>(init), { updatedAt: new Date().toISOString() }); writeState(state); return publicProfile(currentUser) as T; }
  if (pathname === "/api/me/profile-image" && method === "PUT") { currentUser.hasProfileImage = true; currentUser.profileImageUpdatedAt = new Date().toISOString(); writeState(state); return publicProfile(currentUser) as T; }
  if (pathname === "/api/me/password" && method === "PUT") return undefined as T;
  if (pathname === "/api/me" && method === "DELETE") return undefined as T;

  if (pathname === "/api/settings/report-ai") {
    if (method === "PUT") { const request = bodyOf<{ tone: string; promptTemplate: string }>(init); state.reportAiSetting = { ...request, updatedByName: currentUser.name, updatedAt: new Date().toISOString() }; writeState(state); }
    return state.reportAiSetting as T;
  }
  if (pathname === "/api/settings/activity-logs") return pageOf(demoActivityLogs, url) as T;

  throw new DemoApiError(404, "DEMO_ENDPOINT_NOT_FOUND", `데모에서 지원하지 않는 요청입니다: ${method} ${pathname}`);
}

export async function handleDemoDownload(path: string): Promise<Blob> {
  if (path.includes("/profile-image")) {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="160" height="160" rx="80" fill="#e8f1ff"/><circle cx="80" cy="62" r="28" fill="#75a7ef"/><path d="M30 145c7-33 26-49 50-49s43 16 50 49" fill="#75a7ef"/></svg>';
    return new Blob([svg], { type: "image/svg+xml" });
  }
  if (path.includes("/reports/export")) return new Blob(["리포트 ID,학생명,상태\nREPORT-2026-09-001,김지훈,공개\nREPORT-2026-09-002,김예린,공개\n"], { type: "text/csv;charset=utf-8" });
  if (path.includes("/students/bulk/template")) return new Blob(["학생코드,이름,생년월일,나이\nSTU-DEMO-001,홍길동,2015-01-01,11\n"], { type: "text/csv;charset=utf-8" });
  return new Blob([], { type: "application/octet-stream" });
}
