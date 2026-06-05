"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export type ToastKind = "info" | "success" | "error" | "warn";
export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  ttl: number;
}

type Listener = (items: ToastItem[]) => void;

let _id = 1;
let _items: ToastItem[] = [];
const _listeners = new Set<Listener>();

function emit() {
  for (const l of _listeners) l([..._items]);
}

export function showToast(message: string, kind: ToastKind = "info", ttl = 3500) {
  const id = _id++;
  _items = [..._items, { id, kind, message, ttl }];
  emit();
  setTimeout(() => {
    _items = _items.filter((t) => t.id !== id);
    emit();
  }, ttl);
  return id;
}

/** Promise-based confirm replacement (custom dialog). */
let _confirmResolver: ((v: boolean) => void) | null = null;
let _confirmMsg: string | null = null;
const _confirmListeners = new Set<(msg: string | null) => void>();
function emitConfirm() {
  for (const l of _confirmListeners) l(_confirmMsg);
}
export function showConfirm(message: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    _confirmResolver = resolve;
    _confirmMsg = message;
    emitConfirm();
  });
}

const COLORS: Record<ToastKind, { bg: string; bd: string; tx: string; icon: string }> = {
  info:    { bg: "#EFF6FF", bd: "#BFDBFE", tx: "#1D4ED8", icon: "ℹ" },
  success: { bg: "#F0FDF4", bd: "#BBF7D0", tx: "#15803D", icon: "✓" },
  error:   { bg: "#FEF2F2", bd: "#FECACA", tx: "#B91C1C", icon: "✕" },
  warn:    { bg: "#FFFBEB", bd: "#FDE68A", tx: "#B45309", icon: "!" },
};

export default function Toaster() {
  const t = useTranslations("common");
  const [items, setItems] = useState<ToastItem[]>([]);
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);

  useEffect(() => {
    const l: Listener = (next) => setItems(next);
    _listeners.add(l);
    setItems([..._items]);
    const cl = (msg: string | null) => setConfirmMsg(msg);
    _confirmListeners.add(cl);
    return () => {
      _listeners.delete(l);
      _confirmListeners.delete(cl);
    };
  }, []);

  const close = (v: boolean) => {
    _confirmResolver?.(v);
    _confirmResolver = null;
    _confirmMsg = null;
    emitConfirm();
  };

  return (
    <>
      <div
        aria-live="polite"
        style={{
          position: "fixed", top: 70, right: 16, zIndex: 9999,
          display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none",
        }}
      >
        {items.map((t) => {
          const c = COLORS[t.kind];
          return (
            <div
              key={t.id}
              style={{
                pointerEvents: "auto",
                background: c.bg, border: `1px solid ${c.bd}`, color: c.tx,
                padding: "10px 14px", borderRadius: 10, boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                display: "flex", alignItems: "center", gap: 10, minWidth: 240, maxWidth: 360,
                fontSize: 13, fontWeight: 500,
                animation: "mls-toast-in .18s ease-out",
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>{c.icon}</span>
              <span style={{ flex: 1 }}>{t.message}</span>
            </div>
          );
        })}
      </div>

      {confirmMsg !== null && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed", inset: 0, zIndex: 10000,
            background: "rgba(15,23,42,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => close(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 12, padding: 20,
              width: "min(420px, 90vw)", boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
            }}
          >
            <p style={{ fontSize: 14, color: "#111827", margin: "0 0 16px", lineHeight: 1.5 }}>
              {confirmMsg}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                onClick={() => close(false)}
                style={{
                  padding: "7px 14px", borderRadius: 8, border: "1px solid #E5E7EB",
                  background: "#fff", color: "#374151", fontSize: 13, fontWeight: 500, cursor: "pointer",
                }}
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => close(true)}
                style={{
                  padding: "7px 14px", borderRadius: 8, border: "none",
                  background: "#1565C0", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                {t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes mls-toast-in {
          from { opacity: 0; transform: translateX(8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
