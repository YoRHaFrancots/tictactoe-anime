// Interfaz y control de modos (local, anfitrión, invitado).
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const clean = s => String(s || '').trim().slice(0, 16);

  const animeById = new Map(DB.animes.map(a => [a.id, a]));
  const tagById = new Map(DB.tags.map(t => [t.id, t]));
  const searchIndex = DB.characters.map(c => ({ c, keys: [c.name, ...c.aliases].map(norm) }));
  const MARKS = ['X', 'O'];

  const app = {
    mode: null,       // 'local' | 'host' | 'guest'
    game: null,       // Engine.Game (solo local/host)
    net: null,
    state: null,      // último snapshot
    deadline: 0,      // fin del turno en reloj local
    me: null,         // 0 o 1 en online
    selected: null,   // casilla elegida para el buscador
    results: [],
    sel: 0,
    lastEventId: 0,
    lastRound: 0,
    showAnswers: false,
    overShownRound: 0,
    loop: null,
  };

  // ---------- utilidades ----------
  function show(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === 'screen-' + name));
    document.body.classList.toggle('in-game', name !== 'home');
    if (name !== 'home') { closePanel(); window.scrollTo(0, 0); }
  }
  const absUrl = path => 'url("' + new URL(path, location.href).href + '")';
  function setScene(path) { document.body.style.setProperty('--scene', absUrl(path)); }
  function store(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
  function load(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }

  function myName() { return clean($('in-name').value); }
  function settings() {
    const diff = $('in-diff').querySelector('.on');
    return {
      timer: parseInt($('in-timer').value, 10) || 30,
      spoilers: $('in-spoilers').checked,
      difficulty: diff ? diff.dataset.v : 'normal',
    };
  }
  const charOf = id => Engine.byId.get(id);
  const imgOf = id => (window.CHAR_IMAGES || {})[id];
  const initials = name => name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

  function catLabel(cat) {
    return cat.kind === 'anime' ? animeById.get(cat.id).name : tagById.get(cat.id).label;
  }

  let toastTimer = null;
  function toast(text, kind) {
    const t = $('toast');
    t.textContent = text;
    t.className = 'toast show ' + (kind || '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
  }

  // ---------- modos ----------
  function startHostLoop() {
    clearInterval(app.loop);
    app.loop = setInterval(() => { if (app.game && app.game.tick()) push(); }, 200);
  }

  function push() {
    const st = app.game.snapshot();
    if (app.mode === 'host' && app.net) app.net.send({ t: 'state', state: st });
    applyState(st);
  }

  function startLocal() {
    reset();
    app.mode = 'local';
    app.game = new Engine.Game([myName() || 'Jugador 1', clean($('in-name2').value) || 'Jugador 2'], settings());
    app.game.newRound();
    startHostLoop();
    setScene('assets/bg/local.jpg');
    show('game');
    push();
  }

  const CPU_NAMES = { facil: 'Gojo (tranqui)', normal: 'Gojo', dificil: 'Gojo sin venda' };
  function startCpu() {
    reset();
    app.mode = 'cpu';
    app.me = 0;
    const st = settings();
    app.game = new Engine.Game([myName() || 'Vos', CPU_NAMES[st.difficulty]], st);
    app.game.newRound();
    startHostLoop();
    setScene('assets/bg/cpu.jpg');
    show('game');
    push();
  }

  // Programa la jugada de la CPU cuando le toca
  function maybeCpu() {
    const st = app.state;
    if (app.mode !== 'cpu' || st.phase !== 'playing' || st.turn !== 1) return;
    const key = st.round + ':' + st.eventId;
    if (app.cpuKey === key) return;
    app.cpuKey = key;
    clearTimeout(app.cpuTimer);
    app.cpuTimer = setTimeout(() => {
      const s = app.game && app.game.s;
      if (!s || s.phase !== 'playing' || s.turn !== 1 || s.round + ':' + s.eventId !== key) return;
      const move = Engine.cpuMove(s, s.settings.difficulty);
      if (move) app.game.guess(1, move.cell, move.charId);
      else app.game.pass(1);
      push();
    }, Engine.cpuDelay(st.settings.difficulty, st.settings.timer));
  }

  function createRoom() {
    reset();
    app.mode = 'host';
    app.me = 0;
    setScene('assets/bg/crear.jpg');
    $('lobby-code').textContent = '-----';
    show('lobby');
    app.net = Net.host({
      onReady(code) {
        app.code = code;
        $('lobby-code').textContent = code;
      },
      onJoin(msg) {
        const guest = clean(msg.name) || 'Invitado';
        if (!app.game) {
          app.game = new Engine.Game([myName() || 'Anfitrión', guest], settings());
          app.game.newRound();
          startHostLoop();
          show('game');
        } else {
          app.game.s.names[1] = guest;
          app.game.resume();
          toast(guest + ' volvió a la sala', 'ok');
        }
        push();
      },
      onMessage(msg) {
        if (!app.game) return;
        let err = null;
        if (msg.t === 'guess') err = app.game.guess(1, msg.cell, msg.charId);
        else if (msg.t === 'pass') err = app.game.pass(1);
        else if (msg.t === 'rematch' && app.game.s.phase === 'over') app.game.newRound();
        if (err) app.net.send({ t: 'error', text: err });
        push();
      },
      onLeave() {
        if (!app.game) return;
        app.game.pause();
        push();
        toast('Tu rival se desconectó. Esperando que vuelva…', 'bad');
      },
      onError(text) {
        if (!app.game) leave(text);
        else toast(text, 'bad');
      },
    });
  }

  function joinRoom(code) {
    if (!/^[A-Z0-9]{5}$/i.test(code)) { $('home-error').textContent = 'El código tiene 5 caracteres.'; return; }
    reset();
    app.mode = 'guest';
    app.me = 1;
    setScene('assets/bg/crear.jpg');
    $('connecting-text').textContent = 'Conectando a la sala ' + code.toUpperCase() + '…';
    show('connecting');
    app.net = Net.join(code, myName() || 'Invitado', {
      onOpen() { $('connecting-text').textContent = 'Conectado. Preparando partida…'; },
      onMessage(msg) {
        if (msg.t === 'state') {
          if (!$('screen-game').classList.contains('active')) show('game');
          applyState(msg.state);
        } else if (msg.t === 'full') {
          leave('La sala ya está llena.');
        } else if (msg.t === 'error') {
          toast(msg.text, 'bad');
        }
      },
      onClose() { leave('El anfitrión cerró la sala.'); },
      onError(text) { leave(text); },
    });
  }

  function reset() {
    clearInterval(app.loop);
    clearTimeout(app.cpuTimer);
    app.cpuKey = null;
    if (app.net) app.net.close();
    Object.assign(app, {
      mode: null, game: null, net: null, state: null, me: null, selected: null,
      lastEventId: 0, lastRound: 0, showAnswers: false, overShownRound: 0, loop: null,
    });
    closeSearch();
    $('over').classList.add('hidden');
    $('home-error').textContent = '';
  }

  function leave(errorText) {
    const wasOnline = app.mode === 'host' || app.mode === 'guest';
    reset();
    show('home');
    if (errorText) {
      openPanel(wasOnline ? 'online' : 'cpu');
      $('home-error').textContent = errorText;
    }
  }

  // ---------- acciones del jugador ----------
  function myTurn() {
    const st = app.state;
    return !!st && st.phase === 'playing' && !st.paused && (app.mode === 'local' || st.turn === app.me);
  }

  function submitGuess(cell, charId) {
    closeSearch();
    if (app.mode === 'guest') { app.net.send({ t: 'guess', cell, charId }); return; }
    const player = app.mode === 'local' ? app.state.turn : 0;
    const err = app.game.guess(player, cell, charId);
    if (err) toast(err, 'bad');
    push();
  }

  function passTurn() {
    if (app.state && app.state.phase === 'over') return rematch();
    if (!myTurn()) return;
    if (app.mode === 'guest') { app.net.send({ t: 'pass' }); return; }
    app.game.pass(app.mode === 'local' ? app.state.turn : 0);
    push();
  }

  function rematch() {
    $('over').classList.add('hidden');
    if (app.mode === 'guest') {
      app.net.send({ t: 'rematch' });
      toast('Pidiendo revancha…');
      return;
    }
    app.game.newRound();
    push();
  }

  // ---------- estado y render ----------
  function applyState(st) {
    const newRound = st.round !== app.lastRound;
    app.state = st;
    app.deadline = Date.now() + st.remainingMs;
    if (newRound) {
      app.lastRound = st.round;
      app.showAnswers = false;
      $('over').classList.add('hidden');
    }
    const ev = st.event;
    const fresh = ev && ev.id !== app.lastEventId;
    if (fresh) { app.lastEventId = ev.id; announce(ev); }

    if (app.selected !== null && (!myTurn() || st.cells[app.selected])) closeSearch();

    render(fresh && ev.type === 'wrong' ? ev.cell : null);

    maybeCpu();

    if (st.phase === 'over' && app.overShownRound !== st.round) {
      app.overShownRound = st.round;
      setTimeout(showOver, 900);
    }
  }

  function playerName(p) { return app.state.names[p]; }

  function announce(ev) {
    const who = playerName(ev.player);
    const ch = ev.charId && charOf(ev.charId);
    switch (ev.type) {
      case 'correct': toast('✅ ' + who + ' acertó con ' + ch.name, 'ok'); break;
      case 'wrong':   toast('❌ ' + who + ' dijo ' + ch.name + ': ¡incorrecto! Pierde el turno.', 'bad'); break;
      case 'timeout': toast('⏰ ¡Se le acabó el tiempo a ' + who + '!', 'bad'); break;
      case 'pass':    toast(who + ' pasó el turno'); break;
      case 'round':   toast('Nueva partida: empieza ' + who); break;
    }
  }

  function render(badCell) {
    const st = app.state;
    [0, 1].forEach(p => {
      const el = $('pl-' + p);
      el.querySelector('.pname').textContent = st.names[p] + (app.mode !== 'local' && p === app.me ? ' (vos)' : '');
      el.querySelector('.pscore').textContent = st.scores[p];
      el.classList.toggle('active', st.phase === 'playing' && st.turn === p);
    });

    let text = '';
    if (st.paused) text = 'Partida en pausa: esperando que tu rival se reconecte…';
    else if (st.phase === 'over') text = st.winner === 'draw' ? 'Empate' : 'Ganó ' + playerName(st.winner);
    else if (app.mode === 'local') text = 'Turno de ' + playerName(st.turn) + ' (' + MARKS[st.turn] + ')';
    else if (app.mode === 'cpu' && st.turn === 1) text = playerName(1) + ' está pensando…';
    else text = st.turn === app.me ? '¡Tu turno! Elegí una casilla.' : 'Turno de ' + playerName(st.turn) + '…';
    $('turn-text').textContent = text;

    const passBtn = $('btn-pass');
    passBtn.textContent = st.phase === 'over' ? 'Revancha' : 'Pasar turno';
    passBtn.disabled = st.phase !== 'over' && !myTurn();

    renderBoard(badCell);
    renderTimer();
  }

  function catEl(cat) {
    const d = document.createElement('div');
    d.className = 'cat ' + cat.kind;
    if (cat.kind === 'anime') {
      const img = (window.ANIME_IMAGES || {})[cat.id];
      if (img) d.style.backgroundImage = 'url("' + img + '")';
      d.innerHTML = '<span class="kind">Anime</span><span>' + esc(catLabel(cat)) + '</span>';
    } else {
      const t = tagById.get(cat.id);
      const icon = t.hair
        ? '<span class="swatch" style="background:' + t.hair + '"></span>'
        : '<span class="icon">' + t.icon + '</span>';
      d.innerHTML = icon + '<span>' + esc(t.label) + '</span>';
    }
    return d;
  }

  function renderBoard(badCell) {
    const st = app.state;
    const board = $('board');
    board.innerHTML = '';
    const corner = document.createElement('div');
    corner.className = 'corner';
    corner.textContent = 'Ronda ' + st.round;
    board.appendChild(corner);
    st.board.cols.forEach(c => board.appendChild(catEl(c)));

    for (let r = 0; r < 3; r++) {
      board.appendChild(catEl(st.board.rows[r]));
      for (let c = 0; c < 3; c++) {
        const i = r * 3 + c;
        const cell = st.cells[i];
        const d = document.createElement('div');
        d.className = 'cell';
        if (cell) {
          const ch = charOf(cell.charId);
          const img = imgOf(cell.charId);
          d.classList.add('owned', 'p' + cell.player);
          d.innerHTML =
            (img ? '<img src="' + esc(img) + '" alt="">' : '<span class="initials">' + esc(initials(ch.name)) + '</span>') +
            '<span class="xo">' + MARKS[cell.player] + '</span>' +
            '<span class="cname">' + esc(ch.name) + '</span>';
          if (st.winLine && st.winLine.includes(i)) d.classList.add('win');
        } else if (st.phase === 'over' && app.showAnswers) {
          const ids = Engine.answersFor(st.board.rows[r], st.board.cols[c]).filter(id => !st.used.includes(id));
          const names = ids.slice(0, 4).map(id => charOf(id).name);
          d.innerHTML = '<div class="answers">' + esc(names.join(', ')) + (ids.length > 4 ? ' y ' + (ids.length - 4) + ' más' : '') + '</div>';
        } else if (myTurn()) {
          d.classList.add('clickable');
          d.addEventListener('click', () => openSearch(i));
        }
        if (i === badCell) d.classList.add('flash-bad');
        board.appendChild(d);
      }
    }
  }

  function renderTimer() {
    const st = app.state;
    if (!st) return;
    const total = st.settings.timer * 1000;
    const left = st.phase !== 'playing' ? 0 : st.paused ? st.remainingMs : Math.max(0, app.deadline - Date.now());
    const secs = Math.ceil(left / 1000);
    const num = $('timer-num');
    num.textContent = st.phase === 'playing' ? secs : '–';
    num.classList.toggle('low', st.phase === 'playing' && !st.paused && secs <= 5);
    $('timer-fill').style.width = (st.phase === 'playing' ? (left / total) * 100 : 0) + '%';
    $('timer-fill').style.background = st.turn === 0 ? 'var(--p0)' : 'var(--p1)';
  }
  setInterval(renderTimer, 100);

  function showOver() {
    const st = app.state;
    if (!st || st.phase !== 'over') return;
    let title;
    if (st.winner === 'draw') title = '¡Empate!';
    else if (app.mode === 'local') title = '¡Ganó ' + playerName(st.winner) + '!';
    else title = st.winner === app.me ? '¡Ganaste! 🎉' : 'Perdiste 😢';
    $('over-title').textContent = title;
    $('over-score').textContent = st.names[0] + ' ' + st.scores[0] + ' – ' + st.scores[1] + ' ' + st.names[1];
    $('over-wait').textContent = '';
    $('over').classList.remove('hidden');
  }

  // ---------- buscador ----------
  function openSearch(cell) {
    if (!myTurn()) return;
    app.selected = cell;
    const [r, c] = [app.state.board.rows[Math.floor(cell / 3)], app.state.board.cols[cell % 3]];
    $('search-cats').innerHTML =
      '<span class="chip">' + esc(catLabel(r)) + '</span><span class="x">+</span><span class="chip">' + esc(catLabel(c)) + '</span>';
    $('search-input').value = '';
    renderResults();
    $('search').classList.remove('hidden');
    setTimeout(() => $('search-input').focus(), 0);
  }

  function closeSearch() {
    app.selected = null;
    $('search').classList.add('hidden');
  }

  function renderResults() {
    const q = norm($('search-input').value);
    const ul = $('search-results');
    ul.innerHTML = '';
    app.results = [];
    app.sel = 0;
    if (q.length < 2) {
      ul.innerHTML = '<li class="empty">Escribí al menos 2 letras…</li>';
      return;
    }
    const scored = [];
    searchIndex.forEach(({ c, keys }) => {
      let best = 9;
      keys.forEach(k => {
        if (k.startsWith(q)) best = Math.min(best, 0);
        else if (k.split(' ').some(w => w.startsWith(q))) best = Math.min(best, 1);
        else if (k.includes(q)) best = Math.min(best, 2);
      });
      if (best < 9) scored.push({ c, best });
    });
    scored.sort((a, b) => a.best - b.best || a.c.name.localeCompare(b.c.name));
    const used = app.state.used;
    app.results = scored.slice(0, 8).map(s => s.c);
    if (!app.results.length) {
      ul.innerHTML = '<li class="empty">No encontramos ese personaje.</li>';
      return;
    }
    app.results.forEach((c, idx) => {
      const li = document.createElement('li');
      const img = imgOf(c.id);
      const isUsed = used.includes(c.id);
      if (isUsed) li.classList.add('used');
      if (idx === app.sel) li.classList.add('sel');
      li.innerHTML =
        (img ? '<img class="thumb" src="' + esc(img) + '" alt="">' : '<span class="thumb">' + esc(initials(c.name)) + '</span>') +
        '<div><div class="rname">' + esc(c.name) + '</div><div class="ranime">' + esc(animeById.get(c.anime).name) + (isUsed ? ' · ya usado' : '') + '</div></div>';
      li.addEventListener('click', () => pick(idx));
      ul.appendChild(li);
    });
  }

  function pick(idx) {
    const c = app.results[idx];
    if (!c || app.selected === null) return;
    if (app.state.used.includes(c.id)) { toast('Ese personaje ya se usó en esta partida', 'bad'); return; }
    submitGuess(app.selected, c.id);
  }

  function moveSel(delta) {
    if (!app.results.length) return;
    app.sel = (app.sel + delta + app.results.length) % app.results.length;
    [...$('search-results').children].forEach((li, i) => li.classList.toggle('sel', i === app.sel));
  }

  // ---------- eventos ----------
  $('in-name').value = load('ttta-name') || '';
  $('in-name').addEventListener('input', () => store('ttta-name', $('in-name').value));
  $('btn-create').addEventListener('click', createRoom);
  $('btn-join').addEventListener('click', () => joinRoom($('in-code').value.trim()));
  $('in-code').addEventListener('keydown', e => { if (e.key === 'Enter') joinRoom($('in-code').value.trim()); });
  $('btn-local').addEventListener('click', startLocal);
  $('btn-cpu').addEventListener('click', startCpu);
  $('btn-lobby-back').addEventListener('click', () => leave());
  $('btn-connecting-back').addEventListener('click', () => leave());
  $('btn-leave').addEventListener('click', () => { if (confirm('¿Salir de la partida?')) leave(); });
  $('btn-over-leave').addEventListener('click', () => leave());
  $('btn-pass').addEventListener('click', passTurn);
  $('btn-rematch').addEventListener('click', rematch);
  $('btn-answers').addEventListener('click', () => {
    app.showAnswers = true;
    $('over').classList.add('hidden');
    render(null);
  });
  $('btn-copy-link').addEventListener('click', () => {
    const url = location.origin + location.pathname + '?sala=' + app.code;
    navigator.clipboard.writeText(url).then(() => toast('Link copiado'), () => prompt('Copiá este link:', url));
  });

  $('search-input').addEventListener('input', renderResults);
  $('search-input').addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveSel(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveSel(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); pick(app.sel); }
    else if (e.key === 'Escape') closeSearch();
  });
  $('search-cancel').addEventListener('click', closeSearch);
  $('search').addEventListener('click', e => { if (e.target.id === 'search') closeSearch(); });

  // ---------- portada y panel de modos ----------
  const PANELS = {
    cpu:    { title: 'Contra la máquina',   sub: 'Elegí la dificultad y enfrentá a Gojo' },
    online: { title: 'Multijugador online', sub: 'Creá una sala o unite con un código' },
    local:  { title: 'Dos jugadores',       sub: 'Se turnan en la misma pantalla' },
    rules:  { title: 'Cómo jugar',          sub: 'Todo lo que tenés que saber' },
  };

  document.querySelector('.hero').style.setProperty('--hero', absUrl('assets/bg/hero.jpg'));
  const banners = [...document.querySelectorAll('.mode')];
  banners.forEach(b => {
    b.style.setProperty('--bg', absUrl(b.dataset.bg));
    b.addEventListener('click', () => openPanel(b.dataset.panel));
  });
  // Los banners aparecen con animación al entrar en pantalla
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    }), { threshold: 0.15 });
    banners.forEach(b => io.observe(b));
  } else {
    banners.forEach(b => b.classList.add('visible'));
  }

  function restartAnimation(el) {
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
  }

  function openPanel(kind) {
    const info = PANELS[kind];
    const banner = banners.find(b => b.dataset.panel === kind);
    const head = $('panel-head');
    head.style.setProperty('--bg', absUrl(banner.dataset.bg));
    head.style.setProperty('--tint', banner.style.getPropertyValue('--tint'));
    const char = $('panel-char');
    char.src = banner.querySelector('.mode-char').src;
    restartAnimation(char);
    $('panel-title').textContent = info.title;
    $('panel-sub').textContent = info.sub;
    document.querySelectorAll('#panel [data-for]').forEach(el => {
      el.style.display = el.dataset.for.split(' ').includes(kind) ? '' : 'none';
    });
    $('home-error').textContent = '';
    restartAnimation(document.querySelector('.panel-card'));
    $('panel').classList.remove('hidden');
    if (kind !== 'rules') {
      setTimeout(() => (kind === 'online' && $('in-code').value ? $('btn-join') : $('in-name')).focus(), 50);
    }
  }
  function closePanel() { $('panel').classList.add('hidden'); }

  document.querySelectorAll('.navlink[data-panel]').forEach(n => n.addEventListener('click', () => openPanel(n.dataset.panel)));
  $('panel-close').addEventListener('click', closePanel);
  $('panel').addEventListener('click', e => { if (e.target.id === 'panel') closePanel(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

  $('in-diff').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    $('in-diff').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    store('ttta-diff', b.dataset.v);
  });
  const savedDiff = load('ttta-diff');
  if (savedDiff) $('in-diff').querySelectorAll('button').forEach(x => x.classList.toggle('on', x.dataset.v === savedDiff));
  $('in-name2').value = load('ttta-name2') || '';
  $('in-name2').addEventListener('input', () => store('ttta-name2', $('in-name2').value));

  // Link de invitación: ?sala=CODIGO
  const sala = new URLSearchParams(location.search).get('sala');
  if (sala) {
    $('in-code').value = sala.toUpperCase();
    openPanel('online');
  }

})();
