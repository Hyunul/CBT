import { afterEach, it, expect, vi } from "vitest";
import { render, act, cleanup, screen } from "@testing-library/react";
import Timer from "@/components/Timer";
import { renderToStaticMarkup } from "react-dom/server";
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it("shows a placeholder before the first calculation, then the elapsed server time", () => {
  const props = {
    startTime: "2026-10-13T00:00:00Z",
    serverTime: "2026-10-13T00:10:00Z",
    durationSec: 3000,
    onTimeUp: vi.fn(),
  };
  const firstRender = renderToStaticMarkup(<Timer {...props} />);
  expect(firstRender).toContain("--:--");
  expect(firstRender).not.toContain("50:00");
  render(<Timer {...props} />);
  expect(screen.getByText("40:00")).toBeTruthy();
});
it("uses server time when the browser clock is five minutes behind", () => {
  vi.useFakeTimers();
  const serverNow = new Date(Date.now() + 300000).toISOString();
  const done = vi.fn();
  render(
    <Timer
      startTime={serverNow}
      serverTime={serverNow}
      durationSec={2}
      onTimeUp={done}
    />,
  );
  expect(screen.getByText("00:02")).toBeTruthy();
  act(() => vi.advanceTimersByTime(2100));
  expect(done).toHaveBeenCalledTimes(1);
});
it("does not restart its deadline when the answer callback changes", () => {
  vi.useFakeTimers();
  const start = new Date().toISOString();
  const old = vi.fn();
  const latest = vi.fn();
  const view = render(
    <Timer startTime={start} durationSec={2} onTimeUp={old} />,
  );
  act(() => vi.advanceTimersByTime(1250));
  view.rerender(<Timer startTime={start} durationSec={2} onTimeUp={latest} />);
  act(() => vi.advanceTimersByTime(1000));
  expect(latest).toHaveBeenCalledTimes(1);
  expect(old).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(5000));
  expect(latest).toHaveBeenCalledTimes(1);
});
