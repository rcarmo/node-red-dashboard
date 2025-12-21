import { io, Socket } from "socket.io-client";

export type UiSocket = Socket;

export type UiSocketHandlers = {
  onControls?: (data: unknown) => void;
  onReplayDone?: () => void;
  onConnect?: (socketId: string) => void;
  onControl?: (data: unknown) => void;
  onToast?: (data: unknown) => void;
  onAudio?: (data: unknown) => void;
};

export type UiSocketBridge = {
  socket: UiSocket;
  emit: (event: string, msg?: Record<string, unknown>) => void;
  dispose: () => void;
};

export function createSocketBridge(handlers: UiSocketHandlers = {}): UiSocketBridge {
  const path = `${window.location.pathname}socket.io`;
  const secure = window.location.protocol === "https:";
  const socket = io({ path, secure });

  socket.on("ui-controls", (data) => {
    handlers.onControls?.(data);
    socket.emit("ui-replay-state");
  });

  socket.on("ui-control", (data) => {
    handlers.onControl?.(data);
  });

  socket.on("show-toast", (data) => {
    handlers.onToast?.(data);
  });

  socket.on("ui-audio", (data) => {
    handlers.onAudio?.(data);
  });

  socket.on("ui-replay-done", () => {
    handlers.onReplayDone?.();
  });

  socket.on("connect", () => {
    handlers.onConnect?.(socket.id);
  });

  const emit = (event: string, msg: Record<string, unknown> = {}): void => {
    const payload = { ...msg, socketid: socket.id };
    socket.emit(event, payload);
  };

  const dispose = (): void => {
    socket.removeAllListeners();
    socket.close();
  };

  return { socket, emit, dispose };
}
