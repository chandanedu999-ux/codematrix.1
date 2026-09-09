import React, { useState, useLayoutEffect } from 'react';

interface RippleProps {
  color?: string;
  duration?: number;
}

interface RippleCircle {
  x: number;
  y: number;
  size: number;
  id: number;
}

export const useRipple = (color = 'rgba(255, 255, 255, 0.4)') => {
  const [ripples, setRipples] = useState<RippleCircle[]>([]);

  const createRipple = (event: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
    const triggerElement = event.currentTarget;
    const rect = triggerElement.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in event && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if ('clientX' in event) {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const size = Math.max(rect.width, rect.height);
    const x = clientX - rect.left - size / 2;
    const y = clientY - rect.top - size / 2;

    const newRipple: RippleCircle = {
      x,
      y,
      size,
      id: Date.now() + Math.random()
    };

    setRipples((prev) => [...prev, newRipple]);
  };

  const clearRipple = (id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  };

  const RippleElements = (
    <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="ripple-wave"
          style={{
            top: ripple.y,
            left: ripple.x,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: color
          }}
          onAnimationEnd={() => clearRipple(ripple.id)}
        />
      ))}
    </span>
  );

  return { createRipple, RippleElements };
};

export const triggerHaptic = (pattern: number | number[] = [40, 30, 40]) => {
  if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // safe fallback if blocked
    }
  }
};
