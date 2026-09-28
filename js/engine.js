// Lógica del juego: generación de tableros, validación y turnos.
// La usa el modo local y el anfitrión de una sala online (que es la autoridad).
(function () {
  const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const MIN_ANSWERS = 2;

  const byId = new Map(DB.characters.map(c => [c.id, c]));
  const catKey = cat => cat.kind + ':' + cat.id;

  // Índice: categoría -> Set de ids de personajes que la cumplen
  const index = new Map();
  function addTo(key, id) {
    if (!index.has(key)) index.set(key, new Set());
    index.get(key).add(id);
  }
  DB.characters.forEach(c => {
    addTo('anime:' + c.anime, c.id);
    c.tags.forEach(t => addTo('tag:' + t, c.id));
  });

  function answersFor(a, b) {
    const A = index.get(catKey(a)) || new Set();
    const B = index.get(catKey(b)) || new Set();
    const out = [];
    A.forEach(id => { if (B.has(id)) out.push(id); });
    return out;
  }

  function matches(charId, cat) {
    const s = index.get(catKey(cat));
    return !!s && s.has(charId);
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function generateBoard(opts) {
    const animes = DB.animes.filter(a => a.count >= 6).map(a => ({ kind: 'anime', id: a.id }));
    const tags = DB.tags.filter(t => opts.spoilers || !t.spoiler).map(t => ({ kind: 'tag', id: t.id }));

    const ok = (a, b) => answersFor(a, b).length >= MIN_ANSWERS;

    // Devuelve [ejeA, ejeB] o null si el intento no sirve
    const strategies = {
      // 3 animes contra 3 atributos
      threeAnimes() {
        const an = shuffle(animes).slice(0, 3);
        const tg = shuffle(tags).filter(t => an.every(a => ok(a, t)));
        return tg.length >= 3 ? [an, tg.slice(0, 3)] : null;
      },
      // 2 animes + 1 atributo contra 3 atributos
      twoAnimes() {
        const an = shuffle(animes).slice(0, 2);
        const compatible = shuffle(tags).filter(t => an.every(a => ok(a, t)));
        for (const extra of shuffle(tags)) {
          const tg = compatible.filter(t => t.id !== extra.id && ok(extra, t));
          if (tg.length >= 3) return [shuffle([...an, extra]), tg.slice(0, 3)];
        }
        return null;
      },
      // solo atributos
      tagsOnly() {
        const tg = shuffle(tags);
        const A = tg.slice(0, 3), B = tg.slice(3, 6);
        return A.every(a => B.every(b => ok(a, b))) ? [A, B] : null;
      },
    };

    const r = Math.random();
    const order = r < 0.55 ? ['threeAnimes', 'twoAnimes', 'tagsOnly']
                : r < 0.85 ? ['twoAnimes', 'threeAnimes', 'tagsOnly']
                : ['tagsOnly', 'threeAnimes', 'twoAnimes'];
    for (const name of order) {
      for (let i = 0; i < 400; i++) {
        const res = strategies[name]();
        if (res) {
          const [A, B] = res;
          const [rows, cols] = Math.random() < 0.5 ? [A, B] : [B, A];
          return { rows, cols };
        }
      }
    }
    throw new Error('No se pudo generar un tablero');
  }

  class Game {
    constructor(names, settings) {
      this.s = {
        names: names.slice(),
        settings: { timer: 30, spoilers: true, ...settings },
        scores: [0, 0],
        round: 0,
        starter: Math.random() < 0.5 ? 0 : 1,
        eventId: 0,
        event: null,
        paused: false,
      };
    }

    newRound() {
      const s = this.s;
      if (s.round > 0) s.starter = 1 - s.starter;
      s.round++;
      s.board = generateBoard(s.settings);
      s.cells = Array(9).fill(null);
      s.used = [];
      s.turn = s.starter;
      s.phase = 'playing';
      s.winner = null;
      s.winLine = null;
      this.emit({ type: 'round', player: s.turn });
      this.startTurn();
    }

    startTurn() {
      this.s.turnEndsAt = Date.now() + this.s.settings.timer * 1000;
    }

    emit(ev) {
      this.s.eventId++;
      this.s.event = { ...ev, id: this.s.eventId };
    }

    cellCats(cell) {
      const b = this.s.board;
      return [b.rows[Math.floor(cell / 3)], b.cols[cell % 3]];
    }

    // Devuelve un string de error si la jugada es inválida (no consume el turno).
    guess(player, cell, charId) {
      const s = this.s;
      if (s.phase !== 'playing' || s.paused) return 'La partida no está activa';
      if (player !== s.turn) return 'No es tu turno';
      if (!(cell >= 0 && cell < 9)) return 'Casilla inválida';
      if (s.cells[cell]) return 'Esa casilla ya está marcada';
      if (!byId.has(charId)) return 'Personaje desconocido';
      if (s.used.includes(charId)) return 'Ese personaje ya se usó';

      const [r, c] = this.cellCats(cell);
      if (matches(charId, r) && matches(charId, c)) {
        s.cells[cell] = { player, charId };
        s.used.push(charId);
        this.emit({ type: 'correct', player, cell, charId });
        const line = LINES.find(l => l.every(i => s.cells[i] && s.cells[i].player === player));
        if (line) return this.finish(player, line);
      } else {
        this.emit({ type: 'wrong', player, cell, charId });
      }
      this.nextTurn();
      return null;
    }

    pass(player) {
      const s = this.s;
      if (s.phase !== 'playing' || s.paused || player !== s.turn) return 'No es tu turno';
      this.emit({ type: 'pass', player });
      this.nextTurn();
      return null;
    }

    // Llamar periódicamente. Devuelve true si cambió el estado.
    tick() {
      const s = this.s;
      if (s.phase !== 'playing' || s.paused) return false;
      if (Date.now() >= s.turnEndsAt) {
        this.emit({ type: 'timeout', player: s.turn });
        this.nextTurn();
        return true;
      }
      return false;
    }

    nextTurn() {
      const s = this.s;
      // Empate si no quedan casillas con respuestas posibles
      const playable = s.cells.some((cell, i) => {
        if (cell) return false;
        const [r, c] = this.cellCats(i);
        return answersFor(r, c).some(id => !s.used.includes(id));
      });
      if (!playable) return this.finish('draw', null);
      s.turn = 1 - s.turn;
      this.startTurn();
    }

    finish(winner, line) {
      const s = this.s;
      s.phase = 'over';
      s.winner = winner;
      s.winLine = line;
      if (winner !== 'draw') s.scores[winner]++;
      return null;
    }

    pause() {
      const s = this.s;
      if (s.paused) return;
      s.paused = true;
      s.pausedRemaining = Math.max(0, s.turnEndsAt - Date.now());
    }

    resume() {
      const s = this.s;
      if (!s.paused) return;
      s.paused = false;
      s.turnEndsAt = Date.now() + (s.pausedRemaining || s.settings.timer * 1000);
    }

    snapshot() {
      const s = this.s;
      const remainingMs = s.paused ? s.pausedRemaining : Math.max(0, s.turnEndsAt - Date.now());
      return JSON.parse(JSON.stringify({ ...s, remainingMs }));
    }
  }

  // ---------- Rival CPU ----------
  // know: probabilidad de saber una respuesta correcta
  // smart: probabilidad de elegir la casilla con estrategia (ganar, bloquear, centro...)
  const CPU_LEVELS = {
    facil:   { know: 0.4,  smart: 0.15, delay: [3500, 7000] },
    normal:  { know: 0.65, smart: 0.6,  delay: [2500, 6000] },
    dificil: { know: 0.88, smart: 1,    delay: [1500, 4500] },
  };
  const pickRandom = arr => arr[Math.floor(Math.random() * arr.length)];

  function cpuMove(s, level) {
    const cfg = CPU_LEVELS[level] || CPU_LEVELS.normal;
    const me = s.turn, op = 1 - me;
    const cats = i => [s.board.rows[Math.floor(i / 3)], s.board.cols[i % 3]];
    const avail = i => s.cells[i] ? [] : answersFor(...cats(i)).filter(id => !s.used.includes(id));
    const free = [0,1,2,3,4,5,6,7,8].filter(i => avail(i).length);
    if (!free.length) return null;

    let cell;
    if (Math.random() < cfg.smart) {
      const owner = j => s.cells[j] && s.cells[j].player;
      const score = i => {
        let sc = Math.random();
        LINES.filter(l => l.includes(i)).forEach(l => {
          const others = l.filter(j => j !== i);
          const mine = others.filter(j => owner(j) === me).length;
          const theirs = others.filter(j => owner(j) === op).length;
          if (mine === 2) sc += 100;          // gana
          if (theirs === 2) sc += 50;         // bloquea
          if (theirs === 0) sc += mine ? 4 : 1;
        });
        if (i === 4) sc += 3;
        if ([0, 2, 6, 8].includes(i)) sc += 1.5;
        return sc;
      };
      cell = free.reduce((a, b) => (score(b) > score(a) ? b : a));
    } else {
      cell = pickRandom(free);
    }

    const answers = avail(cell);
    if (Math.random() < cfg.know) return { cell, charId: pickRandom(answers) };
    // Se equivoca con un personaje que cumple solo una de las dos categorías
    const [r, c] = cats(cell);
    const near = DB.characters.filter(ch => !s.used.includes(ch.id) && matches(ch.id, r) !== matches(ch.id, c));
    return { cell, charId: near.length ? pickRandom(near).id : pickRandom(answers) };
  }

  function cpuDelay(level, timerSecs) {
    const [a, b] = (CPU_LEVELS[level] || CPU_LEVELS.normal).delay;
    return Math.min(a + Math.random() * (b - a), timerSecs * 1000 - 1500);
  }

  window.Engine = { Game, answersFor, matches, byId, generateBoard, cpuMove, cpuDelay };
})();
