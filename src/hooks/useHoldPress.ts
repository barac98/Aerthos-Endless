import React, { useState, useEffect, useCallback, useRef } from 'react';

export const useHoldPress = (callback: () => void, delay = 100, initialDelay = 400) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const initialTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stopPress = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (initialTimerRef.current) {
      clearTimeout(initialTimerRef.current);
      initialTimerRef.current = null;
    }
  }, []);

  const startPress = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Prevent context menu or other default behaviors if needed
    // e.preventDefault(); 
    
    stopPress();
    callbackRef.current(); // Initial trigger

    initialTimerRef.current = setTimeout(() => {
      timerRef.current = setInterval(() => {
        callbackRef.current();
      }, delay);
    }, initialDelay);
  }, [delay, initialDelay, stopPress]);

  useEffect(() => {
    return () => stopPress();
  }, [stopPress]);

  return {
    onMouseDown: startPress,
    onMouseUp: stopPress,
    onMouseLeave: stopPress,
    onTouchStart: startPress,
    onTouchEnd: stopPress,
  };
};
