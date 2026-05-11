import { useEffect, useRef, useCallback } from "react";
import { io, type Socket } from "socket.io-client";

export function useRunStream(
  runId: string | null,
  onLog: (log: { timestamp: string; nodeId: string; level: string; message: string }) => void,
  onComplete: (status: string) => void,
) {
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (!runId) return;
    const socket = io(window.location.origin, {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("subscribe:run", runId);
    });

    socket.on("log", (data: { timestamp: string; nodeId: string; level: string; message: string }) => {
      onLog(data);
    });

    socket.on("node:completed", (data: { nodeId: string }) => {
      onLog({ timestamp: new Date().toISOString(), nodeId: data.nodeId, level: "info", message: "Node completed" });
    });

    socket.on("node:failed", (data: { nodeId: string; error: string }) => {
      onLog({ timestamp: new Date().toISOString(), nodeId: data.nodeId, level: "error", message: data.error });
    });

    socket.on("run:completed", (data: { status: string }) => {
      onComplete(data.status);
      socket.disconnect();
    });

    return () => { socket.disconnect(); };
  }, [runId, onLog, onComplete]);

  useEffect(() => {
    const cleanup = connect();
    return () => { cleanup?.(); socketRef.current?.disconnect(); };
  }, [connect]);

  return { socket: socketRef.current };
}
