# Tic-Tac-Toe Anime

Autor: **Francots**

Tic-Tac-Toe estilo "futbolero" pero con personajes de anime. Cada casilla cruza dos categorías (un anime o un atributo). Para marcarla tenés que nombrar un personaje que cumpla las dos.

## 🎮 [Jugar ahora → tictactoe-anime.netlify.app](https://tictactoe-anime.netlify.app/)

No hace falta instalar nada: funciona en el navegador, desde la compu o el celular.

## Reglas

- En tu turno elegís una casilla libre y escribís un personaje.
- Si acertás, la casilla queda marcada y nadie más la puede usar.
- Si fallás o se te acaba el tiempo, perdés el turno.
- Cada personaje se puede usar una sola vez por partida.
- Gana el primero que haga tres en línea. Si no quedan jugadas posibles, es empate.

## Modos de juego

- **Contra la máquina**: jugás contra Gojo. Tiene tres dificultades (Fácil, Normal, Difícil) que cambian qué tan seguido acierta y qué tan bien elige la casilla.
- **Multijugador online**: creás una sala o te unís con un código.
- **Dos jugadores**: se turnan en la misma pantalla.

## Cómo jugar online con amigos

1. Entrá a [tictactoe-anime.netlify.app](https://tictactoe-anime.netlify.app/), elegí **Multijugador online** y tocá **Crear sala**.
2. Pasale a tu amigo el código o el link de invitación.
3. Tu amigo pone el código y toca **Unirse**.

La conexión es directa entre los dos navegadores (WebRTC, usando PeerJS). El que crea la sala hace de "servidor": maneja el tiempo y valida las respuestas. Si el invitado se desconecta, la partida se pausa hasta que vuelva a entrar con el mismo código.

## Agregar personajes

Los personajes están en `js/data.js`, agrupados por anime. Cada línea sigue este formato:

```
Nombre | alias1;alias2 | tags
```

Los tags disponibles están al principio del archivo (`prota`, `vill`, `mujer`, `esp`, `rubio`, etc.).

Para agregar un anime nuevo, copiá un bloque `A(...)`. Un anime aparece como categoría en el tablero cuando tiene al menos 6 personajes y suficientes atributos en común.

Después de agregar personajes, corré este comando para bajar sus imágenes desde AniList:

```bash
python tools/fetch_images.py
```

## Archivos

| Archivo | Qué hace |
|---|---|
| `index.html` | Estructura de las pantallas |
| `css/styles.css` | Estilos del juego |
| `css/home.css` | Portada, banners animados y paneles |
| `assets/bg/` | Fondos de los banners |
| `js/data.js` | Base de personajes, animes y atributos |
| `js/images.js` | URLs de imágenes (lo genera el script) |
| `js/engine.js` | Reglas, generación de tableros y turnos |
| `js/net.js` | Conexión online (PeerJS) |
| `js/app.js` | Interfaz y modos de juego |

## Créditos de imágenes

- Fondos: [Wallhaven](https://wallhaven.cc). Portada: `gw5ypd` · Contra la máquina: `9dr7zk` · Online: `k7mwp7` · Dos jugadores: `g8dwve` · Cómo jugar: `ymwj9d`.
- Personajes de los banners: renders de las wikis de Fandom (One Piece, Jujutsu Kaisen, Dragon Ball y Kimetsu no Yaiba). Se cargan directo desde el CDN de Fandom.
- Imágenes del tablero: [AniList](https://anilist.co).

Es un proyecto fan sin fines de lucro. Todos los personajes pertenecen a sus autores.
