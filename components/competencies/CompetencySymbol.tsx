import Image from "next/image";

import incitesSymbolSprite from "@/common/Symbol_INCITES.svg";

const SYMBOL_X: Record<string, number> = {
  I: 20,
  I2: 20,
  N: 78,
  C: 136,
  T: 194,
  E: 252,
  S: 310,
};

type CompetencySymbolProps = {
  code: string;
  size?: number;
  className?: string;
};

export function CompetencySymbol({ code, size = 44, className = "" }: CompetencySymbolProps) {
  const sourceX = SYMBOL_X[code] ?? SYMBOL_X.I;
  const scale = size / 44;

  return (
    <span
      className={`competency-symbol ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span
        className="competency-symbol-sprite"
        style={{ transform: `scale(${scale}) translate(${-sourceX}px, -20px)` }}
      >
        <Image src={incitesSymbolSprite} alt="" width={374} height={84} unoptimized />
      </span>
    </span>
  );
}
