// Base de datos de personajes.
// Formato de cada línea:  Nombre | alias1;alias2 | tags separados por espacio
// A(id, nombre visible, término de búsqueda en AniList, lista)
(function () {
  const TAGS = [
    { id: 'prota',   label: 'Protagonista',            icon: '⭐' },
    { id: 'vill',    label: 'Villano o antagonista',   icon: '😈' },
    { id: 'mujer',   label: 'Personaje femenino',      icon: '♀️' },
    { id: 'esp',     label: 'Usa espada',              icon: '⚔️' },
    { id: 'muere',   label: 'Muere en la historia',    icon: '💀', spoiler: true },
    { id: 'nohum',   label: 'No es humano',            icon: '👹' },
    { id: 'rubio',   label: 'Pelo rubio',              hair: '#f5d142' },
    { id: 'negro',   label: 'Pelo negro',              hair: '#1b1b24' },
    { id: 'blanco',  label: 'Pelo blanco o plateado',  hair: '#eef1f6' },
    { id: 'rojo',    label: 'Pelo rojo o naranja',     hair: '#ff5a2c' },
    { id: 'rosa',    label: 'Pelo rosa',               hair: '#ff8ccf' },
    { id: 'azul',    label: 'Pelo azul',               hair: '#3d8bff' },
    { id: 'verde',   label: 'Pelo verde',              hair: '#39c96b' },
    { id: 'lentes',  label: 'Usa lentes o gafas',      icon: '👓' },
    { id: 'fuego',   label: 'Usa fuego',               icon: '🔥' },
    { id: 'mentor',  label: 'Mentor o maestro',        icon: '🧙' },
    { id: 'estud',   label: 'Estudiante (escuela)',    icon: '🎒' },
    { id: 'transf',  label: 'Tiene transformación',    icon: '✨' },
    { id: 'cicat',   label: 'Cicatriz visible',        icon: '🩹' },
    { id: 'ojos',    label: 'Poder en los ojos',       icon: '👁️' },
    { id: 'realeza', label: 'Realeza o nobleza',       icon: '👑' },
  ];

  const animes = [];
  const characters = [];

  function A(id, name, search, list) {
    const anime = { id, name, search, count: 0 };
    animes.push(anime);
    list.split('\n').map(l => l.trim()).filter(Boolean).forEach(line => {
      const [n, aliases = '', tags = ''] = line.split('|').map(s => s.trim());
      characters.push({
        id: id + ':' + n,
        name: n,
        aliases: aliases ? aliases.split(';').map(s => s.trim()).filter(Boolean) : [],
        anime: id,
        tags: tags ? tags.split(/\s+/) : [],
      });
      anime.count++;
    });
  }

  A('naruto', 'Naruto', 'Naruto', `
Naruto Uzumaki|Naruto|prota rubio transf
Sasuke Uchiha|Sasuke|negro esp ojos vill fuego
Sakura Haruno|Sakura|mujer rosa
Kakashi Hatake|Kakashi|blanco mentor ojos cicat muere
Itachi Uchiha|Itachi|negro ojos vill muere fuego
Madara Uchiha|Madara|negro ojos vill muere fuego
Obito Uchiha|Obito;Tobi|negro ojos vill muere cicat fuego
Jiraiya|Ero-Sennin|blanco mentor muere
Gaara|Gaara del Desierto|rojo vill muere
Hinata Hyuga|Hinata|mujer azul ojos
Neji Hyuga|Neji|ojos muere
Rock Lee|Lee|negro
Nagato|Pain;Pein|rojo ojos vill muere
Orochimaru|Orochimaru|negro vill esp mentor
Tsunade|Tsunade|mujer rubio mentor
Minato Namikaze|Minato;Cuarto Hokage|rubio muere mentor
Kurama (Kyubi)|Kyubi;Nueve Colas;Kurama|nohum
Kisame Hoshigaki|Kisame|azul esp vill muere
Might Guy|Gai;Guy|negro mentor
Shikamaru Nara|Shikamaru|negro
Deidara|Deidara|rubio vill muere
Zabuza Momochi|Zabuza|negro esp vill muere
Haku|Haku|negro vill muere
Hiruzen Sarutobi|Tercer Hokage;Hiruzen|blanco mentor muere
Iruka Umino|Iruka|negro mentor cicat
`);

  A('onepiece', 'One Piece', 'One Piece', `
Monkey D. Luffy|Luffy|prota negro transf cicat
Roronoa Zoro|Zoro|esp verde cicat
Nami|Nami|mujer rojo
Usopp|Usopp|negro
Sanji|Vinsmoke Sanji|rubio fuego realeza
Tony Tony Chopper|Chopper|nohum transf
Nico Robin|Robin|mujer negro
Franky|Cutty Flam|azul nohum
Brook|Brook|nohum esp muere negro
Jinbe|Jinbei|nohum
Portgas D. Ace|Ace|negro fuego muere
Shanks|Pelirrojo|rojo esp cicat
Trafalgar Law|Law|negro esp
Boa Hancock|Hancock|mujer negro realeza
Nefertari Vivi|Vivi|mujer azul realeza
Donquixote Doflamingo|Doflamingo;Doffy|rubio vill lentes realeza
Crocodile|Sir Crocodile|negro vill cicat
Kaido|Kaido|negro vill transf
Charlotte Linlin|Big Mom|mujer rosa vill
Marshall D. Teach|Barbanegra;Blackbeard;Teach|negro vill
Dracule Mihawk|Mihawk;Ojo de Halcon|negro esp
Edward Newgate|Barbablanca;Whitebeard|blanco muere cicat
Sabo|Sabo|rubio fuego cicat
Smoker|Smoker|blanco
Rob Lucci|Lucci|negro vill transf
Buggy|Buggy el Payaso|azul vill
Gol D. Roger|Roger;Rey de los Piratas|negro muere
Arlong|Arlong|nohum vill negro
Borsalino|Kizaru|lentes
`);

  A('dragonball', 'Dragon Ball', 'Dragon Ball', `
Son Goku|Goku;Kakarotto;Kakaroto|prota negro nohum transf muere
Vegeta|Vegeta|negro nohum transf realeza muere vill
Son Gohan|Gohan|negro transf estud
Piccolo|Picoro|nohum mentor muere vill
Freezer|Frieza;Freeza|nohum vill transf muere
Cell|Cell|nohum vill transf muere
Majin Buu|Buu;Boo|nohum vill transf
Bulma|Bulma|mujer azul
Krillin|Krilin;Kuririn|muere
Trunks|Future Trunks;Trunks del Futuro|esp transf
Maestro Roshi|Roshi;Kame Sennin|mentor lentes
Androide 18|Numero 18;C-18;Android 18|mujer rubio vill
Bills|Beerus|nohum
Broly|Broly|nohum transf vill negro
Yamcha|Yamcha|negro muere cicat
Raditz|Raditz|negro nohum vill muere
Whis|Whis|nohum mentor blanco
Tenshinhan|Ten Shin Han;Tien|muere ojos
Goku Black|Black|negro vill transf muere
Chi-Chi|Milk;Chichi|mujer negro
`);

  A('bleach', 'Bleach', 'Bleach', `
Ichigo Kurosaki|Ichigo|prota rojo esp transf estud
Rukia Kuchiki|Rukia|mujer negro esp nohum
Orihime Inoue|Orihime|mujer rojo estud
Uryu Ishida|Uryu;Ishida|negro lentes estud
Byakuya Kuchiki|Byakuya|negro esp nohum realeza
Kenpachi Zaraki|Kenpachi|negro esp nohum cicat
Sosuke Aizen|Aizen|vill esp nohum lentes transf
Toshiro Hitsugaya|Toshiro;Hitsugaya|blanco esp nohum
Renji Abarai|Renji|rojo esp nohum
Kisuke Urahara|Urahara|rubio esp mentor nohum
Yoruichi Shihoin|Yoruichi|mujer nohum transf realeza
Grimmjow Jaegerjaquez|Grimmjow|azul nohum vill transf esp
Ulquiorra Cifer|Ulquiorra|negro nohum vill transf muere esp
Gin Ichimaru|Gin|blanco esp nohum vill muere
Genryusai Yamamoto|Yamamoto;Yamaji|fuego esp nohum muere cicat
Yhwach|Juha Bach|negro vill muere
Yasutora Sado|Chad|estud
Shunsui Kyoraku|Shunsui|esp nohum
`);

  A('aot', 'Attack on Titan', 'Shingeki no Kyojin', `
Eren Jaeger|Eren;Eren Yeager|prota transf muere vill esp
Mikasa Ackerman|Mikasa|mujer negro esp cicat
Armin Arlert|Armin|rubio transf esp
Levi Ackerman|Levi|negro esp cicat
Erwin Smith|Erwin|rubio muere esp
Hange Zoe|Hange;Hanji|lentes muere esp
Reiner Braun|Reiner|rubio transf vill
Annie Leonhart|Annie|mujer rubio transf vill
Bertholdt Hoover|Bertholdt|negro transf vill muere
Zeke Jaeger|Zeke|rubio lentes transf vill muere realeza
Historia Reiss|Historia;Krista|mujer rubio realeza
Sasha Blouse|Sasha|mujer muere
Jean Kirstein|Jean|esp
Ymir|Ymir|mujer transf muere negro
Hannes|Hannes|rubio muere
`);

  A('kny', 'Demon Slayer', 'Kimetsu no Yaiba', `
Tanjiro Kamado|Tanjiro|prota esp rojo cicat fuego
Nezuko Kamado|Nezuko|mujer nohum negro transf
Zenitsu Agatsuma|Zenitsu|rubio esp
Inosuke Hashibira|Inosuke|esp
Kyojuro Rengoku|Rengoku|rubio esp fuego muere mentor
Giyu Tomioka|Giyu|negro esp
Shinobu Kocho|Shinobu|mujer negro esp muere
Mitsuri Kanroji|Mitsuri|mujer rosa esp
Muzan Kibutsuji|Muzan|negro nohum vill muere transf
Akaza|Akaza|rosa nohum vill muere
Tengen Uzui|Tengen|blanco esp
Gyomei Himejima|Gyomei|muere cicat
Sanemi Shinazugawa|Sanemi|blanco esp cicat
Muichiro Tokito|Muichiro|negro esp muere
Kokushibo|Kokushibo|nohum vill esp muere ojos
Doma|Douma|nohum vill blanco muere
Kanao Tsuyuri|Kanao|mujer esp negro ojos
Sakonji Urokodaki|Urokodaki|mentor blanco
`);

  A('jjk', 'Jujutsu Kaisen', 'Jujutsu Kaisen', `
Yuji Itadori|Itadori;Yuji|prota rosa estud
Megumi Fushiguro|Megumi|negro estud
Nobara Kugisaki|Nobara|mujer rojo estud
Satoru Gojo|Gojo|blanco ojos mentor muere
Ryomen Sukuna|Sukuna|rosa nohum vill transf fuego muere
Maki Zenin|Maki|mujer verde esp lentes estud cicat
Toge Inumaki|Inumaki|blanco estud
Yuta Okkotsu|Yuta|negro esp estud
Kento Nanami|Nanami|rubio lentes muere esp
Suguru Geto|Geto|negro vill muere
Mahito|Mahito|nohum vill cicat muere
Toji Fushiguro|Toji|negro cicat vill muere esp
Aoi Todo|Todo|cicat estud
Jogo|Jogo|nohum vill fuego muere
Panda|Panda|nohum estud
Choso|Choso|nohum negro muere
Yoshinobu Gakuganji|Gakuganji|mentor blanco
`);

  A('mha', 'My Hero Academia', 'Boku no Hero Academia', `
Izuku Midoriya|Deku;Midoriya|prota verde estud cicat
Katsuki Bakugo|Bakugo;Kacchan|rubio estud
Shoto Todoroki|Todoroki|blanco rojo fuego estud cicat
Ochaco Uraraka|Uraraka|mujer estud
All Might|Toshinori Yagi|rubio mentor cicat transf
Tenya Iida|Iida|lentes estud
Tomura Shigaraki|Shigaraki|blanco vill cicat
Dabi|Toya Todoroki|negro fuego vill cicat
Endeavor|Enji Todoroki|rojo fuego cicat
Himiko Toga|Toga|mujer rubio vill transf
Eijiro Kirishima|Kirishima|rojo estud transf
Hawks|Keigo Takami|rubio
All For One|AFO|vill cicat mentor
Shota Aizawa|Aizawa;Eraserhead|negro mentor cicat ojos
Momo Yaoyorozu|Yaoyorozu;Momo|mujer negro estud
Tsuyu Asui|Froppy;Tsuyu|mujer verde estud
Denki Kaminari|Kaminari|rubio estud
Stain|Chizome Akaguro|vill esp cicat
Kai Chisaki|Overhaul|vill
`);

  A('deathnote', 'Death Note', 'Death Note', `
Light Yagami|Light;Kira|prota vill estud muere
L|L Lawliet;Ryuzaki|negro muere
Ryuk|Ryuk|nohum negro
Misa Amane|Misa|mujer rubio ojos
Near|Nate River|blanco
Mello|Mihael Keehl|rubio muere cicat
Soichiro Yagami|Soichiro|lentes muere
Rem|Rem|nohum mujer muere blanco
Teru Mikami|Mikami|negro lentes muere
`);

  A('fma', 'Fullmetal Alchemist', 'Fullmetal Alchemist', `
Edward Elric|Ed;Edward|prota rubio
Alphonse Elric|Al;Alphonse|nohum
Roy Mustang|Mustang|negro fuego
Riza Hawkeye|Riza|mujer rubio cicat
Winry Rockbell|Winry|mujer rubio
Scar|Scar|cicat vill blanco
Maes Hughes|Hughes|lentes muere
King Bradley|Bradley;Wrath|esp vill nohum muere ojos
Envy|Envidia|nohum vill transf verde muere
Lust|Lujuria|nohum mujer vill negro muere
Greed|Codicia|nohum vill muere
Father|Padre|nohum vill muere
Izumi Curtis|Izumi|mujer mentor negro
Van Hohenheim|Hohenheim|rubio lentes muere
Olivier Mira Armstrong|Olivier|mujer rubio esp
Alex Louis Armstrong|Armstrong|rubio
`);

  A('hxh', 'Hunter x Hunter', 'Hunter x Hunter', `
Gon Freecss|Gon|prota transf
Killua Zoldyck|Killua|blanco
Kurapika|Kurapika|rubio ojos
Leorio Paradinight|Leorio|lentes negro
Hisoka Morow|Hisoka|rojo vill
Chrollo Lucilfer|Chrollo;Kuroro|negro vill
Isaac Netero|Netero|blanco mentor muere
Meruem|Meruem;Rey Hormiga|nohum vill muere realeza
Neferpitou|Pitou|nohum vill muere blanco
Illumi Zoldyck|Illumi|negro vill
Biscuit Krueger|Bisky|mujer rubio mentor transf
Kite|Kaito|blanco muere
Wing|Wing|lentes mentor
Uvogin|Uvogin|vill muere
`);

  A('csm', 'Chainsaw Man', 'Chainsaw Man', `
Denji|Chainsaw Man|prota rubio transf
Power|Power|mujer nohum muere
Makima|Makima|mujer rojo vill muere nohum
Aki Hayakawa|Aki|negro esp muere
Kobeni Higashiyama|Kobeni|mujer
Himeno|Himeno|mujer muere
Pochita|Pochita|nohum
Kishibe|Kishibe|mentor cicat
Reze|Bomb Devil|mujer vill transf
Angel Devil|Angel|nohum muere
`);

  A('spyfam', 'Spy x Family', 'Spy x Family', `
Loid Forger|Loid;Twilight|rubio prota
Anya Forger|Anya|mujer rosa estud
Yor Forger|Yor;Thorn Princess|mujer negro
Bond Forger|Bond|nohum
Damian Desmond|Damian|estud negro
Yuri Briar|Yuri|negro
Franky Franklin|Franky Franklin|lentes
Becky Blackbell|Becky|mujer estud
`);

  A('tg', 'Tokyo Ghoul', 'Tokyo Ghoul', `
Ken Kaneki|Kaneki|prota blanco nohum transf ojos estud
Touka Kirishima|Touka|mujer nohum azul ojos
Rize Kamishiro|Rize|mujer nohum vill ojos
Kisho Arima|Arima|blanco lentes esp muere mentor
Juuzou Suzuya|Juuzou|blanco cicat
Shuu Tsukiyama|Tsukiyama|nohum
Hideyoshi Nagachika|Hide|rubio estud
Yamori|Jason|nohum vill muere
Yoshimura|Yoshimura|nohum mentor
`);

  A('opm', 'One Punch Man', 'One Punch Man', `
Saitama|Saitama|prota mentor
Genos|Genos|rubio nohum
Tatsumaki|Tatsumaki|mujer verde
Fubuki|Fubuki|mujer negro
Garou|Garou|blanco vill transf
Bang|Silverfang|blanco mentor
Boros|Lord Boros|nohum vill transf muere
Atomic Samurai|Atomic Samurai|esp
Speed of Sound Sonic|Sonic|esp negro vill
`);

  A('jojo', 'JoJo’s Bizarre Adventure', 'JoJo no Kimyou na Bouken', `
Jonathan Joestar|Jonathan|prota muere
Joseph Joestar|Joseph|prota
Jotaro Kujo|Jotaro|prota negro estud
Josuke Higashikata|Josuke|prota estud
Giorno Giovanna|Giorno|prota rubio
Dio Brando|Dio|rubio vill nohum muere
Jean Pierre Polnareff|Polnareff|blanco esp
Noriaki Kakyoin|Kakyoin|rojo estud muere
Yoshikage Kira|Kira|rubio vill muere
Jolyne Cujoh|Jolyne|mujer prota
Muhammad Avdol|Avdol|fuego muere
Bruno Bucciarati|Bucciarati|negro muere
`);

  A('sao', 'Sword Art Online', 'Sword Art Online', `
Kirito|Kazuto Kirigaya|prota negro esp estud
Asuna Yuuki|Asuna|mujer esp estud
Sinon|Shino Asada|mujer azul estud
Klein|Klein|rojo esp
Leafa|Suguha Kirigaya|mujer rubio esp estud
Yui|Yui|mujer nohum negro
Heathcliff|Akihiko Kayaba|vill esp muere
`);

  A('haikyuu', 'Haikyuu!!', 'Haikyuu', `
Shoyo Hinata|Hinata Shoyo|prota rojo estud
Tobio Kageyama|Kageyama|negro estud
Kei Tsukishima|Tsukishima|rubio lentes estud
Yu Nishinoya|Nishinoya|estud
Kenma Kozume|Kenma|rubio estud
Tetsuro Kuroo|Kuroo|negro estud
Toru Oikawa|Oikawa|estud
Koshi Sugawara|Sugawara;Suga|blanco estud
Kotaro Bokuto|Bokuto|blanco estud
Daichi Sawamura|Daichi|negro estud
`);

  A('ft', 'Fairy Tail', 'Fairy Tail', `
Natsu Dragneel|Natsu|prota rosa fuego
Lucy Heartfilia|Lucy|mujer rubio
Erza Scarlet|Erza|mujer rojo esp
Gray Fullbuster|Gray|negro
Happy|Happy|nohum
Wendy Marvell|Wendy|mujer azul
Gajeel Redfox|Gajeel|negro
Makarov Dreyar|Makarov|mentor blanco
Zeref Dragneel|Zeref|vill negro
Mirajane Strauss|Mirajane|mujer blanco transf
Laxus Dreyar|Laxus|rubio cicat
Juvia Lockser|Juvia|mujer azul
`);

  A('bc', 'Black Clover', 'Black Clover', `
Asta|Asta|prota blanco esp transf
Yuno|Yuno Grinberryall|negro realeza
Noelle Silva|Noelle|mujer blanco realeza
Yami Sukehiro|Yami|negro esp mentor
Julius Novachrono|Julius|mentor
Mereoleona Vermillion|Mereoleona|mujer rojo fuego realeza
Fuegoleon Vermillion|Fuegoleon|rojo fuego realeza
`);

  A('cg', 'Code Geass', 'Code Geass', `
Lelouch Lamperouge|Lelouch;Lelouch vi Britannia;Zero|prota negro ojos realeza estud muere vill
Suzaku Kururugi|Suzaku|estud
C.C.|CC|mujer verde nohum
Kallen Kozuki|Kallen|mujer rojo estud
Nunnally vi Britannia|Nunnally|mujer realeza
Charles zi Britannia|Charles|vill realeza muere blanco
Schneizel el Britannia|Schneizel|rubio realeza vill
`);

  A('eva', 'Evangelion', 'Neon Genesis Evangelion', `
Shinji Ikari|Shinji|prota estud
Rei Ayanami|Rei Ayanami|mujer azul estud nohum
Asuka Langley Soryu|Asuka|mujer rojo estud
Misato Katsuragi|Misato|mujer mentor cicat muere
Gendo Ikari|Gendo|lentes vill
Kaworu Nagisa|Kaworu|blanco nohum muere
`);

  A('mob', 'Mob Psycho 100', 'Mob Psycho 100', `
Shigeo Kageyama|Mob|prota negro estud transf
Arataka Reigen|Reigen|mentor
Dimple|Ekubo|nohum
Ritsu Kageyama|Ritsu|negro estud
Teru Hanazawa|Teru|rubio estud
`);

  A('bluelock', 'Blue Lock', 'Blue Lock', `
Yoichi Isagi|Isagi|prota negro estud
Meguru Bachira|Bachira|estud
Rin Itoshi|Rin|estud
Seishiro Nagi|Nagi|blanco estud
Hyoma Chigiri|Chigiri|rojo estud
Jinpachi Ego|Ego|lentes mentor negro
Shoei Barou|Barou|negro estud
Reo Mikage|Reo|estud
`);

  A('frieren', 'Frieren', 'Sousou no Frieren', `
Frieren|Frieren|prota mujer blanco nohum mentor
Fern|Fern|mujer
Stark|Stark|rojo cicat
Himmel|Himmel|azul esp muere
Heiter|Heiter|muere
Eisen|Eisen|nohum mentor
Aura|Aura la Guillotina|mujer nohum vill rosa muere
Flamme|Flamme|mujer mentor rojo muere
Ubel|Ubel|mujer vill
`);

  A('sololeveling', 'Solo Leveling', 'Ore dake Level Up na Ken', `
Sung Jin-Woo|Jinwoo;Sung Jinwoo|prota negro esp
Cha Hae-In|Hae-In|mujer rubio esp
Igris|Igris|nohum esp
Beru|Beru|nohum
`);

  A('bebop', 'Cowboy Bebop', 'Cowboy Bebop', `
Spike Spiegel|Spike|prota verde
Faye Valentine|Faye|mujer
Jet Black|Jet|
Vicious|Vicious|vill blanco esp
Ed|Edward Wong|mujer rojo
`);

  A('sailormoon', 'Sailor Moon', 'Sailor Moon', `
Usagi Tsukino|Sailor Moon;Usagi;Serena|prota mujer rubio estud realeza transf
Ami Mizuno|Sailor Mercury;Amy|mujer azul estud transf
Rei Hino|Sailor Mars;Raye|mujer negro fuego estud transf
Makoto Kino|Sailor Jupiter;Lita|mujer estud transf
Minako Aino|Sailor Venus;Mina|mujer rubio estud transf
Mamoru Chiba|Tuxedo Mask;Darien|negro realeza transf
Luna|Luna|nohum
Chibiusa|Rini|mujer rosa realeza
`);

  A('pokemon', 'Pokémon', 'Pokemon', `
Ash Ketchum|Ash;Satoshi|prota negro
Misty|Kasumi|mujer rojo
Brock|Takeshi|
Pikachu|Pikachu|nohum
Jessie|Musashi|mujer rojo vill
James|Kojiro|azul vill
Meowth|Nyarth|nohum vill
Gary Oak|Gary|
Profesor Oak|Samuel Oak|mentor blanco
`);

  A('yyh', 'Yu Yu Hakusho', 'Yu Yu Hakusho', `
Yusuke Urameshi|Yusuke|prota negro muere estud
Kazuma Kuwabara|Kuwabara|esp estud
Kurama (Yu Yu Hakusho)|Kurama;Shuichi Minamino|rojo nohum transf estud
Hiei|Hiei|negro nohum esp ojos fuego
Genkai|Genkai|mujer mentor muere
Toguro|Toguro Menor|vill transf lentes
`);

  A('oshinoko', 'Oshi no Ko', 'Oshi no Ko', `
Aqua Hoshino|Aqua|rubio ojos estud
Ruby Hoshino|Ruby|mujer rubio ojos estud
Ai Hoshino|Ai|mujer muere ojos
Kana Arima|Kana|mujer rojo estud
Akane Kurokawa|Akane|mujer azul estud
`);

  A('dandadan', 'Dandadan', 'Dandadan', `
Momo Ayase|Momo Ayase|mujer estud
Okarun|Ken Takakura|negro lentes estud transf
Turbo Granny|Turbo Granny|nohum vill
Seiko Ayase|Seiko|mujer mentor
Aira Shiratori|Aira|mujer rubio estud
`);

  window.DB = { tags: TAGS, animes, characters };
})();
