"use client";

import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { useAppSelector } from "../../lib/hooks";
import type { ChatMessage } from "../../lib/features/chat/chatApi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

export interface UseGroupChatHubOptions {
  groupId: string | null;
  enabled?: boolean;
  onMessageReceived?: (msg: ChatMessage) => void;
  onMessageDeleted?: (payload: { id: string; groupId: string }) => void;
  onUserTyping?: (userId: string) => void;
}

export function useGroupChatHub({
  groupId,
  enabled = true,
  onMessageReceived,
  onMessageDeleted,
  onUserTyping,
}: UseGroupChatHubOptions) {
  const connRef = useRef<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const token = useAppSelector((s) => s.auth.accessToken);
  const tenantSlug = useAppSelector((s) => s.auth.tenantSlug);

  useEffect(() => {
    if (!enabled || !groupId) return;

    const url = new URL(`${API_BASE}/hubs/group-chat`);
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

    conn.on("MessageReceived", (msg: ChatMessage) => onMessageReceived?.(msg));
    conn.on("MessageDeleted", (p: { id: string; groupId: string }) => onMessageDeleted?.(p));
    conn.on("UserTyping", (userId: string) => onUserTyping?.(userId));
    conn.onreconnected(() => setIsConnected(true));
    conn.onclose(() => setIsConnected(false));

    let cancelled = false;
    (async () => {
      try {
        await conn.start();
        if (cancelled) { await conn.stop(); return; }
        await conn.invoke("JoinGroup", groupId);
        connRef.current = conn;
        setIsConnected(true);
      } catch (err) {
        console.warn("[GroupChatHub] connection failed:", err);
      }
    })();

    return () => {
      cancelled = true;
      const c = connRef.current;
      if (c) {
        c.invoke("LeaveGroup", groupId).catch(() => null);
        c.stop().catch(() => null);
        connRef.current = null;
        setIsConnected(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, enabled, token, tenantSlug]);

  const sendTyping = async () => {
    const c = connRef.current;
    if (c?.state === signalR.HubConnectionState.Connected && groupId)
      await c.invoke("Typing", groupId).catch(() => null);
  };

  return { isConnected, sendTyping };
}
