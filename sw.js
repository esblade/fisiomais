// Guarda os arquivos do app para abrir mesmo sem internet.
// Ao mudar qualquer arquivo do app, aumente a versão abaixo
// e o "?v=" de styles.css e app.js no index.html.
const VERSION = "fisiomais-v15";
const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./config.js",
  "./sync.js",
  "./push.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  // "reload" ignora o cache do navegador: guarda sempre a versão publicada agora
  e.waitUntil(
    caches.open(VERSION)
      .then(c => c.addAll(SHELL.map(u => new Request(u, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Fontes do Google e biblioteca do Supabase (versão fixa): cache primeiro
  if (url.host === "fonts.googleapis.com" || url.host === "fonts.gstatic.com" || url.host === "cdn.jsdelivr.net") {
    e.respondWith(
      caches.open(VERSION).then(async c => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok || res.type === "opaque") c.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // Arquivos do app: sempre confere com o servidor ("no-cache" revalida em vez de usar
  // a cópia guardada pelo navegador) e só usa o cache quando estiver sem internet.
  e.respondWith(
    fetch(req.url, { cache: "no-cache", credentials: "same-origin" })
      .then(res => {
        if (res.ok) { const copia = res.clone(); caches.open(VERSION).then(c => c.put(req, copia)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("./index.html")))
  );
});

// ============ Notificações ============
self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { corpo: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.titulo || "Fisio+", {
    body: d.corpo || "",
    icon: "./icons/icon-192.png",
    badge: "./icons/icon-192.png",
    tag: d.tag || undefined,
    renotify: !!d.tag,
    data: { url: d.url || "./#agenda" }
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope).href;
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(janelas => {
      for (const j of janelas) {
        if (j.url.startsWith(self.registration.scope)) return j.focus().then(() => (j.navigate ? j.navigate(url) : null));
      }
      return clients.openWindow(url);
    })
  );
});
