// Conexión online entre dos navegadores usando PeerJS (WebRTC).
// El anfitrión crea la sala con un código; el invitado se conecta a ese código.
(function () {
  const PREFIX = 'ttt-anime-v1-';
  const PING_MS = 2000, TIMEOUT_MS = 10000;
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  function randomCode() {
    let s = '';
    for (let i = 0; i < 5; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    return s;
  }

  // handlers: { onReady(code), onJoin(conn, msg), onMessage(msg), onLeave(), onError(text) }
  function host(handlers) {
    let peer, conn = null, destroyed = false, lastSeen = 0;

    function drop() {
      const c = conn;
      conn = null;
      try { c.close(); } catch (e) {}
      handlers.onLeave();
    }
    const heartbeat = setInterval(() => {
      if (!conn) return;
      if (Date.now() - lastSeen > TIMEOUT_MS) drop();
      else if (conn.open) conn.send({ t: 'ping' });
    }, PING_MS);

    function open() {
      const code = randomCode();
      peer = new Peer(PREFIX + code);
      peer.on('open', () => handlers.onReady(code));
      peer.on('connection', c => {
        c.on('data', msg => {
          if (c === conn) lastSeen = Date.now();
          if (!msg || msg.t === 'ping') return;
          if (msg.t === 'hello') {
            if (conn && conn.open && conn !== c) { c.send({ t: 'full' }); return; }
            conn = c;
            lastSeen = Date.now();
            handlers.onJoin(msg);
          } else if (c === conn) {
            handlers.onMessage(msg);
          }
        });
        c.on('close', () => { if (c === conn) drop(); });
      });
      peer.on('disconnected', () => { if (!destroyed) peer.reconnect(); });
      peer.on('error', err => {
        if (err.type === 'unavailable-id') { peer.destroy(); open(); return; }
        handlers.onError(describe(err));
      });
    }
    open();

    return {
      send(msg) { if (conn && conn.open) conn.send(msg); },
      connected() { return !!(conn && conn.open); },
      close() { destroyed = true; clearInterval(heartbeat); peer && peer.destroy(); },
    };
  }

  // handlers: { onOpen(), onMessage(msg), onClose(), onError(text) }
  function join(code, name, handlers) {
    const peer = new Peer();
    let conn = null, destroyed = false, lastSeen = 0, heartbeat = null;
    function lost() {
      if (destroyed) return;
      destroyed = true;
      clearInterval(heartbeat);
      handlers.onClose();
    }
    peer.on('open', () => {
      conn = peer.connect(PREFIX + code.toUpperCase().trim(), { reliable: true });
      conn.on('open', () => {
        lastSeen = Date.now();
        conn.send({ t: 'hello', name });
        handlers.onOpen();
        heartbeat = setInterval(() => {
          if (Date.now() - lastSeen > TIMEOUT_MS) lost();
          else conn.send({ t: 'ping' });
        }, PING_MS);
      });
      conn.on('data', msg => {
        lastSeen = Date.now();
        if (msg && msg.t !== 'ping') handlers.onMessage(msg);
      });
      conn.on('close', lost);
    });
    peer.on('error', err => handlers.onError(describe(err)));
    return {
      send(msg) { if (conn && conn.open) conn.send(msg); },
      close() { destroyed = true; clearInterval(heartbeat); peer.destroy(); },
    };
  }

  function describe(err) {
    switch (err.type) {
      case 'peer-unavailable': return 'No existe una sala con ese código.';
      case 'network':
      case 'server-error':
      case 'socket-error': return 'Problema de conexión con el servidor. Revisá tu internet.';
      case 'browser-incompatible': return 'Tu navegador no soporta el modo online.';
      default: return 'Error de conexión (' + err.type + ').';
    }
  }

  window.Net = { host, join };
})();
