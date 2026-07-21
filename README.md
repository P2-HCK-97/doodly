# 🎨 Doodly — Realtime Collaborative Drawing Canvas with AI Roast

> **Tagline:** Gambar bareng-bareng, biar AI yang nilai — dan nge-roast hasil kerja tim!

Doodly adalah aplikasi canvas kolaboratif real-time multiplayer ala Excalidraw/Figma. Semua pemain dalam satu room menggambar **bersama-sama di canvas yang sama** untuk menyelesaikan topik gambar yang dihasilkan oleh AI secara acak tiap rondenya. Di akhir ronde, AI secara otomatis mengevaluasi kemiripan gambar (*similarity score*) dan memberikan ulasan/komentar lucu (*roast/puji*).

---

## 🌟 Fitur Utama (MVP)

- **Multiplayer Real-time Canvas:** Semua stroke coretan tersinkron secara *live* di seluruh perangkat pemain secara bersamaan.
- **Real-time Live Cursor & Avatars:** Kursor setiap pemain beserta nama & avatar Dicebear melayang di atas canvas secara real-time.
- **AI Topic Pool Generator:** Generasi otomatis batch topik menarik per room di awal permainan dengan *fallback pool*.
- **AI Round Evaluator & Roaster:** Evaluasi berbasis gambar (*multimodal AI*) untuk memberikan *Similarity Score (0-100%)* dan kalimat *roast* lucu dari AI setelah waktu ronde selesai.
- **Synchronized Room Timer:** Countdown timer tersinkron di seluruh client dengan server sebagai *source of truth*.
- **Gallery & Scoreboard:** Galeri hasil ronde beserta riwayat snapshot canvas, skor similarity, dan roast AI di halaman akhir.

---

## 🛠️ Arsitektur & Teknologi

### **Client (Frontend)**
- **Framework:** React 19 + Vite
- **Routing:** React Router v7 (`react-router`)
- **State Management:** React Context (`GameContext` + `useReducer`)
- **Styling:** Tailwind CSS v4 + DaisyUI v5
- **Realtime:** `socket.io-client` v4
- **Icons & FX:** `lucide-react`, `canvas-confetti`

### **Server (Backend)**
- **Runtime:** Node.js (ES Module)
- **Framework:** Express v5
- **Realtime Server:** Socket.IO v4
- **AI Engine:** Google Gemini AI API (`@google/genai`)
- **In-Memory Store:** `roomRepository` (Map-based session state)
