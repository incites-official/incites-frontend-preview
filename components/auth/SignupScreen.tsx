"use client";

import { Icon } from "@/components/Icon";
import { showToast } from "@/components/feedback/Toast";
import { SoftButton, SoftInput } from "@/components/soft/Soft";
import { ApiError } from "@/lib/api";
import { apiErrorMessage, registerAccount } from "@/lib/incites-api";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type SignupRole = "parent" | "student";
type SignupStep = "role" | "details" | "code" | "complete";

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,72}$/;
const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SignupProgress({ step }: { step: Exclude<SignupStep, "complete"> }) {
  const activeStep = step === "role" ? 1 : step === "details" ? 2 : 3;

  return (
    <ol className="signup-progress" aria-label={`회원가입 ${activeStep}/3단계`}>
      {[1, 2, 3].map((item) => (
        <li className={item <= activeStep ? "active" : ""} key={item} aria-current={item === activeStep ? "step" : undefined}>
          <span className="sr-only">{item}단계</span>
        </li>
      ))}
    </ol>
  );
}

function RoleOption({
  role,
  selected,
  onSelect,
}: {
  role: SignupRole;
  selected: boolean;
  onSelect: () => void;
}) {
  const isParent = role === "parent";

  return (
    <button className={`signup-role-option ${selected ? "selected" : ""}`} type="button" aria-pressed={selected} onClick={onSelect}>
      <Icon name={isParent ? "guardian" : "graduation"} />
      <span>
        <strong>{isParent ? "학부모 (PA)" : "학생 (ST)"}</strong>
        <small>{isParent ? "자녀의 관찰 기록과 성장 과정을 확인해요" : "나의 관찰 기록과 성장 과정을 확인해요"}</small>
      </span>
    </button>
  );
}

export function SignupScreen() {
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>("role");
  const [role, setRole] = useState<SignupRole>("parent");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const passwordError = password.length > 0 && !PASSWORD_RULE.test(password);
  const detailsReady = Boolean(name.trim() && EMAIL_RULE.test(email.trim()) && PASSWORD_RULE.test(password));
  const codeReady = Boolean(studentCode.trim());

  async function register(studentCodeValue?: string) {
    setSubmitting(true);
    try {
      await registerAccount({
        password,
        name: name.trim(),
        email: email.trim(),
        role: role === "parent" ? "PARENT" : "STUDENT",
        studentCode: studentCodeValue?.trim(),
      });
      setStep("complete");
    } catch (error) {
      if (error instanceof ApiError && error.code === "LOGIN_ID_DUPLICATED") setStep("details");
      showToast(apiErrorMessage(error, "회원가입 요청을 처리하지 못했습니다."), { tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function moveForward(event?: FormEvent) {
    event?.preventDefault();
    if (step === "role") {
      setStep("details");
      return;
    }
    if (step === "details") {
      if (detailsReady) setStep("code");
      return;
    }
    if (step === "code") {
      const normalizedCode = studentCode.trim().toUpperCase();
      setStudentCode(normalizedCode);
      await register(normalizedCode);
    }
  }

  function selectRole(nextRole: SignupRole) {
    setRole(nextRole);
    setStudentCode("");
  }

  function moveBack() {
    if (step === "role") {
      router.push("/login");
      return;
    }
    if (step === "details") setStep("role");
    if (step === "code") setStep("details");
  }

  return (
    <main className="signup-stage">
      <section className="signup-app" aria-label="INCITES 회원가입">
        {step === "complete" ? (
          <div className="signup-completion">
            <span className="signup-completion-icon"><Icon name="check" /></span>
            <div className="signup-completion-copy">
              <h1>{role === "parent" ? "학부모 가입이 완료되었어요" : "학생 가입이 완료되었어요"}</h1>
              <p>{role === "parent" ? <>아이의 관찰 기록을 한곳에서 관리하고<br />성장 과정을 확인해보세요.</> : <>나의 관찰 기록을 한곳에서 관리하고<br />성장 과정을 확인해보세요.</>}</p>
            </div>
            <SoftButton className="signup-main-button" type="button" onClick={() => router.replace("/login")}>시작하기</SoftButton>
          </div>
        ) : (
          <form className={`signup-flow signup-${step}-step`} onSubmit={moveForward}>
            <header className="signup-header">
              <button type="button" onClick={moveBack} aria-label="이전 단계로 이동"><Icon name="arrow-left" /></button>
              <h1>회원가입</h1>
            </header>
            <SignupProgress step={step} />

            <h1 className="signup-step-title">
              {step === "role" && <>가입 유형을<br />선택해주세요</>}
              {step === "details" && "기본 정보를 입력해주세요"}
              {step === "code" && (role === "parent" ? "자녀 정보를 연결해주세요" : "학생 코드를 입력해주세요")}
            </h1>

            {step === "role" && (
              <div className="signup-role-list">
                <RoleOption role="parent" selected={role === "parent"} onSelect={() => selectRole("parent")} />
                <RoleOption role="student" selected={role === "student"} onSelect={() => selectRole("student")} />
              </div>
            )}

            {step === "details" && (
              <div className="signup-fields signup-details-fields">
                <SoftInput className="signup-input" label="이름" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="홍길동" maxLength={100} autoFocus />
                <SoftInput className="signup-input" label="이메일 (로그인 아이디)" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="name@example.com" maxLength={255} />
                <SoftInput className="signup-input" label="비밀번호" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" placeholder="abcd1234*" maxLength={72} error={passwordError ? "* 영문, 숫자, 특수문자 포함 8자 이상" : undefined} />
              </div>
            )}

            {step === "code" && (
              <div className="signup-fields signup-code-field">
                <SoftInput className="signup-input" label="학생 코드" value={studentCode} onChange={(event) => setStudentCode(event.target.value)} autoCapitalize="characters" autoComplete="off" placeholder="홍길동" maxLength={40} autoFocus />
              </div>
            )}

            <div className={`signup-actions ${step === "code" && role === "parent" ? "split" : ""}`}>
              {step === "code" && role === "parent" && <SoftButton variant="dark" type="button" disabled={submitting} onClick={() => void register()}>건너뛰기</SoftButton>}
              <SoftButton className="signup-main-button" type="submit" disabled={submitting || (step === "details" ? !detailsReady : step === "code" ? !codeReady : false)}>{submitting ? "가입 중" : "다음"}</SoftButton>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
