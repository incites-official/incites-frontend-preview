"use client";

import { DateRangePicker, type DateRangeValue } from "@/components/common/DateRangePicker";
import { showToast } from "@/components/feedback/Toast";
import { Icon } from "@/components/Icon";
import { SoftButton, SoftDropdown } from "@/components/soft/Soft";
import { StatusPill, WorkspaceEmpty, WorkspaceSearch, WorkspaceTabs } from "@/components/workspace/WorkspaceUi";
import {
  apiErrorMessage, bulkPublishReports, downloadReports, getObservation, getObservations,
  getReports, getUnreadReports, remindUnreadReports, unpublishReport,
  type GrowthReportListItem, type ObservationDetail, type UnreadReport,
} from "@/lib/incites-api";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type RecordTab = "reports" | "unread" | "audit";
type ReportAuthorScope = "ALL" | "ADMIN" | "OPERATOR";

const tabs = [
  { id: "reports", label: "성장 리포트 관리" },
  { id: "unread", label: "미열람 현황 추적" },
  { id: "audit", label: "전체 관찰 기록 감사" },
] as const;

const auditSortOptions = [
  { value: "newest", label: "최신순" },
  { value: "oldest", label: "오래된순" },
];

function dateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

function formatReportPeriod(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long" }).format(new Date(value));
}

function reportStatusLabel(status: GrowthReportListItem["status"]) {
  if (status === "PUBLISHED") return "공개";
  if (status === "REVIEWED") return "검토 완료";
  return "초안";
}

export function RecordControl({ initialTab }: { initialTab: "reports" | "audit" }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<RecordTab>(initialTab);
  const [search, setSearch] = useState("");
  const [reportAuthorScope, setReportAuthorScope] = useState<ReportAuthorScope>("ALL");
  const [auditSort, setAuditSort] = useState("newest");
  const [auditDate, setAuditDate] = useState<DateRangeValue>(() => {
    const today = dateValue(new Date());
    return { from: today, to: today };
  });
  const [auditDateActive, setAuditDateActive] = useState(false);
  const [auditRecords, setAuditRecords] = useState<ObservationDetail[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [reports, setReports] = useState<GrowthReportListItem[]>([]);
  const [unreadReports, setUnreadReports] = useState<UnreadReport[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

  const loadAuditRecords = useCallback(async () => {
    setAuditLoading(true);
    try {
      const from = auditDateActive ? new Date(`${auditDate.from}T00:00:00+09:00`).toISOString() : undefined;
      const to = auditDateActive ? new Date(`${auditDate.to}T23:59:59.999+09:00`).toISOString() : undefined;
      const page = await getObservations({ from, to, page: 0, size: 100 });
      setAuditRecords(await Promise.all(page.items.map((record) => getObservation(record.id))));
    } catch (reason) {
      showToast(apiErrorMessage(reason, "관찰 기록 감사 데이터를 불러오지 못했습니다."), { tone: "error" });
    } finally {
      setAuditLoading(false);
    }
  }, [auditDate, auditDateActive]);

  const loadReportControl = useCallback(async () => {
    setReportLoading(true);
    try {
      const [reportPage, unread] = await Promise.all([
        getReports({ authorRole: reportAuthorScope === "ALL" ? undefined : reportAuthorScope }),
        getUnreadReports(),
      ]);
      setReports(reportPage.items);
      setUnreadReports(unread);
    } catch (reason) {
      showToast(apiErrorMessage(reason, "리포트 통제 데이터를 불러오지 못했습니다."), { tone: "error" });
    } finally {
      setReportLoading(false);
    }
  }, [reportAuthorScope]);

  useEffect(() => {
    if (activeTab !== "audit") return;
    const timer = window.setTimeout(() => void loadAuditRecords(), 0);
    return () => window.clearTimeout(timer);
  }, [activeTab, loadAuditRecords]);

  useEffect(() => {
    if (activeTab === "audit") return;
    const timer = window.setTimeout(() => void loadReportControl(), 0);
    return () => window.clearTimeout(timer);
  }, [activeTab, loadReportControl]);

  const visibleAuditRecords = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ko-KR");
    const filtered = auditRecords.filter((record) => !query || [record.studentName, record.studentCode, record.topic, record.authorName].some((value) => value.toLocaleLowerCase("ko-KR").includes(query)));
    return [...filtered].sort((a, b) => auditSort === "newest" ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt));
  }, [auditRecords, auditSort, search]);
  const visibleReports = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ko-KR");
    return reports.filter((report) => !query || [report.id, report.title, report.studentName, report.studentCode]
      .some((value) => value.toLocaleLowerCase("ko-KR").includes(query)));
  }, [reports, search]);
  const publishableReportIds = visibleReports.filter((report) => report.status === "REVIEWED").map((report) => report.id);

  function changeTab(tab: RecordTab) {
    setActiveTab(tab);
    if (tab === "reports") router.replace("/admin/records/reports");
    if (tab === "audit") router.replace("/admin/records/audit");
  }

  async function publishOne(reportId: string) {
    setReportLoading(true);
    try {
      const result = await bulkPublishReports([reportId]);
      showToast(result.publishedCount ? "리포트를 공개했습니다." : "검토 완료 상태의 리포트만 공개할 수 있습니다.", { tone: result.publishedCount ? "success" : "info" });
      await loadReportControl();
    } catch (reason) { showToast(apiErrorMessage(reason, "리포트를 공개하지 못했습니다."), { tone: "error" }); }
    finally { setReportLoading(false); }
  }

  async function publishVisibleReports() {
    if (!publishableReportIds.length) return;
    setReportLoading(true);
    try {
      const result = await bulkPublishReports(publishableReportIds);
      showToast(`검토 완료 리포트 ${result.publishedCount}건을 공개했습니다.`, { tone: "success" });
      await loadReportControl();
    } catch (reason) {
      showToast(apiErrorMessage(reason, "리포트를 일괄 공개하지 못했습니다."), { tone: "error" });
    } finally {
      setReportLoading(false);
    }
  }

  async function withdraw(reportId: string) {
    setReportLoading(true);
    try { await unpublishReport(reportId); await loadReportControl(); showToast("리포트 공개를 회수했습니다.", { tone: "success" }); }
    catch (reason) { showToast(apiErrorMessage(reason, "리포트 공개를 회수하지 못했습니다."), { tone: "error" }); }
    finally { setReportLoading(false); }
  }

  async function remind() {
    setReportLoading(true);
    try {
      const result = await remindUnreadReports();
      showToast(`미열람 보호자 ${result.createdCount}명에게 인앱 알림을 생성했습니다.`, { tone: "success" });
      await loadReportControl();
    } catch (reason) { showToast(apiErrorMessage(reason, "미열람 알림을 생성하지 못했습니다."), { tone: "error" }); }
    finally { setReportLoading(false); }
  }

  async function exportReports() {
    try {
      const blob = await downloadReports();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `incites_growth_reports_${new Date().toISOString().slice(0, 10)}.xlsx`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (reason) { showToast(apiErrorMessage(reason, "리포트를 내보내지 못했습니다."), { tone: "error" }); }
  }

  return (
    <div className="record-control-page page-stack workspace-page">
      <div className="page-heading record-control-heading">
        <div>
          <h2>관찰 기록 및 리포트 통제</h2>
          <p>전체 관찰 기록 감사 로그 및 월간/분기 리포트 일괄 공개, 회수, 학부모 열람 상태를 통합 관리합니다.</p>
        </div>
        <SoftButton
          className="record-export-button"
          variant="dark"
          onClick={() => void exportReports()}
        >
          <Icon name="download" />
          전체 리포트 Export
        </SoftButton>
      </div>

      <section className={`soft-card workspace-card record-control-card record-${activeTab}-view`}>
        <WorkspaceTabs tabs={tabs} active={activeTab} onChange={changeTab} label="기록 통제" />

        {activeTab === "reports" && (
          <div className="workspace-tab-panel record-reports-panel" aria-busy={reportLoading}>
            <div className="workspace-toolbar record-reports-toolbar">
              <div className="toolbar-fields">
                <WorkspaceSearch value={search} onChange={setSearch} placeholder="학생명, 리포트 식별자 검색" />
                <SoftDropdown
                  className="record-report-scope"
                  label="작성 권한"
                  hideLabel
                  value={reportAuthorScope}
                  options={[
                    { value: "ALL", label: "전체 권한" },
                    { value: "ADMIN", label: "총괄 (SA)" },
                    { value: "OPERATOR", label: "일반/교사 (GA)" },
                  ]}
                  onChange={(value) => setReportAuthorScope(value as ReportAuthorScope)}
                />
              </div>
              <SoftButton className="record-bulk-button" disabled={!publishableReportIds.length || reportLoading} onClick={() => void publishVisibleReports()}>
                일괄 공개 승인 실행
              </SoftButton>
            </div>

            {reportLoading && !reports.length ? (
              <WorkspaceEmpty icon="file" title="성장 리포트를 불러오고 있습니다." description="잠시만 기다려주세요." />
            ) : visibleReports.length ? (
              <div className="workspace-table-scroll record-report-table-scroll">
                <table className="workspace-table report-control-table">
                  <thead><tr><th className="report-id-column">리포트 식별자</th><th className="report-student-column">학생정보</th><th className="report-cycle-column">발행 주기</th><th className="report-status-column">현재상태</th><th className="report-read-column">학부모 열람</th><th className="report-created-column">생성일</th><th className="report-action-column">처리</th></tr></thead>
                  <tbody>{visibleReports.map((report) => {
                    const allGuardiansRead = report.guardianCount > 0 && report.readGuardianCount >= report.guardianCount;
                    const unreadCount = Math.max(0, report.guardianCount - report.readGuardianCount);
                    return (
                      <tr key={report.id}>
                        <td><strong className="report-identifier" title={report.id}>{report.id}</strong></td>
                        <td><strong>{report.studentName} ({report.studentCode})</strong></td>
                        <td>{formatReportPeriod(report.periodEnd)}</td>
                        <td><StatusPill tone={report.status === "PUBLISHED" ? "blue" : report.status === "REVIEWED" ? "green" : "neutral"}>{reportStatusLabel(report.status)}</StatusPill></td>
                        <td>{report.status !== "PUBLISHED" ? <span className="report-read-state neutral">-</span> : report.guardianCount === 0 ? <span className="report-read-state neutral">연결 보호자 없음</span> : allGuardiansRead ? <span className="report-read-state complete">열람완료</span> : <span className="report-read-state unread">미열람 {unreadCount}명</span>}</td>
                        <td><time dateTime={report.createdAt}>{formatDate(report.createdAt)}</time></td>
                        <td>{report.status === "DRAFT" ? <button className="table-action" type="button" onClick={() => router.push("/admin/reports")}>검토</button> : report.status === "REVIEWED" ? <button className="table-action" type="button" onClick={() => void publishOne(report.id)}>공개승인</button> : <button className="table-action danger" type="button" onClick={() => void withdraw(report.id)}>공개회수</button>}</td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            ) : (
              <WorkspaceEmpty icon="file" title={search ? "조건에 맞는 리포트가 없습니다." : "생성된 리포트가 없습니다."} description={search ? "검색어나 작성 권한 필터를 변경해주세요." : "리포트 검토 화면에서 초안을 생성해주세요."} />
            )}
          </div>
        )}

        {activeTab === "unread" && (
          <div className="workspace-tab-panel record-unread-panel" aria-busy={reportLoading}><div className="page-heading"><div><h3>미열람 보호자 {unreadReports.length}명</h3><p>공개된 리포트를 아직 열람하지 않은 승인 보호자입니다.</p></div><SoftButton disabled={!unreadReports.length || reportLoading} onClick={() => void remind()}><Icon name="bell" />인앱 알림 생성</SoftButton></div>{reportLoading && !unreadReports.length ? <div className="workspace-empty"><span className="spinner" /><strong>미열람 현황을 불러오고 있습니다.</strong></div> : unreadReports.length ? <div className="session-timeline">{unreadReports.map((item) => <article key={`${item.reportId}-${item.parentId}`}><div><h4>{item.studentName} 학생 · {item.parentName} 보호자</h4><time>{formatDate(item.publishedAt)}</time></div><p>리포트 공개 후 미열람</p></article>)}</div> : <WorkspaceEmpty icon="file" title="미열람 리포트가 없습니다." description="모든 승인 보호자가 공개 리포트를 확인했습니다." />}</div>
        )}

        {activeTab === "audit" && (
          <div className="workspace-tab-panel record-audit-panel">
            <div className="record-audit-heading">
              <div className="section-copy">
                <h3>전체 관찰 기록 Read-Only 감사</h3>
                <p>교사들이 작성한 개별 관찰 로그의 무단 수정 / 위변조 여부를 감사용 로그 형태로 확인합니다.</p>
              </div>
              <div className="record-audit-filters">
                <WorkspaceSearch value={search} onChange={setSearch} placeholder="학생명, 코드, 작성자 검색" />
                <SoftDropdown
                  className="record-audit-sort"
                  label="정렬 기준"
                  hideLabel
                  value={auditSort}
                  options={auditSortOptions}
                  onChange={setAuditSort}
                />
                <DateRangePicker
                  className="audit-date-picker"
                  label="감사 기록 날짜 조회"
                  triggerText="날짜 조회"
                  value={auditDate}
                  onChange={(value) => {
                    setAuditDate(value);
                    setAuditDateActive(true);
                  }}
                />
              </div>
            </div>
            <div className="audit-grid" aria-busy={auditLoading}>
              {auditLoading ? <div className="workspace-empty"><span className="spinner" /><strong>관찰 기록을 불러오고 있습니다.</strong></div> : visibleAuditRecords.length ? visibleAuditRecords.map((record) => (
                <article key={record.id}>
                  <div className="audit-meta">
                    <StatusPill tone="blue">{record.id}</StatusPill>
                    <time dateTime={record.lessonAt}>{formatDate(record.lessonAt)}</time>
                  </div>
                  <h4>{record.studentName} · {record.studentCode} | {record.sessionRound}회차 · {record.topic}</h4>
                  <p>{record.comment || "관찰 코멘트가 없습니다."}</p>
                  <footer>
                    <div className="audit-main-meta">
                      <span>작성자: {record.authorName}</span>
                      <span>선택된 7대 영역: {record.competencies.map((item) => `${item.competencyCode} ${item.level}`).join(", ")}</span>
                    </div>
                    <span>서버 저장: {formatDate(record.createdAt)}</span>
                  </footer>
                </article>
              )) : <div className="workspace-empty"><Icon name="file" /><strong>조건에 맞는 관찰 기록이 없습니다.</strong><span>날짜나 검색어를 변경해주세요.</span></div>}
            </div>
          </div>
        )}
      </section>

    </div>
  );
}
