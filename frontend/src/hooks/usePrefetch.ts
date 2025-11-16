import { useEffect } from 'react';

/**
 * Prefetch a dynamic import chunk on idle
 * @param importFn - The dynamic import function (e.g., () => import('./Component'))
 * @param condition - Optional condition to gate the prefetch (default: true)
 */
export function usePrefetchOnIdle(importFn: () => Promise<any>, condition: boolean = true) {
  useEffect(() => {
    if (!condition) return;

    const prefetch = () => {
      // Trigger the import to start downloading the chunk
      importFn().catch((err) => {
        console.warn('Prefetch failed:', err);
      });
    };

    // Use requestIdleCallback if available, otherwise fallback to setTimeout
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(prefetch, { timeout: 2000 });
      return () => cancelIdleCallback(id);
    } else {
      const id = setTimeout(prefetch, 1000);
      return () => clearTimeout(id);
    }
  }, [condition]);
}

/**
 * Programmatically add a prefetch link for a chunk
 * @param href - The chunk URL/path to prefetch
 * @param condition - Optional condition to gate the prefetch
 */
export function usePrefetchLink(href: string, condition: boolean = true) {
  useEffect(() => {
    if (!condition || !href) return;

    // Check if link already exists
    const existing = document.querySelector(`link[rel="prefetch"][href="${href}"]`);
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    link.as = 'script';
    document.head.appendChild(link);

    return () => {
      // Cleanup on unmount
      link.remove();
    };
  }, [href, condition]);
}
