"use client";

if (typeof window !== "undefined" && window.performance && window.performance.measure) {
  const originalMeasure = window.performance.measure;
  
  (window.performance as any).measure = function (
    name: string,
    startMark?: any,
    endMark?: any
  ): any {
    try {
      return originalMeasure.apply(this, arguments as any);
    } catch (e) {
      // Return a valid mock PerformanceMeasure structure to satisfy return type checks
      return {
        duration: 0,
        entryType: "measure",
        name,
        startTime: 0,
        detail: null,
        toJSON: () => ({})
      };
    }
  };
}

export default function PerformanceShim() {
  return null;
}
