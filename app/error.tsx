"use client";

import { Icon } from "@/components/Icon";
import { SoftButton } from "@/components/soft/Soft";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="boundary-page"><section className="boundary-card"><span className="boundary-icon warning"><Icon name="warning" /></span><span className="eyebrow">UNEXPECTED ERROR</span><h1>페이지를 표시하지 못했습니다.</h1><p>일시적인 오류일 수 있습니다. 잠시 후 다시 시도해주세요.</p><SoftButton onClick={reset}><Icon name="refresh" />다시 시도</SoftButton></section></main>
  );
}
