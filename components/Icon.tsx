import type { SVGProps } from "react";

type IconName =
  | "home"
  | "dashboard"
  | "users"
  | "menu"
  | "close"
  | "logout"
  | "search"
  | "plus"
  | "edit"
  | "key"
  | "trash"
  | "refresh"
  | "shield"
  | "activity"
  | "check"
  | "warning"
  | "info"
  | "chevron-left"
  | "arrow-left"
  | "chevron-right"
  | "arrow-up-right"
  | "bell"
  | "star"
  | "camera"
  | "sparkles"
  | "admin"
  | "file"
  | "download"
  | "upload"
  | "eye"
  | "eye-off"
  | "clock"
  | "calendar"
  | "save"
  | "link"
  | "book"
  | "user"
  | "child"
  | "growth"
  | "graduation"
  | "guardian"
  | "alert-circle"
  | "share";

const paths: Record<IconName, React.ReactNode> = {
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  close: <><path d="m18 6-12 12M6 6l12 12"/></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/></>,
  search: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
  key: <><circle cx="7.5" cy="15.5" r="5.5"/><path d="m12 12 9-9M15 6l3 3M18 3l3 3"/></>,
  trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6"/></>,
  refresh: <><path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5"/><path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5"/></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
  activity: <><path d="M3 12h4l2-7 4 14 2-7h6"/></>,
  check: <><path d="m5 12 4 4L19 6"/></>,
  warning: <><path d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></>,
  "chevron-left": <><path d="m15 18-6-6 6-6"/></>,
  "arrow-left": <><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></>,
  "chevron-right": <><path d="m9 18 6-6-6-6"/></>,
  "arrow-up-right": <><path d="M7 17 17 7"/><path d="M7 7h10v10"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
  star: <><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2L5.8 21 7 14.2l-5-4.9 6.9-1L12 2Z"/></>,
  camera: <><path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3h5Z"/><circle cx="12" cy="13" r="3.5"/></>,
  sparkles: <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z"/><path d="m5 14 .8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14ZM19 12l.8 2.2L22 15l-2.2.8L19 18l-.8-2.2L16 15l2.2-.8L19 12Z"/></>,
  admin: <><rect x="3" y="3" width="13" height="16" rx="2"/><circle cx="9.5" cy="8" r="2.5"/><path d="M5.5 15c.7-2 2-3 4-3s3.3 1 4 3"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M18.5 15.8v3.4M16.8 17.5h3.4"/></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></>,
  download: <><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></>,
  upload: <><path d="M12 21V9M7 14l5-5 5 5"/><path d="M5 3h14"/></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
  "eye-off": <><path d="m3 3 18 18"/><path d="M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.3A10.8 10.8 0 0 1 12 4c6.5 0 10 8 10 8a18 18 0 0 1-2.1 3.3M6.6 6.6C3.7 8.5 2 12 2 12s3.5 8 10 8c1.4 0 2.7-.4 3.8-1"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></>,
  save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></>,
  link: <><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/></>,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5Z"/><path d="M4 5.5v14"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  child: <><circle cx="12" cy="5" r="2.5"/><path d="M12 8v7M5 10l7 3 7-3M8 22l4-7 4 7"/></>,
  growth: <><path d="M12 22V11M12 15c-4 0-7-2.5-7-6 4 0 7 2.5 7 6ZM12 12c4 0 7-2.5 7-6-4 0-7 2.5-7 6Z"/></>,
  graduation: <><path d="m2 10 10-5 10 5-10 5Z"/><path d="M6 12.2V17c3.5 2 8.5 2 12 0v-4.8M22 10v6"/></>,
  guardian: <><path d="M4.5 12 12 5.8l7.5 6.2v4.9"/><path d="M5.7 11.1v7.1a1.8 1.8 0 0 0 1.8 1.8H12"/><path d="M17.1 21.2s-4.2-2.4-4.2-5.3a2.35 2.35 0 0 1 4.2-1.45 2.35 2.35 0 0 1 4.2 1.45c0 2.9-4.2 5.3-4.2 5.3Z"/></>,
  "alert-circle": <><circle cx="12" cy="12" r="9"/><path d="M12 7.5v6M12 17h.01"/></>,
  share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></>,
};

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {paths[name]}
    </svg>
  );
}
