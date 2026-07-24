const CACHE = "cfm-v7";
const PRECACHE = ["/", "/live", "/contact", "/s-engager", "/petitions", "/manifest.json", "/icon.svg"];
// Espaces à session : jamais mis en Cache API (leur HTML contient des données
// membre/admin).
// ATTENTION à l'absence de barre finale sur "/membre" : la comparaison est un
// startsWith, et l'URL EXACTE /membre (accueil de l'espace membre, qui affiche
// le nom du membre et son fil d'annonces) ne serait PAS couverte par
// "/membre/". Son HTML finirait en Cache API, lisible par la personne suivante
// sur un poste partagé.
const NETWORK_FIRST = ["/membre", "/admin/", "/api/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/_next/")) return;
  if (url.pathname.startsWith("/api/")) return;
  if (NETWORK_FIRST.some((p) => url.pathname.startsWith(p))) return;

  // Les pages HTML sont désormais statiques et peuvent changer côté serveur
  // (édition admin → revalidation). En cache-first, un visiteur récurrent
  // voyait toujours l'ancienne version, la neuve seulement à la visite
  // SUIVANTE. → network-first pour les navigations : on tente le réseau, le
  // cache ne sert que de repli hors ligne.
  const isNavigation =
    event.request.mode === "navigate" ||
    (event.request.headers.get("accept") || "").includes("text/html");

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok && url.origin === self.location.origin) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(event.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  // Autres ressources same-origin (images, polices…) : stale-while-revalidate.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((res) => {
          if (res.ok && url.origin === self.location.origin) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(event.request, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "CFM", body: "Nouvelle notification", url: "/" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    /* ignore */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.svg",
      data: { url: data.url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
