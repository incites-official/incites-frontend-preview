import { useId } from "react";

export function BrandLogo({ inverted = false, compact = false, className = "" }: { inverted?: boolean; compact?: boolean; className?: string }) {
  const gradientId = useId().replaceAll(":", "");

  return (
    <span className={`brand-logo ${inverted ? "inverted" : ""} ${compact ? "compact" : ""} ${className}`} aria-label="INCITES">
      <svg className="brand-symbol" viewBox="0 0 38 43" fill="none" aria-hidden="true">
        <path className="brand-logo-layer" opacity="0.7" d="M18.1452 17.7499 5.14934 25.1617c-1.06077.6051-1.06077 2.2444 0 2.8495l12.99586 7.4118c.4195.2395.9221.2395 1.3416 0l12.9959-7.4118c1.0607-.6051 1.0607-2.2444 0-2.8495L19.4868 17.7499a1.35 1.35 0 0 0-1.3416 0Z" fill={`url(#${gradientId})`} />
        <path className="brand-logo-layer" opacity="0.4" d="M18.1452 12.6254 5.14934 20.0372c-1.06077.6051-1.06077 2.2444 0 2.8495l12.99586 7.4118c.4195.2395.9221.2395 1.3416 0l12.9959-7.4118c1.0607-.6051 1.0607-2.2444 0-2.8495L19.4868 12.6254a1.35 1.35 0 0 0-1.3416 0Z" fill={`url(#${gradientId})`} />
        <path className="brand-logo-layer" opacity="0.2" d="M18.1452 7.50038 5.14934 14.9122c-1.06077.6051-1.06077 2.2444 0 2.8495l12.99586 7.4118c.4195.2395.9221.2395 1.3416 0l12.9959-7.4118c1.0607-.6051 1.0607-2.2444 0-2.8495L19.4868 7.50038a1.35 1.35 0 0 0-1.3416 0Z" fill={`url(#${gradientId})`} />
        <g className="brand-logo-frame" stroke="currentColor" strokeMiterlimit="10">
          <path d="M36.9295 11.3498v-.3397l-.2943-.1698M36.0312 10.4918 19.4222.902344M19.1205.72792l-.2943-.169815-.2944.169815M17.9279 1.07666 1.31891 10.6661M1.01718 10.8403l-.294341.1698v.3397M.722839 12.0474v19.1782M.722839 31.5742v.3396l.294341.1699M1.62115 32.4321l16.60895 9.5894M18.5318 42.1958l.2944.1698.2943-.1698M19.7245 41.8472l16.609-9.5894M36.6352 32.0837l.2943-.1699v-.3396M36.9295 30.8765V11.6982" strokeWidth=".12" strokeDasharray=".96 .96" />
        </g>
        <g className="brand-logo-nodes" fill="currentColor">
          <circle cx="18.8262" cy=".722843" r=".722843" /><circle cx=".722843" cy="11.0104" r=".722843" /><circle cx="36.9092" cy="11.0104" r=".722843" /><circle cx=".722843" cy="31.9245" r=".722843" /><circle cx="36.9092" cy="31.9245" r=".722843" /><circle cx="18.8262" cy="42.2014" r=".722843" />
        </g>
        <defs><linearGradient id={gradientId} x1="18.816" y1="7.32108" x2="18.816" y2="35.6023" gradientUnits="userSpaceOnUse"><stop stopColor="#4CD3C8" /><stop offset="1" stopColor="#257DDB" /></linearGradient></defs>
      </svg>
      {!compact && <strong>INCITES</strong>}
    </span>
  );
}
