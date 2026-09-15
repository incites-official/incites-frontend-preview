"use client";

import { formatStudentAge } from "@/lib/student";

import { showToast } from "@/components/feedback/Toast";
import { Icon } from "@/components/Icon";
import { SingleDatePicker } from "@/components/common/SingleDatePicker";
import { CompetencySymbol } from "@/components/competencies/CompetencySymbol";
import { useAuth } from "@/components/providers/AuthProvider";
import { useUiRole } from "@/components/providers/UiRoleProvider";
import { SoftButton } from "@/components/soft/Soft";
import { PersonAvatar } from "@/components/workspace/WorkspaceUi";
import completionIcon from "@/common/Popup Icon.svg";
import {
  apiErrorMessage,
  cancelLesson,
  createLesson,
  createObservation,
  createObservationDraft,
  deleteObservationDraft,
  getAssignedStudents,
  getCompetencyCatalog,
  getObservationDraft,
  getObservationDrafts,
  updateObservationDraft,
  type ObservationDraftDetail,
  type ObservationDraftListItem,
  type ObservationDraftWriteRequest,
  type CompetencyCatalogItem,
  type ObservationLevel,
  type TeacherAssignedStudent,
} from "@/lib/incites-api";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const stepTitles = [
  "관찰 대상 학생 선택",
  "수업 및 회차 정보",
  "오늘 두드러진 핵심영역 선택",
  "선택 영역별 Level (L1~L4) 세그먼트 평가",
  "관찰 행동 추천 태그 선택",
  "한줄 관찰 코멘트",
  "수업 활동 사진 등록",
  "작성 요약 미리보기 및 저장",
] as const;

const stepSummaries = [
  "학생 선택",
  "수업 정보",
  "핵심영역 선택",
  "Level L1~L4 평가",
  "관찰 행동 태그 선택",
  "관찰 코멘트",
  "활동 사진",
  "작성 내용 확인",
] as const;

function today() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function lessonInstant(date: string) {
  return new Date(`${date}T12:00:00+09:00`).toISOString();
}

function dateFromInstant(value: string | null) {
  if (!value) return today();
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

async function loadAllAssignedStudents(teacherId: string) {
  const firstPage = await getAssignedStudents(teacherId, { page: 0, size: 100 });
  if (firstPage.totalPages <= 1) return firstPage.items;
  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) => getAssignedStudents(teacherId, { page: index + 1, size: 100 })),
  );
  return [firstPage, ...remainingPages].flatMap((page) => page.items);
}

function LocalPhotoPreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [previewUrl] = useState(() => URL.createObjectURL(file));

  useEffect(() => {
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  return (
    <figure className="photo-preview">
      <Image src={previewUrl} alt={`${file.name} 미리보기`} fill sizes="160px" unoptimized />
      <button type="button" onClick={onRemove} aria-label={`${file.name} 사진 삭제`}><Icon name="close" /></button>
    </figure>
  );
}

export function ObservationWorkspace({ initialView }: { initialView: "write" | "drafts" }) {
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveUserId } = useUiRole();
  const [view, setView] = useState<"write" | "drafts">(initialView);
  const [step, setStep] = useState(1);
  const [students, setStudents] = useState<TeacherAssignedStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [studentQuery, setStudentQuery] = useState("");
  const [studentPage, setStudentPage] = useState(0);
  const [date, setDate] = useState(today);
  const [session, setSession] = useState("");
  const [topic, setTopic] = useState("");
  const [areas, setAreas] = useState<string[]>([]);
  const [levels, setLevels] = useState<Record<string, ObservationLevel>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [comment, setComment] = useState("");
  const [competencies, setCompetencies] = useState<CompetencyCatalogItem[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState<ObservationDraftListItem[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const student = students.find((item) => item.id === selectedStudent) ?? null;
  const selectedDraft = drafts.find((item) => item.id === selectedDraftId) ?? null;
  const filteredStudents = useMemo(() => {
    const query = studentQuery.trim().toLocaleLowerCase("ko-KR");
    if (!query) return students;
    return students.filter((item) => [item.name, formatStudentAge(item.age), item.studentCode]
      .some((value) => value.toLocaleLowerCase("ko-KR").includes(query)));
  }, [studentQuery, students]);
  const totalStudentPages = Math.max(1, Math.ceil(filteredStudents.length / 4));
  const visibleStudents = filteredStudents.slice(studentPage * 4, studentPage * 4 + 4);

  const loadDrafts = useCallback(async () => {
    const page = await getObservationDrafts();
    setDrafts(page.items);
    setSelectedDraftId((current) => current && page.items.some((item) => item.id === current) ? current : null);
  }, []);

  const loadWorkspace = useCallback(async () => {
    if (!user || !effectiveUserId) return;
    setLoading(true);
    try {
      const [assignedStudents, draftPage, catalog] = await Promise.all([
        loadAllAssignedStudents(effectiveUserId),
        getObservationDrafts(),
        getCompetencyCatalog(),
      ]);
      const params = new URLSearchParams(window.location.search);
      const requestedStudentId = params.get("studentId");
      const requestedCompetency = params.get("competency");
      const requestedStudent = assignedStudents.find((item) => item.id === requestedStudentId);
      const hasRequestedCompetency = catalog.competencies.some((item) => item.code === requestedCompetency);
      setStudents(assignedStudents);
      setSelectedStudent((current) => requestedStudent?.id ?? (current && assignedStudents.some((item) => item.id === current) ? current : assignedStudents[0]?.id ?? null));
      if (requestedCompetency && hasRequestedCompetency) {
        setAreas((current) => current.includes(requestedCompetency) ? current : [...current, requestedCompetency]);
      }
      setDrafts(draftPage.items);
      setSelectedDraftId((current) => current && draftPage.items.some((item) => item.id === current) ? current : null);
      setCompetencies(catalog.competencies);
      setStudentPage(0);
    } catch (reason) {
      showToast(apiErrorMessage(reason, "관찰 기록 작성 정보를 불러오지 못했습니다."), { tone: "error" });
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadWorkspace(), 0);
    return () => window.clearTimeout(timer);
  }, [loadWorkspace]);

  function toggleArea(code: string) {
    setAreas((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code]);
  }

  function toggleTag(tag: string) {
    setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);
  }

  function addCustomTag() {
    const value = customTag.trim();
    if (!value || tags.includes(value)) return;
    setTags((current) => [...current, value]);
    setCustomTag("");
  }

  function resetForm() {
    setStep(1);
    setDate(today());
    setSession("");
    setTopic("");
    setAreas([]);
    setLevels({});
    setTags([]);
    setCustomTag("");
    setComment("");
    setPhotos([]);
    setStudentQuery("");
    setStudentPage(0);
    setCurrentDraftId(null);
    setCompleted(false);
  }

  function nextStep() {
    if (step < 8) setStep((current) => current + 1);
    else void saveObservation();
  }

  function previousStep() {
    setStep((current) => Math.max(current - 1, 1));
  }

  function draftPayload(): ObservationDraftWriteRequest {
    return {
      currentStep: step,
      studentId: selectedStudent,
      lessonAt: date ? lessonInstant(date) : null,
      sessionRound: session.trim() || null,
      topic: topic.trim() || null,
      competencies: areas.map((code) => ({ competencyCode: code, level: levels[code] ?? null })),
      tags,
      comment,
      photoIds: [],
    };
  }

  async function saveDraft() {
    setSaving(true);
    try {
      const saved = currentDraftId
        ? await updateObservationDraft(currentDraftId, draftPayload())
        : await createObservationDraft(draftPayload());
      setCurrentDraftId(saved.id);
      showToast("현재 작성 내용이 임시저장함에 저장되었습니다.", { tone: "info" });
      try {
        await loadDrafts();
      } catch {
        showToast("임시저장은 완료했지만 임시저장 목록을 새로고침하지 못했습니다.", { tone: "error" });
      }
    } catch (reason) {
      showToast(apiErrorMessage(reason, "관찰 기록을 임시저장하지 못했습니다."), { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  function applyDraft(draft: ObservationDraftDetail) {
    setSelectedStudent(draft.studentId);
    setDate(dateFromInstant(draft.lessonAt));
    setSession(draft.sessionRound ?? "");
    setTopic(draft.topic ?? "");
    setAreas(draft.competencies.map((item) => item.competencyCode));
    setLevels(Object.fromEntries(draft.competencies.filter((item) => item.level).map((item) => [item.competencyCode, item.level])) as Record<string, ObservationLevel>);
    setTags(draft.tags);
    setCustomTag("");
    setComment(draft.comment);
    setPhotos([]);
    setStep(draft.currentStep);
    setCurrentDraftId(draft.id);
    setCompleted(false);
  }

  async function resumeDraft(item: ObservationDraftListItem) {
    setLoading(true);
    try {
      const detail = await getObservationDraft(item.id);
      applyDraft(detail);
      setView("write");
      showToast(`${detail.studentName ?? "선택 전"} 학생의 임시저장 기록을 불러왔습니다.`, { tone: "info" });
    } catch (reason) {
      showToast(apiErrorMessage(reason, "임시저장 기록을 불러오지 못했습니다."), { tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function saveObservation() {
    if (!user || !effectiveUserId || !student) return;
    setSaving(true);
    let createdLessonId: string | null = null;
    try {
      const lesson = await createLesson({
        lessonAt: lessonInstant(date),
        sessionRound: session.trim(),
        topic: topic.trim(),
        teacherId: effectiveUserId,
        participantStudentIds: [student.id],
      });
      createdLessonId = lesson.id;
      await createObservation({
        studentId: student.id,
        lessonId: lesson.id,
        competencies: areas.map((code) => ({ competencyCode: code, level: levels[code] })),
        tags,
        comment,
      });
      let draftCleanupFailed = false;
      if (currentDraftId) {
        try {
          await deleteObservationDraft(currentDraftId);
        } catch {
          draftCleanupFailed = true;
        }
      }
      setCurrentDraftId(null);
      setCompleted(true);
      showToast("관찰 기록이 저장되었습니다.", { tone: "success" });
      if (draftCleanupFailed) {
        showToast("관찰 기록은 저장했지만 기존 임시저장 기록을 정리하지 못했습니다.", { tone: "error" });
      }
      try {
        await loadDrafts();
      } catch {
        showToast("관찰 기록은 저장했지만 임시저장 목록을 새로고침하지 못했습니다.", { tone: "error" });
      }
    } catch (reason) {
      if (createdLessonId) {
        try {
          await cancelLesson(createdLessonId);
        } catch {
          // 관찰 저장 실패 시 생성된 수업을 가능한 범위에서 취소한다.
        }
      }
      showToast(apiErrorMessage(reason, "관찰 기록을 최종 저장하지 못했습니다."), { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  function selectPhotos(files: FileList | null) {
    if (!files) return;
    const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    const incoming = Array.from(files);
    const valid = incoming.filter((file) => acceptedTypes.has(file.type) && file.size <= 10 * 1024 * 1024);
    if (valid.length !== incoming.length) {
      showToast("JPEG, PNG, WEBP 형식의 10MB 이하 사진만 선택할 수 있습니다.", { tone: "error" });
    }
    const existingKeys = new Set(photos.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
    const unique = valid.filter((file) => !existingKeys.has(`${file.name}-${file.size}-${file.lastModified}`));
    const available = Math.max(0, 3 - photos.length);
    setPhotos((current) => [...current, ...unique.slice(0, available)]);
    if (unique.length > available) showToast("활동 사진은 최대 3장까지 추가할 수 있습니다.", { tone: "info" });
  }

  if (view === "drafts") return <div className="observation-page observation-drafts-page page-stack workspace-page">
    <header className="observation-flow-header drafts-page-header">
      <div>
        <h2>관찰 기록 임시저장함</h2>
        <p>작성 중인 관찰 기록을 확인하고 이어서 작성할 수 있습니다.</p>
      </div>
    </header>
    <section className="soft-card drafts-card" aria-busy={loading}>
      {loading ? <div className="workspace-empty"><span className="spinner" /><strong>임시저장 기록을 불러오고 있습니다.</strong></div> : drafts.length ? <>
        <div className="draft-list" role="group" aria-label="임시저장 기록 선택">
          {drafts.map((draft) => {
            const assignedStudent = students.find((item) => item.id === draft.studentId);
            return <button
              type="button"
              aria-pressed={selectedDraftId === draft.id}
              className={`draft-choice${selectedDraftId === draft.id ? " selected" : ""}`}
              onClick={() => setSelectedDraftId(draft.id)}
              key={draft.id}
            >
              <PersonAvatar name={draft.studentName ?? "?"} />
              <span>
                <strong>{draft.studentName ?? "학생 선택 전"}</strong>
                <small>{formatStudentAge(draft.studentAge ?? assignedStudent?.age)} ({draft.studentCode ?? assignedStudent?.studentCode ?? "학생 코드 미입력"})</small>
              </span>
            </button>;
          })}
        </div>
        <button type="button" className="draft-resume-button" disabled={!selectedDraft || loading} onClick={() => selectedDraft && void resumeDraft(selectedDraft)}>이어서 작성</button>
      </> : <div className="workspace-empty"><Icon name="save" /><strong>임시저장 기록이 없습니다.</strong><span>관찰 기록 작성 화면에서 임시저장할 수 있습니다.</span></div>}
    </section>
  </div>;

  return <div className={`observation-page observation-write-page observation-page-step-${step} page-stack workspace-page`}>
    <header className="observation-flow-header">
      <div>
        <h2>관찰 기록 작성 (8-Step Flow)</h2>
        <p>
          학생: {student?.name ?? "선택 전"} ({formatStudentAge(student?.age)})
          {step >= 3 && <> | {session || "-"}회차: {topic || "주제 미입력"}</>}
        </p>
      </div>
    </header>

    <section className={`soft-card observation-flow-card observation-step-${step}`} aria-busy={loading || saving}>
      {completed ? <div className="observation-complete">
        <Image src={completionIcon} alt="" width={110} height={110} priority />
        <h3>관찰 기록 등록 완료!</h3>
        <div><SoftButton variant="secondary" onClick={resetForm}>이어서 다른 학생 기록</SoftButton><SoftButton onClick={() => router.push("/admin/dashboard")}>홈으로 돌아가기</SoftButton></div>
      </div> : <>
        <div className={`observation-step-heading${step === 1 ? " has-search" : ""}`}>
          <h3><strong>Step {step}.</strong> {stepTitles[step - 1]}{step === 3 && <em>최소 2개 필수</em>}</h3>
          {step === 1 ? <label className="observation-student-search">
            <Icon name="search" />
            <span className="sr-only">학생 검색</span>
            <input
              type="search"
              value={studentQuery}
              placeholder="학생 검색"
              autoComplete="off"
              onChange={(event) => {
                setStudentQuery(event.target.value);
                setStudentPage(0);
              }}
            />
          </label> : <span><b>{step}</b>/8: {stepSummaries[step - 1]}</span>}
        </div>
        <div className="step-progress" aria-label={`관찰 기록 ${step}단계`}>{stepTitles.map((_, index) => <i className={index < step ? "done" : ""} key={index} />)}</div>
        <div className="observation-step-content">
          {step === 1 && (loading ? <div className="workspace-empty"><span className="spinner" /><strong>담당 학생을 불러오고 있습니다.</strong></div> : students.length ? <div className="student-choice-carousel">
            <button className="student-carousel-arrow previous" type="button" disabled={studentPage === 0} onClick={() => setStudentPage((current) => Math.max(0, current - 1))} aria-label="이전 학생 목록"><Icon name="chevron-left" /></button>
            {visibleStudents.length ? <div className="student-choice-grid">{visibleStudents.map((item) => <button type="button" aria-pressed={selectedStudent === item.id} className={selectedStudent === item.id ? "selected" : ""} onClick={() => setSelectedStudent(item.id)} key={item.id}><PersonAvatar name={item.name} /><span><strong>{item.name}</strong><small>{formatStudentAge(item.age)} ({item.studentCode})</small></span>{selectedStudent === item.id && <Icon name="check" />}</button>)}</div> : <div className="student-search-empty" role="status"><Icon name="search" /><strong>검색 결과가 없습니다.</strong><span>학생 이름, 나이 또는 학생 코드를 다시 확인해주세요.</span></div>}
            <button className="student-carousel-arrow next" type="button" disabled={studentPage >= totalStudentPages - 1 || visibleStudents.length === 0} onClick={() => setStudentPage((current) => Math.min(totalStudentPages - 1, current + 1))} aria-label="다음 학생 목록"><Icon name="chevron-right" /></button>
          </div> : <div className="workspace-empty"><Icon name="users" /><strong>배정된 학생이 없습니다.</strong><span>총괄관리자에게 담당 학생 배정을 요청해주세요.</span></div>)}

          {step === 2 && <div className="observation-form-grid">
            <SingleDatePicker value={date} onChange={setDate} label="수업 일자" className="observation-date-field" />
            <label><span>회차 차수</span><input type="number" inputMode="numeric" min="1" value={session} onChange={(event) => setSession(event.target.value)} /></label>
            <label className="wide"><span>수업/게임/미션 주제</span><input value={topic} onChange={(event) => setTopic(event.target.value)} /></label>
          </div>}

          {step === 3 && <div className="competency-choice-grid">{competencies.map((area) => <button type="button" aria-pressed={areas.includes(area.code)} className={areas.includes(area.code) ? "selected" : ""} onClick={() => toggleArea(area.code)} key={area.code}><CompetencySymbol code={area.code} size={44} /><div><strong>{area.name}</strong><small>{area.englishName}</small></div></button>)}</div>}

          {step === 4 && <div className="level-evaluation-list">{areas.map((code) => { const area = competencies.find((item) => item.code === code); return <article key={code}><div className="level-evaluation-heading"><CompetencySymbol code={code} size={44} /><strong>{area?.name ?? code}</strong></div><div>{(["L1", "L2", "L3", "L4"] as ObservationLevel[]).map((level) => <button type="button" aria-pressed={levels[code] === level} className={levels[code] === level ? "selected" : ""} onClick={() => setLevels((current) => ({ ...current, [code]: level }))} key={level}><strong>{level}</strong><small>{level === "L1" ? "시작" : level === "L2" ? "발전" : level === "L3" ? "심화" : "탁월"}</small></button>)}</div></article>; })}</div>}

          {step === 5 && <div className="tag-selection"><div className="custom-tag"><input value={customTag} maxLength={50} onChange={(event) => setCustomTag(event.target.value)} placeholder="직접 태그 입력 후 [추가]..." onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addCustomTag(); } }} /><SoftButton variant="dark" size="small" onClick={addCustomTag}>추가</SoftButton></div>{tags.length > 0 && <div className="selected-observation-tags">{tags.map((tag) => <button type="button" onClick={() => toggleTag(tag)} aria-label={`${tag} 태그 삭제`} key={tag}><span>{tag}</span><Icon name="close" /></button>)}</div>}</div>}

          {step === 6 && <div className="comment-editor"><textarea value={comment} maxLength={300} onChange={(event) => setComment(event.target.value)} placeholder="수업 중 인상적인 관찰 행동 및 학생 성장 포인트를 한 문장으로 입력하세요." /><div><SoftButton className="ai-comment-button" variant="secondary" size="small" onClick={() => showToast("AI 추천 문구 자동 생성 기능은 준비 중입니다.", { tone: "info" })}><Icon name="sparkles" />AI 추천 문구 자동 생성</SoftButton><span>{comment.length} / 300자</span></div></div>}

          {step === 7 && <div className="photo-section"><div className="photo-uploader" role="group" aria-label="수업 활동 사진">
            {student?.photoConsentStatus === "CONSENTED" ? photos.length < 3 && <label className="photo-add-tile"><Icon name="camera" /><span>사진 추가</span><input hidden type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { selectPhotos(event.currentTarget.files); event.currentTarget.value = ""; }} /></label> : <div className="photo-add-tile disabled" aria-disabled="true"><Icon name="camera" /><span>촬영 동의 필요</span></div>}
            {photos.map((file) => <LocalPhotoPreview file={file} onRemove={() => setPhotos((current) => current.filter((item) => item !== file))} key={`${file.name}-${file.size}-${file.lastModified}`} />)}
          </div><p className={student?.photoConsentStatus === "CONSENTED" ? "" : "warning"}>{student?.photoConsentStatus === "CONSENTED" ? "JPEG, PNG, WEBP · 장당 10MB 이하 · 최대 3장" : "보호자의 촬영 동의가 확인되어야 사진을 추가할 수 있습니다."}</p></div>}

          {step === 8 && student && <div className="observation-review"><dl><div><dt>학생:</dt><dd>{student.name} ({formatStudentAge(student.age)})</dd></div><div><dt>수업:</dt><dd>{topic} - {session}회차</dd></div><div><dt>선택 영역:</dt><dd>{areas.map((code) => `${competencies.find((item) => item.code === code)?.name ?? code}(${code.replace("2", "")})`).join(", ")}</dd></div><div><dt>코멘트:</dt><dd>{comment || "입력된 코멘트가 없습니다."}</dd></div></dl></div>}
        </div>
        <div className="observation-step-actions"><SoftButton variant="secondary" disabled={step === 1 || saving} onClick={previousStep}>← 이전 Step</SoftButton><SoftButton variant={step === 8 ? "dark" : "primary"} disabled={saving || (step === 1 && !selectedStudent) || (step === 2 && (!date || !session || !topic.trim())) || (step === 3 && areas.length < 2) || (step === 4 && areas.some((area) => !levels[area])) || (step === 5 && tags.length === 0)} onClick={nextStep}>{saving ? "저장 중..." : step === 8 ? <><Icon name="check" />관찰 기록 최종 저장</> : <>다음 Step →</>}</SoftButton></div>
      </>}
    </section>
    {!completed && <SoftButton variant="secondary" className="observation-draft-button" disabled={saving} onClick={() => void saveDraft()}><Icon name="save" />{currentDraftId ? "임시저장 갱신" : "임시저장"}</SoftButton>}
  </div>;
}
