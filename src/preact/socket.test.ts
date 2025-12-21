import { describe, expect, test, vi } from "bun:test";
import { Window } from "happy-dom";
import { createSocketBridge } from "./socket";

// happy-dom setup
if (typeof document === "undefined") {
  const { window } = new Window();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).window = window as never;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).document = window.document as never;
}

const mockIo = vi.fn();
const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  removeAllListeners: vi.fn(),
  close: vi.fn(),
  id: "sock-1",
};

vi.mock("socket.io-client", () => ({
  io: () => {
    mockIo();
    return mockSocket;
  },
}));

describe("socket bridge", () => {
  test("emits with socketid and wires handlers", () => {
    const onControls = vi.fn();
    const bridge = createSocketBridge({ onControls });

    // simulate incoming ui-controls
    const handler = mockSocket.on.mock.calls.find((c) => c[0] === "ui-controls")?.[1] as (d: unknown) => void;
    handler?.({ menu: [] });
    expect(onControls).toHaveBeenCalledWith({ menu: [] });

    // emit includes socketid
    bridge.emit("ui-change", { tab: 1 });
    expect(mockSocket.emit).toHaveBeenCalledWith("ui-change", { tab: 1, socketid: "sock-1" });

    bridge.dispose();
    expect(mockSocket.removeAllListeners).toHaveBeenCalled();
    expect(mockSocket.close).toHaveBeenCalled();
  });
});
