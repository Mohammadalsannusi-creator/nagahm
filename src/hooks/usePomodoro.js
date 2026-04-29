import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "pomodoro-state";

export function usePomodoro({ onComplete } = {}) {
  const [mode, setMode] = useState("focus"); // focus | break
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [focusMin, setFocusMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const tickRef = useRef(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved) {
        setFocusMin(saved.focusMin ?? 25);
        setBreakMin(saved.breakMin ?? 5);
      }
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ focusMin, breakMin }));
  }, [focusMin, breakMin]);

  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(tickRef.current);
          setRunning(false);
          const nextMode = mode === "focus" ? "break" : "focus";
          if (mode === "focus") onComplete?.({ minutes: focusMin });
          // chime
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.frequency.value = 880;
            o.connect(g);
            g.connect(ctx.destination);
            g.gain.setValueAtTime(0.0001, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
            o.start();
            o.stop(ctx.currentTime + 0.6);
          } catch {}
          setMode(nextMode);
          return (nextMode === "focus" ? focusMin : breakMin) * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [running, mode, focusMin, breakMin, onComplete]);

  function start() {
    setRunning(true);
  }
  function pause() {
    setRunning(false);
  }
  function reset() {
    setRunning(false);
    setSecondsLeft((mode === "focus" ? focusMin : breakMin) * 60);
  }
  function switchMode(m) {
    setMode(m);
    setRunning(false);
    setSecondsLeft((m === "focus" ? focusMin : breakMin) * 60);
  }

  return {
    mode,
    running,
    secondsLeft,
    focusMin,
    breakMin,
    setFocusMin,
    setBreakMin,
    start,
    pause,
    reset,
    switchMode,
  };
}

export function formatMMSS(total) {
  const m = Math.floor(total / 60).toString().padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
