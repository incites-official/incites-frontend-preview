export const studentFixtures = [
  { id: "STU-2026-001", name: "김지훈", grade: "초등 5학년", guardian: "이수진", phone: "010-0000-0000", teacher: "박지수 수석강사", birthDate: "2015. 05. 12", records: 14, lastRecord: "2026. 08. 07", connected: true, consent: "동의" },
  { id: "STU-2026-002", name: "김예린", grade: "초등 5학년", guardian: "김은정", phone: "010-2134-7821", teacher: "박지수 수석강사", birthDate: "2015. 09. 03", records: 12, lastRecord: "2026. 08. 05", connected: true, consent: "보류" },
  { id: "STU-2026-003", name: "박민우", grade: "초등 5학년", guardian: "박선희", phone: "010-9032-1150", teacher: "박지수 수석강사", birthDate: "2015. 02. 27", records: 9, lastRecord: "2026. 07. 31", connected: false, consent: "미동의" },
  { id: "STU-2026-004", name: "이서현", grade: "초등 5학년", guardian: "이승민", phone: "010-3857-0091", teacher: "박지수 수석강사", birthDate: "2015. 11. 18", records: 15, lastRecord: "2026. 08. 08", connected: true, consent: "동의" },
] as const;

export const guardianConnectionFixtures = [
  { id: "CON-2026-031", guardian: "이수진", student: "김지훈", requestedAt: "2026-08-03 09:12", status: "대기" },
  { id: "CON-2026-032", guardian: "김은정", student: "김예린", requestedAt: "2026-08-04 11:45", status: "대기" },
] as const;

export const sessionFixtures = [
  { id: "SES-2026-008", title: "8회차 · 아이디어 프로토타입 발표", date: "2026. 08. 09", summary: "팀의 결과물을 소개하고 동료의 질문에 근거를 들어 답했습니다.", levels: "I·N·C" },
  { id: "SES-2026-007", title: "7회차 · 센서 데이터 탐구", date: "2026. 08. 02", summary: "측정값의 차이를 비교하고 반복 실험으로 오류 원인을 찾았습니다.", levels: "N·T·S" },
  { id: "SES-2026-006", title: "6회차 · 스마트 시티 자율주행 모듈 제어", date: "2026. 07. 26", summary: "제어 순서를 팀원과 조율하고 실패한 조건을 다시 설계했습니다.", levels: "C·T·I" },
] as const;

export const studentReportFixtures = [
  { id: "rep-2026-07-01", title: "2026년 7월 성장 리포트", status: "Published", statusLabel: "공개", cycle: "2026년 7월" },
  { id: "rep-2026-08-draft", title: "2026년 8월 성장 리포트", status: "Reviewing", statusLabel: "검토 중", cycle: "2026년 8월" },
] as const;

export const recordAuditFixtures = [
  { id: "log-101", student: "김지훈", className: "스마트 시티 자율주행 모듈 제어 프로젝트 (5회차)", teacher: "박지수 수석강사", date: "2026.08.22", levels: "I, C, S, T", duration: "142초", body: "자율주행 환경에서 발생한 오류를 팀원과 분석하고 역할을 조정해 해결 방법을 찾았습니다." },
  { id: "log-102", student: "김예린", className: "센서 데이터로 안전한 길 설계 (6회차)", teacher: "이선영 강사", date: "2026.08.21", levels: "N, T, E", duration: "118초", body: "측정 결과를 표로 정리하고 친구들에게 실험 조건에 따른 차이를 설명했습니다." },
  { id: "log-103", student: "박민우", className: "문제 발견과 아이디어 스케치 (4회차)", teacher: "박지수 수석강사", date: "2026.08.19", levels: "I, N, E", duration: "156초", body: "생활 속 불편을 관찰하고 여러 해결 아이디어를 그림과 문장으로 표현했습니다." },
  { id: "log-104", student: "이서현", className: "협업 프로토타입 제작 (7회차)", teacher: "최유진 강사", date: "2026.08.18", levels: "C, S, T", duration: "133초", body: "팀원의 의견을 정리해 제작 순서를 정하고 맡은 작업을 끝까지 완성했습니다." },
] as const;

export const draftFixtures = [
  { id: "draft-001", student: "김지훈", session: "8회차 · 스마트 피지컬 코딩 미션", step: 6, updatedAt: "2026. 08. 26 14:32" },
  { id: "draft-002", student: "김예린", session: "7회차 · 센서 데이터 탐구", step: 4, updatedAt: "2026. 08. 25 17:10" },
] as const;

export const competencyFixtures = [
  { code: "I", name: "주도성", description: "스스로 목표를 정하고 행동을 시작하는 역량", level: "L3" },
  { code: "N", name: "탐구력", description: "질문을 만들고 근거를 찾아 확인하는 역량", level: "L3" },
  { code: "C", name: "협업력", description: "의견을 나누고 공동의 결과를 만드는 역량", level: "L3" },
  { code: "I2", name: "상상력", description: "새로운 가능성과 해결 방법을 떠올리는 역량", level: "L2" },
  { code: "T", name: "사고력", description: "정보를 비교하고 논리적으로 판단하는 역량", level: "L3" },
  { code: "E", name: "표현력", description: "생각과 결과를 명확하게 전달하는 역량", level: "L2" },
  { code: "S", name: "지속력", description: "실패 후에도 방법을 바꾸어 계속 시도하는 역량", level: "L3" },
] as const;

export const observationTags = ["질문 주도", "역할 조정", "근거 제시", "끝까지 시도", "친구 격려", "아이디어 확장", "오류 발견", "발표 참여"] as const;
