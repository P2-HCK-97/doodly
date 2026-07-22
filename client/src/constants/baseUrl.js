const serverUrl = import.meta.env.VITE_SERVER_URL;

if (!serverUrl) {
  console.warn(
    "VITE_SERVER_URL belum diatur. Menggunakan http://localhost:3000",
  );
}

export const baseUrl = serverUrl || "http://localhost:3000";
