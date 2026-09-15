"use client";

import { BrandLogo } from "@/components/BrandLogo";
import { showToast } from "@/components/feedback/Toast";
import { Icon } from "@/components/Icon";
import { useAuth } from "@/components/providers/AuthProvider";
import { InlineMessage, SoftButton, SoftInput } from "@/components/soft/Soft";
import { ApiError } from "@/lib/api";
import { DEMO_PASSWORD, demoAccountGroups, type DemoAccount } from "@/lib/demo-data";
import { homePathForRole } from "@/lib/navigation";
import type { Role } from "@/lib/types";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

function GoogleLogo() {
  return (
    <svg className="login-provider-icon google" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.482h4.844a4.14 4.14 0 0 1-1.797 2.716v2.259h2.909c1.702-1.567 2.684-3.875 2.684-6.616Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.468-.806 5.956-2.179l-2.909-2.259c-.806.54-1.835.859-3.047.859-2.344 0-4.328-1.585-5.037-3.714H.956v2.332A8.999 8.999 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.963 10.707A5.41 5.41 0 0 1 3.682 9c0-.592.102-1.168.281-1.707V4.961H.956A8.996 8.996 0 0 0 0 9c0 1.452.347 2.827.956 4.039l3.007-2.332Z" />
      <path fill="#EA4335" d="M9 3.579c1.321 0 2.507.454 3.441 1.346l2.581-2.582C13.464.891 11.426 0 9 0A8.999 8.999 0 0 0 .956 4.961l3.007 2.332C4.672 5.164 6.656 3.579 9 3.579Z" />
    </svg>
  );
}

function KakaoLogo() {
  return (
    <svg className="login-provider-icon kakao" viewBox="0 0 24 22" aria-hidden="true">
      <path fill="currentColor" d="M12 1C5.925 1 1 4.807 1 9.504c0 2.922 1.9 5.5 4.788 7.032l-1.215 4.46a.45.45 0 0 0 .69.49l5.34-3.532c.458.043.924.065 1.397.065 6.075 0 11-3.807 11-8.515C23 4.807 18.075 1 12 1Z" />
    </svg>
  );
}

export function LoginScreen({ audience }: { audience: "system" | "mobile" }) {
  const { user, initialized, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rememberId, setRememberId] = useState(false);
  const [accountNotice, setAccountNotice] = useState<string | null>(null);
  const isMobileAudience = audience === "mobile";

  useEffect(() => {
    if (initialized && user) router.replace(homePathForRole(user.role));
  }, [initialized, router, user]);

  useEffect(() => {
    const restoreSavedEmail = window.setTimeout(() => {
      const savedEmail = window.localStorage.getItem("incites.saved-login-email")
        ?? window.localStorage.getItem("incites.saved-login-id");
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberId(true);
      }
    }, 0);
    return () => window.clearTimeout(restoreSavedEmail);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await authenticate(email.trim(), password);
  }

  async function authenticate(loginEmail: string, loginPassword: string) {
    setSubmitting(true);
    setAccountNotice(null);
    try {
      const allowedRoles: Role[] = isMobileAudience ? ["PARENT", "STUDENT"] : ["ADMIN", "OPERATOR"];
      const profile = await login(loginEmail, loginPassword, allowedRoles);
      window.localStorage.removeItem("incites.saved-login-id");
      if (rememberId) window.localStorage.setItem("incites.saved-login-email", loginEmail);
      else window.localStorage.removeItem("incites.saved-login-email");
      router.replace(homePathForRole(profile.role));
    } catch (requestError) {
      showToast(requestError instanceof ApiError ? requestError.message : "로그인 요청을 처리하지 못했습니다.", { tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function loginWithDemoAccount(account: DemoAccount) {
    setEmail(account.email);
    setPassword(account.password);
    await authenticate(account.email, account.password);
  }

  const visibleDemoGroups = demoAccountGroups.filter((group) => isMobileAudience
    ? group.id === "STUDENT" || group.id === "PARENT"
    : group.id === "ADMIN" || group.id === "TEACHER");

  return (
    <main className={`login-page ${isMobileAudience ? "mobile-login-page" : "system-login-page"}`}>
      <section className="login-showcase">
        <BrandLogo inverted className="login-brand" />
        <div className="showcase-copy"><h1>아이의 하루를 기록하고,<br />성장을 발견하세요.</h1><p>수업 중 관찰은 간편하게 기록하고,<br />INCITES와 함께 성장의 흐름을 한눈에 확인하세요.</p></div>
        <div className="showcase-features">
          <article><span><Icon name="star" /></span><strong>핵심 영역 기록</strong><small>오늘 수업 학급</small></article>
          <article><span><Icon name="activity" /></span><strong>Level 평가</strong><small>L1~L4 기준 문구 기반 일관된 평가</small></article>
          <article><span><Icon name="camera" /></span><strong>수업 사진</strong><small>촬영 동의 학생만 업로드 활성화</small></article>
          <article><span><Icon name="sparkles" /></span><strong>AI 종합 코멘트</strong><small>검토 후 공개, 회수까지 상태 관리</small></article>
        </div>
      </section>
      <section className="login-panel">
        <form className="login-form" onSubmit={submit}>
          <BrandLogo className="mobile-brand" />
          <div className="login-form-head">
            <h2>{isMobileAudience ? <><strong>INCITES</strong>에 로그인하세요</> : <><strong>INCITES</strong> 관리자 로그인</>}</h2>
            <p>{isMobileAudience ? "관찰 기록과 성장 리포트를 한곳에서 관리하세요." : "운영 관리 시스템에 접속하세요."}</p>
          </div>
          <section className="demo-account-picker" aria-label="데모 계정 빠른 로그인">
            <div className="demo-account-heading">
              <span>DEMO</span>
              <p>확인할 계정을 선택하면 바로 로그인됩니다.</p>
              <small>공통 비밀번호 {DEMO_PASSWORD}</small>
            </div>
            <div className="demo-account-groups">
              {visibleDemoGroups.map((group) => (
                <div className="demo-account-group" key={group.id}>
                  <strong>{group.label}</strong>
                  <div>
                    {group.accounts.map((account, index) => (
                      <button type="button" disabled={submitting} onClick={() => void loginWithDemoAccount(account)} key={account.id}>
                        <span>{index + 1}</span>
                        <b>{account.name}</b>
                        <small>{account.email}</small>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
          <div className="login-fields">
            <SoftInput label="이메일" hideLabel type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" placeholder="이메일" autoFocus required />
            <SoftInput label="비밀번호" hideLabel type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="비밀번호" required />
          </div>
          <label className="remember-login"><input type="checkbox" checked={rememberId} onChange={(event) => setRememberId(event.target.checked)} /><span className="remember-desktop-label">이메일 저장</span><span className="remember-mobile-label">자동 로그인</span></label>
          {accountNotice && <InlineMessage tone="info"><Icon name="info" />{accountNotice}</InlineMessage>}
          <SoftButton className="login-submit" type="submit" disabled={submitting || !email.trim() || !password}>{submitting ? <><span className="button-spinner" />로그인 중</> : "로그인"}</SoftButton>
          <div className="login-mobile-actions">
            <nav className="login-account-links" aria-label="계정 도움말">
              <button type="button" onClick={() => router.push("/find-email")}>이메일 찾기</button><i aria-hidden="true" />
              <button type="button" onClick={() => router.push("/reset-password")}>비밀번호 재설정</button><i aria-hidden="true" />
              <button type="button" onClick={() => router.push("/signup")}>회원가입</button>
            </nav>
            <div className="login-divider"><span>OR</span></div>
            <div className="login-provider-buttons">
              <button type="button" className="login-provider-button google" onClick={() => setAccountNotice("Google 로그인은 현재 지원하지 않습니다. 가입한 이메일로 로그인해주세요.")}><GoogleLogo />Google로 로그인</button>
              <button type="button" className="login-provider-button kakao" onClick={() => setAccountNotice("카카오 로그인은 현재 지원하지 않습니다. 가입한 이메일로 로그인해주세요.")}><KakaoLogo />카카오로 로그인</button>
            </div>
          </div>
          <p className="login-help"><Icon name="shield" />로그인에 연속 실패하면 계정이 일정 시간 잠깁니다.</p>
        </form>
      </section>
    </main>
  );
}
