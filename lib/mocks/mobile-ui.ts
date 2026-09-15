export const competencyData = [
  { code: "I", name: "주도성", level: "L3", value: 72, color: "#2f80ed", description: "스스로 목표를 설정하고 자발적으로 문제 해결에 도전하는 역량" },
  { code: "N", name: "탐구력", level: "L3", value: 78, color: "#20a99f", description: "궁금한 점을 질문하고 다양한 방법으로 답을 찾아가는 역량" },
  { code: "C", name: "협업력", level: "L4", value: 86, color: "#7c6ee6", description: "친구의 의견을 존중하고 함께 역할을 나누어 완성하는 역량" },
  { code: "I", name: "상상력", level: "L2", value: 58, color: "#ec6d93", description: "익숙한 대상에서 새로운 가능성과 아이디어를 발견하는 역량" },
  { code: "T", name: "사고력", level: "L3", value: 69, color: "#f59e0b", description: "근거를 비교하고 순서를 세워 문제를 논리적으로 해결하는 역량" },
  { code: "E", name: "표현력", level: "L2", value: 54, color: "#0ea5a5", description: "생각과 감정을 상황에 맞는 말과 행동으로 전달하는 역량" },
  { code: "S", name: "지속력", level: "L4", value: 91, color: "#4f8bea", description: "어려움이 있어도 방법을 바꾸며 끝까지 시도하는 역량" },
] as const;

export const parentChildren = [
  { id: "STU-2026-001", name: "김지훈", detail: "초등 5학년 | 박지수 수석강사" },
  { id: "STU-2026-014", name: "김지은", detail: "초등 3학년 | 이수현 강사" },
  { id: "STU-2026-027", name: "김지호", detail: "초등 1학년 | 최민서 강사" },
] as const;

export const recentMoments = [
  { title: "스마트 시티 자율주행 모듈 제어", date: "2026. 08. 07", body: "라인트레이싱 오류 발생 시 모터 센서값을 10번 이상 직접 재측정하며 오류 원인을 찾아냈습니다. 조원들과 친절하게 의견을 나누는 모습이 인상적이었습니다." },
  { title: "우리가 만드는 친환경 에너지", date: "2026. 07. 24", body: "서로 다른 의견을 표로 정리하고 친구들이 이해하기 쉬운 말로 설명하며 팀의 결정을 이끌었습니다." },
] as const;
