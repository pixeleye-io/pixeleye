import { useState, useEffect } from "react";

export interface ThrottleOptions {
  delay?: number;
}

export function useThrottle<T>(value: T, options?: ThrottleOptions): T {
  const [throttledValue, setThrottledValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(
      () => {
        setThrottledValue(value);
      },
      options?.delay ?? 500
    );

    return () => {
      clearTimeout(timeout);
    };
  }, [options?.delay, value]);

  return throttledValue;
}
