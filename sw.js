const CACHE_NAME = "quiz-challenge-v1";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// Installation : on met en cache tout ce qu'il faut pour démarrer l'appli sans réseau
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
});

// Activation : on nettoie les anciennes versions du cache
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Récupération : on sert le cache en priorité (offline-first),
// et on met à jour le cache en arrière-plan si le réseau est dispo.
self.addEventListener("fetch", (event) => {
  const req = event.request;

  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((response) => {
          if (req.method === "GET" && response && response.status === 200) {
            const resClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return response;
        })
        .catch(() => {
          // Pas de réseau : si on demande une page (navigation), on renvoie l'app en cache
          if (req.mode === "navigate") {
            return caches.match("./index.html");
          }
          return cached;
        });

      // Si on a déjà cette ressource en cache, on la sert tout de suite (rapide + offline)
      return cached || networkFetch;
    })
  );
});
