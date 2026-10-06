import { useCallback, useEffect, useRef, useState } from "react";

function initialRemainingSeconds(expiresAt, serverNow) {
  if (!expiresAt) return 0;
  const authoritativeNow = serverNow
    ? new Date(serverNow).getTime()
    : Date.now();
  return Math.max(
    0,
    Math.floor((new Date(expiresAt).getTime() - authoritativeNow) / 1000),
  );
}

/**
 * Server-synchronized countdown backed by performance.now(), so changing the
 * device clock after the room opens cannot extend the attempt.
 */
export function useCountdown({ expiresAt, serverNow, onExpire }) {
  const onExpireRef = useRef(onExpire);
  const deadlineRef = useRef(0);
  const expiredHandledRef = useRef(false);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    initialRemainingSeconds(expiresAt, serverNow),
  );
  onExpireRef.current = onExpire;

  const applyRemaining = useCallback((remainingSeconds) => {
    const normalized = Math.max(0, Math.floor(Number(remainingSeconds) || 0));
    deadlineRef.current = performance.now() + normalized * 1000;
    expiredHandledRef.current = false;
    setSecondsLeft(normalized);
  }, []);

  useEffect(() => {
    applyRemaining(initialRemainingSeconds(expiresAt, serverNow));

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((deadlineRef.current - performance.now()) / 1000),
      );
      setSecondsLeft(remaining);
      if (remaining === 0 && !expiredHandledRef.current) {
        expiredHandledRef.current = true;
        onExpireRef.current?.();
      }
    };

    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [applyRemaining, expiresAt, serverNow]);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;
  const pad = (value) => String(value).padStart(2, "0");

  return {
    secondsLeft,
    formattedTime:
      hours > 0
        ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
        : `${pad(minutes)}:${pad(seconds)}`,
    isExpired: secondsLeft === 0,
    syncRemaining: applyRemaining,
  };
}
