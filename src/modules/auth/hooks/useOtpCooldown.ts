import { useEffect, useRef, useState } from "react";

const COOLDOWN_SECONDS = 30;

// Client-side resend cooldown — real rate-limiting is enforced server-side
// by Supabase itself, this is purely UX: stops someone mashing "resend" and
// makes clear when it's actually worth trying again.
export function useOtpCooldown() {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function start() {
    setSecondsLeft(COOLDOWN_SECONDS);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1 && intervalRef.current) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  return { secondsLeft, canResend: secondsLeft === 0, start };
}
