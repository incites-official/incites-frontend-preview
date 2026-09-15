"use client";

import { formatStudentAge } from "@/lib/student";

import { useAnimatedChartValues } from "@/components/charts/useAnimatedChartValues";
import { ActionListItem } from "@/components/common/ActionListItem";
import { DateRangePicker, type DateRangeValue } from "@/components/common/DateRangePicker";
import { showToast } from "@/components/feedback/Toast";
import { Icon } from "@/components/Icon";
import { useAuth } from "@/components/providers/AuthProvider";
import { useUiRole } from "@/components/providers/UiRoleProvider";
import { WorkspaceEmpty } from "@/components/workspace/WorkspaceUi";
import {
  apiErrorMessage,
  getAdminDashboard,
  getOperatorDashboard,
  type AdminDashboard,
  type DashboardTrendPoint,
  type OperatorDashboard,
} from "@/lib/incites-api";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const competencyLabels = [
  { code: "I", name: "주도성" },
  { code: "N", name: "탐구력" },
  { code: "C", name: "협업력" },
  { code: "I2", name: "상상력" },
  { code: "T", name: "사고력" },
  { code: "E", name: "표현력" },
  { code: "S", name: "지속력" },
] as const;

const generalAdminMetricRoutes = ["/admin/students", "/admin/observations/drafts", "/admin/reports"] as const;

function dateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function initialDashboardRange(now: Date): DateRangeValue {
  const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
  return { from: dateValue(twelveWeeksAgo), to: dateValue(now) };
}

function rangeForApi(range: DateRangeValue) {
  return {
    from: new Date(`${range.from}T00:00:00`).toISOString(),
    to: new Date(`${range.to}T23:59:59.999`).toISOString(),
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric" }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function useChartSize(defaultWidth: number, defaultHeight: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const updateSize = () => {
      const bounds = container.getBoundingClientRect();
      const styles = window.getComputedStyle(container);
      const width = bounds.width - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
      const height = bounds.height - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom);
      if (width <= 0 || height <= 0) return;
      setSize((current) => {
        const next = { width: Math.round(width), height: Math.round(height) };
        return current.width === next.width && current.height === next.height ? current : next;
      });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return { containerRef, ...size };
}

function TrendChart({ points }: { points: DashboardTrendPoint[] }) {
  const { containerRef, width, height } = useChartSize(900, 236);
  const compact = height < 200;
  const values = points.length === 1 ? [points[0], points[0]] : points;
  const plot = { left: 48, right: 18, top: 18, bottom: compact ? 36 : 48 };
  const maximum = Math.max(4, ...values.map((item) => item.count));
  const axisMaximum = Math.ceil(maximum / 4) * 4;
  const coordinates = values.map((item, index) => ({
    x: plot.left + (index * (width - plot.left - plot.right)) / Math.max(1, values.length - 1),
    y: height - plot.bottom - (item.count / axisMaximum) * (height - plot.top - plot.bottom),
  }));
  const line = coordinates.reduce((path, point, index) => {
    if (index === 0) return `M${point.x},${point.y}`;
    const previous = coordinates[index - 1];
    const beforePrevious = coordinates[index - 2] ?? previous;
    const next = coordinates[index + 1] ?? point;
    const firstControlX = previous.x + (point.x - beforePrevious.x) / 6;
    const firstControlY = previous.y + (point.y - beforePrevious.y) / 6;
    const secondControlX = point.x - (next.x - previous.x) / 6;
    const secondControlY = point.y - (next.y - previous.y) / 6;
    return `${path} C${firstControlX},${firstControlY} ${secondControlX},${secondControlY} ${point.x},${point.y}`;
  }, "");
  const floorY = height - plot.bottom;
  const area = `${line} L${coordinates.at(-1)?.x},${floorY} L${coordinates[0].x},${floorY} Z`;
  const yTicks = [axisMaximum, axisMaximum * .75, axisMaximum * .5, axisMaximum * .25, 0];
  const dataKey = points.map((point) => `${point.from}:${point.count}`).join("|");

  return (
    <div className="trend-chart" ref={containerRef} aria-label="기간별 관찰 기록 추이 그래프">
      <svg viewBox={`0 0 ${width} ${height}`} role="img">
        <defs><linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#86c5f7" stopOpacity=".55" /><stop offset="1" stopColor="#86c5f7" stopOpacity=".05" /></linearGradient></defs>
        {yTicks.map((tick) => {
          const y = floorY - (tick / axisMaximum) * (height - plot.top - plot.bottom);
          return <text key={tick} x="8" y={y} dominantBaseline="middle" className="chart-axis-label">{Math.round(tick)}</text>;
        })}
        {coordinates.map((point, index) => <g key={`${values[index].from}-${index}`}><line x1={point.x} x2={point.x} y1={plot.top} y2={floorY} className="chart-grid-line vertical" /><text x={point.x} y={height - 12} textAnchor="middle" className="chart-week-label">{index + 1}주</text></g>)}
        <g className="trend-series" key={dataKey}>
          <path d={area} fill="url(#trend-fill)" className="trend-area" />
          <path d={line} pathLength={1} className="trend-line" />
        </g>
      </svg>
    </div>
  );
}

function RadarChart({ values }: { values: number[] }) {
  const chartValues = values.slice(0, competencyLabels.length);
  const animatedValues = useAnimatedChartValues(chartValues);
  const cx = 160;
  const cy = 132;
  const radius = 88;
  const point = (value: number, index: number) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / chartValues.length;
    const scaled = (radius * value) / 100;
    return `${cx + Math.cos(angle) * scaled},${cy + Math.sin(angle) * scaled}`;
  };
  const ring = (ratio: number) => chartValues.map((_, index) => point(ratio * 100, index)).join(" ");

  return <div className="radar-chart"><svg viewBox="0 0 320 264" role="img" aria-label="INCITES 역량별 분포">
    {[.33, .66, 1].map((ratio) => <polygon key={ratio} points={ring(ratio)} className="radar-ring" />)}
    {chartValues.map((_, index) => <line key={index} x1={cx} y1={cy} x2={point(100, index).split(",")[0]} y2={point(100, index).split(",")[1]} className="radar-axis" />)}
    <polygon points={animatedValues.map(point).join(" ")} className="radar-value" />
    {animatedValues.map((value, index) => <circle key={`point-${index}`} cx={point(value, index).split(",")[0]} cy={point(value, index).split(",")[1]} r="3.2" className="radar-point" />)}
    {chartValues.map((_, index) => { const [x, y] = point(124, index).split(",").map(Number); const label = competencyLabels[index]; return <text key={label.code} x={x} y={y} textAnchor="middle" dominantBaseline="middle">{label.code === "I2" ? "I" : label.code} {label.name}</text>; })}
  </svg></div>;
}

function Metric({ label, value, detail, loading }: { label: string; value: number; detail: string; loading: boolean }) {
  return <article className="soft-card metric-card"><div className="metric-copy"><span>{label}</span>{loading ? <strong><i className="skeleton-number" /></strong> : <strong>{value.toLocaleString("ko-KR")}</strong>}<small className={value ? "positive" : "neutral"}><i />{detail}</small></div></article>;
}

function AdminDashboardView({ data, loading, period, setPeriod, onRefresh }: {
  data: AdminDashboard | null;
  loading: boolean;
  period: DateRangeValue;
  setPeriod: (value: DateRangeValue) => void;
  onRefresh: () => void;
}) {
  const hasTrend = Boolean(data?.observationTrend.some((item) => item.count > 0));
  const hasCompetencies = Boolean(data?.competencies.some((item) => item.assessmentCount > 0));
  const assessedCompetencies = data?.competencies.filter((item) => item.assessmentCount > 0) ?? [];
  const average = assessedCompetencies.length ? Math.round(assessedCompetencies.reduce((sum, item) => sum + item.averageScore, 0) / assessedCompetencies.length) : 0;
  const averageLevelNumber = Math.max(1, Math.min(4, Math.round(average / 25)));
  const averageLevel = `L${averageLevelNumber}`;
  const averageLevelLabel = ["", "시작", "발전", "심화", "확장"][averageLevelNumber];
  const weeklyAverage = data?.observationTrend.length ? (data.observationCount / data.observationTrend.length).toFixed(1) : "0";
  const queueTotal = (data?.pendingGuardianConnections ?? 0) + (data?.draftReports ?? 0) + (data?.unreadReports ?? 0);

  return <div className="dashboard-page role-dashboard page-stack sa-dashboard">
    <div className="page-heading role-dashboard-heading"><div><h2>운영 대시보드</h2><p>INCITES 플랫폼 전체 지표, 관찰 기록 동향 및 처리 대기 상태를 통합 모니터링합니다.</p></div><div className="dashboard-heading-actions"><DateRangePicker className="dashboard-period-field" value={period} onChange={setPeriod} /><button className={`dashboard-refresh-button ${loading ? "refreshing" : ""}`} type="button" onClick={onRefresh} disabled={loading} aria-label="대시보드 새로고침"><Icon name="refresh" /></button></div></div>
    <div className="metric-grid sa-metric-grid"><Metric label="활성 학생" value={data?.activeStudents ?? 0} detail={data?.activeStudents ? "현재 등록된 활성 학생" : "등록된 학생 없음"} loading={loading && !data} /><Metric label="활성 강사" value={data?.activeTeachers ?? 0} detail={data?.activeTeachers ? "현재 활동 중인 강사" : "등록된 강사 없음"} loading={loading && !data} /><Metric label="기간 내 관찰" value={data?.observationCount ?? 0} detail={data?.observationCount ? "선택 기간 누적 기록" : "작성된 관찰 없음"} loading={loading && !data} /><Metric label="공개 리포트" value={data?.publishedReports ?? 0} detail={(data?.draftReports ?? 0) ? `검토할 초안 ${data?.draftReports}건` : "검토 대기 초안 없음"} loading={loading && !data} /></div>
    <div className="sa-dashboard-grid">
      <section className="soft-card dashboard-panel trend-panel"><div className="dashboard-panel-heading"><div><h3>관찰 기록 추이</h3><p>주차별 교사 관찰 기록 건수 변화</p></div><Link href="/admin/records/audit">전체 로그 <Icon name="chevron-right" /></Link></div>{hasTrend && data ? <><TrendChart points={data.observationTrend} /><p className="chart-caption"><span>주당 평균 작성 건수: <strong>{weeklyAverage}건</strong></span></p></> : <WorkspaceEmpty icon="growth" title="선택한 기간에 관찰 기록이 없습니다." description="관찰 기록이 생성되면 기간별 추이를 이곳에서 확인할 수 있습니다." />}</section>
      <section className="soft-card dashboard-panel competency-panel"><div className="dashboard-panel-heading"><div><h3>INCITES 역량별 분포</h3><p>전체 학생의 핵심 역량별 평균 성장 레벨</p></div>{hasCompetencies && <span className="level-badge">전체평균: {averageLevel}({averageLevelLabel})</span>}</div>{hasCompetencies && data ? <div className="competency-content"><RadarChart values={competencyLabels.map((label) => data.competencies.find((item) => item.code === label.code)?.averageScore ?? 0)} /><div className="competency-legend" aria-label="역량 범례">{competencyLabels.slice(0, 4).map((label) => { const item = data.competencies.find((competency) => competency.code === label.code); return <span key={label.code}><i />{label.name} {Math.round(item?.averageScore ?? 0)}%</span>; })}</div></div> : <WorkspaceEmpty icon="growth" title="아직 역량 평가 데이터가 없습니다." description="관찰 기록에 역량을 평가하면 평균 분포가 표시됩니다." />}</section>
    </div>
    <div className="sa-dashboard-lower">
      <section className="soft-card dashboard-panel activity-log-panel"><div className="dashboard-panel-heading"><h3>최근 활동 로그</h3></div>{data?.recentActivities.length ? <div className="activity-log-list">{data.recentActivities.slice(0, 3).map((item, index) => <div key={`${item.requestedAt}-${item.path}-${index}`}><span><i />{item.method} {item.path}</span><small>{item.userName ?? "비로그인"} · {item.status} · {formatDateTime(item.requestedAt)}</small></div>)}</div> : <WorkspaceEmpty icon="file" title="최근 활동 로그가 없습니다." description="관리자와 교사의 API 활동이 이곳에 기록됩니다." />}</section>
      <section className="soft-card dashboard-panel queue-panel"><div className="dashboard-panel-heading"><h3>처리 대기</h3><span>총 {queueTotal}건</span></div><div className="queue-list"><ActionListItem tone="blue" href="/admin/members/guardians" title={<>보호자 연결 대기 <strong>{data?.pendingGuardianConnections ?? 0}건</strong></>} description="신규 자녀 연결 신청 검토" /><ActionListItem tone="green" href="/admin/reports" title={<>리포트 초안 <strong>{data?.draftReports ?? 0}건</strong></>} description="내용 검토 및 공개" /><ActionListItem tone="orange" href="/admin/records/reports" title={<>미열람 리포트 <strong>{data?.unreadReports ?? 0}건</strong></>} description="보호자 알림 대상" /></div></section>
    </div>
  </div>;
}

function OperatorDashboardView({ data, loading, onRefresh }: { data: OperatorDashboard | null; loading: boolean; onRefresh: () => void }) {
  const metrics = [{ label: "담당 학생", value: data?.assignedStudentCount ?? 0, detail: "활성 학생", tone: "neutral" }, { label: "임시저장", value: data?.draftCount ?? 0, detail: "작성 중인 관찰 기록", tone: "success" }, { label: "검토 대기", value: data?.reportReviewCount ?? 0, detail: "성장 리포트 초안", tone: "warning" }];
  return <div className="dashboard-page role-dashboard page-stack ga-dashboard">
    <div className="page-heading role-dashboard-heading"><div><h2>선생님 대시보드</h2><p>수업 학생 관찰, 임시저장 기록 완료 및 성장 리포트를 빠르게 수행합니다.</p></div><div className="dashboard-heading-actions"><Link className="soft-button dark medium ga-new-observation-button" href="/admin/observations/write"><Icon name="plus" />새 관찰 기록 작성</Link><button className={`dashboard-refresh-button ${loading ? "refreshing" : ""}`} type="button" onClick={onRefresh} disabled={loading} aria-label="대시보드 새로고침"><Icon name="refresh" /></button></div></div>
    <div className="ga-overview-grid"><article className={`ga-class-card ${data?.latestLesson ? "" : "empty"}`}><span className="ga-class-icon"><Image src="/dashboard/class-book-icon.svg" alt="" width={24} height={24} /></span>{data?.latestLesson ? <div className="ga-class-copy"><small>{formatDateTime(data.latestLesson.lessonAt)} · {data.latestLesson.sessionRound}</small><h3>{data.latestLesson.topic}</h3><p><span>참여 {data.latestLesson.participantCount}명</span><span>관찰 {data.observationCount}건</span></p></div> : <div className="ga-class-empty"><strong>등록된 수업이 없습니다.</strong><span>첫 수업을 만들고 관찰 기록을 시작해보세요.</span></div>}<Image className="ga-class-illustration" src="/dashboard/report-review-illustration.svg" alt="" width={226} height={226} priority /></article>{metrics.map((metric, index) => <Link className={`soft-card ga-status-card ${metric.tone}`} href={generalAdminMetricRoutes[index]} key={metric.label}><div><span className={`status-dot ${metric.tone}`}><i />{metric.label}</span><span className="ga-status-arrow"><Icon name="arrow-up-right" /></span></div>{loading && !data ? <strong><i className="skeleton-number" /></strong> : <strong>{metric.value.toLocaleString("ko-KR")}</strong>}<small>{metric.value ? metric.detail : `${metric.label} 데이터 없음`}</small></Link>)}</div>
    <section className="soft-card assigned-students-panel"><div className="dashboard-panel-heading"><div><h3><Image src="/dashboard/assigned-students-icon.svg" alt="" width={24} height={24} />담당 학생 빠른 기록 상태</h3></div><Link href="/admin/students">담당 학생 전체 보기 <Icon name="chevron-right" /></Link></div>{data?.students.length ? <div className="assigned-student-grid">{data.students.slice(0, 4).map((student) => <article key={student.id}><div className="student-heading"><span className="student-avatar">{student.name.slice(0, 1)}</span><div><strong>{student.name}</strong><small>{formatStudentAge(student.age)} · {student.studentCode}</small></div>{student.photoConsentStatus !== "CONSENTED" && <span className="photo-restricted">사진 제한</span>}</div><div className="student-record-summary"><p><span>누적 관찰</span><strong>{student.observationCount}건</strong></p><p><span>최근 기록일</span><time>{student.lastObservedAt ? formatDate(student.lastObservedAt) : "기록 없음"}</time></p></div><Link className="student-observation-link" href={`/admin/observations/write?studentId=${encodeURIComponent(student.id)}`}><Icon name="plus" />바로 관찰 기록</Link></article>)}</div> : <WorkspaceEmpty icon="users" title="담당 학생이 없습니다." description="학생을 배정하면 빠른 관찰 기록 상태가 이곳에 표시됩니다." />}</section>
  </div>;
}

export function DashboardView() {
  const { user } = useAuth();
  const { role } = useUiRole();
  const [admin, setAdmin] = useState<AdminDashboard | null>(null);
  const [operator, setOperator] = useState<OperatorDashboard | null>(null);
  const [period, setPeriod] = useState<DateRangeValue>(() => initialDashboardRange(new Date()));
  const [loading, setLoading] = useState(true);
  const selectedPeriod = useMemo(() => rangeForApi(period), [period]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (role === "SA") setAdmin(await getAdminDashboard({ from: selectedPeriod.from, to: selectedPeriod.to }));
      if (role === "GA") setOperator(await getOperatorDashboard({ from: selectedPeriod.from, to: selectedPeriod.to }));
    } catch (reason) {
      showToast(apiErrorMessage(reason, "대시보드 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."), { tone: "error" });
    } finally {
      setLoading(false);
    }
  }, [role, selectedPeriod.from, selectedPeriod.to, user]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  if (role === "SA") return <AdminDashboardView data={admin} loading={loading} period={period} setPeriod={setPeriod} onRefresh={() => void load()} />;
  return <OperatorDashboardView data={operator} loading={loading} onRefresh={() => void load()} />;
}
