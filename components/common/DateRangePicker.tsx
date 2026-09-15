"use client";

import { Icon } from "@/components/Icon";
import { useEffect, useMemo, useRef, useState } from "react";

export interface DateRangeValue {
  from: string;
  to: string;
}

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatRangeDate(value: string) {
  const date = parseDate(value);
  return `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, "0")}. ${String(date.getDate()).padStart(2, "0")}.`;
}

export function DateRangePicker({
  value,
  onChange,
  label = "조회 기간",
  triggerText,
  className = "",
}: {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  label?: string;
  triggerText?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const selected = parseDate(value.to);
    return new Date(selected.getFullYear(), selected.getMonth(), 1);
  });
  const [pendingStart, setPendingStart] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function closeFromOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setPendingStart(null);
      }
    }
    function closeFromEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      setPendingStart(null);
      triggerRef.current?.focus();
    }
    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeFromEscape);
    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("keydown", closeFromEscape);
    };
  }, [open]);

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    return [
      ...Array.from({ length: firstWeekday }, () => null),
      ...Array.from({ length: lastDay }, (_, index) => new Date(year, month, index + 1)),
    ];
  }, [visibleMonth]);

  const previewFrom = pendingStart ?? value.from;
  const previewTo = pendingStart ?? value.to;

  function chooseDate(date: Date) {
    const selected = toDateValue(date);
    if (!pendingStart || selected < pendingStart) {
      setPendingStart(selected);
      return;
    }
    onChange({ from: pendingStart, to: selected });
    setPendingStart(null);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function changeMonth(offset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  return (
    <div className={`date-range-picker ${open ? "open" : ""} ${className}`} ref={rootRef}>
      <button
        ref={triggerRef}
        className="date-range-trigger"
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current);
          setPendingStart(null);
        }}
      >
        <Icon name="calendar" />
        <span>{triggerText ?? `${formatRangeDate(value.from)} – ${formatRangeDate(value.to)}`}</span>
        <Icon name="chevron-right" />
      </button>
      {open && (
        <section className="date-range-calendar" role="dialog" aria-label={`${label} 달력`}>
          <h4>{pendingStart ? "종료일을 선택해주세요" : "기간을 선택해주세요"}</h4>
          <div className="date-range-calendar-month">
            <strong>{visibleMonth.getFullYear()}년 {visibleMonth.getMonth() + 1}월</strong>
            <div>
              <button type="button" onClick={() => changeMonth(-1)} aria-label="이전 달"><Icon name="chevron-left" /></button>
              <button type="button" onClick={() => changeMonth(1)} aria-label="다음 달"><Icon name="chevron-right" /></button>
            </div>
          </div>
          <div className="date-range-calendar-weekdays" aria-hidden="true">
            {weekdays.map((weekday) => <span key={weekday}>{weekday}</span>)}
          </div>
          <div className="date-range-calendar-days">
            {calendarDays.map((date, index) => {
              if (!date) return <span key={`blank-${index}`} />;
              const dateValue = toDateValue(date);
              const boundary = dateValue === previewFrom || dateValue === previewTo;
              const inRange = dateValue >= previewFrom && dateValue <= previewTo;
              return (
                <button
                  type="button"
                  className={`${boundary ? "selected" : ""} ${inRange ? "in-range" : ""}`}
                  aria-pressed={boundary}
                  aria-label={`${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`}
                  key={dateValue}
                  onClick={() => chooseDate(date)}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
