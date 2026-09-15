import { BrandLogo } from "@/components/BrandLogo";
import { Icon } from "@/components/Icon";
import Link from "next/link";

const messages = {
  expired: { eyebrow: "SESSION EXPIRED", title: "로그인 시간이 만료되었습니다.", body: "안전한 시스템 이용을 위해 현재 세션을 종료했습니다. 다시 로그인해주세요." },
  idle: { eyebrow: "AUTO LOGOUT", title: "장시간 활동이 없어 로그아웃되었습니다.", body: "계정 보호를 위해 사용하지 않은 세션을 자동으로 종료했습니다." },
  logout: { eyebrow: "SIGNED OUT", title: "안전하게 로그아웃되었습니다.", body: "INCITES 이용을 마쳤습니다. 다시 이용하려면 로그인해주세요." },
};

export default async function SessionEndedPage({ searchParams }: PageProps<"/session-ended">) {
  const params = await searchParams;
  const reason = typeof params.reason === "string" && params.reason in messages ? params.reason as keyof typeof messages : "expired";
  const loginPath = params.audience === "admin" ? "/admin/login" : "/login";
  const message = messages[reason];
  return (
    <main className="boundary-page">
      <BrandLogo className="boundary-brand" />
      <section className="boundary-card">
        <span className="boundary-icon"><Icon name={reason === "logout" ? "check" : "shield"} /></span>
        <span className="eyebrow">{message.eyebrow}</span>
        <h1>{message.title}</h1><p>{message.body}</p>
        <Link href={loginPath} className="soft-button primary medium">로그인 화면으로<Icon name="chevron-right" /></Link>
      </section>
      <small>보안을 위해 브라우저에 저장된 인증 정보도 함께 정리되었습니다.</small>
    </main>
  );
}
