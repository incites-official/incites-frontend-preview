"use client";

import { useAnimatedChartValues } from "@/components/charts/useAnimatedChartValues";
import { showToast } from "@/components/feedback/Toast";
import { Icon } from "@/components/Icon";
import { useAuth } from "@/components/providers/AuthProvider";
import { useUiRole } from "@/components/providers/UiRoleProvider";
import { InlineMessage, SoftButton } from "@/components/soft/Soft";
import { PersonAvatar, WorkspaceEmpty, WorkspaceSearch } from "@/components/workspace/WorkspaceUi";
import {
  apiErrorMessage,
  createReport,
  downloadObservationPhoto,
  getAssignedStudents,
  getObservationPhotos,
  getObservations,
  getReport,
  getReports,
  getStudents,
  publishReport,
  regenerateReport,
  reviewReport,
  updateReport,
  type GrowthReportCompetency,
  type GrowthReportDetail,
  type GrowthReportListItem,
  type ObservationPhoto,
} from "@/lib/incites-api";
import { formatStudentAge } from "@/lib/student";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import styles from "./ReportReview.module.css";

type ReportStep = "students" | "history" | "detail";

type ReportStudent = {
  id: string;
  name: string;
  studentCode: string;
  age: number | null;
};

type ActivityPhoto = ObservationPhoto & {
  url: string;
};

function monthRange() {
  const end = new Date();
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  return { periodStart: start.toISOString(), periodEnd: end.toISOString() };
}

function asDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: string, includeTime = false) {
  const date = asDate(value);
  if (!date) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit", hour12: false } : {}),
  }).format(date);
}

function formatPeriod(report: Pick<GrowthReportListItem, "periodStart" | "periodEnd">) {
  const start = asDate(report.periodStart);
  const end = asDate(report.periodEnd);
  if (!start || !end) return "기간 정보 없음";
  const startLabel = `${String(start.getMonth() + 1).padStart(2, "0")}. ${String(start.getDate()).padStart(2, "0")}`;
  const endLabel = `${String(end.getMonth() + 1).padStart(2, "0")}. ${String(end.getDate()).padStart(2, "0")}`;
  return `${startLabel} - ${endLabel}`;
}

function reportPeriod(report: Pick<GrowthReportListItem, "periodStart" | "periodEnd">) {
  const start = asDate(report.periodStart);
  const end = asDate(report.periodEnd);
  if (!start || !end) return "기간 정보 없음";
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${start.getFullYear()}년 ${start.getMonth() + 1}월`;
  }
  return `${formatDate(report.periodStart)} ~ ${formatDate(report.periodEnd)}`;
}

function reportWeek(report: GrowthReportListItem) {
  const titleWeek = report.title.match(/(\d+)\s*주차/);
  if (titleWeek) return `${titleWeek[1]}주차`;
  const end = asDate(report.periodEnd);
  if (!end) return "주차 정보 없음";
  return `${end.getMonth() + 1}월 ${Math.ceil(end.getDate() / 7)}주차`;
}

function isReviewComplete(report: Pick<GrowthReportListItem, "status">) {
  return report.status === "PUBLISHED";
}

function sortReportsNewest(a: GrowthReportListItem, b: GrowthReportListItem) {
  return b.periodEnd.localeCompare(a.periodEnd) || b.createdAt.localeCompare(a.createdAt);
}

function ReportRadar({ competencies }: { competencies: GrowthReportCompetency[] }) {
  const items = competencies.slice(0, 7);
  const targetValues = items.map((item) => Math.max(0, Math.min(100, item.averageScore)));
  const values = useAnimatedChartValues(targetValues);

  if (competencies.length < 3) {
    return (
      <div className={styles.chartEmpty}>
        <Icon name="growth" />
        <span>표시할 역량 평가가 아직 없습니다.</span>
      </div>
    );
  }

  const labels = items.map((item) => `${item.code} ${item.name}`);
  const centerX = 218;
  const centerY = 168;
  const radius = 112;

  function point(value: number, index: number, scale = 1) {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / values.length;
    const distance = (radius * value * scale) / 100;
    return `${centerX + Math.cos(angle) * distance},${centerY + Math.sin(angle) * distance}`;
  }

  const outerPoints = values.map((_, index) => point(100, index));

  return (
    <svg className={styles.radar} viewBox="0 0 436 334" role="img" aria-label="현재 성장 역량 레이더 차트">
      {[25, 50, 75, 100].map((level) => (
        <polygon key={level} points={values.map((_, index) => point(level, index)).join(" ")} className={styles.radarRing} />
      ))}
      {outerPoints.map((axisPoint, index) => {
        const [x, y] = axisPoint.split(",").map(Number);
        return <line key={`axis-${labels[index]}`} x1={centerX} y1={centerY} x2={x} y2={y} className={styles.radarAxis} />;
      })}
      <polygon points={values.map((value, index) => point(value, index)).join(" ")} className={styles.radarValue} />
      {values.map((value, index) => {
        const [x, y] = point(value, index).split(",").map(Number);
        return <circle key={`point-${labels[index]}`} cx={x} cy={y} r="5" className={styles.radarPoint} />;
      })}
      {labels.map((label, index) => {
        const [x, y] = point(100, index, 1.27).split(",").map(Number);
        return <text key={label} x={x} y={y} textAnchor="middle" dominantBaseline="middle">{label}</text>;
      })}
    </svg>
  );
}

function PhotoLightbox({ photo, onClose }: { photo: ActivityPhoto; onClose: () => void }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function closeFromEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", closeFromEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeFromEscape);
    };
  }, [onClose]);

  return createPortal(
    <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label={`${photo.originalFilename} 확대 보기`} onMouseDown={(event) => {
      if (event.currentTarget === event.target) onClose();
    }}>
      <div className={styles.lightboxImage}>
        <Image src={photo.url} alt={photo.originalFilename} fill sizes="min(80vw, 900px)" unoptimized />
        <button type="button" onClick={onClose} aria-label="확대 이미지 닫기" autoFocus><Icon name="close" /></button>
      </div>
    </div>,
    document.body,
  );
}

export function ReportReview() {
  const { user } = useAuth();
  const { role, effectiveUserId } = useUiRole();
  const isOperator = role === "GA";
  const [step, setStep] = useState<ReportStep>("students");
  const [audience, setAudience] = useState<"guardian" | "student">("guardian");
  const [reports, setReports] = useState<GrowthReportListItem[]>([]);
  const [students, setStudents] = useState<ReportStudent[]>([]);
  const [studentId, setStudentId] = useState("");
  const [selected, setSelected] = useState<GrowthReportDetail | null>(null);
  const [activityPhotos, setActivityPhotos] = useState<ActivityPhoto[]>([]);
  const [expandedPhoto, setExpandedPhoto] = useState<ActivityPhoto | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const photoUrls = useRef<string[]>([]);
  const photoLoadSequence = useRef(0);

  const clearPhotoUrls = useCallback(() => {
    photoUrls.current.forEach((url) => URL.revokeObjectURL(url));
    photoUrls.current = [];
  }, []);

  const load = useCallback(async () => {
    if (!user || !effectiveUserId) return;
    setLoading(true);
    try {
      const [reportPage, studentItems] = await Promise.all([
        getReports({ size: 100 }),
        isOperator
          ? getAssignedStudents(effectiveUserId).then((page) => page.items)
          : getStudents({ size: 100 }).then((page) => page.items),
      ]);
      setReports([...reportPage.items].sort(sortReportsNewest));
      setStudents(studentItems);
    } catch (reason) {
      showToast(apiErrorMessage(reason, "리포트 검토 현황을 불러오지 못했습니다."), { tone: "error" });
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId, isOperator, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => () => clearPhotoUrls(), [clearPhotoUrls]);

  async function loadActivityPhotos(report: GrowthReportDetail) {
    const sequence = ++photoLoadSequence.current;
    clearPhotoUrls();
    setActivityPhotos([]);
    setExpandedPhoto(null);
    setPhotosLoading(true);
    try {
      const observations = await getObservations({
        studentId: report.studentId,
        from: report.periodStart,
        to: report.periodEnd,
        page: 0,
        size: 100,
      });
      const photoLists = await Promise.allSettled(observations.items.map((item) => getObservationPhotos(item.id)));
      const photoMetadata = photoLists.flatMap((result) => result.status === "fulfilled" ? result.value : []);
      const photoDownloads = await Promise.allSettled(photoMetadata.map(async (photo) => ({
        ...photo,
        url: URL.createObjectURL(await downloadObservationPhoto(photo.observationId, photo.id)),
      })));
      const loadedPhotos = photoDownloads.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);

      if (sequence !== photoLoadSequence.current) {
        loadedPhotos.forEach((photo) => URL.revokeObjectURL(photo.url));
        return;
      }

      photoUrls.current = loadedPhotos.map((photo) => photo.url);
      setActivityPhotos(loadedPhotos);
      if (photoLists.some((result) => result.status === "rejected") || photoDownloads.some((result) => result.status === "rejected")) {
        showToast("일부 활동 사진을 불러오지 못했습니다.", { tone: "info" });
      }
    } catch (reason) {
      if (sequence === photoLoadSequence.current) {
        showToast(apiErrorMessage(reason, "활동 사진을 불러오지 못했습니다."), { tone: "error" });
      }
    } finally {
      if (sequence === photoLoadSequence.current) setPhotosLoading(false);
    }
  }

  function openStudentHistory(id: string) {
    photoLoadSequence.current += 1;
    clearPhotoUrls();
    setActivityPhotos([]);
    setExpandedPhoto(null);
    setSelected(null);
    setPhotosLoading(false);
    setStudentId(id);
    setNotice(null);
    setStep("history");
  }

  async function openReport(reportId: string) {
    setDetailLoading(true);
    setNotice(null);
    try {
      const detail = await getReport(reportId);
      setSelected(detail);
      setAudience("guardian");
      setStep("detail");
      void loadActivityPhotos(detail);
    } catch (reason) {
      showToast(apiErrorMessage(reason, "리포트 상세를 불러오지 못했습니다."), { tone: "error" });
    } finally {
      setDetailLoading(false);
    }
  }

  function showStudentList() {
    photoLoadSequence.current += 1;
    clearPhotoUrls();
    setActivityPhotos([]);
    setExpandedPhoto(null);
    setSelected(null);
    setPhotosLoading(false);
    setStudentId("");
    setNotice(null);
    setStep("students");
  }

  function showHistory() {
    photoLoadSequence.current += 1;
    clearPhotoUrls();
    setActivityPhotos([]);
    setExpandedPhoto(null);
    setSelected(null);
    setPhotosLoading(false);
    setNotice(null);
    setStep("history");
  }

  async function create() {
    if (!studentId) return;
    setSaving(true);
    try {
      const created = await createReport({ studentId, ...monthRange() });
      const page = await getReports({ size: 100 });
      setReports([...page.items].sort(sortReportsNewest));
      setSelected(created);
      setAudience("guardian");
      setStep("detail");
      setNotice("관찰 기록을 바탕으로 이번 달 성찰 리포트 초안을 생성했습니다.");
      void loadActivityPhotos(created);
    } catch (reason) {
      showToast(apiErrorMessage(reason, "리포트를 생성하지 못했습니다."), { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function regenerate() {
    if (!selected || selected.status === "PUBLISHED") return;
    setSaving(true);
    try {
      setSelected(await regenerateReport(selected.id));
      setNotice("관찰 데이터를 바탕으로 AI 코멘트를 다시 생성했습니다.");
    } catch (reason) {
      showToast(apiErrorMessage(reason, "AI 코멘트를 다시 생성하지 못했습니다."), { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function saveAndPublish() {
    if (!selected || selected.status === "PUBLISHED") return;
    setSaving(true);
    try {
      const saved = await updateReport(selected.id, {
        title: selected.title,
        summary: selected.summary,
        strengths: selected.strengths,
        nextSteps: selected.nextSteps,
      });
      const reviewed = await reviewReport(saved.id);
      const published = await publishReport(reviewed.id);
      const page = await getReports({ size: 100 });
      setReports([...page.items].sort(sortReportsNewest));
      setSelected(published);
      setNotice("수정사항을 저장하고 학생과 학부모에게 리포트를 공개했습니다.");
      showToast("최종 검토를 완료하고 리포트를 공개했습니다.", { tone: "success" });
    } catch (reason) {
      showToast(apiErrorMessage(reason, "리포트를 저장하고 공개하지 못했습니다."), { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  const reportsByStudent = useMemo(() => {
    const grouped = new Map<string, GrowthReportListItem[]>();
    reports.forEach((report) => {
      const current = grouped.get(report.studentId) ?? [];
      current.push(report);
      grouped.set(report.studentId, current);
    });
    grouped.forEach((items) => items.sort(sortReportsNewest));
    return grouped;
  }, [reports]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ko-KR");
    if (!query) return students;
    return students.filter((student) => [student.name, student.studentCode, formatStudentAge(student.age)]
      .some((value) => value.toLocaleLowerCase("ko-KR").includes(query)));
  }, [search, students]);

  const selectedStudent = students.find((student) => student.id === studentId) ?? null;
  const studentReports = selectedStudent ? reportsByStudent.get(selectedStudent.id) ?? [] : [];
  const pendingCount = reports.filter((report) => !isReviewComplete(report)).length;
  const completedCount = reports.length - pendingCount;
  const studentPendingCount = studentReports.filter((report) => !isReviewComplete(report)).length;
  const studentCompletedCount = studentReports.length - studentPendingCount;
  const readOnly = selected?.status === "PUBLISHED";
  const approvalDisabled = !selected || readOnly || saving || !selected.summary.trim() || !selected.strengths.trim();

  return (
    <div className={`report-review-page page-stack workspace-page ${styles.page}`}>
      <div className={`page-heading report-review-heading ${styles.heading}`}>
        <div>
          <h2>AI 성찰 리포트 검토 및 승인</h2>
          <p>AI가 생성한 학부모용/학생용 성찰 소평을 검토 및 교정한 후 최종 공개를 승인합니다.</p>
        </div>
        {step === "detail" && (
          <SoftButton className={`report-final-button ${styles.finalButton}`} variant="dark" disabled={approvalDisabled} onClick={() => void saveAndPublish()}>
            <Icon name="check" />{readOnly ? "공개 승인 완료" : "최종 검토 완료 & 공개 승인"}
          </SoftButton>
        )}
      </div>

      {notice && <InlineMessage tone="success"><Icon name="check" />{notice}</InlineMessage>}

      {loading ? (
        <section className={`soft-card ${styles.emptyCard}`} aria-busy="true">
          <WorkspaceEmpty icon="file" title="리포트 검토 현황을 불러오는 중입니다." description="잠시만 기다려주세요." />
        </section>
      ) : step === "students" ? (
        <section className={`soft-card ${styles.studentCard}`}>
          <div className={styles.studentToolbar}>
            <div className={styles.metrics} aria-label="리포트 검토 현황">
              <article className={styles.metric}>
                <span className={`${styles.metricIcon} ${styles.blue}`}><Icon name="users" /></span>
                <span>전체 학생<strong>{students.length}명</strong></span>
              </article>
              <article className={styles.metric}>
                <span className={`${styles.metricIcon} ${styles.orange}`}><Icon name="clock" /></span>
                <span>검토 대기<strong>{pendingCount}건</strong></span>
              </article>
              <article className={styles.metric}>
                <span className={`${styles.metricIcon} ${styles.green}`}><Icon name="check" /></span>
                <span>검토 완료<strong>{completedCount}건</strong></span>
              </article>
            </div>
            <WorkspaceSearch value={search} onChange={setSearch} placeholder="학생명 검색" />
          </div>

          {students.length ? (
            filteredStudents.length ? (
              <div className={styles.tableScroll}>
                <table className={styles.studentTable}>
                  <thead><tr><th>학생정보</th><th>작성된 리포트</th><th>검토 대기</th><th>검토 완료</th><th>최근 작성 기록</th><th><span className="sr-only">작업</span></th></tr></thead>
                  <tbody>{filteredStudents.map((student) => {
                    const items = reportsByStudent.get(student.id) ?? [];
                    const pending = items.filter((report) => !isReviewComplete(report)).length;
                    const latest = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
                    return (
                      <tr key={student.id}>
                        <td><strong>{student.name}</strong> <span>({formatStudentAge(student.age)})</span></td>
                        <td><strong>{items.length}개</strong></td>
                        <td><em className={pending ? styles.pending : styles.zero}>{pending}개</em></td>
                        <td><em className={styles.complete}>{items.length - pending}개</em></td>
                        <td><time dateTime={latest?.createdAt}>{latest ? formatDate(latest.createdAt, true) : "기록 없음"}</time></td>
                        <td><SoftButton size="small" variant="secondary" onClick={() => openStudentHistory(student.id)}>기록 보기</SoftButton></td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            ) : (
              <WorkspaceEmpty icon="users" title="검색 결과가 없습니다." description="학생 이름을 다시 확인해주세요." />
            )
          ) : (
            <WorkspaceEmpty icon="users" title="담당 학생이 없습니다." description="총괄관리자에게 학생 배정을 요청해주세요." />
          )}
        </section>
      ) : step === "history" && selectedStudent ? (
        <section className={`soft-card ${styles.historyCard}`}>
          <header className={styles.studentSummary}>
            <div className={styles.studentIdentity}>
              <PersonAvatar name={selectedStudent.name} size="large" />
              <span><strong>{selectedStudent.name}</strong><small>{formatStudentAge(selectedStudent.age)} ({selectedStudent.studentCode})</small></span>
            </div>
            <dl>
              <div><dt>총 리포트</dt><dd>{studentReports.length}개</dd></div>
              <div><dt>검토 대기</dt><dd className={styles.pendingText}>{studentPendingCount}개</dd></div>
              <div><dt>검토 완료</dt><dd className={styles.completeText}>{studentCompletedCount}개</dd></div>
            </dl>
          </header>

          <div className={styles.historyBody} aria-busy={detailLoading}>
            <h3>{selectedStudent.name}의 리포트 이력</h3>
            {studentReports.length ? (
              <div className={styles.tableScroll}>
                <table className={styles.historyTable}>
                  <thead><tr><th>주차</th><th>관찰 기간</th><th>검토 상태</th><th>작성일</th><th><span className="sr-only">작업</span></th></tr></thead>
                  <tbody>{studentReports.map((report) => {
                    const complete = isReviewComplete(report);
                    return (
                      <tr key={report.id}>
                        <td><strong>{reportWeek(report)}</strong></td>
                        <td>{formatPeriod(report)}</td>
                        <td><em className={complete ? styles.complete : styles.pending}>{complete ? "검토 완료" : "검토 대기"}</em></td>
                        <td><time dateTime={report.createdAt}>{formatDate(report.createdAt)}</time></td>
                        <td><SoftButton size="small" disabled={detailLoading} onClick={() => void openReport(report.id)}>리포트 검토</SoftButton></td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            ) : (
              <WorkspaceEmpty
                icon="file"
                title={`${selectedStudent.name} 학생의 리포트가 없습니다.`}
                description="관찰 기록을 바탕으로 이번 달 AI 성찰 리포트를 생성해주세요."
                action={<SoftButton disabled={saving} onClick={() => void create()}><Icon name="sparkles" />이번 달 AI 리포트 생성</SoftButton>}
              />
            )}
            <SoftButton className={styles.backButton} variant="secondary" onClick={showStudentList}><Icon name="chevron-left" />학생 목록으로</SoftButton>
          </div>
        </section>
      ) : step === "detail" && selected ? (
        <>
          <div className={styles.detailGrid} aria-busy={saving}>
            <section className={`soft-card ${styles.previewPanel}`}>
              <header className={styles.panelHeader}>
                <h3><Icon name="eye" />학부모/학생 노출 프리뷰</h3>
                <div className={styles.audienceSwitch} role="group" aria-label="리포트 노출 대상 미리보기">
                  <button type="button" className={audience === "guardian" ? styles.active : ""} aria-pressed={audience === "guardian"} onClick={() => setAudience("guardian")}>
                    <Icon name="guardian" />학부모 뷰
                  </button>
                  <button type="button" className={audience === "student" ? styles.active : ""} aria-pressed={audience === "student"} onClick={() => setAudience("student")}>
                    <Icon name="graduation" />학생 뷰
                  </button>
                </div>
              </header>
              <div className={styles.previewBody}>
                <h4>{selected.studentName}의 {reportPeriod(selected)} 성장 리포트</h4>
                <p>담당 강사: {selected.teacherName ?? "미배정"}{selected.teacherPosition ? ` ${selected.teacherPosition}` : ""} · 관찰 기록 {selected.observationCount}건</p>
                <div className={styles.summaryBox}>
                  <strong><Icon name="sparkles" />{audience === "guardian" ? "이번달 총평 및 성장 소평" : "선생님이 전하는 칭찬 코멘트"}</strong>
                  <p>{audience === "guardian" ? selected.summary : selected.strengths}</p>
                </div>
                <ReportRadar competencies={selected.competencies} />
                {selected.competencies.length >= 3 && <span className={styles.radarCaption}><i />현재 성장 역량</span>}
              </div>
            </section>

            <section className={`soft-card ${styles.photosPanel}`}>
              <header className={styles.panelHeader}><h3><Icon name="camera" />활동 사진 ({activityPhotos.length}장)</h3></header>
              <div className={styles.photoBody} aria-busy={photosLoading}>
                {photosLoading ? (
                  <div className={styles.photoEmpty}><span className="spinner" /><span>활동 사진을 불러오는 중입니다.</span></div>
                ) : activityPhotos.length ? (
                  <div className={styles.photoStrip}>
                    {activityPhotos.map((photo) => (
                      <button type="button" className={styles.photoTile} key={photo.id} onClick={() => setExpandedPhoto(photo)} aria-label={`${photo.originalFilename} 확대 보기`}>
                        <Image src={photo.url} alt="" fill sizes="180px" unoptimized />
                        <span><Icon name="arrow-up-right" /></span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className={styles.photoEmpty}><Icon name="camera" /><span>이 기간에 등록된 활동 사진이 없습니다.</span></div>
                )}
              </div>
            </section>

            <section className={`soft-card ${styles.editorPanel}`}>
              <header className={styles.panelHeader}>
                <h3><Icon name="sparkles" />AI 종합 코멘트 편집기</h3>
                {!readOnly && (
                  <SoftButton className={styles.regenerateButton} size="small" variant="secondary" disabled={saving} onClick={() => void regenerate()}>
                    <Icon name="refresh" />AI 내용 재도출
                  </SoftButton>
                )}
              </header>
              <div className={styles.editorBody}>
                <label>
                  <span><Icon name="guardian" />학부모 대상 종합 성장 코멘트</span>
                  <textarea value={selected.summary} disabled={readOnly} maxLength={2000} onChange={(event) => setSelected({ ...selected, summary: event.target.value })} spellCheck={false} />
                </label>
                <label>
                  <span><Icon name="graduation" />학생 직접 전달 칭찬 코멘트</span>
                  <textarea value={selected.strengths} disabled={readOnly} maxLength={2000} onChange={(event) => setSelected({ ...selected, strengths: event.target.value })} spellCheck={false} />
                </label>
              </div>
              <div className={styles.editorActions}>
                <SoftButton disabled={approvalDisabled} onClick={() => void saveAndPublish()}>
                  <Icon name="check" />{readOnly ? "공개 승인 완료" : "수정사항 저장 및 공개 승인 확정"}
                </SoftButton>
              </div>
            </section>
          </div>
          <SoftButton className={styles.detailBackButton} variant="secondary" onClick={showHistory}><Icon name="chevron-left" />리포트 이력으로</SoftButton>
        </>
      ) : (
        <section className={`soft-card ${styles.emptyCard}`}>
          <WorkspaceEmpty icon="file" title="선택한 정보를 찾을 수 없습니다." description="학생 목록으로 돌아가 다시 선택해주세요." action={<SoftButton onClick={showStudentList}>학생 목록으로</SoftButton>} />
        </section>
      )}

      {expandedPhoto && <PhotoLightbox photo={expandedPhoto} onClose={() => setExpandedPhoto(null)} />}
    </div>
  );
}
