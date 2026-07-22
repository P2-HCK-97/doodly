'use strict';

const DEFAULT_TOPIC_COUNT = 12;
const MAX_TOPIC_COUNT = 15;

const FALLBACK_TOPICS = [
  'Kucing menjual es krim',
  'Rumah kecil terbang bersama balon',
  'Matahari memakai kacamata hitam',
  'Robot menari di taman',
  'Pizza terbang membawa balon',
  'Kura-kura mengendarai mobil balap',
  'Panda minum teh hangat',
  'Gajah bermain bola basket',
  'Ikan membawa payung warna-warni',
  'Alien berkebun di bulan',
  'Naga memasak mie instan',
  'Sepatu roket mengejar pelangi',
  'Ular memainkan gitar listrik',
  'Bebek menjadi detektif taman',
  'Kelinci membuat kue ulang tahun',
];

const BLOCKED_WORDS = new Set([
  'marah',
  'ngambek',
  'menangis',
  'sedih',
  'takut',
  'sakit',
  'terluka',
  'mati',
  'kematian',
  'membunuh',
  'pembunuhan',
  'darah',
  'perang',
  'senjata',
  'bom',
  'bencana',
  'kecelakaan',
  'pencuri',
  'merampok',
  'kriminal',
  'narkoba',
  'alkohol',
  'judi',
  'seksual',
  'politik',
  'agama',
  'menghina',
  'penghinaan',
  'mengejek',
  'ejekan',
  'sarkasme',
  'gagal',
  'menderita',
  'hantu',
  'seram',
]);

const TOPIC_POOL_SCHEMA = {
  type: 'array',
  description:
    'Daftar topik positif untuk game menggambar kolaboratif.',
  items: {
    type: 'string',
    description:
      'Topik konkret berisi 3 sampai 7 kata, memiliki subjek dan aksi yang jelas.',
  },
};

let aiClientPromise;

async function getAiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY belum dikonfigurasi');
  }

  if (!aiClientPromise) {
    aiClientPromise = import('@google/genai')
      .then(({ GoogleGenAI }) => {
        return new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
        });
      })
      .catch((error) => {
        aiClientPromise = undefined;
        throw error;
      });
  }

  return aiClientPromise;
}

function normalizeCount(count) {
  const parsedCount = Number(count);

  if (!Number.isInteger(parsedCount) || parsedCount < 1) {
    return DEFAULT_TOPIC_COUNT;
  }

  return Math.min(parsedCount, MAX_TOPIC_COUNT);
}

function normalizeTopic(topic) {
  return topic
    .replace(/\s+/g, ' ')
    .replace(/[.!?]+$/g, '')
    .trim();
}

function getTopicWords(topic) {
  return normalizeTopic(topic)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function isValidTopic(topic) {
  if (typeof topic !== 'string') {
    return false;
  }

  const normalizedTopic = normalizeTopic(topic);

  if (!normalizedTopic) {
    return false;
  }

  const words = getTopicWords(normalizedTopic);
  const containsBlockedWord = words.some((word) =>
    BLOCKED_WORDS.has(word),
  );

  return (
    words.length >= 3 &&
    words.length <= 7 &&
    normalizedTopic.length <= 70 &&
    !containsBlockedWord
  );
}

function getUniqueValidTopics(topics) {
  const uniqueTopics = new Map();

  for (const topic of topics) {
    if (!isValidTopic(topic)) {
      continue;
    }

    const normalizedTopic = normalizeTopic(topic);
    const topicKey = normalizedTopic.toLowerCase();

    if (!uniqueTopics.has(topicKey)) {
      uniqueTopics.set(topicKey, normalizedTopic);
    }
  }

  return [...uniqueTopics.values()];
}

function fillWithFallback(topics, count) {
  const topicMap = new Map(
    topics.map((topic) => [topic.toLowerCase(), topic]),
  );

  for (const fallbackTopic of FALLBACK_TOPICS) {
    if (topicMap.size >= count) {
      break;
    }

    const topicKey = fallbackTopic.toLowerCase();

    if (!topicMap.has(topicKey)) {
      topicMap.set(topicKey, fallbackTopic);
    }
  }

  return [...topicMap.values()].slice(0, count);
}

/**
 * Membuat kumpulan topik sekali ketika room dibuat.
 * Function selalu mengembalikan array topik.
 * Jika Gemini gagal, topik fallback akan digunakan.
 *
 * @param {number} [count=12]
 * @returns {Promise<string[]>}
 */
async function generateTopicPool(count = DEFAULT_TOPIC_COUNT) {
  const safeCount = normalizeCount(count);

  try {
    const ai = await getAiClient();

    const prompt = `
Buat tepat ${safeCount} topik untuk game menggambar kolaboratif
dalam Bahasa Indonesia.

Konteks game:
Semua pemain menggambar bersama pada satu canvas berdasarkan satu topik.
Setiap ronde berlangsung selama 90 detik.

Aturan topik:
- Setiap topik terdiri dari 3 sampai 7 kata.
- Topik harus konkret dan mudah divisualisasikan.
- Topik harus memiliki subjek dan aksi atau situasi yang jelas.
- Topik harus masuk akal untuk digambar dalam waktu 90 detik.
- Topik harus lucu, positif, ringan, dan ramah untuk semua umur.
- Topik tidak boleh terlalu rumit atau memiliki terlalu banyak objek.
- Semua topik harus unik dan tidak mengulang ide yang sama.

Tema yang diperbolehkan:
- Hewan.
- Makanan.
- Benda sehari-hari.
- Kendaraan.
- Profesi.
- Kegiatan sehari-hari.
- Fantasi ringan.

Dilarang:
- Topik umum atau abstrak.
- Topik di luar konteks game menggambar.
- Sarkasme, sindiran, ejekan, penghinaan, dan kata kasar.
- Kekerasan, kematian, ketakutan, kesedihan, atau penderitaan.
- Kriminalitas, bencana, kecelakaan, dan peperangan.
- Politik, agama, seksual, narkoba, alkohol, dan perjudian.
- Merek, logo, tokoh terkenal, atau karakter berhak cipta.
- Situasi menyeramkan, berbahaya, atau berkonotasi negatif.

Contoh topik yang sesuai:
- "Kucing menjual es krim"
- "Robot menari di taman"
- "Gajah bermain bola basket"
- "Alien berkebun di bulan"
- "Kelinci membuat kue ulang tahun"

Campurkan tingkat kesulitan secara seimbang:
- Sekitar 40 persen mudah.
- Sekitar 40 persen sedang.
- Sekitar 20 persen sulit.

Kembalikan hanya JSON array yang berisi string.
Jangan tambahkan markdown, nomor, kategori, atau penjelasan.
    `.trim();

    const response = await ai.models.generateContent({
      model:
        process.env.GEMINI_TOPIC_MODEL || 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseFormat: {
          text: {
            mimeType: 'application/json',
            schema: TOPIC_POOL_SCHEMA,
          },
        },
      },
    });

    if (!response.text) {
      throw new Error(
        'Gemini tidak mengembalikan hasil topic pool',
      );
    }

    const rawTopics = JSON.parse(response.text);

    if (!Array.isArray(rawTopics)) {
      throw new Error(
        'Format topic pool dari Gemini bukan array',
      );
    }

    const validTopics = getUniqueValidTopics(rawTopics);

    return fillWithFallback(validTopics, safeCount);
  } catch (error) {
    console.error(
      `generateTopicPool gagal, pakai fallback: ${error.message}`,
    );

    return FALLBACK_TOPICS.slice(0, safeCount);
  }
}

module.exports = {
  generateTopicPool,
  FALLBACK_TOPICS,
};