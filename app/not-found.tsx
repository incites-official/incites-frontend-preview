import { BrandLogo } from "@/components/BrandLogo";
import { Icon } from "@/components/Icon";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="boundary-page not-found-page">
      <BrandLogo className="boundary-brand" />
      <section className="boundary-card"><strong className="error-number">404</strong><span className="eyebrow">PAGE NOT FOUND</span><h1>요청한 페이지를 찾을 수 없습니다.</h1><p>주소가 올바른지 확인하거나 홈으로 돌아가 다시 시작해주세요.</p><Link href="/" className="soft-button primary medium">홈으로 이동<Icon name="chevron-right" /></Link></section>
    </main>
  );
}
