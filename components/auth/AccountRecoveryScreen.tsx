"use client";

import searchPeopleIcon from "@/common/icon/search_people.svg";
import { showToast } from "@/components/feedback/Toast";
import { Icon } from "@/components/Icon";
import { SoftButton, SoftInput } from "@/components/soft/Soft";
import {
  apiErrorMessage,
  completePasswordReset,
  findEmail,
  requestPasswordReset,
  verifyPasswordReset,
} from "@/lib/incites-api";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type RecoveryMode = "find-email" | "reset-password";
type ResetStep = "details" | "verify" | "password" | "complete";

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,72}$/;

function RecoveryHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="recovery-header">
      <button type="button" onClick={onBack} aria-label="이전 화면으로 이동"><Icon name="arrow-left" /></button>
      <h1>{title}</h1>
    </header>
  );
}

function RecoveryError({ children }: { children: string }) {
  return <div className="recovery-error" role="alert"><Icon name="alert-circle" />{children}</div>;
}

export function AccountRecoveryScreen({ mode }: { mode: RecoveryMode }) {
  const router = useRouter();
  const [step, setStep] = useState<ResetStep>("details");
  const [name, setName] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [developmentCode, setDevelopmentCode] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [foundEmail, setFoundEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isFindEmail = mode === "find-email";
  const title = isFindEmail ? "이메일 찾기" : "비밀번호 재설정";
  const passwordInvalid = newPassword.length > 0 && !PASSWORD_RULE.test(newPassword);

  function goBack() {
    setError(null);
    if (step === "details" || step === "complete" || isFindEmail) {
      router.push("/login");
      return;
    }
    if (step === "verify") setStep("details");
    if (step === "password") setStep("verify");
  }

  async function submitDetails(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (isFindEmail) {
        const result = await findEmail({ name: name.trim(), studentCode: studentCode.trim().toUpperCase() });
        setFoundEmail(result.email);
        setStep("complete");
      } else {
        const result = await requestPasswordReset({ name: name.trim(), email: email.trim() });
        setChallengeId(result.challengeId);
        setDevelopmentCode(result.developmentCode);
        setVerificationCode("");
        setStep("verify");
      }
    } catch (reason) {
      setError(apiErrorMessage(reason, isFindEmail ? "이메일을 찾지 못했습니다." : "계정 정보를 확인하지 못했습니다."));
    } finally {
      setSubmitting(false);
    }
  }

  async function resendCode() {
    setSubmitting(true);
    setError(null);
    try {
      const result = await requestPasswordReset({ name: name.trim(), email: email.trim() });
      setChallengeId(result.challengeId);
      setDevelopmentCode(result.developmentCode);
      setVerificationCode("");
      showToast("인증번호를 다시 발송했습니다.");
    } catch (reason) {
      setError(apiErrorMessage(reason, "인증번호를 다시 발송하지 못했습니다."));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitVerification(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await verifyPasswordReset({ challengeId, code: verificationCode });
      setResetToken(result.resetToken);
      setNewPassword("");
      setStep("password");
    } catch (reason) {
      setError(apiErrorMessage(reason, "인증번호를 확인하지 못했습니다."));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitNewPassword(event: FormEvent) {
    event.preventDefault();
    if (!PASSWORD_RULE.test(newPassword)) return;
    setSubmitting(true);
    setError(null);
    try {
      await completePasswordReset({ resetToken, newPassword });
      setStep("complete");
    } catch (reason) {
      setError(apiErrorMessage(reason, "비밀번호를 변경하지 못했습니다."));
    } finally {
      setSubmitting(false);
    }
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(foundEmail);
      showToast("이메일을 복사했습니다.");
    } catch {
      showToast("이메일을 복사하지 못했습니다.", { tone: "error" });
    }
  }

  const detailsReady = Boolean(name.trim() && (isFindEmail ? studentCode.trim() : email.trim()));

  return (
    <main className="recovery-stage">
      <section className="recovery-app" aria-label={title}>
        {step !== "complete" && <RecoveryHeader title={title} onBack={goBack} />}

        {step === "details" && (
          <form className="recovery-form" onSubmit={submitDetails}>
            <h2>가입 정보를 입력해주세요</h2>
            <div className="recovery-fields">
              <SoftInput label="이름" value={name} maxLength={100} onChange={(event) => setName(event.target.value)} placeholder="이름을 입력해주세요." autoComplete="name" autoFocus />
              {isFindEmail ? (
                <SoftInput label="학생 코드" value={studentCode} maxLength={40} onChange={(event) => setStudentCode(event.target.value)} placeholder="코드를 입력해주세요." autoCapitalize="characters" autoComplete="off" />
              ) : (
                <SoftInput label="이메일" type="email" value={email} maxLength={255} onChange={(event) => setEmail(event.target.value)} placeholder="이메일을 입력해주세요." autoComplete="email" />
              )}
            </div>
            {error && <RecoveryError>{error}</RecoveryError>}
            <SoftButton className="recovery-submit" type="submit" disabled={submitting || !detailsReady}>{submitting ? "확인 중..." : isFindEmail ? "이메일 찾기" : "다음"}</SoftButton>
          </form>
        )}

        {step === "verify" && (
          <form className="recovery-form" onSubmit={submitVerification}>
            <h2>이메일을 인증해주세요</h2>
            <p className="recovery-description">입력하신 이메일로 인증번호를 발송했습니다.</p>
            <div className="recovery-fields single">
              <SoftInput label="인증번호" inputMode="numeric" value={verificationCode} maxLength={6} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))} placeholder="인증번호 6자리" autoComplete="one-time-code" autoFocus />
            </div>
            <p className="recovery-resend">인증번호가 오지 않았나요? <button type="button" disabled={submitting} onClick={() => void resendCode()}>재전송</button></p>
            {developmentCode && <p className="recovery-development-code">개발용 인증번호 <strong>{developmentCode}</strong></p>}
            {error && <RecoveryError>{error}</RecoveryError>}
            <SoftButton className="recovery-submit" type="submit" disabled={submitting || verificationCode.length !== 6}>{submitting ? "인증 중..." : "인증하기"}</SoftButton>
          </form>
        )}

        {step === "password" && (
          <form className="recovery-form" onSubmit={submitNewPassword}>
            <h2>새 비밀번호를 입력해주세요</h2>
            <div className="recovery-fields single">
              <SoftInput label="비밀번호" type="password" value={newPassword} maxLength={72} onChange={(event) => setNewPassword(event.target.value)} placeholder="새 비밀번호" autoComplete="new-password" error={passwordInvalid ? "* 영문, 숫자, 특수문자 포함 8자 이상" : undefined} autoFocus />
            </div>
            {error && <RecoveryError>{error}</RecoveryError>}
            <SoftButton className="recovery-submit" type="submit" disabled={submitting || !PASSWORD_RULE.test(newPassword)}>{submitting ? "변경 중..." : "완료"}</SoftButton>
          </form>
        )}

        {step === "complete" && (
          <div className="recovery-completion">
            <span className={`recovery-completion-icon ${isFindEmail ? "people" : "password"}`}>
              {isFindEmail ? <Image src={searchPeopleIcon} alt="" priority /> : <><Icon name="refresh" /><Icon name="key" /></>}
            </span>
            <h1>{isFindEmail ? "이메일을 찾았어요" : "비밀번호가 변경되었어요"}</h1>
            <p>{isFindEmail ? "입력하신 정보와 일치하는 로그인 이메일입니다." : "새로운 비밀번호로 로그인해주세요."}</p>
            {isFindEmail && (
              <div className="recovery-login-id"><strong>이메일</strong><span>{foundEmail}</span><button type="button" onClick={() => void copyEmail()} aria-label="이메일 복사"><i /><i /></button></div>
            )}
            <SoftButton className="recovery-submit" type="button" onClick={() => router.replace("/login")}>로그인 화면으로</SoftButton>
          </div>
        )}
      </section>
    </main>
  );
}
