import axios from "axios";

const api = axios.create({

  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3003",

});

export default api;