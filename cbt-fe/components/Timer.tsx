"use client";

import { useEffect, useState } from 'react';
import { AlarmClock } from 'lucide-react';

interface TimerProps {
  startTime: string; // ISO 8601 string
  durationSec: number;
  onTimeUp: () => void;
}

export default function Timer({ startTime, durationSec, onTimeUp }: TimerProps) {
  const [remaining, setRemaining] = useState(durationSec);

  useEffect(() => {
    const start = new Date(startTime).getTime();
    const end = start + durationSec * 1000;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const secondsLeft = Math.round((end - now) / 1000);

      if (secondsLeft <= 0) {
        setRemaining(0);
        clearInterval(interval);
        onTimeUp();
      } else {
        setRemaining(secondsLeft);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, durationSec, onTimeUp]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const isLowTime = remaining <= 60; // 1분 남았을 때

  return (
    <div className={`flex items-center gap-2 font-mono text-lg font-bold p-2 rounded-md ${isLowTime ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
      <AlarmClock className="w-5 h-5" />
      <span>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
