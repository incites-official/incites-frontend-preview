"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Icon } from "@/components/Icon";
import { SoftButton, SoftModal } from "@/components/soft/Soft";
import { StatusPill } from "@/components/workspace/WorkspaceUi";
import {
  apiErrorMessage, downloadStudentTemplate, importStudentWorkbook, previewStudentWorkbook,
  type StudentBulkCreateResult, type StudentImportPreview,
} from "@/lib/incites-api";
import styles from "./StudentImportModal.module.css";

const PAGE_SIZE = 10;

export function StudentImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => Promise<void> }) {
  const [step, setStep] = useState<"upload" | "preview" | "processing" | "result" | "failure">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<StudentImportPreview | null>(null);
  const [result, setResult] = useState<StudentBulkCreateResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [failedOnly, setFailedOnly] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const requestPending = useRef(false);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => previousFocus?.focus();
  }, []);

  useEffect(() => {
    modalRef.current?.querySelector<HTMLElement>('[role="dialog"]')?.focus();
    if (step !== "processing") modalRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [step]);

  function close() {
    if (!requestPending.current && !downloading) onClose();
  }

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    setFile(null);
    setPreview(null);
    setError("");
    if (!/\.(xlsx|xls)$/i.test(selected.name)) {
      setError(".xlsx 또는 .xls 파일만 업로드할 수 있습니다.");
    } else if (selected.size === 0) {
      setError("비어 있는 파일입니다. 학생 정보를 입력한 파일을 선택해주세요.");
    } else if (selected.size > 5 * 1024 * 1024) {
      setError("파일 크기는 5MB 이하여야 합니다.");
    } else {
      setFile(selected);
    }
  }

  async function downloadTemplate() {
    setDownloading(true);
    setError("");
    try {
      const blob = await downloadStudentTemplate();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "학생_일괄등록_템플릿.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (reason) {
      setError(apiErrorMessage(reason, "템플릿을 다운로드하지 못했습니다."));
    } finally {
      setDownloading(false);
    }
  }

  async function checkFile() {
    if (!file || requestPending.current) return;
    requestPending.current = true;
    setBusy(true);
    setError("");
    try {
      setPreview(await previewStudentWorkbook(file));
      setPage(0);
      setStep("preview");
    } catch (reason) {
      setError(apiErrorMessage(reason, "학생 정보를 확인하지 못했습니다."));
    } finally {
      requestPending.current = false;
      setBusy(false);
    }
  }

  async function submit() {
    if (!file || !preview?.validCount || requestPending.current) return;
    requestPending.current = true;
    setBusy(true);
    setError("");
    setStep("processing");
    try {
      const response = await importStudentWorkbook(file);
      setResult(response);
      setPage(0);
      setFailedOnly(false);
      setStep("result");
      if (response.createdCount > 0) void onImported();
    } catch (reason) {
      setError(apiErrorMessage(reason, "등록 결과를 확인하지 못했습니다."));
      setStep("failure");
    } finally {
      requestPending.current = false;
      setBusy(false);
    }
  }

  function reset() {
    setStep("upload");
    setFile(null);
    setPreview(null);
    setResult(null);
    setFailedOnly(false);
    setError("");
    setPage(0);
  }

  const rows = preview?.rows ?? [];
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const resultRows = result?.results.map((row, index) => ({ ...row, number: index + 1 }))
    .filter((row) => !failedOnly || !row.success) ?? [];
  const resultPageCount = Math.max(1, Math.ceil(resultRows.length / PAGE_SIZE));
  const locked = busy || downloading;

  return <div ref={modalRef} onKeyDown={(event) => {
    if (event.key === "Escape") { event.stopPropagation(); close(); }
    if (event.key !== "Tab") return;
    if (step === "processing") { event.preventDefault(); return; }
    const focusable = modalRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled):not([type="file"]), [tabindex="0"]');
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }}>
    {(step === "upload" || step === "preview") && <SoftModal key={step} open className={`${styles.modal} ${step === "preview" ? styles.wide : ""}`} title={step === "upload" ? "학생 엑셀 일괄 등록" : "학생 일괄 등록 확인"}
      description={step === "upload" ? "엑셀 템플릿의 [작성 가이드]를 참고해 학생 정보를 작성한 후, 아래에 파일을 넣어주세요." : undefined}
      onClose={close}
      footer={<>
        <SoftButton variant="secondary" disabled={locked} onClick={() => {
          if (step === "upload") close();
          else { setStep("upload"); setError(""); }
        }}>{step === "upload" ? "취소" : "이전"}</SoftButton>
        <SoftButton variant="dark" disabled={locked || !file || (step === "preview" && !preview?.validCount)}
          onClick={() => void (step === "upload" ? checkFile() : submit())}>
          {busy ? "파일 확인 중..." : (step === "upload" ? "등록 내용 확인" : "확인")}
        </SoftButton>
      </>}>
      <div className={styles.content} aria-busy={busy}>
        {error && <div className={styles.error} role="alert"><Icon name="warning" /><span>{error}</span></div>}

        {step === "upload" ? <>
          <section className={styles.section} aria-labelledby="student-template-title">
            <h3 id="student-template-title">엑셀 템플릿</h3>
            <div className={styles.fileCard}>
              <span className={styles.fileIcon}><Icon name="file" /></span>
              <div className={styles.fileInfo}><strong>학생_일괄등록_템플릿.xlsx</strong><small>학생 명 · 학생 코드 · 나이 · 생년월일</small></div>
              <SoftButton size="small" variant="secondary" disabled={locked} onClick={() => void downloadTemplate()}><Icon name="download" />{downloading ? "다운로드 중..." : "다운로드"}</SoftButton>
            </div>
          </section>
          <section className={styles.section} aria-labelledby="student-upload-title">
            <h3 id="student-upload-title">일괄 등록 파일 정보 <span className={styles.required}>*</span></h3>
            <div className={styles.uploadRow}>
              <div className={styles.fileInfo} aria-live="polite"><strong>{file?.name ?? "선택된 파일이 없습니다."}</strong><small>{file ? `${(file.size / 1024).toFixed(1)} KB` : ".xlsx, .xls · 최대 5MB · 1,000명"}</small></div>
              <input ref={inputRef} type="file" hidden accept=".xlsx,.xls" aria-label="학생 일괄 등록 엑셀 파일" onChange={selectFile} disabled={locked} />
              <SoftButton variant="secondary" size="small" disabled={locked} onClick={() => inputRef.current?.click()}><Icon name="upload" />{file ? "파일 변경" : "파일 선택"}</SoftButton>
            </div>
          </section>
        </> : <>
          <div className={styles.summary} role="status">
            {preview && <><strong>아래 학생 정보를 등록하시겠습니까?</strong><p>전체 {preview.requestedCount}명 · 등록 가능 {preview.validCount}명 · 확인 필요 {preview.requestedCount - preview.validCount}명</p><small>{preview.validCount < preview.requestedCount ? "오류가 있는 학생은 등록되지 않습니다. 내용을 수정하려면 이전을 눌러주세요." : "내용을 확인한 후 확인 버튼을 눌러주세요."}</small></>}
          </div>
          <div className={styles.tableHeading}><h3>등록할 학생 정보</h3></div>
          <div className={styles.tableScroll} tabIndex={0} aria-label="학생 일괄 등록 내역">
            <table className={styles.table}><thead><tr><th scope="col">번호</th><th scope="col">학생 명</th><th scope="col">학생 코드</th><th scope="col">나이</th><th scope="col">생년월일</th><th scope="col">검증</th><th scope="col">오류 시 사유</th></tr></thead>
              <tbody>{rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((row, index) => {
                const success = row.errors.length === 0;
                return <tr key={row.rowNumber}><td>{page * PAGE_SIZE + index + 1}</td><td>{row.name || "—"}</td><td>{row.studentCode || "—"}</td><td>{row.age || "—"}</td><td>{row.birthDate || "—"}</td>
                  <td><StatusPill tone={success ? "green" : "red"}>{success ? "등록 가능" : "확인 필요"}</StatusPill></td>
                  <td>{row.errors.length ? row.errors.map((message, index) => <p key={index} className={styles.failureText}>{message}</p>) : "—"}</td></tr>;
              })}</tbody>
            </table>
          </div>
          <div className={styles.pagination}><span>총 {rows.length}명</span><div><SoftButton size="small" variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="이전 페이지"><Icon name="chevron-left" /></SoftButton><span>{page + 1} / {pageCount}</span><SoftButton size="small" variant="secondary" disabled={page + 1 >= pageCount} onClick={() => setPage(page + 1)} aria-label="다음 페이지"><Icon name="chevron-right" /></SoftButton></div></div>
        </>}
      </div>
    </SoftModal>}

    {step === "processing" && <div className="modal-backdrop">
      <section className={`soft-modal ${styles.progressModal}`} role="dialog" aria-modal="true" aria-labelledby="student-import-progress-title" aria-describedby="student-import-progress-description" tabIndex={-1}>
        <div className={styles.progressContent}>
          <span className={styles.progressIcon}><Icon name="upload" /></span>
          <h2 id="student-import-progress-title">학생 정보를 등록하고 있어요</h2>
          <p id="student-import-progress-description">잠시만 기다려주세요. 완료되면 결과를 알려드릴게요.</p>
          <div className={styles.progressTrack} role="progressbar" aria-label="학생 일괄 등록 진행 중"><span /></div>
        </div>
      </section>
    </div>}

    {step === "result" && result && <SoftModal key="result" open className={styles.resultModal} title="학생 일괄 등록 결과" onClose={close}
      footer={<><SoftButton variant="secondary" onClick={reset}>다른 파일 등록</SoftButton><SoftButton variant="dark" onClick={close}>확인</SoftButton></>}>
      <div className={styles.content}>
        <div className={styles.resultHeading} role="status">
          <span className={`${styles.resultIcon} ${result.failedCount ? styles.resultWarning : ""}`}><Icon name={result.failedCount ? "warning" : "check"} /></span>
          <div><h3>{result.failedCount === 0 ? "학생 등록이 완료되었습니다." : result.createdCount > 0 ? "일부 학생이 등록되지 않았습니다." : "학생을 등록하지 못했습니다."}</h3><p>{result.failedCount ? "아래에서 학생별 결과와 오류 사유를 확인해주세요." : `${result.createdCount}명의 학생이 등록되었습니다.`}</p></div>
        </div>
        <dl className={styles.resultCounts}><div><dt>전체</dt><dd>{result.requestedCount}<small>명</small></dd></div><div><dt>성공</dt><dd className={styles.successText}>{result.createdCount}<small>명</small></dd></div><div><dt>실패</dt><dd className={result.failedCount ? styles.failureText : ""}>{result.failedCount}<small>명</small></dd></div></dl>
        <div className={styles.tableHeading}><h3>학생별 처리 결과</h3><label><input type="checkbox" checked={failedOnly} onChange={(event) => { setFailedOnly(event.target.checked); setPage(0); }} />실패 항목만 보기</label></div>
        <div className={styles.tableScroll} tabIndex={0} aria-label="학생별 등록 결과">
          <table className={`${styles.table} ${styles.resultTable}`}><thead><tr><th scope="col">번호</th><th scope="col">학생 정보</th><th scope="col">결과</th><th scope="col">오류 시 사유</th></tr></thead><tbody>
            {resultRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((row) => <tr key={row.rowNumber}><td>{row.number}</td><td><strong>{row.name || "—"}</strong><small className={styles.resultCode}>{row.studentCode || "—"}</small></td><td><StatusPill tone={row.success ? "green" : "red"}>{row.success ? "성공" : "실패"}</StatusPill></td><td>{row.errors.length ? row.errors.map((message, index) => <p key={index} className={styles.failureText}>{message}</p>) : "—"}</td></tr>)}
            {resultRows.length === 0 && <tr><td colSpan={4} className={styles.empty}>실패한 항목이 없습니다.</td></tr>}
          </tbody></table>
        </div>
        <div className={styles.pagination}><span>총 {resultRows.length}명</span><div><SoftButton size="small" variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="결과 이전 페이지"><Icon name="chevron-left" /></SoftButton><span>{page + 1} / {resultPageCount}</span><SoftButton size="small" variant="secondary" disabled={page + 1 >= resultPageCount} onClick={() => setPage(page + 1)} aria-label="결과 다음 페이지"><Icon name="chevron-right" /></SoftButton></div></div>
      </div>
    </SoftModal>}

    {step === "failure" && <SoftModal key="failure" open className={styles.modal} title="학생 등록 결과 확인" onClose={close}
      footer={<><SoftButton variant="secondary" onClick={() => { setError(""); setStep("preview"); }}>이전</SoftButton><SoftButton variant="dark" onClick={close}>닫기</SoftButton></>}>
      <div className={styles.resultHeading} role="alert"><span className={`${styles.resultIcon} ${styles.resultWarning}`}><Icon name="warning" /></span><div><h3>등록 결과를 확인하지 못했습니다.</h3><p>{error}</p><p>학생 목록에서 등록 여부를 확인해주세요.</p></div></div>
    </SoftModal>}
  </div>;
}
