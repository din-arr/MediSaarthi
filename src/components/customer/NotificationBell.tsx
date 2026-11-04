"use client";
import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../LanguageProvider";

type Note = { id: string; message: string; channel: string; read: boolean; createdAt: string };

export default function NotificationBell() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{ unread: number; items: Note[] }>({ unread: 0, items: [] });
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => fetch("/api/notifications").then((response) => response.ok ? response.json() : null).then((value) => value && setData(value));
    load();
    const timer = window.setInterval(load, 30_000);
    const close = (event: MouseEvent) => { if (!box.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => { window.clearInterval(timer); document.removeEventListener("mousedown", close); };
  }, []);

  const toggle = async () => {
    setOpen(!open);
    if (!open && data.unread) { await fetch("/api/notifications", { method: "PATCH" }); setData({ ...data, unread: 0 }); }
  };

  return (
    <div className="bell" ref={box}>
      <button className="icon-button" type="button" aria-label={`Messages${data.unread ? `, ${data.unread} new` : ""}`} aria-expanded={open} onClick={toggle}>
        <Bell size={18} />{data.unread > 0 && <span className="bell-dot">{data.unread}</span>}
      </button>
      {open && (
        <div className="bell-panel">
          <p className="bell-title">{t.more.messages} <small>{t.more.messagesNote}</small></p>
          {data.items.length === 0 ? <p className="empty-copy">{t.more.noMessages}</p> : data.items.map((note) => (
            <div className={`bell-item ${note.read ? "" : "new"}`} key={note.id}><span className="bell-channel">{note.channel === "WHATSAPP" ? "WhatsApp" : "SMS"}</span><p>{note.message}</p><small>{new Date(note.createdAt).toLocaleString()}</small></div>
          ))}
        </div>
      )}
    </div>
  );
}
