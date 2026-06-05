"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { useAppSelector } from "../hooks";
import type { CommentDto } from "../features/comments/commentsApi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

interface UseVideoCommentsOptions {
  sessionId: string;
  onCommentAdded?: (comment: CommentDto) => void;
  enabled?: boolean;
}

export function useVideoComments({
  sessionId,
  onCommentAdded,
  enabled = true,
}: UseVideoCommentsOptions) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const token = useAppSelector((s) => s.auth.accessToken);
  const tenantSlug = useAppSelector((s) => s.auth.tenantSlug);

  const start = useCallback(async () => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) return;

    // NOTE: WebSocket connections cannot send custom headers.
    // Pass tenant as query param and JWT via accessTokenFactory (sent as ?access_token=).
    const hubUrl = new URL(`${API_BASE}/hubs/video-comments`);
    if (tenantSlug) hubUrl.searchParams.set("tenant", tenantSlug);

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl.toString(), {
        accessTokenFactory: () => token ?? "",
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on("CommentAdded", (comment: CommentDto) => {
      onCommentAdded?.(comment);
    });

    connection.onreconnected(() => setIsConnected(true));
    connection.onclose(() => setIsConnected(false));

    try {
      await connection.start();
      await connection.invoke("JoinVideoRoom", sessionId);
      connectionRef.current = connection;
      setIsConnected(true);
    } catch (err) {
      console.warn("[SignalR] connection failed:", err);
      setIsConnected(false);
    }
  }, [sessionId, token, tenantSlug, onCommentAdded]);

  useEffect(() => {
    if (!enabled) return;
    start();
    return () => {
      const conn = connectionRef.current;
      if (conn) {
        conn.invoke("LeaveVideoRoom", sessionId).catch(() => null);
        conn.stop().catch(() => null);
        connectionRef.current = null;
        setIsConnected(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, enabled]);

  return { connection: connectionRef, isConnected };
}
