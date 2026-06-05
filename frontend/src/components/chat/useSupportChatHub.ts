"use client";

import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { useAppSelector } from "../../lib/hooks";
import type { SupportMessage } from "../../lib/features/chat/supportChatApi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

export interface UseSupportChatHubOptions {
  conversationId: string | null;
  enabled?: boolean;
  onMessage?: (msg: SupportMessage) => void;
}

export function useSupportChatHub({
  conversationId,
  enabled = true,
  onMessage,
}: UseSupportChatHubOptions) {
  const connRef = useRef<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const token = useAppSelector((s) => s.auth.accessToken);
  const tenantSlug = useAppSelector((s) => s.auth.tenantSlug);

  useEffect(() => {
    if (!enabled || !conversationId) return;
    const url = new URL(`${API_BASE}/hubs/support`);
    if (tenantSlug) url.searchParams.set("tenant", tenantSlug);

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(url.toString(), {
        accessTokenFactory: () => token ?? "",
        transport:
          signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    conn.on("SupportMessageReceived", (m: SupportMessage) => onMessage?.(m));
    conn.onreconnected(() => setIsConnected(true));
    conn.onclose(() => setIsConnected(false));

    let cancelled = false;
    (async () => {
      try {
        await conn.start();
        if (cancelled) { await conn.stop(); return; }
        await conn.invoke("JoinConversation", conversationId);
        connRef.current = conn;
        setIsConnected(true);
      } catch (err) {
        console.warn("[SupportChatHub] failed:", err);
      }
    })();

    return () => {
      cancelled = true;
      const c = connRef.current;
      if (c) {
        c.invoke("LeaveConversation", conversationId).catch(() => null);
        c.stop().catch(() => null);
        connRef.current = null;
        setIsConnected(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, enabled, token, tenantSlug]);

  return { isConnected };
}
