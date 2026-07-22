import axios from "axios";
import { baseUrl } from "../constants/baseUrl";

const api = axios.create({
  baseURL: baseUrl,
  timeout: 15_000,
});

/**
 * Mengambil seluruh hasil ronde dari server.
 *
 * GET /rooms/:roomCode/history
 */
export async function getRoomHistory(roomCode) {
  if (!roomCode) {
    throw new Error("Kode room tidak ditemukan");
  }

  try {
    const { data } = await api.get(`/rooms/${roomCode}/history`);

    return data;
  } catch (error) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error.message ||
      "Gagal mengambil hasil permainan";

    throw new Error(message);
  }
}

export default api;
