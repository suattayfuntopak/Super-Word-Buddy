/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any[] };

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ url }: { url: URL }) => url.hostname === 'cdn.tailwindcss.com',
  new StaleWhileRevalidate({ cacheName: 'tailwind-cdn' })
);

registerRoute(
  ({ url }: { url: URL }) => url.hostname === 'flagcdn.com',
  new CacheFirst({
    cacheName: 'flag-images',
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 2592000 })]
  })
);

registerRoute(
  ({ url }: { url: URL }) =>
    url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com'),
  new StaleWhileRevalidate({ cacheName: 'google-fonts' })
);

// Open / focus the app and navigate to stats when a notification is clicked
self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  const action: string = event.action || '';
  event.waitUntil(
    (self as any).clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients: any[]) => {
        const existing = clients.find((c: any) => 'focus' in c);
        if (existing) {
          existing.focus();
          existing.postMessage({ type: 'NOTIFICATION_CLICK', action });
          return;
        }
        return (self as any).clients.openWindow('/');
      })
  );
});
