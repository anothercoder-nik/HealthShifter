// Performance monitoring component for Core Web Vitals - SSR Safe
'use client';

import { useEffect } from 'react';

export default function PerformanceMonitor() {
  useEffect(() => {
    // Only run on client side to avoid hydration issues
    if (typeof window === 'undefined') return;

    // Only monitor in development or if explicitly enabled
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_PERF_MONITORING === 'true') {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        // Web Vitals monitoring
        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const metricName = entry.name;
              const value = entry.value || entry.duration;
              
              console.log(`🚀 ${metricName}:`, Math.round(value));
              
              // You can send this data to analytics service
              // Example: sendToAnalytics(metricName, value);
            }
          });

          // Observe Core Web Vitals
          try {
            observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] });
          } catch (e) {
            // Fallback for browsers that don't support all entry types
            try {
              observer.observe({ entryTypes: ['navigation', 'paint'] });
            } catch (fallbackError) {
              console.log('Performance monitoring not supported');
            }
          }

          // Cleanup
          return () => {
            try {
              observer.disconnect();
            } catch (e) {
              // Observer already disconnected
            }
          };
        }
      }, 100);
    }
  }, []);

  return null; // This component doesn't render anything
}

// Helper function to get Core Web Vitals
export function getCoreWebVitals() {
  return new Promise((resolve) => {
    const vitals = {};
    
    // LCP - Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      vitals.lcp = lastEntry.startTime;
      checkComplete();
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // FID - First Input Delay
    new PerformanceObserver((entryList) => {
      const firstEntry = entryList.getEntries()[0];
      vitals.fid = firstEntry.processingStart - firstEntry.startTime;
      checkComplete();
    }).observe({ entryTypes: ['first-input'] });

    // CLS - Cumulative Layout Shift
    new PerformanceObserver((entryList) => {
      let clsValue = 0;
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      vitals.cls = clsValue;
      checkComplete();
    }).observe({ entryTypes: ['layout-shift'] });

    function checkComplete() {
      if (vitals.lcp && vitals.fid !== undefined && vitals.cls !== undefined) {
        resolve(vitals);
      }
    }

    // Timeout after 10 seconds
    setTimeout(() => resolve(vitals), 10000);
  });
}
