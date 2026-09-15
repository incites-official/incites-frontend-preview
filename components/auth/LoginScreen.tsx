"use client";

import { BrandLogo } from "@/components/BrandLogo";
import { showToast } from "@/components/feedback/Toast";
import { Icon } from "@/components/Icon";
import { useAuth } from "@/components/providers/AuthProvider";
import { SoftButton, SoftInput } from "@/components/soft/Soft";
import { ApiError } from "@/lib/api";
import { homePathForRole } from "@/lib/navigation";
import type { Role } from "@/lib/types";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export function LoginScreen({ audience }: { audience: "system" | "mobile" }) {
  const { user, initialized, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rememberId, setRememberId] = useState(false);
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
    setSubmitting(true);
    try {
      const allowedRoles: Role[] = isMobileAudience ? ["PARENT", "STUDENT"] : ["ADMIN", "OPERATOR"];
      const profile = await login(email.trim(), password, allowedRoles);
      window.localStorage.removeItem("incites.saved-login-id");
      if (rememberId) window.localStorage.setItem("incites.saved-login-email", email.trim());
      else window.localStorage.removeItem("incites.saved-login-email");
      router.replace(homePathForRole(profile.role));
    } catch (requestError) {
      showToast(requestError instanceof ApiError ? requestError.message : "로그인 요청을 처리하지 못했습니다.", { tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

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
          <div className="login-fields">
            <SoftInput label="이메일" hideLabel type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" placeholder="이메일" autoFocus required />
            <SoftInput label="비밀번호" hideLabel type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="비밀번호" required />
          </div>
          <label className="remember-login"><input type="checkbox" checked={rememberId} onChange={(event) => setRememberId(event.target.checked)} /><span className="remember-desktop-label">이메일 저장</span><span className="remember-mobile-label">자동 로그인</span></label>
          <SoftButton className="login-submit" type="submit" disabled={submitting || !email.trim() || !password}>{submitting ? <><span className="button-spinner" />로그인 중</> : "로그인"}</SoftButton>
          <div className="login-mobile-actions">
            <nav className="login-account-links" aria-label="계정 도움말">
              <button type="button" onClick={() => router.push("/find-email")}>이메일 찾기</button><i aria-hidden="true" />
              <button type="button" onClick={() => router.push("/reset-password")}>비밀번호 재설정</button><i aria-hidden="true" />
              <button type="button" onClick={() => router.push("/signup")}>회원가입</button>
            </nav>
            <div className="login-provider-placeholder" aria-hidden="true" />
          </div>
          <p className="login-help"><Icon name="shield" />로그인에 연속 실패하면 계정이 일정 시간 잠깁니다.</p>
        </form>
      </section>
    </main>
  );
}
