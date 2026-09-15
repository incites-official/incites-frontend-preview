"use client";

import { Icon } from "@/components/Icon";
import { useEffect, useState } from "react";

export type ToastTone = "success" | "error" | "info";

interface ToastOptions {
  tone?: ToastTone;
  duration?: number;
}

interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
  duration: number;
}

const TOAST_EVENT = "incites:toast";
let toastSequence = 0;

export function showToast(message: string, { tone = "success", duration = 3500 }: ToastOptions = {}) {
  if (typeof window === "undefined") return;
  toastSequence += 1;
  const detail: ToastItem = {
    id: `${Date.now()}-${toastSequence}`,
    message,
    tone,
    duration,
  };
  window.dispatchEvent(new CustomEvent<ToastItem>(TOAST_EVENT, { detail }));
}

export function ToastViewport() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const timers = new Map<string, number>();

    function receiveToast(event: Event) {
      const toast = (event as CustomEvent<ToastItem>).detail;
      setToasts((current) => [...current, toast].slice(-4));
      const timer = window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
        timers.delete(toast.id);
      }, toast.duration);
      timers.set(toast.id, timer);
    }

    window.addEventListener(TOAST_EVENT, receiveToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, receiveToast);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div className={`app-toast ${toast.tone}`} role={toast.tone === "error" ? "alert" : "status"} key={toast.id}>
          <span className="toast-icon">
            <Icon name={toast.tone === "success" ? "check" : toast.tone === "error" ? "warning" : "info"} />
          </span>
          <p>{toast.message}</p>
        </div>
      ))}
    </div>
  );
}
