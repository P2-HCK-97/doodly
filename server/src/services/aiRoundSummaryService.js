"use strict";

const ROUND_SUMMARY_SCHEMA = {
  type: "object",
  properties: {
    similarityScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
      description:
        "Nilai kemiripan gambar dengan topik dalam angka bulat 0 sampai 100.",
    },
    roastText: {
      type: "string",
      description:
        "Komentar singkat, lucu, dan tidak kasar mengenai hasil gambar.",
    },
  },
  required: ["similarityScore", "roastText"],
  additionalProperties: false,
};

let aiClientPromise;

async function getAiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY belum dikonfigurasi");
  }

  if (!aiClientPromise) {
    aiClientPromise = import("@google/genai").then(({ GoogleGenAI }) => {
      return new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });
    });
  }

  return aiClientPromise;
}

function parseCanvasSnapshot(canvasSnapshot) {
  const match = canvasSnapshot.match(
    /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/,
  );

  if (!match) {
    throw new Error("Format canvas snapshot tidak valid");
  }

  return {
    mimeType: match[1],
    imageData: match[2],
  };
}

async function generateRoundSummary({ topic, canvasSnapshot }) {
  if (!topic || typeof topic !== "string") {
    throw new Error("Topic wajib diisi");
  }

  if (!canvasSnapshot || typeof canvasSnapshot !== "string") {
    throw new Error("Canvas snapshot wajib diisi");
  }

  const ai = await getAiClient();

  const { mimeType, imageData } = parseCanvasSnapshot(canvasSnapshot);

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
    contents: [
      {
        inlineData: {
          mimeType,
          data: imageData,
        },
      },
      {
        text: `
Nilai hasil gambar kolaboratif ini berdasarkan topik: "${topic}".

Berikan:
1. similarityScore berupa angka bulat dari 0 sampai 100.
2. roastText berupa komentar lucu sebanyak 1 sampai 2 kalimat.

Roast boleh mengejek hasil gambar secara ringan, tetapi jangan menghina pemain,
jangan mengandung unsur kebencian, dan jangan menggunakan kata kasar.
        `.trim(),
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: ROUND_SUMMARY_SCHEMA,
    },
  });

  if (!response.text) {
    throw new Error("Gemini tidak mengembalikan hasil penilaian");
  }

  const result = JSON.parse(response.text);
  const similarityScore = Number(result.similarityScore);

  if (!Number.isFinite(similarityScore)) {
    throw new Error("Similarity score dari Gemini tidak valid");
  }

  if (!result.roastText) {
    throw new Error("Roast text dari Gemini tidak valid");
  }

  return {
    similarityScore: Math.min(100, Math.max(0, Math.round(similarityScore))),
    roastText: String(result.roastText).trim(),
  };
}

module.exports = {
  generateRoundSummary,
};
