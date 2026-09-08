import axios from "axios";

const API_URL = import.meta.env.RENDER_API_URL;

if (!API_URL) {
  console.error(
    "RENDER_API_URL is not configured. Check frontend/.env"
  );
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;