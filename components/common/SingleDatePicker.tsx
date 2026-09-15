"use client";

import { Icon } from "@/components/Icon";
import { useEffect, useMemo, useRef, useState } from "react";

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

function formatDate(value: string) {
  const selected = parseDate(value);
  return `${selected.getFullYear()}. ${String(selected.getMonth() + 1).padStart(2, "0")}. ${String(selected.getDate()).padStart(2, "0")}`;
}

export function SingleDatePicker({
  value,
  onChange,
  label = "날짜",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const selected = parseDate(value);
    return new Date(selected.getFullYear(), selected.getMonth(), 1);
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function closeFromOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeFromEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
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

  function changeMonth(offset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function selectDate(selected: Date) {
    onChange(toDateValue(selected));
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div className={`single-date-picker ${open ? "open" : ""} ${className}`.trim()} ref={rootRef}>
      <span className="single-date-label">{label}</span>
      <div className="single-date-control observation-date-control">
        <button
          ref={triggerRef}
          className="single-date-trigger"
          type="button"
          aria-label={`${label} 선택`}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            if (!open) {
              const selected = parseDate(value);
              setVisibleMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
            }
            setOpen((current) => !current);
          }}
        >
          <span>{formatDate(value)}</span>
          <Icon name="calendar" />
        </button>

        {open && (
          <section className="single-date-calendar observation-calendar" role="dialog" aria-label={`${label} 달력`}>
            <strong>날짜를 선택해주세요</strong>
            <div className="single-date-calendar-month observation-calendar-month">
              <b>{visibleMonth.getFullYear()}년 {visibleMonth.getMonth() + 1}월</b>
              <span>
                <button type="button" onClick={() => changeMonth(-1)} aria-label="이전 달"><Icon name="chevron-left" /></button>
                <button type="button" onClick={() => changeMonth(1)} aria-label="다음 달"><Icon name="chevron-right" /></button>
              </span>
            </div>
            <div className="single-date-calendar-grid observation-calendar-grid">
              {weekdays.map((weekday) => <b key={weekday}>{weekday}</b>)}
              {calendarDays.map((date, index) => {
                if (!date) return <span aria-hidden="true" key={`blank-${index}`} />;
                const dateValue = toDateValue(date);
                const selected = dateValue === value;
                return (
                  <button
                    type="button"
                    className={selected ? "selected" : ""}
                    aria-pressed={selected}
                    aria-label={`${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`}
                    key={dateValue}
                    onClick={() => selectDate(date)}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
