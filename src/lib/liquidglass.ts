'use client';

import { useEffect, useRef, type RefObject } from 'react';

export const refracts = (): boolean =>
  typeof navigator !== 'undefined' && /Chrom(?:e|ium)\//.test(navigator.userAgent);

export function browserName(): 'Chromium' | 'Safari' | 'Firefox' {
  if (refracts()) return 'Chromium';
  if (typeof navigator !== 'undefined' && /Firefox\//.test(navigator.userAgent)) return 'Firefox';
  return 'Safari';
}

/**
 * Triggers a microscopic offset refit on all liquid glass components
 * so their SVG refraction filters adapt to newly measured container bounds.
 */
export function refit(root: ParentNode = document): void {
  if (typeof document === 'undefined') return;
  const pieces = [...root.querySelectorAll<HTMLElement>('.lg-glass:not(.lg-glass-group-shape)')].filter(
    (piece) => piece.offsetWidth
  );
  const undo = pieces.map((piece) => {
    const { minWidth, boxSizing } = piece.style;
    piece.style.boxSizing = 'border-box';
    piece.style.minWidth = `${parseFloat(getComputedStyle(piece).width) + 0.05}px`;
    return () => {
      piece.style.minWidth = minWidth;
      piece.style.boxSizing = boxSizing;
    };
  });
  requestAnimationFrame(() => requestAnimationFrame(() => undo.forEach((restore) => restore())));
}

interface ThrowOptions {
  start: (room: { width: number; height: number }, own: { width: number; height: number }) => { x: number; y: number };
  kick?: { x: number; y: number };
  onMove?: () => void;
}

const FRICTION = 3.2;
const BOUNCE = 0.62;

/**
 * Enables smooth iOS-style momentum physics on an absolute element,
 * letting users drag, throw, and flick it with natural wall bounces.
 */
export function useThrow(
  ref: RefObject<HTMLElement | null>,
  { start, kick, onMove }: ThrowOptions
): void {
  const moved = useRef(onMove);
  moved.current = onMove;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const parent = element.parentElement;
    if (!parent) return;

    const calm = typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const room = () => ({
      width: Math.max(0, parent.clientWidth - element.offsetWidth),
      height: Math.max(0, parent.clientHeight - element.offsetHeight),
    });

    const first = start(
      { width: parent.clientWidth, height: parent.clientHeight },
      { width: element.offsetWidth, height: element.offsetHeight }
    );
    let [x, y] = [first.x, first.y];
    let [vx, vy] = calm || !kick ? [0, 0] : [kick.x, kick.y];
    let grab: { id: number; dx: number; dy: number; at: number } | null = null;
    let frame = 0;
    let previous = performance.now();

    const paint = () => {
      element.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    };

    const keepInside = (bounce: boolean) => {
      const { width, height } = room();
      if (x < 0 || x > width) {
        x = Math.max(0, Math.min(width, x));
        vx = bounce ? -vx * BOUNCE : 0;
      }
      if (y < 0 || y > height) {
        y = Math.max(0, Math.min(height, y));
        vy = bounce ? -vy * BOUNCE : 0;
      }
    };

    const glide = (now: number) => {
      const step = Math.min(0.05, (now - previous) / 1000);
      previous = now;
      x += vx * step;
      y += vy * step;
      const slow = Math.exp(-FRICTION * step);
      vx *= slow;
      vy *= slow;
      keepInside(true);
      paint();
      frame = Math.hypot(vx, vy) > 6 ? requestAnimationFrame(glide) : 0;
    };

    const launch = () => {
      cancelAnimationFrame(frame);
      previous = performance.now();
      frame = requestAnimationFrame(glide);
    };

    const down = (event: PointerEvent) => {
      if (event.button) return;
      cancelAnimationFrame(frame);
      element.setPointerCapture(event.pointerId);
      element.dataset.held = '';
      grab = { id: event.pointerId, dx: event.clientX - x, dy: event.clientY - y, at: performance.now() };
      vx = vy = 0;
    };

    const move = (event: PointerEvent) => {
      if (grab?.id !== event.pointerId) return;
      const now = performance.now();
      const stepSec = Math.max(0.001, (now - grab.at) / 1000);
      const [nextX, nextY] = [event.clientX - grab.dx, event.clientY - grab.dy];
      vx = vx * 0.3 + ((nextX - x) / stepSec) * 0.7;
      vy = vy * 0.3 + ((nextY - y) / stepSec) * 0.7;
      x = nextX;
      y = nextY;
      grab.at = now;
      keepInside(false);
      paint();
      moved.current?.();
    };

    const up = (event: PointerEvent) => {
      if (grab?.id !== event.pointerId) return;
      const still = performance.now() - grab.at > 80;
      grab = null;
      delete element.dataset.held;
      if (calm || still) vx = vy = 0;
      else launch();
    };

    const key = (event: KeyboardEvent) => {
      const stepMap: Record<string, [number, number]> = {
        ArrowLeft: [-24, 0],
        ArrowRight: [24, 0],
        ArrowUp: [0, -24],
        ArrowDown: [0, 24],
      };
      const step = stepMap[event.key];
      if (!step) return;
      event.preventDefault();
      x += step[0];
      y += step[1];
      keepInside(false);
      paint();
      moved.current?.();
    };

    const resized = new ResizeObserver(() => {
      keepInside(false);
      paint();
    });

    keepInside(false);
    paint();
    if (vx || vy) launch();
    resized.observe(parent);
    element.addEventListener('pointerdown', down);
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerup', up);
    element.addEventListener('pointercancel', up);
    element.addEventListener('keydown', key);

    return () => {
      cancelAnimationFrame(frame);
      resized.disconnect();
      element.removeEventListener('pointerdown', down);
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerup', up);
      element.removeEventListener('pointercancel', up);
      element.removeEventListener('keydown', key);
    };
  }, [ref, start, kick]);
}
