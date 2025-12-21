import { io, Socket } from "socket.io-client";

export type UiSocket = Socket;

export function connectSocket(): UiSocket {
  const path = `${window.location.pathname}socket.io`;
  const secure = window.location.protocol === "https:";
  return io({ path, secure });
}
