{% load static %}
const CACHE_NAME = "forge-shell-v1";
const SHELL_URLS = [
  "{% url 'core:offline' %}",
  "{% static 'css/foundation.css' %}",
  "{% static 'js/pwa.js' %}",
  "{% static 'js/offline_workout.js' %}",
  "{% static 'js/rest_timer.js' %}",
  "{% static 'site.webmanifest' %}",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, copy);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match("{% url 'core:offline' %}");
        });
      })
  );
});
