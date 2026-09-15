"use client";

import { Icon } from "@/components/Icon";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { useEffect, useId, useRef, useState } from "react";

export function SoftCard({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`soft-card ${className}`}>
      {(title || description || action) && (
        <div className="soft-card-header">
          <div>
            {title && <h2>{title}</h2>}
            {description && <p>{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function SoftButton({
  variant = "primary",
  size = "medium",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "dark";
  size?: "small" | "medium";
}) {
  return <button className={`soft-button ${variant} ${size} ${className}`} {...props} />;
}

function FieldLabel({ label }: { label: string }) {
  const requiredLabel = label.endsWith(" *");
  return <span>{requiredLabel ? <>{label.slice(0, -2)} <em aria-hidden="true">*</em></> : label}</span>;
}

export interface SoftDropdownOption {
  value: string;
  label: string;
  selectedLabel?: string;
}

export function SoftDropdown({
  label,
  value,
  options,
  onChange,
  hideLabel = false,
  menuPlacement = "bottom",
  className = "",
}: {
  label: string;
  value: string;
  options: SoftDropdownOption[];
  onChange: (value: string) => void;
  hideLabel?: boolean;
  menuPlacement?: "bottom" | "top" | "auto";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [resolvedPlacement, setResolvedPlacement] = useState<"bottom" | "top">(menuPlacement === "top" ? "top" : "bottom");
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const labelId = useId();
  const menuId = useId();
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const selectedOption = options[selectedIndex];

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

  function focusOption(index: number) {
    window.requestAnimationFrame(() => optionRefs.current[index]?.focus());
  }

  function resolveMenuPlacement() {
    if (menuPlacement !== "auto") {
      setResolvedPlacement(menuPlacement);
      return;
    }

    const trigger = triggerRef.current;
    const root = rootRef.current;
    if (!trigger || !root) return;

    const triggerBounds = trigger.getBoundingClientRect();
    let clippingTop = 0;
    let clippingBottom = window.innerHeight;
    let ancestor = root.parentElement;

    while (ancestor && ancestor !== document.body) {
      const styles = window.getComputedStyle(ancestor);
      if ([styles.overflow, styles.overflowY].some((value) => ["auto", "scroll", "hidden", "clip"].includes(value))) {
        const bounds = ancestor.getBoundingClientRect();
        clippingTop = Math.max(clippingTop, bounds.top);
        clippingBottom = Math.min(clippingBottom, bounds.bottom);
      }
      ancestor = ancestor.parentElement;
    }

    const estimatedMenuHeight = Math.min(options.length * 48 + 2, 320);
    const spaceBelow = clippingBottom - triggerBounds.bottom - 8;
    const spaceAbove = triggerBounds.top - clippingTop - 8;
    setResolvedPlacement(spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow ? "top" : "bottom");
  }

  function openMenu() {
    resolveMenuPlacement();
    setOpen(true);
  }

  function openAndFocus(index: number) {
    openMenu();
    focusOption(index);
  }

  function selectOption(option: SoftDropdownOption) {
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div className={`field soft-dropdown-field ${hideLabel ? "hide-label" : ""} ${open ? "dropdown-open" : ""} ${className}`} ref={rootRef}>
      <span id={labelId}><FieldLabel label={label} /></span>
      <div className={`soft-dropdown placement-${resolvedPlacement} ${open ? "open" : ""}`}>
        <button
          ref={triggerRef}
          className="soft-dropdown-trigger"
          type="button"
          aria-labelledby={`${labelId} ${menuId}-value`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => {
            if (open) setOpen(false);
            else openMenu();
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              openAndFocus(selectedIndex);
            }
          }}
        >
          <span id={`${menuId}-value`}>{selectedOption?.selectedLabel ?? selectedOption?.label ?? "선택"}</span>
          <Icon name="chevron-right" />
        </button>
        {open && (
          <div className="soft-dropdown-menu" id={menuId} role="listbox" aria-labelledby={labelId}>
            {options.map((option, index) => (
              <button
                ref={(element) => { optionRefs.current[index] = element; }}
                type="button"
                role="option"
                aria-selected={option.value === value}
                key={option.value}
                onClick={() => selectOption(option)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    focusOption((index + 1) % options.length);
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    focusOption((index - 1 + options.length) % options.length);
                  } else if (event.key === "Home") {
                    event.preventDefault();
                    focusOption(0);
                  } else if (event.key === "End") {
                    event.preventDefault();
                    focusOption(options.length - 1);
                  }
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function SoftInput({ label, error, hideLabel = false, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hideLabel?: boolean }) {
  const errorId = useId();
  const describedBy = [props["aria-describedby"], error ? errorId : undefined].filter(Boolean).join(" ") || undefined;

  return (
    <label className={`field ${hideLabel ? "hide-label" : ""}`}>
      <FieldLabel label={label} />
      <input {...props} className={[props.className, error ? "invalid" : ""].filter(Boolean).join(" ")} aria-invalid={error ? true : props["aria-invalid"]} aria-describedby={describedBy} />
      {error && <small className="field-error" id={errorId} role="alert">{error}</small>}
    </label>
  );
}

export function SoftSelect({ label, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <FieldLabel label={label} />
      <select {...props}>{children}</select>
    </label>
  );
}

export function SoftBadge({ tone = "neutral", children }: { tone?: "success" | "warning" | "danger" | "info" | "neutral"; children: ReactNode }) {
  return <span className={`soft-badge ${tone}`}>{children}</span>;
}

export function SoftModal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  className = "",
}: {
  open: boolean;
  title: ReactNode;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`soft-modal ${className}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <div>
            <h2 id="modal-title">{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="닫기"><Icon name="close" /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </section>
    </div>
  );
}

export function InlineMessage({ tone, children }: { tone: "success" | "info"; children: ReactNode }) {
  return <div className={`inline-message ${tone}`} role="status">{children}</div>;
}
