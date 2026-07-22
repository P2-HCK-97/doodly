'use strict';

// Static fallback pool — used whenever the AI call fails for any reason,
// so a room can always start even without a working AI response.
const FALLBACK_TOPICS = [
  'Kucing naik skateboard',
  'Rumah di atas awan',
  'Matahari pakai kacamata hitam',
  'Robot lagi ngambek',
  'Pizza terbang',
  'Kura-kura balapan mobil',
  'Hantu ngopi di kafe',
  'Gajah main basket',
  'Ikan pakai payung',
  'Alien lagi antri sembako',
  'Naga makan mie ayam',
  'Sepatu roket',
  'Ular main gitar',
  'Bebek jadi detektif',
];

const TOPIC_POOL_SCHEMA = {
  type: 'array',
  items: { type: 'string' },
};

let aiClientPromise;

async function getAiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY belum dikonfigurasi');
  }

  if (!aiClientPromise) {
    aiClientPromise = import('@google/genai').then(({ GoogleGenAI }) => {
      return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    });
  }

  return aiClientPromise;
}

/**
 * Generates a pool of drawable topics for a room, called once when the
 * room is created. Always resolves — never throws — falling back to
 * FALLBACK_TOPICS on any failure (missing API key, network error,
 * invalid or non-JSON response) so a room can always start.
 *
 * @param {number} [count=12] - how many topics to request from the AI.
 * @returns {Promise<string[]>} pool of topic strings.
 */
async function generateTopicPool(count = 12) {
  try {
    const ai = await getAiClient();

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_TOPIC_MODEL || 'gemini-3.6-flash',
      contents: [
        {
          text: `
Buatkan ${count} topik gambar sederhana dalam Bahasa Indonesia santai,
yang bisa digambar dalam waktu terbatas (90 detik) oleh sekelompok orang
bareng-bareng di satu canvas yang sama. Campur level kesulitan: sebagian
gampang, sebagian medium, sebagian susah.

Format output HARUS berupa JSON array of string murni, tanpa markdown,
tanpa backticks, dan tanpa penjelasan lain di luar array itu.
          `.trim(),
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: TOPIC_POOL_SCHEMA,
      },
    });

    if (!response.text) {
      throw new Error('Gemini tidak mengembalikan hasil topic pool');
    }

    const topics = JSON.parse(response.text);

    const isValid =
      Array.isArray(topics) &&
      topics.length > 0 &&
      topics.every((topic) => typeof topic === 'string' && topic.trim().length > 0);

    if (!isValid) {
      throw new Error('Format topic pool dari Gemini tidak valid');
    }

    return topics;
  } catch (error) {
    console.error(`generateTopicPool gagal, pakai fallback: ${error.message}`);
    return FALLBACK_TOPICS;
  }
}

module.exports = {
  generateTopicPool,
  FALLBACK_TOPICS,
};

// Contoh test manual (jalanin dari folder server/):
//   node -e "require('./src/services/aiTopicGenService').generateTopicPool().then(console.log)"
//     -> kalau GEMINI_API_KEY valid & Gemini kebentur, hasilnya array topic dari AI
//     -> kalau GEMINI_API_KEY kosong/gagal, otomatis fallback dan hasilnya sama persis FALLBACK_TOPICS
//
//   node -e "console.log(require('./src/services/aiTopicGenService').FALLBACK_TOPICS.length)"
//     -> 14 (jumlah topic di pool statis)
