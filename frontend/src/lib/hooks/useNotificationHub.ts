"use client";

import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { useAppDispatch, useAppSelector } from "../hooks";
import { incrementUnread } from "../features/notifications/notificationSlice";
import type { NotificationDto } from "../features/notifications/notificationsApi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

export interface UseNotificationHubOptions {
  enabled?: boolean;
  onNotification?: (notification: NotificationDto) => void;
}

export function useNotificationHub({
  enabled = true,
  onNotification,
}: UseNotificationHubOptions = {}) {
  const connRef = useRef<signalR.HubConnection | null>(null);
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.accessToken);
  const tenantSlug = useAppSelector((s) => s.auth.tenantSlug);

  useEffect(() => {
    if (!enabled || !token) return;

    const url = new URL(`${API_BASE}/hubs/notifications`);
    if (tenantSlug) url.searchParams.set("tenant", tenantSlug);

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(url.toString(), {
        accessTokenFactory: () => token ?? "",
        transport:
          signalR.HttpTransportType.WebSockets |
          signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    conn.on("NewNotification", (notification: NotificationDto) => {
      dispatch(incrementUnread());
      onNotification?.(notification);
    });

    let cancelled = false;
    (async () => {
      try {
        await conn.start();
        if (cancelled) {
          await conn.stop();
          return;
        }
        connRef.current = conn;
      } catch (err) {
        console.warn("[NotificationHub] connection failed:", err);
      }
    })();

    return () => {
      cancelled = true;
      connRef.current?.stop().catch(() => null);
      connRef.current = null;
    };
  }, [enabled, token, tenantSlug, dispatch, onNotification]);

  return { isConnected: connRef.current?.state === signalR.HubConnectionState.Connected };
}
