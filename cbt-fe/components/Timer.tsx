"use client";
import { useEffect, useRef, useState } from "react";
import { AlarmClock } from "lucide-react";
interface Props {
  startTime: string;
  serverTime?: string;
  durationSec: number;
  onTimeUp: () => void;
}
export default function Timer({
  startTime,
  serverTime,
  durationSec,
  onTimeUp,
}: Props) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const callback = useRef(onTimeUp);
  useEffect(() => {
    callback.current = onTimeUp;
  }, [onTimeUp]);
  useEffect(() => {
    const end = new Date(startTime).getTime() + durationSec * 1000;
    const serverNow = serverTime ? new Date(serverTime).getTime() : Date.now();
    const receivedAt = performance.now();
    let fired = false;
    const tick = () => {
      const now = serverNow + performance.now() - receivedAt;
      const left = Math.min(
        durationSec,
        Math.max(0, Math.ceil((end - now) / 1000)),
      );
      setRemaining(left);
      if (left === 0 && !fired) {
        fired = true;
        clearInterval(interval);
        callback.current();
      }
    };
    const interval = setInterval(tick, 250);
    tick();
    return () => clearInterval(interval);
  }, [startTime, serverTime, durationSec]);
  return (
    <div
      role="timer"
      aria-label={remaining === null ? "남은 시간 계산 중" : remaining === 0 ? "시험 시간 종료" : `남은 시간 ${Math.floor(remaining / 60)}분 ${remaining % 60}초`}
      className={`flex items-center gap-2 font-mono text-lg p-2 ${remaining !== null && remaining <= 60 ? "text-destructive" : ""}`}
    >
      <AlarmClock className="w-5 h-5" />
      <span>
        {remaining === null ? "--:--" : `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`}
      </span>
    </div>
  );
}
