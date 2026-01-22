const CACHE_NAME = "nvidiaxamd-v1";

// Arquivos básicos para cache offline
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/favicon.ico"
];

// Instalação: salva arquivos no cache
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Ativação: limpa caches antigos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Intercepta requisições
self.addEventListener("fetch", event => {
  const req = event.request;

  // Se for chamada de API, tenta rede primeiro (não cacheia)
  if (req.url.includes("/api/") || req.method === "POST") {
    event.respondWith(
      fetch(req).catch(() =>
        new Response(JSON.stringify({ error: "Sem conexão com a API." }), {
          headers: { "Content-Type": "application/json" }
        })
      )
    );
    return;
  }

  // Para arquivos do app: cache first
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;

      return fetch(req)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          return response;
        })
        .catch(() => caches.match("/index.html"));
    })
  );
});
