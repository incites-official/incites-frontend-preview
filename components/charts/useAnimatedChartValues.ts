"use client";

import { useEffect, useRef, useState } from "react";

function normalizedValue(value: number) {
  return Number.isFinite(value) ? value : 0;
}

export function useAnimatedChartValues(targetValues: number[], duration = 560) {
  const targetKey = targetValues.map(normalizedValue).join("|");
  const [displayValues, setDisplayValues] = useState<number[]>(() => targetValues.map(() => 0));
  const currentValues = useRef(displayValues);

  useEffect(() => {
    const nextValues = targetKey ? targetKey.split("|").map(Number) : [];
    const updateValues = (values: number[]) => {
      currentValues.current = values;
      setDisplayValues(values);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || duration <= 0) {
      updateValues(nextValues);
      return;
    }

    const startValues = currentValues.current.length === nextValues.length
      ? [...currentValues.current]
      : nextValues.map(() => 0);
    if (startValues.every((value, index) => value === nextValues[index])) {
      updateValues(nextValues);
      return;
    }

    let animationFrame = 0;
    let startedAt: number | null = null;
    const animate = (timestamp: number) => {
      startedAt ??= timestamp;
      const progress = Math.min(1, (timestamp - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      updateValues(startValues.map((value, index) => value + (nextValues[index] - value) * eased));
      if (progress < 1) animationFrame = window.requestAnimationFrame(animate);
    };

    animationFrame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [duration, targetKey]);

  return displayValues.length === targetValues.length ? displayValues : targetValues.map(() => 0);
}
