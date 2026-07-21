# Doodly — Spesifikasi Project (Fase 2 Group Project)

## Ringkasan

**Nama aplikasi:** Doodly
**Tagline:** Gambar bareng-bareng, biar AI yang nilai — dan nge-roast hasil kerja tim.

**Latar belakang:** Doodly adalah canvas kolaboratif realtime ala Excalidraw/Figma, tapi dengan tujuan: semua pemain di satu room gambar **bareng-bareng di canvas yang sama** menuju satu topic yang di-generate AI tiap ronde. Topic-nya keliatan ke semua orang dari awal (gak disembunyiin) — jadi bukan game tebak-tebakan, tapi kerja tim gambar cepat dalam waktu terbatas. Begitu waktu ronde habis, AI menilai seberapa mirip hasil gambar tim dengan topic-nya (similarity score) sekaligus ngasih komentar singkat (roast/puji). Skor terkumpul per ronde, dimainkan beberapa ronde dengan topic beda-beda tiap kali.

## Pemenuhan requirement Fase 2

| Requirement dari brief | Dipenuhi lewat |
|---|---|
| Tema aplikasi realtime | Canvas kolaboratif multiplayer, semua stroke tersinkron langsung antar pemain di room yang sama |
| Real-Time Communication | Socket.IO — join room, broadcast stroke canvas, broadcast posisi cursor tiap pemain, broadcast hasil AI |
| State Management | React Context (`GameContext` + `useReducer`) — strokes, players, currentTopic, phase, roundHistory |
| Arsitektur Client-Server | Client: Vite + React. Server: Express + Socket.IO |
| Client wajib (SPA, Router, Component, State Mgmt) | Halaman Home/Lobby/Canvas/Result via React Router, semua state global lewat Context |
| Server optional (REST API + socket + dokumentasi) | REST endpoint kecil untuk histori room & topic yang pernah keluar, didokumentasikan di README |
| Fitur AI sebagai pendukung | AI Topic Generation (bikin pool topic per room) + AI Round Summary (similarity score jadi skor ronde + roast), keduanya nentuin konten & hasil, bukan cuma dekorasi |
| Semenarik mungkin buat portofolio | Demo langsung 3-4 device gambar bareng real-time + cursor tiap pemain keliatan, skor & roast beda tiap ronde, galeri hasil di result page |
| Deploy client wajib | Vercel / Netlify |

## Alur pemakaian (user flow)

1. Host (misal Andi) buat room → server minta AI generate satu batch pool topic (misal 10-15 topic, campuran gampang/susah) khusus buat room ini, disimpen di `roomRepository`. Kalau generate gagal, server fallback ke pool topic statis kecil biar room tetap bisa jalan.
2. Pemain lain (Budi, Citra, Deni) join pakai kode, masuk lobby.
3. Host klik **Mulai** → server ambil 1 topic dari pool room, broadcast `round:started` ke **semua** pemain sekaligus (topic keliatan buat semua orang, gak disembunyiin) beserta timer (misal 90 detik).
4. Semua pemain gambar bareng di canvas yang sama → tiap gerakan (mousedown/mousemove/mouseup + koordinat X,Y, warna, ukuran brush) langsung dikirim & di-broadcast ke semua pemain lain, tiap stroke ditandai `socketId` + warna unik per pemain biar keliatan siapa gambar apa. Posisi cursor tiap pemain (beserta label `username` & Dicebear Avatar) juga di-broadcast ringan (throttled) biar semua orang liat kursor temannya bergerak real-time, kayak Figma/Google Docs.
5. Timer jalan di server, ditampilkan sinkron ke semua client.
6. Waktu habis (atau host klik "Selesai" lebih awal) → server broadcast `round:over` dengan topic yang barusan, canvas snapshot **langsung tersedia** buat ditampilkan sementara nunggu penilaian AI.
7. Beberapa saat kemudian (async, gak blocking apa pun), server kirim snapshot canvas final ke AI dalam satu kali panggilan, minta similarity score (0-100%, seberapa mirip gambar dengan topic) sekaligus komentar singkat (roast/puji). Server tambahkan similarity score itu ke skor kumulatif room, lalu broadcast `round:aiSummary` berisi similarity score, skor kumulatif terbaru, dan roast text. Client update scoreboard dengan animasi begitu event ini nyampe.
8. Ronde berikutnya jalan dengan topic baru dari pool yang sama (topic yang udah kepake ditandai biar gak keulang), canvas di-reset/clear buat semua pemain.
9. Setelah semua ronde selesai (misal 3-5 ronde), halaman hasil nampilin galeri: tiap ronde ditampilkan sebagai card berisi topic, snapshot canvas final, similarity score, dan roast text, plus skor kumulatif akhir room.

## Fitur

### Fitur utama (MVP — wajib selesai duluan)
- Buat & gabung room pakai kode
- Topic tiap ronde diambil dari pool yang di-generate AI per room, ditampilkan ke semua pemain (bukan disembunyikan)
- Sinkronisasi coretan canvas realtime kolaboratif (broadcast koordinat stroke + socketId + warna) ke semua pemain di room secara bersamaan (bukan giliran)
- Broadcast posisi cursor & Dicebear Avatar per pemain (throttled) biar kelihatan siapa gambar di mana secara real-time
- Timer per ronde, sinkron di semua client, server yang jadi source of truth kapan ronde berakhir
- Skor ronde dari AI similarity, diakumulasi jadi skor room across beberapa ronde
- Halaman hasil menampilkan galeri tiap ronde (snapshot canvas, topic, skor, roast) + skor kumulatif akhir

### Fitur AI pendukung
- **AI Topic Generation**: sekali per room (bukan per ronde), server minta AI generate satu batch topic (10-15 topic, campuran level susah) buat dipakai sepanjang room itu — nyimpen di `roomRepository`, ada fallback pool statis kalau generate gagal
- **AI Round Summary**: setelah `round:over`, satu kali panggilan AI kirim snapshot canvas final + topic-nya, minta similarity score (0-100%) sekaligus roast/pujian singkat (2-3 kalimat) — similarity score langsung jadi skor ronde yang diakumulasi ke skor room, dikirim lewat event terpisah `round:aiSummary` supaya gak menunda transisi ke ronde berikutnya

Baik AI topic generation maupun AI round summary berjalan async terhadap flow utama — **tidak** menunda sinkronisasi canvas maupun transisi ke ronde berikutnya, tapi bedanya dari versi kompetitif sebelumnya: similarity score di sini bukan sekadar bonus tambahan, dia **adalah** skor utama ronde itu sendiri, karena gak ada mekanisme skor lain (gak ada tebakan buat divalidasi).

### Stretch goals (kerjakan hanya kalau MVP sudah selesai & waktu masih sisa)
- Pilihan warna & ukuran brush per pemain, avatar/nama kecil nempel di cursor masing-masing
- Tombol "undo" per pemain (cuma bisa undo stroke sendiri) / "clear canvas" (host only)
- Leaderboard antar room/sesi (bandingin skor kumulatif room ini vs room-room sebelumnya)
- "MVP Artist" badge tiap ronde — proxy sederhana dari jumlah stroke event tiap pemain, cosmetic aja, bukan skor kompetitif serius
- REST endpoint `GET /rooms/:code/history` untuk lihat topic & hasil tiap ronde sebelumnya
- Reconnect handling kalau pemain disconnect di tengah ronde
- Export hasil galeri jadi gambar/PDF buat dibagiin

## Arsitektur teknis

| Layer | Teknologi |
|---|---|
| Client | Vite, React 19, React Router, React Context, Tailwind CSS v4 + DaisyUI, socket.io-client, `<canvas>` API standar |
| Server | Node.js, Express, Socket.IO (v4.8.x) |
| Fitur AI | AI API (Gemini/GPT-4 — bebas pilih): 1x panggilan generate topic pool per room (di awal) + 1x panggilan round summary (similarity + roast) per ronde setelah selesai |
| Deploy | Client → Vercel/Netlify (wajib). Server → Railway/Render (opsional) |

## Kontrak event Socket.IO

| Arah | Event | Payload |
|---|---|---|
| Client → Server | `room:create` | `{ username }` (server generate topic pool AI di sini) |
| Client → Server | `room:join` | `{ roomCode, username }` |
| Client → Server | `game:start` | `{ roomCode }` (host only) |
| Client → Server | `canvas:stroke` | `{ roomCode, x, y, type: 'down'\|'move'\|'up', color, size }` (server nempelin `socketId` dari socket) |
| Client → Server | `canvas:cursorMove` | `{ roomCode, x, y }` (throttled, misal max tiap 50ms) |
| Client → Server | `canvas:clear` | `{ roomCode }` (host only) |
| Client → Server | `round:end` | `{ roomCode }` (host only, buat akhirin ronde lebih awal) |
| Server → Client | `room:playersUpdate` | `{ players: [{ socketId, username, color, avatarUrl }] }` |
| Server → Client | `round:started` | `{ topic, durationSec }` (topic keliatan buat SEMUA pemain) |
| Server → Client | `canvas:strokeBroadcast` | `{ socketId, color, x, y, type, size }` |
| Server → Client | `canvas:cursorBroadcast` | `{ socketId, username, color, avatarUrl, x, y }` |
| Server → Client | `round:over` | `{ topic, canvasSnapshot }` |
| Server → Client | `round:aiSummary` | `{ similarityScore, roomTotalScore, roastText }` (dikirim belakangan, async, gak nunda ronde berikutnya) |
| Server → Client | `error` | `{ message }` |

Catatan desain: `round:over` gak nunggu AI apa pun — snapshot canvas & transisi ronde bisa langsung jalan begitu timer habis. `round:aiSummary` sengaja jadi event async terpisah yang nyusul belakangan — bedanya dari versi kompetitif, di sini dia bukan cuma bonus tambahan, tapi memang satu-satunya sumber skor ronde, jadi wajar kalau munculnya agak telat asal gak bikin pemain nunggu buat transisi ke topic berikutnya.

Catatan lain: identity pemain dipegang langsung sama `socketId` (bukan `userId` terpisah), jadi kalau ada yang refresh atau koneksinya putus sebentar, `socketId`-nya bakal ganti dan dia keliatan kayak "player baru" (warna & avatar kereset). Ini kenapa "Reconnect handling" tetep worth masuk stretch goal — kalau ada waktu sisa, tinggal simpen `username` sebagai key buat rejoin, bukan bikin sistem identity baru dari nol.

## Struktur folder (layered)

**Client**
```
src/
├── services/
│   ├── socket.js              # instance socket.io-client
│   └── api.js                 # axios instance (kalau pakai REST optional)
├── contexts/
│   └── GameContext.jsx        # provider + useReducer
├── hooks/
│   └── useGameSocket.js       # wiring listener socket ke reducer
├── pages/
│   ├── HomePage.jsx           # form username + create/join room (emit room:create, room:join)
│   ├── LobbyPage.jsx          # tampilin kode room, render PlayerList, tombol Mulai (host only)
│   ├── CanvasPage.jsx         # gabung Canvas + ToolBar + CursorLayer + RoundTimer + ScoreBadge, tampilin topic aktif
│   └── ResultPage.jsx         # loop roundHistory, render RoundResultCard per ronde + total skor akhir
├── components/
│   ├── Canvas.jsx             # elemen <canvas>, gambar stroke sendiri optimistic + emit canvas:stroke, render ulang stroke orang lain dari context
│   ├── ToolBar.jsx            # pilihan warna/size, tombol clear
│   ├── CursorLayer.jsx        # render cursor + avatar tiap pemain di atas canvas
│   ├── PlayerAvatar.jsx       # render 1 avatar Dicebear + ring warna, dipakai di CursorLayer & PlayerList
│   ├── PlayerList.jsx         # daftar pemain di Lobby (avatar, username, status ready)
│   ├── RoundTimer.jsx         # countdown client-side, disinkronin ulang tiap update dari server
│   ├── ScoreBadge.jsx         # skor kumulatif room, live-update pas round:aiSummary nyampe
│   └── RoundResultCard.jsx    # snapshot + skor + roast per ronde, dipakai di galeri result page
└── routes/
    └── router.jsx             # definisiin path ke tiap page pakai react-router
```

**Server**
```
src/
├── socket/
│   ├── index.js                 # setup io(), tiap koneksi baru register room.handler & round.handler
│   └── handlers/
│       ├── room.handler.js      # room:create (generate topic pool AI) & room:join (generate avatar+warna, push player, broadcast playersUpdate)
│       └── round.handler.js     # game:start, canvas:stroke/cursorMove (broadcast), logic timer habis → round:over instan lalu round:aiSummary async
├── services/
│   ├── gameEngine.js            # pure function: checkRoundOver, computeCumulativeScore — gampang di-unit-test tanpa mock socket
│   ├── aiTopicGenService.js     # generate pool topic sekali per room, dengan fallback pool statis
│   └── aiRoundSummaryService.js # satu kali panggilan AI pasca-ronde: similarity score + roast digabung
├── utils/
│   ├── avatarGen.js             # bikin avatarUrl Dicebear dari username (deterministic seed), dipanggil pas room:join
│   └── colorAssign.js           # pilih warna unik dari palette tetap buat player baru, hindari warna bentrok di 1 room
├── repositories/
│   └── roomRepository.js        # in-memory Map: players ({ socketId, username, color, avatarUrl }), currentTopic, strokes, topicPool, roundHistory, totalScore
├── routes/
│   └── room.routes.js           # REST optional, baca dari roomRepository buat histori ronde
├── app.js                       # instance express + middleware cors/json, mount route REST
└── server.js                    # bungkus app jadi http server, attach socket.io, listen port
```

`gameEngine.js` sengaja dipisah sebagai fungsi murni (input timer state/similarity score, output kapan ronde berakhir + skor kumulatif) — gak bergantung ke socket atau state server, jadi bisa di-unit-test langsung kayak pola testing yang udah kamu pakai sebelumnya. `avatarGen.js` dan `colorAssign.js` juga sengaja pure/deterministic (input username/index, output url/warna) biar gampang dites tanpa mock socket juga — dipanggil sekali di `room.handler.js` pas event `room:join` diterima, hasilnya disimpen di `roomRepository` biar semua client liat avatar & warna yang sama buat tiap orang.

## Role split tim (asumsi 2–3 orang)

| Role | Tanggung jawab |
|---|---|
| Backend | `gameEngine`, room + round handler, `aiTopicGenService` & `aiRoundSummaryService`, in-memory store |
| Frontend core | Routing, `GameContext`, `useGameSocket`, integrasi canvas + cursor layer ke backend |
| UI/testing | Canvas/ToolBar/CursorLayer styling (Tailwind+DaisyUI), edge case (pemain disconnect, stroke spam), dokumentasi |

## Timeline 1 hari

| Jam | Kerjaan |
|---|---|
| 0–1 | Setup repo, GitHub Org, branch strategy, scaffold client & server. Sepakati kontrak event dulu |
| 1–2 | BE: `gameEngine` (unit test langsung) + room/round handler + roomRepository + `aiTopicGenService` dengan fallback pool statis |
| 1–2 (paralel) | FE: routing, GameContext stub, Canvas basic drawing (belum sync) pakai dummy state |
| 2–3 | Integrasi sinkronisasi stroke canvas realtime kolaboratif + broadcast cursor, test 3-4 tab browser gambar bareng |
| 3–4 | Integrasi `aiRoundSummaryService` (dipanggil setelah `round:over`, pastikan gak blocking) + akumulasi skor room di `gameEngine` |
| 4–5 | Styling Canvas, ToolBar, CursorLayer, RoundTimer, RoundResultCard + galeri result page |
| 5–6 | Testing edge case (pemain disconnect di tengah ronde, spam stroke, AI gagal generate/response lambat) + README |
| 6–7 | Deploy client (wajib) & server (opsional), smoke test |
| 7–8 | Buffer — kalau sempat, kerjakan 1-2 stretch goal (MVP artist badge, leaderboard antar room, export galeri) |