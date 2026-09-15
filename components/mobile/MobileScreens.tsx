"use client";

import { formatStudentAge } from "@/lib/student";

import { useAnimatedChartValues } from "@/components/charts/useAnimatedChartValues";
import { Icon } from "@/components/Icon";
import { CompetencySymbol } from "@/components/competencies/CompetencySymbol";
import { showToast } from "@/components/feedback/Toast";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  apiErrorMessage,
  getCompetencyCatalog,
  getMyChildren,
  getMyGrowth,
  getParentDashboard,
  getReport,
  getReports,
  getStudentDashboard,
  requestGuardianConnection,
  updatePhotoConsent,
  type GrowthReportDetail,
  type CompetencyCatalogItem,
  type ParentChild,
  type PhotoConsentStatus,
  type StudentGrowth,
  type UserGrowthDashboard,
} from "@/lib/incites-api";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useId, useState } from "react";

type CompetencyBadgeItem = {
  code: string;
  name: string;
  currentLevel: string | null;
};

type CompetencyRadarItem = CompetencyBadgeItem & {
  averageScore: number;
};

function formatReportPublishedAt(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Seoul",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}. ${part("month")}. ${part("day")} | ${part("hour")}:${part("minute")}:${part("second")}`;
}

function formatYearMonth(value: string | null | undefined) {
  const date = value ? new Date(value) : new Date();
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    timeZone: "Asia/Seoul",
  }).format(date);
}

function formatCompactDate(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}. ${part("month")}. ${part("day")}`;
}

function CompetencyBadgeGrid({ competencies }: { competencies: CompetencyBadgeItem[] }) {
  if (!competencies.some((item) => item.currentLevel)) {
    return <div className="mobile-api-pending"><Icon name="growth" /><strong>아직 표시할 역량 기록이 없습니다.</strong><span>관찰 기록이 쌓이면 7대 역량 배지가 표시됩니다.</span></div>;
  }

  return (
    <div className="mobile-badge-grid" aria-label="7대 핵심 역량 배지">
      {competencies.map((item) => (
        <article className="mobile-competency-badge" key={item.code} aria-label={`${item.name} 역량 ${item.currentLevel ?? "미평가"}`}>
          <CompetencySymbol code={item.code} />
          <strong className="mobile-competency-level">{item.currentLevel ?? "-"}</strong>
        </article>
      ))}
    </div>
  );
}

function CompetencyRadar({ competencies, compact = false }: { competencies: CompetencyRadarItem[]; compact?: boolean }) {
  const gradientId = useId().replaceAll(":", "");
  const items = competencies.slice(0, 7);
  const targetValues = items.map((item) => Math.max(0, Math.min(100, item.averageScore)));
  const values = useAnimatedChartValues(targetValues);

  if (!items.some((item) => item.currentLevel)) {
    return <div className="mobile-api-pending"><Icon name="growth" /><strong>아직 표시할 역량 기록이 없습니다.</strong><span>관찰 기록이 쌓이면 7대 역량 레이더가 표시됩니다.</span></div>;
  }

  const centerX = 150;
  const centerY = 116;
  const radius = compact ? 74 : 82;
  const point = (value: number, index: number, customRadius = radius) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / values.length;
    const scaled = (customRadius * value) / 100;
    return [centerX + Math.cos(angle) * scaled, centerY + Math.sin(angle) * scaled] as const;
  };
  const ring = (ratio: number) => values.map((_, index) => point(ratio * 100, index).join(",")).join(" ");

  return (
    <div className={`mobile-radar ${compact ? "compact" : ""}`}>
      <svg viewBox="0 0 300 250" role="img" aria-label="7대 핵심 역량 레이더 차트">
        <defs><linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#4d91f7" stopOpacity=".72"/><stop offset="1" stopColor="#72abfb" stopOpacity=".42"/></linearGradient></defs>
        {[.25, .5, .75, 1].map((ratio) => <polygon key={ratio} points={ring(ratio)} className="mobile-radar-ring" />)}
        {values.map((_, index) => { const outer = point(100, index); return <line key={items[index].code} x1={centerX} y1={centerY} x2={outer[0]} y2={outer[1]} className="mobile-radar-axis" />; })}
        <polygon points={values.map((value, index) => point(value, index).join(",")).join(" ")} fill={`url(#${gradientId})`} className="mobile-radar-value" />
        {values.map((value, index) => { const [x, y] = point(value, index); return <circle key={`point-${items[index].code}`} cx={x} cy={y} r="4" className="mobile-radar-point" />; })}
        {items.map((item, index) => { const [x, y] = point(100, index, 107); return <text key={item.code} x={x} y={y} textAnchor="middle" dominantBaseline="middle"><tspan>{item.code.replace("2", "")} </tspan>{item.name}</text>; })}
      </svg>
      <span className="mobile-radar-legend"><i />현재 성장 역량</span>
    </div>
  );
}

function CompetencyDetailGrid({ competencies, catalog }: { competencies: CompetencyBadgeItem[]; catalog: CompetencyCatalogItem[] }) {
  return (
    <div className="mobile-competency-grid">
      {competencies.map((item) => (
        <article className="mobile-competency-card" key={item.code}>
          <div className="mobile-competency-title">
            <CompetencySymbol code={item.code} size={32} />
            <strong>{item.name}</strong>
            <em>{item.currentLevel ?? "-"}</em>
          </div>
          <p>{catalog.find((entry) => entry.code === item.code)?.description ?? "아직 등록된 역량 설명이 없습니다."}</p>
        </article>
      ))}
    </div>
  );
}

export function StudentHomeScreen() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<UserGrowthDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    void getStudentDashboard().then((result) => { if (active) setDashboard(result); })
      .catch((reason) => { if (active) showToast(apiErrorMessage(reason, "성장 정보를 불러오지 못했습니다."), { tone: "error" }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return (
    <div className="mobile-screen student-home-screen">
      <section className="mobile-summary-card">
        <span><Icon name="sparkles" />안녕, {user?.name ?? "학생"}!</span>
        <h1>지금까지 {dashboard?.observationCount ?? 0}번의<br />성장 순간이 기록되었어요.</h1>
        <p>{dashboard?.lastObservedAt ? `최근 관찰일 ${new Date(dashboard.lastObservedAt).toLocaleDateString("ko-KR")}` : "첫 관찰 기록을 기다리고 있어요."}</p>
      </section>
      <section className="mobile-section">
        <h2><Icon name="activity" />나의 7대 능력 별 배지</h2>
        <div className="mobile-white-card mobile-competency-badge-card">{dashboard ? <CompetencyBadgeGrid competencies={dashboard.competencies} /> : loading ? <span className="spinner" /> : <CompetencyBadgeGrid competencies={[]} />}</div>
      </section>
    </div>
  );
}

export function ParentHomeScreen() {
  const searchParams = useSearchParams();
  const requestedStudentId = searchParams.get("studentId");
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<UserGrowthDashboard | null>(null);
  const [latestReport, setLatestReport] = useState<GrowthReportDetail | null>(null);
  const [dashboardSettledFor, setDashboardSettledFor] = useState<string | null>(null);
  const child = children[selected] ?? null;
  const selectedDashboard = child && dashboard?.studentId === child.id ? dashboard : null;
  const selectedReport = child && latestReport?.studentId === child.id ? latestReport : null;
  const dashboardLoading = Boolean(child && dashboardSettledFor !== child.id);

  useEffect(() => {
    let active = true;
    void getMyChildren().then((result) => {
      if (!active) return;
      setChildren(result);
      const requestedIndex = requestedStudentId
        ? result.findIndex((item) => item.id === requestedStudentId)
        : -1;
      if (requestedIndex >= 0) setSelected(requestedIndex);
    }).catch((reason) => {
      if (active) showToast(apiErrorMessage(reason, "연결된 자녀 정보를 불러오지 못했습니다."), { tone: "error" });
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [requestedStudentId]);

  useEffect(() => {
    if (!child) return;
    let active = true;
    void getParentDashboard(child.id).then(async (result) => {
      let report: GrowthReportDetail | null = null;
      if (result.latestReport) {
        try {
          report = await getReport(result.latestReport.id);
        } catch (reason) {
          if (active) showToast(apiErrorMessage(reason, "최신 성장 리포트 요약을 불러오지 못했습니다."), { tone: "error" });
        }
      }
      if (!active) return;
      setDashboard(result);
      setLatestReport(report);
      setDashboardSettledFor(child.id);
    }).catch((reason) => {
      if (!active) return;
      setLatestReport(null);
      setDashboardSettledFor(child.id);
      showToast(apiErrorMessage(reason, "자녀 성장 정보를 불러오지 못했습니다."), { tone: "error" });
    });
    return () => { active = false; };
  }, [child]);

  const summaryMonth = formatYearMonth(selectedReport?.periodEnd ?? selectedDashboard?.to);
  const summaryTitle = selectedReport?.strengths
    ?? (child ? `${child.name} 학생의 성장 기록을 준비하고 있습니다.` : "자녀를 연결하고 성장 기록을 확인해보세요.");
  const summaryDescription = selectedReport
    ? `${selectedReport.summary} ${selectedReport.nextSteps}`
    : dashboardLoading
      ? "최신 성장 요약을 불러오고 있습니다."
      : child
        ? "새로운 성장 리포트가 공개되면 이곳에서 바로 확인할 수 있습니다."
        : "자녀 연결이 승인되면 월간 성장 요약과 역량 변화를 확인할 수 있습니다.";
  const reportHref = selectedReport ? `/parent/report?reportId=${encodeURIComponent(selectedReport.id)}` : "/parent/report";

  return (
    <div className="mobile-screen parent-home-screen">
      <div className="mobile-parent-child-picker" aria-label="자녀 선택" aria-busy={loading}>
        {loading ? <div className="mobile-parent-child-loading"><span className="spinner" /><span>자녀 정보 로딩 중</span></div> : children.map((item, index) => (
          <button type="button" key={item.id} className={index === selected ? "active" : ""} aria-pressed={index === selected} onClick={() => setSelected(index)}>
            <span className="mobile-parent-child-avatar" aria-hidden="true">{item.name.trim().slice(0, 1) || "?"}</span>
            <strong>{item.name}</strong>
            <small>{formatStudentAge(item.age)}</small>
          </button>
        ))}
        <Link href="/parent/children" aria-label="자녀 추가">
          <span className="mobile-parent-child-avatar"><Icon name="plus" /></span>
          <strong>자녀 추가</strong>
        </Link>
      </div>
      <section className="mobile-summary-card parent-summary" aria-busy={dashboardLoading}>
        <span><Icon name="sparkles" />{summaryMonth} 성장 요약</span>
        <h1>{summaryTitle}</h1>
        <p>{summaryDescription}</p>
        <Link href={reportHref}>{summaryMonth.replace(/^\d{4}년\s*/, "")} 종합 리포트 전체 보기</Link>
      </section>
      <section className="mobile-section">
        <div className="mobile-section-head"><h2>7대 핵심 역량 레이더</h2><Link href="/parent/growth">성장 대시보드 <Icon name="chevron-right" /></Link></div>
        <div className="mobile-white-card mobile-radar-card">{selectedDashboard ? <CompetencyRadar competencies={selectedDashboard.competencies} compact /> : child && dashboardLoading ? <span className="spinner" /> : child ? <div className="mobile-api-pending"><Icon name="growth" /><strong>아직 표시할 역량 기록이 없습니다.</strong><span>관찰 기록이 쌓이면 역량 레이더가 표시됩니다.</span></div> : <div className="mobile-api-pending"><Icon name="users" /><strong>연결된 자녀가 없습니다.</strong><span>자녀 연결이 승인되면 역량 레이더가 표시됩니다.</span></div>}</div>
      </section>
      <section className="mobile-section recent-moments">
        <div className="mobile-section-head"><h2>선생님이 기록한 순간</h2></div>
        <div className="mobile-recent-list">
          {selectedDashboard?.recentObservations.length ? selectedDashboard.recentObservations.slice(0, 2).map((item) => <article className="mobile-white-card" key={item.observationId}><div><strong>{item.topic}</strong><time>{formatCompactDate(item.lessonAt)}</time></div><p>“{item.comment}”</p></article>) : <article className="mobile-white-card empty"><p>표시할 최근 관찰 기록이 없습니다.</p></article>}
        </div>
      </section>
    </div>
  );
}

export function GrowthScreen({ role }: { role: "student" | "parent" }) {
  const [growth, setGrowth] = useState<StudentGrowth | null>(null);
  const [catalog, setCatalog] = useState<CompetencyCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [emptyMessage, setEmptyMessage] = useState("아직 표시할 성장 기록이 없습니다.");
  useEffect(() => {
    let active = true;
    async function loadGrowth(): Promise<StudentGrowth | null> {
      if (role === "student") return getMyGrowth();
      const children = await getMyChildren();
      if (!children[0]) {
        if (active) setEmptyMessage("연결된 자녀가 없어 표시할 성장 기록이 없습니다.");
        return null;
      }
      const data = await getParentDashboard(children[0].id);
      return {
        studentId: data.studentId, studentCode: data.studentCode, studentName: data.studentName, from: data.from, to: data.to,
        observationCount: data.observationCount, lastObservedAt: data.lastObservedAt,
        competencies: data.competencies.map((item) => ({ ...item, previousAverageScore: null })), recentObservations: data.recentObservations,
      };
    }
    void Promise.all([loadGrowth(), getCompetencyCatalog()]).then(([result, competencyCatalog]) => {
      if (!active) return;
      setGrowth(result);
      setCatalog(competencyCatalog.competencies);
    })
      .catch((reason) => { if (active) showToast(apiErrorMessage(reason, "성장 정보를 불러오지 못했습니다."), { tone: "error" }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [role]);
  const hasGrowthData = growth?.competencies.some((item) => item.currentLevel) ?? false;

  return (
    <div className="mobile-screen growth-screen">
      <section className="mobile-title-strip"><h1>{growth?.studentName ?? (role === "student" ? "나" : "자녀")}의 7개 역량 성장 종합</h1><p>지난달(회색) 대비 이번달(파란색) 성장 지표 비교</p></section>
      {growth && hasGrowthData ? (
        <>
          <div className="mobile-white-card mobile-radar-card"><CompetencyRadar competencies={growth.competencies} /></div>
          <section className="mobile-section"><h2>영역별 성장 레벨 상세</h2><CompetencyDetailGrid competencies={growth.competencies} catalog={catalog} /></section>
        </>
      ) : loading ? (
        <div className="mobile-white-card mobile-growth-state"><span className="spinner" /></div>
      ) : (
        <div className="mobile-white-card mobile-growth-state"><div className="mobile-api-pending"><Icon name="growth" /><strong>{emptyMessage}</strong><span>관찰 기록 또는 자녀 연결이 준비되면 이곳에 표시됩니다.</span></div></div>
      )}
    </div>
  );
}

export function ReportScreen({ role }: { role: "student" | "parent" }) {
  const searchParams = useSearchParams();
  const [report, setReport] = useState<GrowthReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [emptyMessage, setEmptyMessage] = useState("공개된 리포트가 없습니다.");
  useEffect(() => {
    let active = true;
    const requestedReportId = searchParams.get("reportId");

    async function loadReport() {
      if (requestedReportId) return getReport(requestedReportId);
      if (role === "student") {
        const page = await getReports({ status: "PUBLISHED", size: 1 });
        return page.items[0] ? getReport(page.items[0].id) : null;
      }
      const children = await getMyChildren();
      if (!children[0]) {
        if (active) setEmptyMessage("연결된 자녀가 없어 표시할 리포트가 없습니다.");
        return null;
      }
      const page = await getReports({ studentId: children[0].id, status: "PUBLISHED", size: 1 });
      return page.items[0] ? getReport(page.items[0].id) : null;
    }

    void loadReport()
      .then((result) => { if (active) setReport(result); })
      .catch((reason) => { if (active) showToast(apiErrorMessage(reason, "리포트를 불러오지 못했습니다."), { tone: "error" }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [role, searchParams]);

  const reportMonth = report ? new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    timeZone: "Asia/Seoul",
  }).format(new Date(report.periodEnd)) : "성장";
  const publishedAt = report?.publishedAt ?? report?.updatedAt;

  async function shareReport() {
    if (!report) return;
    const shareData = {
      title: `${report.studentName}의 ${reportMonth} 성장 리포트`,
      text: report.summary,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      showToast("리포트 주소를 복사했습니다.", { tone: "success" });
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      showToast("리포트를 공유하지 못했습니다.", { tone: "error" });
    }
  }

  function printReport() {
    if (!report) return;
    window.print();
  }

  return (
    <div className="mobile-screen report-screen">
      <section className="mobile-report-toolbar">
        <div>
          <h1>{report ? `${reportMonth} 성찰 리포트` : "성장 리포트"}</h1>
          <p>{publishedAt ? `발행일: ${formatReportPublishedAt(publishedAt)}` : "공개된 최신 성장 리포트"}</p>
        </div>
        <button className="share" type="button" disabled={!report} onClick={() => void shareReport()} aria-label="리포트 공유"><Icon name="share" /></button>
        <button type="button" disabled={!report} onClick={printReport}><Icon name="download" />PDF 저장</button>
      </section>
      {report ? (
        <article className="mobile-white-card mobile-report-card">
          <header>
            <h2>{report.studentName}의 <strong>{reportMonth} 성장 리포트</strong></h2>
            <p>담당 강사: {report.teacherName ?? "미배정"}{report.teacherPosition ? ` ${report.teacherPosition}` : ""} <i /> 나이: {formatStudentAge(report.studentAge)}</p>
          </header>
          <section className="mobile-report-summary">
            <h3><Icon name="sparkles" />이번달 총평 및 성장 소평</h3>
            <p>{report.summary}</p>
          </section>
          <CompetencyRadar competencies={report.competencies} />
        </article>
      ) : (
        <article className="mobile-white-card mobile-report-card mobile-report-empty">{loading ? <><span className="spinner" /><strong>리포트를 불러오고 있습니다.</strong></> : <><Icon name="file" /><strong>{emptyMessage}</strong><p>교사가 검토 후 공개하면 이곳에서 확인할 수 있습니다.</p></>}</article>
      )}
    </div>
  );
}

export function ParentChildrenScreen() {
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [pendingConnections, setPendingConnections] = useState<Array<{ id: string; studentCode: string; studentName: string }>>([]);
  const [adding, setAdding] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [consentDialogOpen, setConsentDialogOpen] = useState(false);
  const [connectionCode, setConnectionCode] = useState("");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadChildren = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMyChildren();
      setChildren(result);
      setSelectedChildId((current) => current && result.some((child) => child.id === current) ? current : null);
    } catch (reason) {
      showToast(apiErrorMessage(reason, "연결된 자녀 정보를 불러오지 못했습니다."), { tone: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadChildren(), 0);
    return () => window.clearTimeout(timer);
  }, [loadChildren]);

  async function addChild(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setConnectionError(null);
    try {
      const connection = await requestGuardianConnection(connectionCode.trim());
      setPendingConnections((current) => [...current.filter((item) => item.id !== connection.id), {
        id: connection.id,
        studentCode: connection.studentCode,
        studentName: connection.studentName,
      }]);
      setConnectionCode("");
      setAdding(false);
      showToast("자녀 연결을 요청했습니다. 관리자 승인 후 목록에 표시됩니다.");
    } catch (reason) {
      setConnectionError(apiErrorMessage(reason, "등록된 학생 정보를 찾을 수 없습니다."));
    } finally {
      setSaving(false);
    }
  }

  async function changeConsent(status: Exclude<PhotoConsentStatus, "PENDING">) {
    const child = children.find((item) => item.id === selectedChildId);
    if (!child) return false;
    setSaving(true);
    try {
      await updatePhotoConsent(child.id, status);
      setChildren((current) => current.map((item) => item.id === child.id ? { ...item, photoConsentStatus: status } : item));
      showToast(status === "CONSENTED" ? `${child.name} 학생의 수업 사진 촬영에 동의했습니다.` : `${child.name} 학생의 수업 사진 촬영 동의를 해제했습니다.`);
      return true;
    } catch (reason) {
      showToast(apiErrorMessage(reason, "촬영 동의 상태를 변경하지 못했습니다."), { tone: "error" });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function confirmConsent() {
    if (await changeConsent("CONSENTED")) setConsentDialogOpen(false);
  }

  const selectedChild = children.find((child) => child.id === selectedChildId) ?? null;

  return (
    <div className="mobile-screen children-screen">
      <header className="children-heading"><h1>자녀 연결 및 정보 관리</h1><p>인증코드로 자녀를 연결하고 수업 촬영 동의서를 관리합니다.</p></header>
      <section className="mobile-white-card children-connections" aria-busy={loading}>
        <div className="mobile-child-list">
          {loading && <article><span className="spinner" /><div><strong>자녀 정보를 불러오고 있습니다.</strong></div></article>}
          {!loading && children.map((child) => (
            <article className={selectedChild?.id === child.id ? "selected" : ""} key={child.id}>
              <button type="button" className="mobile-child-select" aria-pressed={selectedChild?.id === child.id} onClick={() => setSelectedChildId(child.id)}>
                <span className="mobile-child-avatar">{child.name.slice(0, 1)}</span>
                <div><strong>{child.name} <em>{child.studentCode}</em></strong><small>{formatStudentAge(child.age)} | {child.teacherName ? `${child.teacherName} 강사` : "담당 강사 미배정"}</small></div>
                <b>연결 완료</b>
              </button>
            </article>
          ))}
          {pendingConnections.map((connection) => <article key={connection.id}><span className="mobile-child-avatar">{connection.studentName.slice(0, 1)}</span><div><strong>{connection.studentName} <em>{connection.studentCode}</em></strong><small>관리자 승인 후 자녀 정보가 표시됩니다.</small></div><b className="pending">대기중</b></article>)}
          {!loading && !children.length && !pendingConnections.length && <article className="empty"><span className="mobile-child-avatar"><Icon name="link" /></span><div><strong>연결된 자녀가 없습니다.</strong><small>학생 코드를 입력해 자녀 연결을 요청해주세요.</small></div></article>}
        </div>
        <button type="button" className="children-add-button" onClick={() => { setConnectionError(null); setAdding(true); }}><Icon name="user" /><Icon name="plus" />자녀 추가 연결</button>
      </section>

      {selectedChild && (
        <section className="mobile-consent-section" aria-busy={saving}>
          <h2>수업 사진 촬영 및 활용 동의서</h2>
          <div className="mobile-white-card consent-card">
            <label className="consent-child-field">
              <span>학생 선택</span>
              <button type="button" onClick={() => setPickerOpen(true)} disabled={saving}><strong>{selectedChild.name}</strong><Icon name="chevron-right" /></button>
            </label>
            <fieldset>
              <legend>동의 상태</legend>
              <div className="consent-options">
                <button type="button" className={selectedChild.photoConsentStatus === "CONSENTED" ? "active consented" : ""} disabled={saving} onClick={() => setConsentDialogOpen(true)}><span>동의함</span><i><Icon name="check" /></i></button>
                <button type="button" className={selectedChild.photoConsentStatus === "DENIED" ? "active denied" : ""} disabled={saving} onClick={() => void changeConsent("DENIED")}><span>동의하지 않음</span><i><Icon name="check" /></i></button>
              </div>
            </fieldset>
            <p><Icon name="info" />학부모 동의 철회 시, 교사 및 센터 관리자 화면에서 학생의 수업 사진 촬영 업로드 기능이 즉시 차단 통제됩니다.</p>
          </div>
        </section>
      )}

      {pickerOpen && selectedChild && (
        <div className="mobile-sheet-backdrop" role="presentation">
          <section className="mobile-bottom-sheet child-picker-sheet" role="dialog" aria-modal="true" aria-labelledby="child-picker-title">
            <header><h2 id="child-picker-title">학생 선택</h2><button type="button" onClick={() => setPickerOpen(false)} aria-label="닫기"><Icon name="close" /></button></header>
            <div className="child-picker-options">
              {children.map((child) => <button type="button" className={child.id === selectedChild.id ? "active" : ""} key={child.id} onClick={() => setSelectedChildId(child.id)}><strong>{child.name}</strong><span>{formatStudentAge(child.age)}</span></button>)}
            </div>
            <button type="button" className="sheet-submit" onClick={() => setPickerOpen(false)}>완료</button>
          </section>
        </div>
      )}

      {adding && (
        <div className="mobile-sheet-backdrop" role="presentation">
          <form className="mobile-bottom-sheet child-code-sheet" role="dialog" aria-modal="true" aria-labelledby="child-code-title" onSubmit={(event) => void addChild(event)}>
            <header><h2 id="child-code-title">학생 코드 입력</h2><button type="button" onClick={() => setAdding(false)} aria-label="닫기"><Icon name="close" /></button></header>
            <input value={connectionCode} maxLength={40} onChange={(event) => { setConnectionCode(event.target.value.toUpperCase()); setConnectionError(null); }} placeholder="STU-2026-001" aria-label="학생 코드" autoCapitalize="characters" autoComplete="off" autoFocus required />
            {connectionError && <div className="sheet-error" role="alert"><Icon name="alert-circle" />{connectionError}</div>}
            <button type="submit" className="sheet-submit" disabled={!connectionCode.trim() || saving}>{saving ? "연결 요청 중..." : "완료"}</button>
          </form>
        </div>
      )}

      {consentDialogOpen && selectedChild && (
        <div className="mobile-dialog-backdrop" role="presentation">
          <section className="mobile-dialog consent-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="consent-dialog-title">
            <button type="button" className="close" onClick={() => setConsentDialogOpen(false)} aria-label="닫기"><Icon name="close" /></button>
            <Icon name="camera" />
            <h2 id="consent-dialog-title">수업 사진 촬영 및 활용에<br />동의하시겠어요?</h2>
            <p>{selectedChild.name} 학생의 수업 활동 사진은 관찰 기록과 성장 리포트 작성에 활용됩니다. 동의 상태는 언제든 변경할 수 있습니다.</p>
            <div><button type="button" onClick={() => setConsentDialogOpen(false)} disabled={saving}>취소</button><button type="button" onClick={() => void confirmConsent()} disabled={saving}>{saving ? "처리 중..." : "동의"}</button></div>
          </section>
        </div>
      )}
    </div>
  );
}
