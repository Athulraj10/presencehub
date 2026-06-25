import axios from "axios";

const attendanceApi = axios.create({
  baseURL: "http://localhost:3003/api/attendance",
});

// Add interceptor here
attendanceApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default attendanceApi;