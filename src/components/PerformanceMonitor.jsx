'use client';

import { useEffect } from 'react';

export default function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Simple performance logging for development
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              console.log(`Performance: ${entry.name}`, Math.round(entry.value || entry.duration));
            }
          });

          try {
            observer.observe({ entryTypes: ['navigation', 'paint'] });
          } catch (e) {
            console.log('Performance monitoring not supported');
          }

          return () => observer.disconnect();
        }
      }, 100);
    }
  }, []);

  return null;
}


