"use client";

import { showToast } from "@/components/feedback/Toast";
import { Icon } from "@/components/Icon";
import { SoftButton, SoftDropdown } from "@/components/soft/Soft";
import { WorkspaceEmpty, WorkspaceTabs } from "@/components/workspace/WorkspaceUi";
import { apiErrorMessage, getCompetencyCatalog, getReportAiSetting, getSettingsActivityLogs, updateReportAiSetting, type CompetencyCatalog, type CompetencyCatalogItem } from "@/lib/incites-api";
import type { ApiRequestLogItem } from "@/lib/types";
import Image from "next/image";
import { useEffect, useState } from "react";

type SettingsTab = "competencies" | "levels" | "activity";

const tabs = [
  { id: "competencies", label: "7대 평가 영역" },
  { id: "levels", label: "Level 1 ~ 4 기준" },
  { id: "activity", label: "활동 로그" },
] as const;

const competencyVisuals: Record<string, { image: string; width: number }> = {
  I: { image: "/settings/competencies/initiative.svg", width: 518 },
  N: { image: "/settings/competencies/inquiry.svg", width: 522 },
  C: { image: "/settings/competencies/collaboration.svg", width: 520 },
  I2: { image: "/settings/competencies/initiative.svg", width: 518 },
  T: { image: "/settings/competencies/thinking.svg", width: 487 },
  E: { image: "/settings/competencies/expression.svg", width: 528 },
  S: { image: "/settings/competencies/sustained-focus.svg", width: 541 },
};

const toneOptions = [
  { value: "warm", label: "따뜻하고 용기를 주는 톤" },
  { value: "analytical", label: "객관적이고 전문적인 분석 톤" },
  { value: "data", label: "데이터 및 정량 지표 중심 톤" },
];

function CompetencyPanel({ competencies }: { competencies: CompetencyCatalogItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  if (!competencies.length) return <WorkspaceEmpty icon="growth" title="등록된 역량 기준이 없습니다." description="역량 카탈로그 API 설정을 확인해주세요." />;
  const competency = competencies[activeIndex];
  const visual = competencyVisuals[competency.code] ?? competencyVisuals.I;

  function move(offset: number) {
    setActiveIndex((current) => (current + offset + competencies.length) % competencies.length);
  }

  return (
    <section className="competency-carousel" aria-roledescription="carousel" aria-label="INCITES 7대 핵심 역량">
      <h3>INCITES 7대 핵심 역량 영역 정리</h3>
      <div className="competency-slide" role="group" aria-label={`${activeIndex + 1} / ${competencies.length}`}>
        <Image
          className="competency-visual"
          src={visual.image}
          alt=""
          width={visual.width}
          height={400}
          unoptimized
          priority={activeIndex === 0}
          draggable={false}
        />
        <div className="competency-slide-copy">
          <strong>{competency.name} ({competency.englishName})</strong>
          <p>{competency.description}</p>
        </div>
      </div>
      {activeIndex > 0 && (
        <button className="competency-arrow previous" type="button" onClick={() => move(-1)} aria-label="이전 역량 보기">
          <Icon name="chevron-left" />
        </button>
      )}
      <button className="competency-arrow next" type="button" onClick={() => move(1)} aria-label="다음 역량 보기">
        <Icon name="chevron-right" />
      </button>
      <div className="competency-pagination" aria-label="역량 바로가기">
        {competencies.map((item, index) => (
          <button
            type="button"
            className={index === activeIndex ? "active" : ""}
            aria-label={`${item.name} 보기`}
            aria-current={index === activeIndex ? "true" : undefined}
            onClick={() => setActiveIndex(index)}
            key={`${item.code}-${item.name}`}
          >
            {item.code}
          </button>
        ))}
      </div>
    </section>
  );
}

function LevelStandardsPanel({ catalog, tone, prompt, saving, onToneChange, onPromptChange, onSave }: { catalog: CompetencyCatalog; tone: string; prompt: string; saving: boolean; onToneChange: (value: string) => void; onPromptChange: (value: string) => void; onSave: () => void }) {

  return (
    <div className="level-settings-layout">
      <section className="level-standard-panel">
        <h3>Level 기준</h3>
        <div className="level-standard-list">
          {catalog.levels.map((item) => (
            <article key={item.level}>
              <span>{item.level.replace("L", "LV ")}</span>
              <strong>{item.label}</strong>
              <b>{item.score} 점</b>
            </article>
          ))}
        </div>
        <h4>행동 관찰 추천 태그 라이브러리</h4>
        <div className="observation-tag-list">
          {[catalog.suggestedTags.slice(0, 3), catalog.suggestedTags.slice(3, 6)].map((row, rowIndex) => (
            <div className="observation-tag-row" key={rowIndex}>
              {row.map((tag) => (
                <span key={tag}># {tag}</span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="report-tone-panel">
        <h3>AI 종합 리포트 톤앤매너 설정</h3>
        <div className="tone-setting-field">
          <label>
            <Image className="settings-field-icon" src="/settings/icons/report-tone.svg" alt="" width={22} height={22} unoptimized />
            톤앤매너 선택
          </label>
          <SoftDropdown
            className="report-tone-dropdown"
            label="톤앤매너 선택"
            value={tone}
            options={toneOptions}
            onChange={onToneChange}
            hideLabel
          />
        </div>
        <label className="prompt-template-field">
          <span>
            <Image className="settings-field-icon" src="/settings/icons/ai-prompt.svg" alt="" width={24} height={24} unoptimized />
            AI 프롬프트 지시어 템플릿
          </span>
          <textarea value={prompt} onChange={(event) => onPromptChange(event.target.value)} />
        </label>
        <button className="report-settings-save" type="button" disabled={saving} onClick={onSave}>{saving ? "저장 중..." : "수정사항 저장"}</button>
      </section>
    </div>
  );
}

function ActivityLogPanel({ logs }: { logs: ApiRequestLogItem[] }) {
  if (!logs.length) return <WorkspaceEmpty icon="file" title="표시할 시스템 활동 로그가 없습니다." description="관리 작업이 발생하면 감사 로그가 이곳에 표시됩니다." />;
  return (
    <section className="settings-activity-panel" aria-labelledby="system-audit-log-title">
      <h3 id="system-audit-log-title">시스템 감사 활동 로그</h3>
      <div className="settings-log-table" role="table" aria-label="시스템 감사 활동 로그" tabIndex={0}>
        <div className="settings-log-row header" role="row">
          <span role="columnheader">타임스탬프</span>
          <span role="columnheader">사용자명</span>
          <span role="columnheader">Role</span>
          <span role="columnheader">액션명</span>
          <span role="columnheader">대상 객체</span>
          <span role="columnheader">IP 주소</span>
          <span role="columnheader">결과</span>
        </div>
        {logs.map((log) => (
          <div className="settings-log-row" role="row" key={log.id}>
            <time role="cell">{new Date(log.requestedAt).toLocaleString("ko-KR")}</time>
            <strong role="cell">{log.userName ?? log.loginId ?? "비로그인"}</strong>
            <b className="settings-log-role" role="cell">{log.role ?? "-"}</b>
            <strong role="cell">{log.httpMethod}</strong>
            <strong role="cell">{log.requestPath}</strong>
            <span role="cell">{log.clientIp ?? "-"}</span>
            <span className="settings-log-result" role="cell">{log.responseStatus < 400 ? "성공" : `실패 ${log.responseStatus}`}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SystemSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("competencies");
  const [savedAt, setSavedAt] = useState("");
  const [tone, setTone] = useState("warm");
  const [prompt, setPrompt] = useState("");
  const [logs, setLogs] = useState<ApiRequestLogItem[]>([]);
  const [catalog, setCatalog] = useState<CompetencyCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([getReportAiSetting(), getSettingsActivityLogs(), getCompetencyCatalog()])
      .then(([setting, page, competencyCatalog]) => {
        if (!active) return;
        setTone(setting.tone);
        setPrompt(setting.promptTemplate);
        setLogs(page.items);
        setCatalog(competencyCatalog);
      })
      .catch((reason) => {
        if (active) showToast(apiErrorMessage(reason, "시스템 설정을 불러오지 못했습니다."), { tone: "error" });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function saveSettings() {
    setSaving(true);
    try {
      const saved = await updateReportAiSetting(tone, prompt);
      setTone(saved.tone);
      setPrompt(saved.promptTemplate);
      setSavedAt(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }));
    } catch (reason) {
      showToast(apiErrorMessage(reason, "시스템 설정을 저장하지 못했습니다."), { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="settings-page diagnostic-settings page-stack workspace-page">
      <div className="page-heading settings-page-heading">
        <div>
          <h2>INCITES 진단 및 시스템 설정</h2>
          <p>INCITE 7대 핵심 역량 레벨, Level 1 ~ 4 세그먼트 환산식, AI 종합 코멘트 프롬프트 및 감사 로그를 설정합니다</p>
        </div>
        <SoftButton className="settings-page-save" disabled={saving || loading} onClick={() => void saveSettings()}>{saving ? "저장 중..." : "저장"}</SoftButton>
      </div>
      <span className="sr-only" role="status">{savedAt && `${savedAt}에 설정을 저장했습니다.`}</span>
      <section className={`soft-card workspace-card settings-card settings-card-${activeTab}`}>
        <WorkspaceTabs tabs={tabs} active={activeTab} onChange={setActiveTab} label="시스템 설정" />
        {loading ? <div className="workspace-empty"><span className="spinner" /><strong>시스템 설정을 불러오고 있습니다.</strong></div> : <>
          {activeTab === "competencies" && <CompetencyPanel competencies={catalog?.competencies ?? []} />}
          {activeTab === "levels" && (catalog ? <LevelStandardsPanel catalog={catalog} tone={tone} prompt={prompt} saving={saving} onToneChange={setTone} onPromptChange={setPrompt} onSave={() => void saveSettings()} /> : <WorkspaceEmpty icon="growth" title="등록된 평가 기준이 없습니다." description="평가 기준이 준비되면 이곳에 표시됩니다." />)}
          {activeTab === "activity" && <ActivityLogPanel logs={logs} />}
        </>}
      </section>
    </div>
  );
}
